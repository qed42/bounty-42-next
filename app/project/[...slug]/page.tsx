import { notFound } from "next/navigation";
import Image from "next/image";
import { Clock, Tag } from "lucide-react";
import {
  GET_PROJECT_BY_PATH,
  getProjectsForUserEmail,
  getProjectWithTeamMembersById,
} from "@/lib/queries/getData";
import { getGraphQLClient } from "@/utils/getGraphQLClient";
import AuthGuard from "@/components/AuthGuard";
import TeamModalForm from "@/components/03-organisms/team-modal-form";
import TeamMilestoneWrapper from "@/components/03-organisms/team-milestone-wrapper";
import { getCommentsForEntity } from "@/lib/queries/getData";
import { getSessionToken } from "@/lib/getSessionToken";
import { canUserAccessProjectUpdates } from "@/lib/utils";
interface ExecutionTrack {
  field_team: {
    field_team_members: Array<{ mail: string }>;
  };
  field_selected: boolean;
}
interface PageProps {
  params: Promise<{ slug: string[] }>; // Changed to Promise
}

export const metadata = {
  title: "Project detail | QED42 AI Bounty Platform",
  description:
    "Join the premier platform where AI developers claim bounties, build innovative projects, and earn rewards. Discover your next AI challenge today.",
};

export default async function ProjectDetailPage({ params }: PageProps) {
  const { slug } = await params;

  const client = await getGraphQLClient();

  const token = await getSessionToken();

  const currentPath = `/project/${slug}`;
  const { data, error } = await client.query(GET_PROJECT_BY_PATH, {
    path: currentPath,
  });

  if (error || !data?.route?.entity) {
    notFound();
  }

  const project = data.route.entity;
  if (!project) {
    notFound();
  }

  const response = await getProjectWithTeamMembersById(project.id);
  const comments = await getCommentsForEntity(project.id);
  // const projectTeams = response?.field_teams ?? [];
  const projectTeams =
    response?.field_execution_tracks?.map(
      (track: ExecutionTrack) => track.field_team
    ) || [];

  // Selected Track
  const [selectedProjectTrack] = response?.field_execution_tracks?.filter(
    (track: ExecutionTrack) => track.field_selected
  );
  // Selected Project Team Members
  const selectedProjectTeamMembers =
    selectedProjectTrack != null
      ? selectedProjectTrack?.field_team?.field_team_members?.map(
          (team: { mail: string }) => team.mail
        )
      : [];

  const projectDetails = {
    name: project.title,
    path: `${process.env.NEXTAUTH_URL}${response?.path?.alias ?? ""}`,
  };

  const isUserInProject = await getProjectsForUserEmail(token?.email || "");
  const canUserBeAddedProject =
    project.teams == null || project.teams.length < 3;

  const canUserAccessProjectUpdate =
    selectedProjectTeamMembers.length > 0
      ? canUserAccessProjectUpdates(
          selectedProjectTeamMembers,
          response?.field_project_mentor?.mail,
          token?.email
        )
      : false;

  return (
    <AuthGuard>
      <div className="container mx-auto px-4 py-12 xl:py-20">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Main Content Area */}
          <div className="xl:col-span-3 space-y-6">
            {/* Title and Duration/Category (Mobile View) */}
            <div className="mb-5">
              <h1 className="text-4xl font-bold text-primary">
                {project.title}
              </h1>
              {/* Duration and Category - Visible on mobile, hidden on desktop */}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-2 text-black xl:hidden">
                <div className="flex items-center gap-2 text-lg">
                  <Clock className="w-5 h-5" />
                  <span>{project.durations}</span>
                </div>
                <div className="flex items-center gap-2 text-lg">
                  <Tag className="w-5 h-5" />
                  <div className="text-base px-0 py-1">
                    {/* Category */}
                    <div className={`w-max text-black project-category project-category--${project.category.weight}`}>
                      {project.category.name}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <section className="p-5 space-y-6 bg-white rounded-2xl shadow-xl">
              {/* Project Image */}
              <div className="relative w-full min-h-[450px] overflow-hidden shadow-xl">
                <Image
                  src={project.defaultImage?.url || "/image-placeholder.webp"}
                  alt="Project preview"
                  width={1080}
                  height={450}
                  className="object-contain w-full h-[450px]"
                  sizes="(max-width: 1024px) 100vw, 75vw"
                  priority
                />
              </div>

              <div
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: project.body?.value || "" }}
              />

              {canUserAccessProjectUpdate && (
                <TeamMilestoneWrapper
                  executionTracks={response?.field_execution_tracks}
                  comments={comments}
                  projectNodeId={project.id}
                  projectMentor={response?.field_project_mentor}
                  projectDetails={projectDetails}
                  userTokenId={
                    typeof token?.uuid === "string" ? token.uuid : ""
                  }
                  currentUserEmail={token?.email || ""}
                />
              )}
            </section>

            {/* Reward (Mobile View) */}
            {project.reward && (
              <section className="p-5 space-y-6 bg-white rounded-2xl shadow-xl xl:hidden">
                <h2 className="text-3xl font-semibold text-primary">Reward</h2>
                <div className="text-lg text-black">{project.reward}</div>
              </section>
            )}

            {/* Be a Member Button / Claimed Status (Mobile View) */}
            {/* {!isUserInProject ? (
              canUserBeAddedProject ? (
                <div className="mt-8 text-center xl:hidden">
                  <TeamModalForm
                    project={project}
                    projectTeams={projectTeams}
                  />
                </div>
              ) : (
                <p className="mt-8 text-center text-lg text-gray-600 xl:hidden">
                  This project has been claimed
                </p>
              )
            ) : (
              <p className="mt-8 text-center text-lg text-gray-600 xl:hidden">
                You are already part of another bounty project.
              </p>
            )} */}
          </div>

          {/* Sidebar (Desktop View) */}
          <aside className="hidden xl:col-span-1 xl:block space-y-6 xl:sticky xl:top-20 h-fit">
            <div className="bg-white shadow-xl rounded-2xl p-5 space-y-4">
              {/* Duration and Category - Desktop only */}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-black">
                <div className="flex items-center gap-2 text-lg">
                  <Clock className="w-5 h-5" />
                  <span>{project.durations}</span>
                </div>
                <div className="flex items-center gap-2 text-lg">
                  <Tag className="w-5 h-5" />
                  <div className="text-base px-0 py-1">
                    <div className={`w-max text-black project-category project-category--${project.category.weight}`}>
                      {project.category.name}
                    </div>
                  </div>
                </div>
              </div>

              {/* Reward - Desktop only */}
              {project.reward && (
                <>
                  <h2 className="text-2xl font-semibold text-primary pt-4 border-t border-gray-200">
                    Reward
                  </h2>
                  <div className="text-lg text-black">{project.reward}</div>
                </>
              )}

              {/* Be a Member Button / Claimed Status - Desktop only */}
              {/* {!isUserInProject ? (
                canUserBeAddedProject ? (
                  <div className="mt-6 pt-6 border-t border-gray-200 text-center">
                    <TeamModalForm
                      project={project}
                      projectTeams={projectTeams}
                    />
                  </div>
                ) : (
                  <p className="mt-6 pt-6 border-t border-gray-200 text-center text-lg text-gray-600">
                    This project has been claimed
                  </p>
                )
              ) : (
                <p className="mt-6 pt-6 border-t border-gray-200 text-center text-lg text-gray-600">
                  You are already part of another bounty project.
                </p>
              )} */}
            </div>
          </aside>
        </div>
      </div>
    </AuthGuard>
  );
}
