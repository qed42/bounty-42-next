import { count, eq, and } from "drizzle-orm";
import { projectTeam, projects, users } from "./schema";
import { db } from "@/db";

// Get all projects with team member count
export const getAllProjects = async () => {
  const projectsWithTeam = await db
    .select({
      id: projects.id,
      title: projects.title,
      description: projects.description,
      slug: projects.slug,
      duration: projects.duration,
      prize: projects.prize,
      teamCount: count(projectTeam.userId),
    })
    .from(projects)
    .leftJoin(projectTeam, eq(projects.id, projectTeam.projectId))
    .groupBy(projects.id);

  return projectsWithTeam;
};

// Get a project by matching its slug value
export const getProjectBySlug = async (slug: string = "") => {
  if (slug.length === 0) return null;

  const projectWithUsers = await db
    .select({
      projectTitle: projects.title,
      projectDuration: projects.duration,
      projectDescription: projects.description,
      userId: users.id,
      userName: users.name,
      userEmail: users.email,
    })
    .from(projects)
    .leftJoin(projectTeam, eq(projects.id, projectTeam.projectId))
    .leftJoin(users, eq(projectTeam.userId, users.id))
    .where(eq(projects.slug, slug));

  if (projectWithUsers.length === 0) {
    return null; // Project not found
  }

  // Filter out null users and create users array
  const validUsers = projectWithUsers
    .filter((row) => row.userId !== null)
    .map((row) => ({
      id: row.userId,
      name: row.userName,
      email: row.userEmail,
    }));

  // Transform the flat result into nested structure
  const project = {
    title: projectWithUsers[0].projectTitle,
    duration: projectWithUsers[0].projectDuration,
    description: projectWithUsers[0].projectDescription,
    teamCount: validUsers.length, // Add team count
    team: validUsers,
  };

  return project;
};

// Add user to project
export const addUserToProjectTransaction = async (
  projectSlug: string,
  userEmail: string
) => {
  return await db.transaction(async (tx) => {
    // Get user by email
    const user = await tx
      .select({ id: users.id, name: users.name })
      .from(users)
      .where(eq(users.email, userEmail))
      .limit(1);

    if (user.length === 0) {
      console.error("User not found");
      return {
        success: false,
        message: "User not found",
      };
    }

    // Get project by slug
    const project = await tx
      .select({ id: projects.id, title: projects.title })
      .from(projects)
      .where(eq(projects.slug, projectSlug))
      .limit(1);

    if (project.length === 0) {
      console.error("Project not found");
      return {
        success: false,
        message: "Project not found",
      };
    }

    // Check if already exists
    const existing = await tx
      .select()
      .from(projectTeam)
      .where(
        and(
          eq(projectTeam.userId, user[0].id),
          eq(projectTeam.projectId, project[0].id)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      console.error("User already in project");
      return {
        success: false,
        message: "User already in project",
      };
    }

    // Add to project
    const membership = await tx
      .insert(projectTeam)
      .values({
        userId: user[0].id,
        projectId: project[0].id,
      })
      .returning();

    return {
      success: true,
      message: `${user[0].name} added to ${project[0].title}`,
      data: {
        userId: user[0].id,
        projectId: project[0].id,
        membershipId: membership[0].id,
      },
    };
  });
};
