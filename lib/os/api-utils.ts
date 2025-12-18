import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";

/* ============================================================
   Constants
============================================================ */

const DRUPAL_USER_BASE_URL = "https://www.drupal.org/jsonapi/user/user";
const CONTRIBUTION_USER_BASE_URL =
  "https://www.drupal.org/jsonapi/views/contribution_records/by_user";

const JINA_SCRAPER_BASE_URL = "https://r.jina.ai/";
const DRUPAL_PROFILE_BASE_URL = "https://www.drupal.org/u";

/* ============================================================
   Helpers
============================================================ */

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeDrupalUsername(username: string): string {
  return username.trim().replace(/\s+/g, "-").toLowerCase();
}

/* ============================================================
   Types
============================================================ */

type ContributionParams = {
  userId: number;
  months: number;
  projectName?: string;
  page?: number;
};

export type ParsedDrupalProfile = {
  memberSince: string | null;
  accountCreatedYear: number | null;
  menteeCount: number;
  contributorRoles: string[];
  events2025: {
    spokenAt: string[];
    organized: string[];
    attended: string[];
  };
};

type DrupalProfileScrapeResult = {
  username: string;
  profileUrl: string;
  content: string;
};

/* ============================================================
   Supabase (SERVER ONLY)
============================================================ */

export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_PUBLISHABLE_DEFAULT_KEY! // 🔒 REQUIRED
);

/* ============================================================
   Drupal Username → UID Resolver
============================================================ */

async function resolveDrupalUserId(username: string): Promise<number> {
  const params = new URLSearchParams({ "filter[name]": username });

  const response = await fetch(`${DRUPAL_USER_BASE_URL}?${params.toString()}`, {
    cache: "force-cache",
  });

  if (!response.ok) {
    throw new Error(`Failed to resolve user ${username}`);
  }

  const json = await response.json();

  if (!json?.data?.length) {
    throw new Error(`Drupal user not found: ${username}`);
  }

  return Number(json.data[0].attributes.drupal_internal__uid);
}

/* ============================================================
   Drupal Contributions Fetcher
============================================================ */

async function fetchDrupalContributions({
  userId,
  months,
  projectName,
  page = 0,
}: ContributionParams) {
  const params = new URLSearchParams({
    "views-argument[0]": String(userId),
    page: String(page),
    "views-filter[field_is_sa_value]": "0",
    "views-filter[last_status_change]": `${months} months ago`,
  });

  if (projectName) {
    params.append("views-filter[field_project_name_value]", projectName);
  }

  const response = await fetch(
    `${CONTRIBUTION_USER_BASE_URL}?${params.toString()}`,
    { cache: "no-store" }
  );

  if (!response.ok) {
    throw new Error("Drupal contributions fetch failed");
  }

  return response.json();
}

/* ============================================================
   Public Issue APIs
============================================================ */

export async function getClosedIssuesByUsername(
  username: string,
  months: number
) {
  const userId = await resolveDrupalUserId(username);
  return fetchDrupalContributions({ userId, months });
}

export async function getClosedIssuesByUsernameForProject(
  username: string,
  months: number,
  projectName: string
) {
  const userId = await resolveDrupalUserId(username);
  return fetchDrupalContributions({ userId, months, projectName });
}

/* ============================================================
   Drupal Profile Scraper
============================================================ */

export async function scrapeDrupalProfile(
  username: string
): Promise<DrupalProfileScrapeResult> {
  const normalized = normalizeDrupalUsername(username);
  const profileUrl = `${DRUPAL_PROFILE_BASE_URL}/${normalized}`;

  const response = await fetch(`${JINA_SCRAPER_BASE_URL}${profileUrl}`, {
    headers: { Accept: "text/plain" },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Profile scrape failed");
  }

  const content = await response.text();

  if (!content.trim()) {
    throw new Error("Empty profile scrape");
  }

  return { username: normalized, profileUrl, content };
}

/* ============================================================
   Gemini Parser
============================================================ */

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function parseDrupalProfileWithGemini(
  scrapedContent: string,
  retryCount = 0
): Promise<ParsedDrupalProfile> {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-3-flash-preview",
      generationConfig: {
        temperature: 0,
        responseMimeType: "application/json",
      },
    });

    const prompt = `
You are extracting structured information from a Drupal.org user profile page.

IMPORTANT CONTEXT:
- The content is scraped markdown/plain text from a Drupal profile page.
- Information may appear under headings, labels, bullet lists, or inline text.
- Account creation information may appear as phrases like:
  - "Member since 2019"
  - "On Drupal.org for 6 years"
  - "Joined Drupal.org in 2018"

RULES (ABSOLUTE):
- Use ONLY the provided content
- Do NOT guess or infer missing values
- You MAY derive values ONLY from explicit phrases
- If data is missing:
  - memberSince → null
  - accountCreatedYear → null
  - menteeCount → 0
  - contributorRoles → []
  - events arrays → []
- Events MUST be from year 2025 ONLY
- Return STRICT JSON
- No markdown
- No explanations

EXPECTED JSON SHAPE:
{
  "memberSince": string | null,
  "accountCreatedYear": number | null,
  "menteeCount": number,
  "contributorRoles": string[],
  "events2025": {
    "spokenAt": string[],
    "organized": string[],
    "attended": string[]
  }
}

Drupal profile content:
"""
${scrapedContent}
"""
`;

    const result = await model.generateContent(prompt);
    const parts = result.response?.candidates?.[0]?.content?.parts;

    const text = parts
      ?.map((p) => p.text)
      .join("")
      .trim();

    if (!text) {
      throw new Error("Empty Gemini response");
    }

    return JSON.parse(text);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("429") &&
      retryCount < 1
    ) {
      await sleep(1200);
      return parseDrupalProfileWithGemini(scrapedContent, retryCount + 1);
    }
    throw error;
  }
}

/* ============================================================
   Unified Collector (CACHE → FETCH → STORE)
============================================================ */

export async function collectAndStoreDrupalUserData(
  username: string,
  months: number
) {
  const normalizedUsername = normalizeDrupalUsername(username);

  /* ---------- CACHE ---------- */

  const { data: existing, error } = await supabase
    .from("drupal_user_stats")
    .select("*")
    .eq("username", normalizedUsername)
    .single();

  if (existing) {
    return { ...existing, source: "supabase" };
  }

  if (error && error.code !== "PGRST116") {
    throw error;
  }

  /* ---------- FETCH ---------- */

  const [totalIssues, totalIssuesForAI, totalIssuesForDrupal] =
    await Promise.all([
      getClosedIssuesByUsername(normalizedUsername, months),
      getClosedIssuesByUsernameForProject(normalizedUsername, months, "ai"),
      getClosedIssuesByUsernameForProject(normalizedUsername, months, "drupal"),
    ]);

  const scraped = await scrapeDrupalProfile(normalizedUsername);
  const parsed = await parseDrupalProfileWithGemini(scraped.content);

  /* ---------- STORE ---------- */

  const payload = {
    username: normalizedUsername,

    total_issues_count: totalIssues.meta.count,
    total_issues_for_ai_count: totalIssuesForAI.meta.count,
    total_issues_for_drupal_count: totalIssuesForDrupal.meta.count,

    member_since: parsed.memberSince,
    account_created_year: parsed.accountCreatedYear,

    mentee_count: parsed.menteeCount,
    contributor_roles: parsed.contributorRoles,
    events_2025: parsed.events2025,
  };

  await supabase.from("drupal_user_stats").insert(payload);

  return {
    ...payload,
    scrapedProfileUrl: scraped.profileUrl,
    source: "fresh",
  };
}
