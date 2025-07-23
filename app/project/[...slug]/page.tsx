import { notFound } from "next/navigation";
import {
  GET_PROJECT_BY_PATH,
  getProjectWithTeamMembersById,
} from "@/lib/queries/getData";
import Image from "next/image";
import { getGraphQLClient } from "@/utils/getGraphQLClient";
import AuthGuard from "@/components/AuthGuard";
import { Clock, Tag } from "lucide-react";
import TeamModalForm from "@/components/03-organisms/team-modal-form";

interface PageProps {
  params: Promise<{ slug: string[] }>; // Changed to Promise
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const client = await getGraphQLClient();

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
  const projectTeams = response?.field_teams ?? [];

  if (!project) {
    notFound();
  }

  const canUserBeAddedProject =
    project.teams == null || project.teams.length < 3;

  return (
    <AuthGuard>
      <div className="container mx-auto px-4 py-12 lg:py-20">
        {/* Title and Duration */}
        <div className="mb-5">
          <h1 className="text-4xl font-bold text-primary">{project.title}</h1>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-2 text-black">
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
                    project.category.name.toLowerCase().replace(/\s+/g, "") ===
                    "pool1"
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

        {/* Project Content */}
        <div className="bg-white shadow-xl rounded-2xl space-y-6">
          {/* Project Image */}
          <div className="relative w-full h-96">
            <Image
              src={project.defaultImage?.url || "/bg.jpg"}
              alt="Project preview"
              fill
              className="w-full h-64 object-cover"
            />
          </div>

          {/* Description */}
          <section className="p-5 space-y-6">
            <div
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: project.body?.value || "" }}
            />

            {/* Reward */}
            {project.reward && (
              <>
                <h2 className="text-3xl font-semibold text-primary">Reward</h2>
                <div className="text-lg text-black">{project.reward}</div>
              </>
            )}

            {/* Team Members */}
            {project.projectTeam?.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-300">
                <h2 className="text-3xl font-semibold text-primary mb-5">
                  Our team
                </h2>
                <ul
                  role="list"
                  className="grid gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 list-none"
                >
                  {project.projectTeam.map(
                    (member: {
                      id: string;
                      name: string;
                      email: string;
                      employeeImage?: { url?: string };
                    }) => (
                      <li key={member.id}>
                        <div className="flex items-center gap-x-4">
                          <Image
                            src={member.employeeImage?.url || "/avatar.png"}
                            width={60}
                            height={60}
                            alt={member.name}
                            className="size-16 rounded-full outline-1 -outline-offset-1 outline-black/5"
                          />
                          <div>
                            <h3 className="text-base font-semibold tracking-tight text-gray-900">
                              {member.name}
                            </h3>
                            {member.email && (
                              <p className="text-sm text-gray-500">
                                {member.email}
                              </p>
                            )}
                          </div>
                        </div>
                      </li>
                    )
                  )}
                </ul>
              </div>
            )}

            {canUserBeAddedProject ? (
              <div className="mt-8 text-center">
                <TeamModalForm project={project} projectTeams={projectTeams} />
              </div>
            ) : (
              <p>This project has been claimed</p>
            )}
          </section>
        </div>
      </div>
    </AuthGuard>
  );
}
