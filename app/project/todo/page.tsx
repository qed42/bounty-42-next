import Image from "next/image";
import { gql } from "urql";
import { getClient } from "@/utils/client";

const GET_PROJECT_DATA = gql`
  query GetProjectData {
    nodeProjects(first: 1) {
      nodes {
        durations
        body {
          value
        }
        reward
        defaultImage {
          url
        }
        title
        projectTeam {
          ... on TermTeam {
            id
            name
            employeeImage {
              url
            }
            email
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

  const { data, error } = await client.query(
    GET_PROJECT_DATA,
    {},
    { requestPolicy: "network-only" }
  );

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

      <div className="bg-white shadow-xl rounded-2xl space-y-6">
        {/* Project Image */}
        <div className="relative w-full h-64">
          <Image
            src={project.defaultImage?.url || "/bg.jpg"}
            alt="Project preview"
            fill
            sizes="(max-width: 768px) 100vw, 700px"
            className="object-cover rounded-t-2xl"
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
              <h2 className="text-3xl font-semibold text-primary">
                Reward
              </h2>
              <div className="text-lg text-black">
                {project.reward}
              </div>
            </>
          )}

          {/* Team Members */}
          {project.projectTeam?.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-300">
              <h2 className="text-2xl font-semibold text-primary mb-5">
                Our team
              </h2>
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
                          <p className="text-sm text-gray-500">
                            {member.email}
                          </p>
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
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
