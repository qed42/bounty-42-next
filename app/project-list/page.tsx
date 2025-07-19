import { Suspense } from "react";
import { CardsSection } from "@/components/03-organisms/cards-section";
import ProjectListSkeleton from "@/components/03-organisms/ProjectListSuspense";
import { getAllProjects } from "@/db/queries";
import AuthGuard from "@/components/AuthGuard";

export default async function ProjectListPage() {
  const projects = await getAllProjects();

  const cards = projects.map((project) => ({
    id: project.id ?? "0",
    title: project.title ?? "Project Title",
    description:
      project.description ?? "A brief project description goes here.",
    link: project.slug ? `/project-item/${project.slug}` : "#",
    teamCount: project.teamCount || 0,
  }));

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <Suspense fallback={<ProjectListSkeleton />}>
          <CardsSection
            title="Our Projects"
            description="Explore some of our most impactful and innovative projects that solve real-world problems and deliver results."
            cards={cards}
          />
        </Suspense>
      </div>
    </AuthGuard>
  );
}
