/* eslint-disable @typescript-eslint/no-explicit-any */
// "use server";

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
export async function checkIfMemberExists(
  projectTeams: ProjectTeam[],
  email: string
) {
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

// const testProject = [
//   { id: 1, title: 'Milestone 1', description: '- Setup project' },
//   { id: 2, title: 'Mileston 2', description: '- Setup DB' }
// ]

async function handleProjectMilestones(milestones: any, projectTeam: any) {
  // 1: Create para--milestoneS in Drupal.
  const createMilestoneParagraphs = await Promise.all(
    milestones.map(async (milestone) => {
      try {
        const response = await drupal.createResource("paragraph--milestone", {
          data: {
            type: "paragraph--milestone",
            attributes: {
              field_milestone_name: milestone.title,
              field_milestone_details: milestone.description,
            },
          },
        });

        const { id, type, drupal_internal__id, drupal_internal__revision_id } =
          response;

        return {
          success: true,
          id,
          type,
          drupal_internal__id,
          drupal_internal__revision_id,
        };
      } catch (error: any) {
        console.error(
          "Failed to create milestone paragraph:",
          milestone,
          error
        );
        return {
          success: false,
          message: error?.message || "Unknown error while creating milestone.",
        };
      }
    })
  );

  if (
    createMilestoneParagraphs[0] &&
    createMilestoneParagraphs[0].success === false
  ) {
    return {
      success: false,
      message:
        createMilestoneParagraphs[0].message || "Failed to create milestones.",
    };
  }

  const paraMilestones = createMilestoneParagraphs
    .filter((item) => item.success)
    .map((item) => ({
      type: item.type,
      id: item.id,
      meta: {
        target_revision_id: item.drupal_internal__revision_id,
        drupal_internal__target_id: item.drupal_internal__id,
      },
    }));

  // 2: Add team ID, mentor ID, and milestones ID to project-milestones paragraph.
  const ProjectMilestones = await drupal.createResource(
    "paragraph--project_milestones",
    {
      data: {
        type: "paragraph--project_milestones",
        relationships: {
          field_execution_plan: {
            data: paraMilestones,
          },
          field_team: {
            data: {
              type: "taxonomy_term--project_teams",
              id: projectTeam.id,
            },
          },
        },
      },
    }
  );

  const { id, type, drupal_internal__id, drupal_internal__revision_id } =
    ProjectMilestones;
  return { id, type, drupal_internal__id, drupal_internal__revision_id };
  // 3: Attach project-milestones under execution tracks under the final project.
}

// Main function to add a team to a project after validation and creation.
export async function addTeamToProject(
  teamData: TeamData,
  project: Project,
  allProjectTeams: ProjectTeam[]
) {
  const { member1, member2, member3, teamName, milestones } = teamData;
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

  // 3: Create Project team taxonomy and handle cases like similar team names and similar team members.
  const projectTeam = await createProjectTeam(teamName, usersDrupal);
  if (!projectTeam?.success) {
    return projectTeam;
  }

  // Handle milestones
  const projectMilestones = await handleProjectMilestones(
    milestones,
    projectTeam
  );

  let updatedExecutionPlan: any = [];
  if (project?.executionTracks != null) {
    const exisitingExecutionPlan = project?.executionTracks?.map(
      (track: any) => ({
        type: track.type || "paragraph--project_milestones",
        id: track.id,
      })
    );
    updatedExecutionPlan = [
      ...exisitingExecutionPlan,
      {
        type: projectMilestones.type,
        id: projectMilestones.id,
        meta: {
          target_revision_id: projectMilestones.drupal_internal__revision_id,
          drupal_internal__target_id: projectMilestones.drupal_internal__id,
        },
      },
    ];
  } else {
    updatedExecutionPlan = [
      {
        type: projectMilestones.type,
        id: projectMilestones.id,
        meta: {
          target_revision_id: projectMilestones.drupal_internal__revision_id,
          drupal_internal__target_id: projectMilestones.drupal_internal__id,
        },
      },
    ];
  }

  const updatedProject = await drupal.updateResource(
    "node--project",
    projectId,
    {
      data: {
        type: "node--project",
        id: projectId,
        relationships: {
          field_execution_tracks: {
            data: updatedExecutionPlan,
          },
        },
      },
    }
  );

  return {
    success: true,
    data: updatedProject,
    message: "Claimed accepted, please wait for someone to reach out.",
  };
}
