/* eslint-disable @typescript-eslint/no-explicit-any */
import { ProjectNode } from "@/types/project";
import { drupal } from "../drupal";

export async function addUserToProject(
  project: ProjectNode,
  termName: string,
  termEmail: string
) {
  const projectId = project.id;

  // Get taxonomy term by email
  const response = await drupal.getResourceCollection("taxonomy_term--team", {
    params: {
      "filter[field_email]": termEmail,
    },
  });

  let term = response[0];

  if (!term) {
    if (!termName?.trim() && !termEmail?.trim()) {
      return {
        data: project,
        termAdded: true,
        message: "Team member's name and email are missing",
      };
    }

    term = await drupal.createResource(
      "taxonomy_term--team",
      {
        data: {
          type: "taxonomy_term--team",
          attributes: { name: termName, field_email: termEmail },
        },
      },
      { withAuth: true }
    );
  }

  const existingTeam: any =
    project.projectTeam?.map((member: any) => ({
      type: member.type || "taxonomy_term--team",
      id: member.id,
    })) ?? [];
  const isAlreadyAdded = existingTeam.some(
    (member: any) => member.id === term.id
  );

  if (isAlreadyAdded) {
    return {
      data: project,
      termAdded: true,
      message: "Already a member of the project",
    };
  }

  const updatedTeam: any = [
    ...existingTeam,
    { type: "taxonomy_term--team", id: term.id },
  ];

  const updated = await drupal.updateResource(
    "node--project",
    projectId,
    {
      data: {
        type: "node--project",
        id: projectId,
        relationships: {
          field_project_team: {
            data: updatedTeam,
          },
        },
      },
    },
    { withAuth: true }
  );

  return {
    data: updated,
    termAdded: true,
    message: "Successfully joined the project!",
  };
}

export async function addUserToTeamTaxonomy(
  userEmail: string,
  userName?: string
) {
  // Validate required parameters
  if (!userEmail || typeof userEmail !== "string" || !userEmail.trim()) {
    console.error("Valid userEmail is required");
    return;
  }

  const trimmedEmail = userEmail.trim();
  const trimmedName = userName?.trim() || null;

  try {
    // Check if taxonomy term already exists for this email
    const existingTerms = await drupal.getResourceCollection(
      "taxonomy_term--team",
      {
        params: {
          "filter[field_email]": trimmedEmail,
        },
      }
    );

    // Return existing term if found
    if (existingTerms && existingTerms.length > 0) {
      return existingTerms[0];
    }

    // Prepare attributes object, only including name if it has a valid value
    const attributes: Record<string, any> = {
      field_email: trimmedEmail,
    };

    if (trimmedName) {
      attributes.name = trimmedName;
    }

    // Create new taxonomy term if none exists
    const newTerm = await drupal.createResource(
      "taxonomy_term--team",
      {
        data: {
          type: "taxonomy_term--team",
          attributes,
        },
      },
      { withAuth: true }
    );

    return newTerm;
  } catch (error) {
    console.error(
      `Failed to add user ${trimmedEmail} to team taxonomy:`,
      error
    );
    throw error;
  }
}
