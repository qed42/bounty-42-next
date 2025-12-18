import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";

/* ============================================================
   Drupal Contributions – Final Correct Implementation
   ============================================================ */

const DRUPAL_USER_BASE_URL = "https://www.drupal.org/jsonapi/user/user";
const CONTRIBUTION_USER_BASE_URL =
  "https://www.drupal.org/jsonapi/views/contribution_records/by_user";

/* ------------------------------------------------------------
   Types
------------------------------------------------------------ */

type ContributionParams = {
  userId: number;
  months: number;
  projectName?: string;
  page?: number;
};

/* ------------------------------------------------------------
   Username → User ID Resolver (REQUIRED)
------------------------------------------------------------ */

async function resolveDrupalUserId(username: string): Promise<number> {
  try {
    if (!username) {
      throw new Error("Username is required");
    }

    const params = new URLSearchParams({
      "filter[name]": username,
    });

    const response = await fetch(
      `${DRUPAL_USER_BASE_URL}?${params.toString()}`,
      {
        cache: "force-cache", // usernames rarely change
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to resolve user: ${response.status} ${response.statusText}`
      );
    }

    const json = await response.json();

    if (!json?.data?.length) {
      throw new Error(`Drupal user not found: ${username}`);
    }

    // Numeric Drupal UID (string → number)
    return Number(json.data[0].attributes.drupal_internal__uid);
  } catch (error) {
    console.error("resolveDrupalUserId failed:", error);
    throw error;
  }
}

/* ------------------------------------------------------------
   Core Fetcher (Views JSON:API)
------------------------------------------------------------ */

async function fetchDrupalContributions({
  userId,
  months,
  projectName,
  page = 0,
}: ContributionParams) {
  try {
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
      throw new Error(
        `Drupal API error: ${response.status} ${response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error("fetchDrupalContributions failed:", error);
    throw error;
  }
}

/* ------------------------------------------------------------
   Public API – What You Actually Use
------------------------------------------------------------ */

export async function getClosedIssuesByUsername(
  username: string,
  months: number,
  page?: number
) {
  const userId = await resolveDrupalUserId(username);

  return fetchDrupalContributions({
    userId,
    months,
    page,
  });
}

export async function getClosedIssuesByUsernameForProject(
  username: string,
  months: number,
  projectName: string,
  page?: number
) {
  const userId = await resolveDrupalUserId(username);

  return fetchDrupalContributions({
    userId,
    months,
    projectName,
    page,
  });
}

/* ============================================================
   Drupal Profile Scraper (via r.jina.ai)
   ============================================================ */

type DrupalProfileScrapeResult = {
  username: string;
  profileUrl: string;
  content: string;
};

const JINA_SCRAPER_BASE_URL = "https://r.jina.ai/";
const DRUPAL_PROFILE_BASE_URL = "https://www.drupal.org/u";

function normalizeDrupalUsername(username: string): string {
  return username.trim().replace(/\s+/g, "-");
}

export async function scrapeDrupalProfile(
  username: string
): Promise<DrupalProfileScrapeResult> {
  try {
    if (!username) {
      throw new Error("Username is required");
    }

    const normalizedUsername = normalizeDrupalUsername(username);
    const profileUrl = `${DRUPAL_PROFILE_BASE_URL}/${normalizedUsername}`;
    const scrapeUrl = `${JINA_SCRAPER_BASE_URL}${profileUrl}`;

    const response = await fetch(scrapeUrl, {
      headers: {
        Accept: "text/plain",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(
        `Profile scrape failed: ${response.status} ${response.statusText}`
      );
    }

    const content = await response.text();

    if (!content.trim()) {
      throw new Error("Empty scrape result from r.jina.ai");
    }

    return {
      username: normalizedUsername,
      profileUrl,
      content,
    };
  } catch (error) {
    console.error("scrapeDrupalProfile failed:", error);
    throw error;
  }
}

/* ============================================================
   Gemini – Parse Drupal Profile Content
   ============================================================ */

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type ParsedDrupalProfile = {
  memberSince: string | null;
  menteeCount: number;
  events2025: {
    spokenAt: string[];
    organized: string[];
    attended: string[];
  };
};

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function parseDrupalProfileWithGemini(
  scrapedContent: string,
  retryCount = 0
): Promise<ParsedDrupalProfile> {
  try {
    if (!scrapedContent || !scrapedContent.trim()) {
      throw new Error("Scraped profile content is empty");
    }

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
- Information may appear under headings, labels, or inline text.

RULES (ABSOLUTE):
- Use ONLY the provided content
- Do NOT guess or infer missing values
- You MAY derive values from explicit phrases (example: "On Drupal.org for 6 years")
- If data is missing:
  - memberSince → null
  - menteeCount → 0
  - events arrays → []
- Events MUST be from year 2025 ONLY
- Return STRICT JSON
- No markdown
- No explanations

EXPECTED JSON SHAPE:
{
  "memberSince": string | null,
  "menteeCount": number,
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
    const response = result.response;
    const text = response.text();

    if (!text) {
      throw new Error("Empty response from Gemini");
    }

    return JSON.parse(text) as ParsedDrupalProfile;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    // Gemini can still throttle occasionally
    if (error?.message?.includes("429") && retryCount < 1) {
      console.warn("Gemini rate-limited. Retrying once...");
      await sleep(1200);
      return parseDrupalProfileWithGemini(scrapedContent, retryCount + 1);
    }

    console.error("parseDrupalProfileWithGemini failed:", error);
    throw error;
  }
}

/* ============================================================
   Drupal User Data Collector
   ============================================================ */

export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_PUBLISHABLE_DEFAULT_KEY! // server-side ONLY
);

export async function collectAndStoreDrupalUserData(
  username: string,
  months: number
) {
  if (!username) {
    throw new Error("Username is required");
  }

  /* ------------------------------------------------------------
     1. Check Supabase first (CACHE)
  ------------------------------------------------------------ */

  const { data: existing, error: fetchError } = await supabase
    .from("drupal_user_stats")
    .select("*")
    .eq("username", username)
    .single();

  // If found → return immediately
  if (existing) {
    return {
      ...existing,
      source: "supabase",
    };
  }

  // If error is NOT "row not found", throw
  if (fetchError && fetchError.code !== "PGRST116") {
    console.error("Supabase fetch failed:", fetchError);
    throw fetchError;
  }

  /* ------------------------------------------------------------
     2. Fetch issue data (parallel)
  ------------------------------------------------------------ */

  const [totalIssues, totalIssuesForAI, totalIssuesForDrupal] =
    await Promise.all([
      getClosedIssuesByUsername(username, months),
      getClosedIssuesByUsernameForProject(username, months, "ai"),
      getClosedIssuesByUsernameForProject(username, months, "drupal"),
    ]);

  /* ------------------------------------------------------------
     3. Scrape profile
  ------------------------------------------------------------ */

  const scrapedProfile = await scrapeDrupalProfile(username);

  /* ------------------------------------------------------------
     4. Parse with Gemini (enable when ready)
  ------------------------------------------------------------ */

  const parsedProfile = await parseDrupalProfileWithGemini(
    scrapedProfile.content
  )

  /* ------------------------------------------------------------
     5. Prepare payload
  ------------------------------------------------------------ */

  const payload = {
    username,

    total_issues_count: totalIssues.meta.count,
    total_issues_for_ai_count: totalIssuesForAI.meta.count,
    total_issues_for_drupal_count: totalIssuesForDrupal.meta.count,

    member_since: parsedProfile.memberSince ?? "",
    mentee_count: parsedProfile.menteeCount ?? 0,
    events_2025: parsedProfile.events2025,
  };

  /* ------------------------------------------------------------
     6. Insert into Supabase
  ------------------------------------------------------------ */

  const { error: insertError } = await supabase
    .from("drupal_user_stats")
    .insert(payload);

  if (insertError) {
    console.error("Supabase insert failed:", insertError);
    throw insertError;
  }

  /* ------------------------------------------------------------
     7. Return result
  ------------------------------------------------------------ */

  return {
    ...payload,
    scrapedProfileUrl: scrapedProfile.profileUrl,
    source: "fresh",
  };
}
