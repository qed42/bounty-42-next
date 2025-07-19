import { notFound } from "next/navigation";
import Image from "next/image";
import { getProjectBySlug } from "@/db/queries";
import AddUserButton from "@/components/02-molecules/AddUserButton";
import AuthGuard from "@/components/AuthGuard";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export default async function ProjectItemPage({
  params,
}: {
  params: { slug: string };
}) {
  const paramsValue = await params;
  const projectSlug = paramsValue.slug;
  
  const session = await getServerSession(authOptions);
  const project = await getProjectBySlug(projectSlug);

  if (!project) {
    notFound();
  }

  const { title, description, duration, teamCount, team } = project;

  return (
    <AuthGuard>
      <div className="container mx-auto px-4 py-12 lg:py-20">
        {/* Title and Duration */}
        <div className="mb-5">
          <h1 className="text-4xl font-bold text-primary">{title}</h1>
          <small className="text-gray-400">({duration})</small>
        </div>

        {/* Project Content */}
        <div className="bg-white shadow-xl rounded-2xl space-y-6">
          {/* Project Image */}
          <div className="relative w-full h-64">
            <Image
              src={"/bg.jpg"}
              alt="Project preview"
              fill
              className="w-full h-64 object-cover"
            />
          </div>

          {/* Description */}
          <section className="p-5 space-y-6">
            <div
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: description || "" }}
            />

            {/* Team Members */}
            {teamCount > 0 && (
              <>
                <h2 className="text-2xl font-semibold text-primary mb-5">
                  Our team
                </h2>
                <ul
                  role="list"
                  className="grid gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 list-none"
                >
                  {team.map(
                    (
                      member: {
                        id: string | null;
                        name: string | null;
                        email: string | null;
                      },
                      index: number
                    ) => (
                      <li key={`${member.email ?? "unknown"}-${index}`}>
                        <div className="flex items-center gap-x-4">
                          <Image
                            src={"/avatar.png"}
                            width={60}
                            height={60}
                            alt={member.name ?? "Unknown"}
                            className="size-16 rounded-full outline-1 -outline-offset-1 outline-black/5"
                          />
                          <div>
                            <h3 className="text-base font-semibold tracking-tight text-gray-900">
                              {member.name ?? "Unknown"}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {member.email ?? "No email"}
                            </p>
                          </div>
                        </div>
                      </li>
                    )
                  )}
                </ul>

                {/* Be a Member Button */}
                {teamCount < 3 && (
                  <div className="mt-8 text-center">
                    <AddUserButton
                      projectSlug={projectSlug}
                      userEmail={session?.user?.email || ""}
                    />
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </div>
    </AuthGuard>
  );
}
