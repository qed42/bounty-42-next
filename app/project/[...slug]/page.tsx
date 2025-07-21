// app/project/[slug]/page.tsx

import { notFound } from "next/navigation";
import { GET_PROJECT_BY_PATH } from "@/lib/queries/getData";
import Image from "next/image";
import { getGraphQLClient } from '@/utils/getGraphQLClient'

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

  if (!project) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-12 lg:py-20">
      {/* Title and Duration */}
      <div className="mb-5">
        <h1 className="text-4xl font-bold text-primary">{project.title}</h1>
        <small className="text-gray-400">({project.durations})</small>
      </div>

      {/* Project Content */}
      <div className="bg-white shadow-xl rounded-2xl space-y-6">
        {/* Project Image */}
        <div className="relative w-full h-64">
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

          {/* Team Members */}
          {project.projectTeam?.length > 0 && (
            <>
              <h2 className="text-2xl font-semibold text-primary mb-5">Our team</h2>
              <ul
                role="list"
                className="grid gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 list-none"
              >
                {project.projectTeam.map((member: {
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
                          <p className="text-sm text-gray-500">{member.email}</p>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Be a Member Button */}
              {project.projectTeam.length < 3 && (
                <div className="mt-8 text-center">
                  <button
                    type="submit"
                    className="px-6 py-2 text-white bg-primary hover:bg-primary-dark rounded-lg transition cursor-pointer"
                  >
                    Be a Member
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
