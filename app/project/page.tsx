// app/project/page.tsx

import { Suspense } from "react";
import { CardsSection } from "@/components/03-organisms/cards-section";
import ProjectListSkeleton from "@/components/03-organisms/ProjectListSuspense";
import { getClient } from "@/utils/client";
import { GET_PROJECTS } from "@/lib/queries/getData";

export default async function ProjectListingPage() {
  const client = await getClient({
    auth: {
      uri: process.env.DRUPAL_AUTH_URI!,
      clientId: process.env.DRUPAL_CLIENT_ID!,
      clientSecret: process.env.DRUPAL_CLIENT_SECRET!,
    },
    url: process.env.DRUPAL_GRAPHQL_URI!,
  });

  const { data, error } = await client.query(GET_PROJECTS, {});

  if (error || !data?.nodeProjects?.edges) {
    throw new Error("Failed to fetch project listings");
  }

  type ProjectNode = {
    id: string;
    title: string;
    body?: { summary?: string } | null;
    defaultImage?: { url?: string };
    path: string,
    projectTeam?: Array<{ email: string; name: string; employeeImage: { url: string } }> | null;
  };

  const cards = data.nodeProjects.edges.map(({ node }: { node: ProjectNode }) => ({
    id: node.id ?? "0",
    title: node.title ?? "Project Title",
    description: node.body?.summary ?? "A brief project description goes here.",
    image: node.defaultImage?.url ?? "/image-placeholder.webp?height=200&width=400",
    link: node.path ?? "#",
    teamCount: Array.isArray(node.projectTeam) ? node.projectTeam.length : 0,
  }));

  return (
    <div className="min-h-screen bg-background">
      <Suspense fallback={<ProjectListSkeleton />}>
        <CardsSection
          title="Our Projects"
          description="Explore some of our most impactful and innovative projects that solve real-world problems and deliver results."
          cards={cards}
        />
      </Suspense>
    </div>
  );
}
