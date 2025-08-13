export const dynamic = 'force-dynamic';

import { Suspense } from "react";
import ProjectListSkeleton from "@/components/03-organisms/ProjectListSuspense";
import { CardsSection } from "@/components/03-organisms/cards-section";
import { GET_PROJECTS } from "@/lib/queries/getData";
import { getGraphQLClient } from "@/utils/getGraphQLClient";
// importing types
import type { ProjectEdge } from "@/types/project";
import AuthGuard from "@/components/AuthGuard";

export const metadata = {
  title: "Projects | QED42 AI Bounty Platform",
  description:
    "Join the premier platform where AI developers claim bounties, build innovative projects, and earn rewards. Discover your next AI challenge today.",
};


export default async function ProjectListingPage() {
  const client = await getGraphQLClient();

  const { data, error } = await client.query(GET_PROJECTS, {
    first: 8,
    after: null,
  });

  if (error || !data?.nodeProjects?.edges) {
    throw new Error("Failed to fetch project listings");
  }

  const edges = data.nodeProjects.edges;
  const pageInfo = data.nodeProjects.pageInfo;

  const cards = edges.map(({ node }: ProjectEdge) => ({
    id: node.id,
    title: node.title,
    description: node.body?.summary ?? "",
    image: node.defaultImage?.url ?? "/image-placeholder.webp",
    link: node.path,
    category: node.category?.name ?? "Uncategorized",
    weight: node.category?.weight ?? 0, // Ensure weight is always defined
  }));

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <Suspense fallback={<ProjectListSkeleton />}>
          <CardsSection
            title="Our Projects"
            description="Explore some of our most impactful and innovative projects that solve real-world problems and deliver results."
            cards={cards}
            pageInfo={pageInfo}
          />
        </Suspense>
      </div>
    </AuthGuard>
  );
}
