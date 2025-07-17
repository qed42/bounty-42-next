import { db } from "@/db";
import { users } from "@/db/schema";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { name, email } = await req.json();
  const [user] = await db.insert(users).values({ name, email }).returning();
  return NextResponse.json({ message: "User created", user });
}
