import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { drupal } from "./drupal";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    GoogleProvider({
      clientId: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ profile }) {
      if (!profile?.email) return false;
      if (!profile.email.endsWith("@qed42.com")) return false;

      try {
        const response = await drupal.fetch("/api/oauth/sync-user", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: profile.email,
            name: profile.name,
          }),
        });

        if (!response.ok) {
          console.error("Failed to sync user with Drupal");
          return false;
        }

        return true;
      } catch (error) {
        console.error("Error syncing with Drupal:", error);
        return false;
      }
    },
  },
};
