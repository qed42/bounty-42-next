import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

import { getMentorProjects } from "@/lib/queries/getData"; 
import AuthGuard from "@/components/AuthGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CardItem } from "@/components/02-molecules/card-item";
import { FolderOpen } from "lucide-react"

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return (
      <div className="container mx-auto py-12">
        Please log in to view your profile.
      </div>
    );
  }

  // Fetch mentor projects
  const mentorProjects = await getMentorProjects(session.user.email);

  return (
    <AuthGuard>
      <div className="container mx-auto px-4 my-5 lg:my-10">    
        
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-5">
            {/* Profile Section */}
            <Card className="lg:col-span-2">
              <CardContent>
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage
                      src={session?.user?.image || "/placeholder.svg"}
                      alt={session?.user?.name || "User"}
                    />
                    <AvatarFallback className="text-lg">
                      {(session?.user?.name ?? "User")
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-foreground">
                      {session?.user?.name}
                    </h2>
                    <p className="text-muted-foreground">{session?.user?.email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            {/* Projects Section */}
              {mentorProjects && mentorProjects.length > 0 && (
                <Card className="lg:col-span-2">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-foreground flex items-center gap-2">
                      <FolderOpen className="h-5 w-5" />
                      <h2 className="text-xl font-semibold">My Projects</h2>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                      {mentorProjects.map((project, index) => (
                        <CardItem
                          key={project.id}
                          index={index}
                          title={project.title}
                          description={project.body?.summary ?? "No description available."}
                          category={project.field_category?.name ?? "Uncategorized"}
                          weight={project.field_category?.weight ?? 0}
                          image={
                            project.field_default_image?.uri?.url
                              ? `${process.env.DRUPAL_AUTH_URI}${project.field_default_image.uri.url}`
                              : "/default-placeholder.jpg"
                          }
                          link={project?.path?.alias}
                          id={project.id}
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
          </div>
      </div>
    </AuthGuard>
  );
}
