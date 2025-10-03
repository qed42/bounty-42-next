/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import {
  ErrorResult,
  Milestone,
  MilestoneResult,
  ProjectTeam,
  ProjectTeamEntity,
  SuccessResult,
  TeamData,
  TeamMember,
} from "@/types/project";
import { drupal } from "../drupal";
import { getUsername } from "@/utils/helpers";
import { getProjectById } from "./getData";

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
    const match = team?.field_team_members.find(
      (member) => member?.mail?.toLowerCase() === email?.toLowerCase()
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

// Handles the creation of project milestones and their relationships.
async function handleProjectMilestones(
  milestones: Milestone[],
  projectTeam: ProjectTeamEntity
): Promise<ErrorResult | SuccessResult | any> {
  // 1: Create paragraph--milestone paragraphs in Drupal
  const milestoneResults = await Promise.all(
    milestones.map(async (milestone): Promise<MilestoneResult> => {
      try {
        const response = await drupal.createResource("paragraph--milestone", {
          data: {
            type: "paragraph--milestone",
            attributes: {
              field_milestone_name: milestone.title,
              field_milestone_details: milestone.description,
              field_milestone_status: "not_started"
            },
          },
        });

        return {
          success: true,
          id: response.id,
          type: response.type,
          drupal_internal__id: response.drupal_internal__id,
          drupal_internal__revision_id: response.drupal_internal__revision_id,
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Unknown error while creating milestone";
        console.error(
          "Failed to create milestone paragraph:",
          milestone,
          error
        );

        return {
          success: false,
          message: errorMessage,
        };
      }
    })
  );

  // 2; Check if any milestone creation failed
  const failedResult = milestoneResults.find((result) => !result.success);
  if (failedResult) {
    return {
      success: false,
      message: failedResult.message || "Failed to create milestones",
    };
  }

  // 3: Transform successful results for Drupal relationships
  const milestoneReferences: any = milestoneResults
    .filter((result): result is Required<MilestoneResult> => result.success)
    .map((result) => ({
      type: result.type,
      id: result.id,
      meta: {
        target_revision_id: result.drupal_internal__revision_id,
        drupal_internal__target_id: result.drupal_internal__id,
      },
    }));

  // 3: Create project milestones paragraph with team and paragraph--project_milestones relationships
  try {
    const projectMilestones = await drupal.createResource(
      "paragraph--project_milestones",
      {
        data: {
          type: "paragraph--project_milestones",
          relationships: {
            field_execution_plan: {
              data: milestoneReferences,
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

    return {
      id: projectMilestones.id,
      type: projectMilestones.type,
      drupal_internal__id: projectMilestones.drupal_internal__id,
      drupal_internal__revision_id:
        projectMilestones.drupal_internal__revision_id,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to create project milestones";
    return {
      success: false,
      message: errorMessage,
    };
  }
}

// Main function to add a team to a project after validation and creation.
export async function addTeamToProject(
  teamData: TeamData,
  projectId: string,
  allProjectTeams: ProjectTeam[]
) {
  const { member1, member2, member3, teamName, milestones } = teamData;
  const teamMails = [member1, member2, member3];
  const projectData = await getProjectById(projectId);

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
      data: projectData,
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
  if (projectData?.field_execution_tracks != null) {
    const exisitingExecutionPlan = projectData?.field_execution_tracks?.map(
      (track: any) => ({
        type: track.type || "paragraph--project_milestones",
        id: track.id,
        meta: {
          target_revision_id: track.resourceIdObjMeta.target_revision_id,
          drupal_internal__target_id:
            track.resourceIdObjMeta.drupal_internal__target_id,
        },
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

export async function postCommentForMilestone({
  projectNodeId,
  uid,
  text,
}: {
  projectNodeId: string;
  uid: string;
  text: string;
}) {
  try {
    const payload = {
      data: {
        type: "comment--comment",
        attributes: {
          subject: `Comment on project ${projectNodeId}`,
          entity_type: "node",
          field_name: "field_comments",
          comment_body: {
            value: text,
            format: "basic_html",
          },
        },
        relationships: {
          entity_id: {
            data: {
              type: "node--project",
              id: projectNodeId,
            },
          },
          uid: {
            data: {
              type: "user--user",
              id: uid,
            },
          },
        },
      },
    };

    const createdComment = await drupal.createResource(
      "comment--comment",
      payload
    );
    return { success: true, comment: createdComment };
  } catch (error) {
    console.error("Error posting comment:", error);
    return { success: false, error };
  }
}

export async function updateMilestoneStatus(
  milestoneId: string,
  status: string
) {
  const transformedStatus = status.replace(/[\s-]+/g, "_").toLowerCase();
  try {
    const response = await drupal.updateResource(
      "paragraph--milestone",
      milestoneId,
      {
        data: {
          type: "paragraph--milestone",
          id: milestoneId,
          attributes: {
            field_milestone_status: transformedStatus,
          },
        },
      }
    );
    return { success: true, data: response };
  } catch (error) {
    console.error("Failed to update milestone status:", error);
    return { success: false, error };
  }
}

export const sendNotificationEmail = async (
  emails: string[],
  projectDetails: { name: string; path: string }
) => {
  const { name, path } = projectDetails;

  const subject = `Recent Activity in "${name}"`;

  const htmlContent = `
    <p>Hi, there’s been some recent activity in the project <strong>${name}</strong>.</p>
    <p>You can check it out here: <a href="${path}">${path}</a></p>
    <br/>
    <p style="color: #555;">- Bounty Portal Team</p>
  `;

  const textContent = `
    Hi there,

    There’s been some recent activity in the project "${name}".

    Check it out here: ${path}

    - Bounty Portal Team
      `;

  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/send-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: emails,
        subject,
        htmlContent,
        textContent,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      return {
        success: true,
        data,
      };
    } else {
      return {
        success: false,
        error: data.error || "Failed to send email",
      };
    }
  } catch (error) {
    console.error("Failed to send email:", error);
    return { success: false, error };
  }
};

export async function deleteComment(commentId: string) {
  try {
    await drupal.deleteResource("comment--comment", commentId);
    return { success: true };
  } catch (err) {
    console.error("Error deleting comment:", err);
    return { success: false };
  }
}

// Update execution track selection
export async function updateExecutionTrackStatus(
  trackId: string,
  selected: boolean
) {
  try {
    const response = await drupal.updateResource(
      "paragraph--project_milestones", // JSON:API type
      trackId,
      {
        data: {
          type: "paragraph--project_milestones",
          id: trackId,
          attributes: {
            field_selected: selected,
          },
        },
      }
    );

    console.log("Execution track updated:", response);
    return { success: true, data: response };
  } catch (error) {
    console.error("Failed to update execution track status:", error);
    return { success: false, error };
  }
}

// Create new comment
export async function createComment(
  entityId: string,
  subject: string,
  body: string,
  uid?: string // optional Drupal user id
) {
  try {
    const payload: any = {
      data: {
        type: "comment--comment",
        attributes: {
          subject,
          entity_type: "node",
          field_name: "field_comments",
          comment_body: {
            value: body,
            format: "basic_html",
          },
        },
        relationships: {
          entity_id: {
            data: {
              type: "node--project", // adjust if your node type differs
              id: entityId,
            },
          },
        },
      },
    };

    // attach uid relationship only if provided
    if (uid) {
      payload.data.relationships.uid = {
        data: {
          type: "user--user",
          id: uid,
        },
      };
    }

    const response = await drupal.createResource("comment--comment", payload);

    console.log("✅ createResource response:", response);
    return { success: true, data: response };
  } catch (error: any) {
    console.error("❌ createResource error:", error);
    return { success: false, error };
  }
}


// Update existing comment
export async function updateComment(
  commentId: string,
  subject: string,
  body: string
) {
  try {
    const payload: any = {
      data: {
        type: "comment--comment",
        id: commentId,
        attributes: {
          subject,
          comment_body: {
            value: body,
            format: "basic_html",
          },
        },
      },
    };

    // Pass `type`, `id`, `payload`
    const response = await drupal.updateResource(
      "comment--comment",
      commentId,
      payload
    );

    console.log("✅ updateResource response:", response);
    return { success: true, data: response };
  } catch (error: any) {
    console.error("❌ updateComment error:", error);
    return { success: false, error };
  }
}


// Delete a comment
export async function deleteCommentnew(commentId: string) {
  try {
    await drupal.deleteResource("comment--comment", commentId);
    return { success: true };
  } catch (error: any) {
    console.error("❌ deleteComment error:", error);
    return { success: false, error };
  }
}
