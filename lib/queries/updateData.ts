/* eslint-disable @typescript-eslint/no-explicit-any */
import { ProjectNode } from "@/types/project";
import { drupal } from "../drupal";

export async function addUserToProject(
  project: ProjectNode,
  termEmail: string
) {
  const projectId = project.id;

  // Get taxonomy term by email
  const response = await drupal.getResourceCollection(
    "taxonomy_term--team",
    {
      params: {
        "filter[field_email]": termEmail,
      },
    }
  );

  let term = response[0];

  if (!term) {
    term = await drupal.createResource(
      "taxonomy_term--team",
      {
        data: {
          type: "taxonomy_term--team",
          attributes: { field_email: termEmail },
        },
      },
      { withAuth: true }
    );
  }

  const existingTeam: any = project.projectTeam ?? [];
  const isAlreadyAdded = existingTeam.some((member: any) => member.id === term.id);

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
