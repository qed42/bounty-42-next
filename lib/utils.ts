/* eslint-disable @typescript-eslint/no-explicit-any */
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const canUserAccessProjectUpdates = (
  teamMembers: string[],
  mentorsMail: string | null = "",
  currentUserEmail: string | null = ""
) => {
  if (!currentUserEmail || !Array.isArray(teamMembers)) return false;

  // Normalize email for case-insensitive comparison
  const normalizedEmail = currentUserEmail.toLowerCase();

  return (
    mentorsMail?.includes(normalizedEmail) ||
    teamMembers.some((member) => {
      if (typeof member === "string") {
        return member.toLowerCase() === normalizedEmail;
      }
      return false;
    })
  );
};

export const getMentorEmails = (mentors: any[]): string[] => {
  return mentors?.map((mentor: any) => mentor?.mail) ?? [];
};
