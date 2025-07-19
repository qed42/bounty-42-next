// lib/queries/getData.ts
import { gql } from "urql";

export const GET_PROJECTS = gql`
  query GetProjects {
    nodeProjects(first: 10, after: null) {
      edges {
        node {
          id
          title
          durations
          body {
            summary
            value
          }
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

export const GET_MAIN_MENU = gql`
  query GetMenu {
    menu(name: MAIN) {
      items {
        title
        url
      }
    }
  }
`;
