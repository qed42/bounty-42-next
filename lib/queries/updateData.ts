/* eslint-disable @typescript-eslint/no-explicit-any */
import { Project, ProjectTeam, TeamData, TeamMember } from "@/types/project";
import { drupal } from "../drupal";
import { getUsername } from "@/utils/helpers";

// Creates users in Drupal from a list of email addresses.
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

// Creates a new project team in Drupal if name and members are unique.
export const createProjectTeam = async (
  teamName: string,
  teamMembers: TeamMember[] | any
) => {
  if (!teamName || teamMembers.length === 0) {
    console.warn("Team name or team members missing.");
    return null;
  }

  try {
    // FIXME: Maybe find a way to improve this GET request, move it to a server based fetch maybe.
    // Step 1: Fetch all existing project teams
    const existingTeams = await drupal.getResourceCollection(
      "taxonomy_term--project_teams",
      {
        params: {
          include: "field_team_members",
        },
      }
    );

    // Step 2: Check for name conflict
    const teamWithSameName = existingTeams.find(
      (team: any) => team.name.toLowerCase() === teamName.toLowerCase()
    );

    if (teamWithSameName) {
      return {
        id: "",
        success: false,
        message: "Oops! That team name is already taken. Try another one.",
      };
    }

    // Step 3: Check for duplicate member sets
    const newMemberUUIDs = teamMembers.map((member: any) => member.uuid).sort();

    for (const team of existingTeams) {
      const members = team?.field_team_members || [];
      const memberUUIDs = members.map((m: any) => m.id).sort();

      const sameLength = memberUUIDs.length === newMemberUUIDs.length;
      const sameMembers =
        sameLength &&
        memberUUIDs.every((id: string, i: number) => id === newMemberUUIDs[i]);

      if (sameMembers) {
        return {
          id: "",
          success: false,
          team,
          message: `These members are already part of the team: "${team.name}".`,
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
              data: teamMembers.map((user: any) => ({
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
      success: true,
    };
  } catch (error) {
    console.error("Failed to create project team:", error);
    return null;
  }
};

// Checks if a team member already exists in any of the project teams.
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
        message: "The team member already part of a different team.",
        memberExists: true,
        email,
        id: match.id,
      };
    }
  }

  return null;
}

// Main function to add a team to a project after validation and creation.
export async function addTeamToProject(
  teamData: TeamData,
  project: Project,
  allProjectTeams: ProjectTeam[]
) {
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
    const emails = doesMemberExist.map((member) => member.email).join(", ");
    const message = `The following member(s) are already part of another team: ${emails}`;

    return {
      success: false,
      data: project,
      userMail: doesMemberExist.map((member) => member.email),
      message,
    };
  }

  // 2: Create users in Drupal if not created.
  const usersDrupal = await createUsersInDrupal(teamMails);

  // 3: Create Project team taxonomy and handles cases like similar team names and similar team members.
  const projectTeam = await createProjectTeam(teamName, usersDrupal);
  if (!projectTeam?.success) {
    return projectTeam;
  }

  // 4: Attach projectTeam to the bounty project
  // FIXME: Maybe we don't need this anymore.
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
      success: false,
      data: project,
      message: "This team is already involved in the project.",
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
    success: true,
    data: updated,
    message: "Project claimed successfully.",
  };
}
