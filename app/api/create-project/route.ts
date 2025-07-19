import { db } from "@/db";
import { projects, projectTeam } from "@/db/schema";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { title, description, duration, prize, userIds } =
    await req.json();

  if (!userIds || userIds.length < 1 || userIds.length > 3) {
    return NextResponse.json(
      { error: "Project must have 1–3 users" },
      { status: 400 }
    );
  }

  const path = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const [project] = await db
    .insert(projects)
    .values({
      title,
      description,
      slug: path,
      duration,
      prize,
    })
    .returning();

  await db.insert(projectTeam).values(
    userIds.map((userId: string) => ({
      userId,
      projectId: project.id,
    }))
  );

  return NextResponse.json({ message: "Project created", project });
}
