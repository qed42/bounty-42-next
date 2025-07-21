import { db } from "@/db";
import { users } from "@/db/schema";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { name, email } = await req.json();

  if (!email.endsWith("@qed42.com")) {
    return NextResponse.json({ error: "Incorrect email" }, { status: 400 });
  }

  const [user] = await db.insert(users).values({ name, email }).returning();
  return NextResponse.json({ message: "User created", user });
}
