import { notFound } from "next/navigation";
import {
  GET_PROJECT_BY_PATH,
  getProjectsForUserEmail,
  getProjectWithTeamMembersById,
} from "@/lib/queries/getData";
import Image from "next/image";
import { getGraphQLClient } from "@/utils/getGraphQLClient";
import AuthGuard from "@/components/AuthGuard";
import { Clock, Tag } from "lucide-react";
import TeamModalForm from "@/components/03-organisms/team-modal-form";
import { getServerSession } from "next-auth";
import authOptions from "@/lib/authOptions";

interface PageProps {
  params: Promise<{ slug: string[] }>; // Changed to Promise
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const client = await getGraphQLClient();

  const session = (await getServerSession(authOptions)) as {
    user?: { email?: string };
  } | null;

  // const slug = typeof paramsValue.slug === "string" ? paramsValue.slug : Array.isArray(paramsValue.slug) ? paramsValue.slug[0] : "";
  // const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  const currentPath = `/project/${slug}`;
  const { data, error } = await client.query(GET_PROJECT_BY_PATH, {
    path: currentPath,
  });

  if (error || !data?.route?.entity) {
    notFound();
  }

  const project = data.route.entity;
  const response = await getProjectWithTeamMembersById(project.id);
  const isUserInProject = await getProjectsForUserEmail(
    session?.user?.email || ""
  );

  const projectTeams = response?.field_teams ?? [];

  if (!project) {
    notFound();
  }

  const canUserBeAddedProject =
    project.teams == null || project.teams.length < 3;

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
                    <div
                      className={`project-category w-max ${
                        project.category.name
                          .toLowerCase()
                          .replace(/\s+/g, "") === "pool1"
                          ? "project-category--1"
                          : project.category.name
                              .toLowerCase()
                              .replace(/\s+/g, "") === "pool2"
                          ? "project-category--2"
                          : project.category.name
                              .toLowerCase()
                              .replace(/\s+/g, "") === "pool3"
                          ? "project-category--3"
                          : "text-black"
                      }`}
                    >
                      {project.category.name}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Project Image */}
            <div className="relative w-full h-96 rounded-2xl overflow-hidden shadow-xl">
              <Image
                src={project.defaultImage?.url || "/image-placeholder.webp"}
                alt="Project preview"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 75vw"
                priority
              />
            </div>

            {/* Description */}
            <section className="p-5 space-y-6 bg-white rounded-2xl shadow-xl">
              <div
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: project.body?.value || "" }}
              />
            </section>

            {/* Reward (Mobile View) */}
            {project.reward && (
              <section className="p-5 space-y-6 bg-white rounded-2xl shadow-xl xl:hidden">
                <h2 className="text-3xl font-semibold text-primary">Reward</h2>
                <div className="text-lg text-black">{project.reward}</div>
              </section>
            )}

            {/* Be a Member Button / Claimed Status (Mobile View) */}
            {!isUserInProject ? (
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
            )}
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
                    <div
                      className={`project-category w-max ${
                        project.category.name
                          .toLowerCase()
                          .replace(/\s+/g, "") === "pool1"
                          ? "project-category--1"
                          : project.category.name
                              .toLowerCase()
                              .replace(/\s+/g, "") === "pool2"
                          ? "project-category--2"
                          : project.category.name
                              .toLowerCase()
                              .replace(/\s+/g, "") === "pool3"
                          ? "project-category--3"
                          : "text-black"
                      }`}
                    >
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
              {!isUserInProject ? (
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
              )}
            </div>
          </aside>
        </div>
      </div>
    </AuthGuard>
  );
}
