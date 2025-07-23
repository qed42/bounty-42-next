// lib/queries/getData.ts
import { DrupalNode } from "next-drupal";
import { gql } from "urql";
import { drupal } from "../drupal";

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
              }
            }
            defaultImage {
              url
              title
              alt
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
        include: ["field_teams", "field_teams.field_team_members"].join(","),
      },
    });

    return node;
  } catch (error) {
    console.error("Error fetching project by ID with team members:", error);
    return null;
  }
}
