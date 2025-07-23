/* eslint-disable @typescript-eslint/no-explicit-any */
import { ProjectNode } from "@/types/project";
import { drupal } from "../drupal";
import { getUsername } from "@/utils/helpers";

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

const createUsersInDrupal = async (userEmails: string[] = []) => {
  const users = await Promise.all(
    userEmails.map(async (mail) => {
      if (!mail || mail.length === 0) return null;

      const name = await getUsername(mail);

      try {
        const response = await drupal.fetch("/api/oauth/sync-user", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: mail,
            name,
          }),
        });

        if (!response.ok) {
          console.error("Failed to sync user with Drupal:", mail);
          return null;
        }

        const userData = await response.json();
        return {
          email: userData.email,
          uuid: userData.uuid,
        };
      } catch (error) {
        console.error("Error syncing with Drupal:", mail, error);
        return null;
      }
    })
  );

  const filteredUsers = users.filter(Boolean); // Remove nulls
  return filteredUsers;
};
type TeamMember = {
  uuid: string;
  email?: string;
};

export const createProjectTeam = async (
  teamName: string,
  teamMembers: TeamMember[]
) => {
  if (!teamName || teamMembers.length === 0) {
    console.warn("Team name or team members missing.");
    return null;
  }

  try {
    // Step 1: Fetch all existing project teams
    const existingTeams = await drupal.getResourceCollection(
      "taxonomy_term--project_teams",
      {
        params: {
          include: "field_team_members",
        },
      }
    );

    console.log(`existingTeams`, existingTeams);
    console.log(`teamMembers`, teamMembers);

    // Step 2: Check for name conflict
    const teamWithSameName = existingTeams.find(
      (team: any) => team.name.toLowerCase() === teamName.toLowerCase()
    );

    if (teamWithSameName) {
      return { team_created: false, message: "Team name taken" };
    }

    // Step 3: Check for duplicate member sets
    const newMemberUUIDs = teamMembers.map((member) => member.uuid).sort();

    for (const team of existingTeams) {
      const members = team?.field_team_members || [];
      const memberUUIDs = members.map((m: any) => m.id).sort();

      const sameLength = memberUUIDs.length === newMemberUUIDs.length;
      const sameMembers =
        sameLength && memberUUIDs.every((id, i) => id === newMemberUUIDs[i]);

      if (sameMembers) {
        return {
          team_created: false,
          message: `Team already exists with name: ${team.name}`,
          team,
        };
      }
    }

    // Step 4: Create the new team
    const response = await drupal.createResource(
      "taxonomy_term--project_teams",
      {
        data: {
          type: "taxonomy_term--project_teams",
          attributes: {
            name: teamName,
          },
          relationships: {
            field_team_members: {
              data: teamMembers.map((user) => ({
                type: "user--user",
                id: user.uuid,
              })),
            },
          },
        },
      }
    );

    return {
      ...response,
      team_created: true,
    };
  } catch (error) {
    console.error("Failed to create project team:", error);
    return null;
  }
};

type TeamMem = {
  id: string;
  name: string;
  mail: string;
};

type ProjectTeam = {
  id: string;
  name: string;
  field_team_members: TeamMem[];
};

export function checkIfMemberExists(
  projectTeams: ProjectTeam[],
  email: string
): {
  message: string;
  memberExists: boolean;
  email: string;
  id: string;
} | null {
  for (const team of projectTeams) {
    const match = team.field_team_members.find(
      (member) => member.mail.toLowerCase() === email.toLowerCase()
    );

    if (match) {
      return {
        message: "Team member already exists in another team",
        memberExists: true,
        email,
        id: match.id,
      };
    }
  }

  return null;
}

export async function addTeamToProject(teamData, project, allProjectTeams) {
  const { member1, member2, member3, teamName } = teamData;
  const teamMails = [member1, member2, member3];
  const projectId = project.id;

  // 1: Check whether any new members are already part of the project via another team.
  const existingMembers = await Promise.all(
    teamMails.map(async (mail) => {
      return await checkIfMemberExists(allProjectTeams, mail);
    })
  );
  const doesMemberExist = existingMembers.filter((item) => item != null);

  if (doesMemberExist && doesMemberExist.length > 0) {
    return {
      data: project,
      userMail: doesMemberExist.map((member) => member.email),
      message: "Already member is a part of another team",
    };
  }

  // 2: Create users in Drupal if not created.
  const usersDrupal = await createUsersInDrupal(teamMails);

  // 3: Create Project team taxonomy and handles cases like similar team names and similar team members.
  const projectTeam = await createProjectTeam(teamName, usersDrupal);
  if (!projectTeam?.team_created) {
    return projectTeam;
  }

  // 4: Attach projectTeam to the bounty project
  const existingTeam: any =
    project.teams?.map((member: any) => ({
      type: member.type || "taxonomy_term--project_teams",
      id: member.id,
    })) ?? [];

  const isAlreadyAdded = existingTeam.some(
    (member: any) => member.id === projectTeam.id
  );

  if (isAlreadyAdded) {
    return {
      data: project,
      termAdded: true,
      message: "Already team is a part of the project",
    };
  }

  const updatedTeam: any = [
    ...existingTeam,
    { type: "taxonomy_term--project_teams", id: projectTeam.id },
  ];
  const updated = await drupal.updateResource(
    "node--project",
    projectId,
    {
      data: {
        type: "node--project",
        id: projectId,
        relationships: {
          field_teams: {
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
