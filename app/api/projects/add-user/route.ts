// app/api/projects/add-user/route.ts
import { NextRequest, NextResponse } from "next/server";
import { addUserToProjectTransaction } from "@/db/queries";

export async function POST(request: NextRequest) {
  try {
    const { projectSlug, userEmail } = await request.json();

    // Validate input
    if (!projectSlug || !userEmail) {
      return NextResponse.json(
        { success: false, message: "Project slug and user email are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail)) {
      return NextResponse.json(
        { success: false, message: "Invalid email format" },
        { status: 400 }
      );
    }

    const result = await addUserToProjectTransaction(projectSlug, userEmail);

    if (result.success) {
      return NextResponse.json(result, { status: 201 });
    } else {
      return NextResponse.json(result, { status: 400 });
    }
  } catch (error) {
    console.error("Error in add-user API:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
