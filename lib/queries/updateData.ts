import { drupal } from "../drupal";

// Prevent duplicates
interface TeamMember {
  id: string;
  type: string;
}

export async function addUserToProject(articleId: string, termEmail: string) {
  // 1️⃣ Find existing taxonomy term by field_email
  const response = await drupal.getResourceCollection("taxonomy_term--team", {
    params: {
      "filter[field_email]": termEmail,
    },
  });

  let term = response[0];

  if (!term) {
    // 2️⃣ Create term if it doesn't exist
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

  // 3️⃣ Fetch current project with field_project_team relationship
  const project = await drupal.getResource("node--project", articleId, {
    params: {
      include: "field_project_team",
    },
  });

  // 4️⃣ Prepare updated team list
  const existingTeam = project?.field_project_team ?? [];
  const isAlreadyAdded = existingTeam.some(
    (member: TeamMember) => member.id === term.id
  );

  if (isAlreadyAdded) {
    return { data: project, termAdded: true };
  }

  const updatedTeam = isAlreadyAdded
    ? existingTeam
    : [...existingTeam, { type: "taxonomy_term--team", id: term.id }];

  // 5️⃣ Update project with new team list
  const updated = await drupal.updateResource(
    "node--project",
    articleId,
    {
      data: {
        type: "node--project",
        id: articleId,
        relationships: {
          field_project_team: {
            data: updatedTeam,
          },
        },
      },
    },
    { withAuth: true }
  );

  return { data: updated, termAdded: true };
}
