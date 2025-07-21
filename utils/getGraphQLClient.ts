// utils/getGraphQLClient.ts

import { getClient } from "@/utils/client"

export async function getGraphQLClient() {
  if (typeof window !== "undefined") {
    throw new Error("getGraphQLClient should not be used on the client");
  }

  // server-only secrets
  const drupalAuthUri = process.env.DRUPAL_AUTH_URI!;
  const drupalClientId = process.env.DRUPAL_CLIENT_ID!;
  const drupalClientSecret = process.env.DRUPAL_CLIENT_SECRET!;
  const drupalGraphqlUri = process.env.DRUPAL_GRAPHQL_URI!;

  const client = await getClient({
    auth: {
      uri: drupalAuthUri,
      clientId: drupalClientId,
      clientSecret: drupalClientSecret,
    },
    url: drupalGraphqlUri,
  });

  return client;
}
