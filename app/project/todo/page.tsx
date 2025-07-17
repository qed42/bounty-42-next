// app/project/todo/page.tsx

import Image from "next/image";
import { gql } from "urql";
import { getClient } from "@/utils/client";

const GET_PROJECT_DATA = gql`
  query GetProjectData {
    nodeProjects(first: 1) {
      nodes {
        title
        durations
        body {
          value
        }
        defaultImage {
          url
        }
        team {
          ... on TermTeam {
            id
            name
            designation
            employeeImage {
              url
            }
          }
        }
      }
    }
  }
`;

export default async function Page() {
  const client = await getClient({
    auth: {
      uri: process.env.DRUPAL_AUTH_URI!,
      clientId: process.env.DRUPAL_CLIENT_ID!,
      clientSecret: process.env.DRUPAL_CLIENT_SECRET!,
    },
    url: process.env.DRUPAL_GRAPHQL_URI!,
  });

  const { data, error } = await client.query(GET_PROJECT_DATA, {});

  if (error) {
    return <div className="text-red-500">Error loading project data.</div>;
  }

  const project = data?.nodeProjects?.nodes?.[0];

  if (!project) {
    return <div className="text-gray-500">No project data found.</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
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
          {project.team?.length > 0 && (
            <>
              <h2 className="text-2xl font-semibold text-primary mb-5">Our team</h2>
              <div className="mx-auto grid max-w-7xl gap-20 px-6 lg:px-8 xl:grid-cols-3">
                <ul role="list" className="grid gap-x-12 gap-y-12 sm:grid-cols-3 sm:gap-y-16 xl:col-span-3 list-none">
                  {project.team.map((member: any) => (
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
                          <h3 className="text-base/7 font-semibold tracking-tight text-gray-900">
                            {member.name}
                          </h3>
                          <p className="text-sm/6 font-semibold text-blue-600">
                            {member.designation}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
