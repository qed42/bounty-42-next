import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const canUserAccessProjectUpdates = (
  teamMembers: string[],
  currentUserEmail = ""
) => {
  if (!currentUserEmail || !Array.isArray(teamMembers)) return false;

  // Normalize email for case-insensitive comparison
  const normalizedEmail = currentUserEmail.toLowerCase();

  return teamMembers.some((member) => {
    if (typeof member === "string") {
      return member.toLowerCase() === normalizedEmail;
    }
    return false;
  });
};
