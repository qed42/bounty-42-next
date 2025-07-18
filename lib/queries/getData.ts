// lib/queries/getData.ts
import { gql } from "urql";

export const GET_PROJECTS = gql`
  query GetProjects {
    nodeProjects(first: 10, after: null) {
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
            alt
            title
          }
          projectTeam {
            ... on TermTeam {
              id
              name
              employeeImage {
                url
              }
              email
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
