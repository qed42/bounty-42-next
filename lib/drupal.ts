import { NextDrupal } from "next-drupal";

export const drupal = new NextDrupal(process.env.NEXT_PUBLIC_DRUPAL_AUTH_URI!, {
  auth: {
    clientId: process.env.NEXT_PUBLIC_DRUPAL_CLIENT_ID!,
    clientSecret: process.env.NEXT_PUBLIC_DRUPAL_CLIENT_SECRET!,
  },
});
