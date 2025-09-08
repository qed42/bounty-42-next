import { DrupalNode, DrupalTaxonomyTerm } from "next-drupal";
import { gql } from "urql";
import { drupal } from "../drupal";
import { DrupalComment } from "../type";

export const GET_PROJECTS = gql`
  query GetProjects($first: Int, $after: Cursor) {
    nodeProjects(first: $first, after: $after) {
      edges {
        node {
          id
          durations
          body {
            summary
            value
          }
          category {
            ... on TermCategory {
              id
              name
              weight
            }
          }
          title
          path
          defaultImage {
            url
            title
            alt
          }
        }
        cursor
      }
      pageInfo {
        endCursor
        hasNextPage
      }
    }
  }
`;

export const GET_PROJECT_BY_PATH = gql`
  query GetProjectByPath($path: String!) {
    route(path: $path) {
      ... on RouteInternal {
        entity {
          ... on NodeProject {
            id
            title
            durations
            path
            body {
              summary
              value
            }
            reward
            category {
              ... on TermCategory {
                id
                name
                weight
              }
            }
            defaultImage {
              url
              title
              alt
            }
            executionTracks {
              ... on ParagraphProjectMilestone {
                __typename
                executionPlan {
                  ... on ParagraphMilestone {
                    id
                    status
                    milestoneStatus
                    milestoneName
                    milestoneDetails
                  }
                }
                id
                team {
                  ... on TermProjectTeam {
                    id
                    name
                  }
                }
                selected
              }
            }
            teams {
              ... on TermProjectTeam {
                id
                name
                teamMembers {
                  id
                  name
                  mail
                }
              }
            }
            projectMentor {
              mail
              name
            }
          }
        }
      }
      ... on RouteRedirect {
        url
        status
      }
    }
  }
`;

export async function getProjectWithTeamMembersById(
  id: string
): Promise<DrupalNode | null> {
  try {
    const node = await drupal.getResource<DrupalNode>("node--project", id, {
      params: {
        include: [
          "field_teams.field_team_members",
          "field_execution_tracks.field_team.field_team_members",
          "field_execution_tracks.field_execution_plan",
          "field_project_mentor",
        ].join(","),
      },
    });

    return node;
  } catch (error) {
    console.error("Error fetching project by ID with team members:", error);
    return null;
  }
}

export async function getTeamIdsForUserEmail(email: string): Promise<string[]> {
  try {
    const terms = await drupal.getResourceCollection<DrupalTaxonomyTerm[]>(
      "taxonomy_term--project_teams",
      {
        params: {
          "filter[field_team_members.mail]": email,
          "fields[taxonomy_term--project_teams]": "id",
        },
      }
    );

    return terms.map((term) => term.id);
  } catch (error) {
    console.error("Error fetching teams by user email:", error);
    return [];
  }
}

export async function getProjectsForUserEmail(email: string): Promise<boolean> {
  const teamIds = await getTeamIdsForUserEmail(email);

  if (teamIds.length === 0) return false;

  const params: Record<string, string> = {
    include: "field_execution_tracks.field_team",
  };

  try {
    const projects = await drupal.getResourceCollection<DrupalNode[]>(
      "node--project",
      { params }
    );

    const projectTeamIds = projects.filter((item) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      item.field_execution_tracks?.some((track: any) =>
        teamIds.includes(track.field_team.id)
      )
    );

    return projectTeamIds.length > 0;
  } catch (error) {
    console.error("Error fetching projects by email:", error);
    return false;
  }
}

// export async function getProjectById(id: string): Promise<DrupalNode | null> {
//   try {
//     const node = await drupal.getResource<DrupalNode>("node--project", id);
//     return node;
//   } catch (error) {
//     console.error("Error fetching article by ID:", error);
//     return null;
//   }
// }
export async function getProjectById(id: string): Promise<DrupalNode | null> {
  try {
    const params: Record<string, string> = {
      include: "field_project_mentor",
    };

    const node = await drupal.getResource<DrupalNode>(
      "node--project",
      id,
      { params }
    );

    return node;
  } catch (error) {
    console.error("Error fetching project by ID:", error);
    return null;
  }
}


export async function getCommentsForEntity(
  entityId: string
): Promise<DrupalComment[]> {
  try {
    const comments = await drupal.getResourceCollection<DrupalComment[]>(
      "comment--comment",
      {
        params: {
          "filter[entity_id.id]": entityId,
          include: "uid",
          sort: "-created",
        },
      }
    );

    // Map the included user data into display names
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return comments.map((comment: any) => {
      let authorEmail = "Anonymous";
      if (comment.uid?.mail) {
        authorEmail = comment.uid.mail; // Drupal username
      } else if (comment.uid?.mail) {
        authorEmail = comment.uid.mail; // If your Drupal has display_name field
      }

      return {
        ...comment,
        user_id: { display_name: authorEmail },
      };
    });
  } catch (error) {
    console.error("Error fetching comments for entity:", error);
    return [];
  }
}

export async function getMentorProjects(email: string): Promise<DrupalNode[]> {
  // Expand mentors so we get their user fields (mail, name, etc.)
  const params: Record<string, string> = {
    include: "field_project_mentor,field_category,field_default_image",
    "fields[media--image]": "name,field_media_image",
  };

  try {
    const projects = await drupal.getResourceCollection<DrupalNode[]>(
      "node--project",
      { params }
    );

    const mentorProjects = projects.filter((project) => {
      const mentors = Array.isArray(project.field_project_mentor)
        ? project.field_project_mentor
        : project.field_project_mentor
        ? [project.field_project_mentor]
        : [];

      // Return true if this project has a mentor with the given email
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return mentors.some((mentor: any) => mentor?.mail === email);
    });

    return mentorProjects;
  } catch (error) {
    console.error("Error fetching mentor projects:", error);
    return [];
  }
}
