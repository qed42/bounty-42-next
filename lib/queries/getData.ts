// lib/queries/getData.ts
import { gql } from "urql";

export const GET_PROJECTS = gql`
  query GetProjects($first :Int, $after : Cursor) {
    nodeProjects(first: $first, after: $after) {
      edges {
        node {
          id
          durations
          body {
            summary
            value
          }
          title
          path
          defaultImage {
            url
            title
            alt
          }
          projectTeam {
            ... on TermTeam {
              employeeImage {
                url
                alt
                title
              }
              name
              email
              id
            }
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
            defaultImage {
              url
              title
              alt
            }
            projectTeam {
              ... on TermTeam {
                id
                name
                email
                employeeImage {
                  url
                  alt
                  title
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
