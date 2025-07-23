// app/project/page.tsx
export const dynamic = 'force-dynamic';

import { Suspense } from "react";
import ProjectListSkeleton from "@/components/03-organisms/ProjectListSuspense";
import { CardsSection } from "@/components/03-organisms/cards-section";
import { GET_PROJECTS } from "@/lib/queries/getData";
import { getGraphQLClient } from "@/utils/getGraphQLClient";
// importing types
import type { ProjectEdge } from "@/types/project";
import AuthGuard from "@/components/AuthGuard";

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
    teamCount: Array.isArray(node.projectTeam) ? node.projectTeam.length : 0,
    category: node.category?.name ?? "Uncategorized",
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
