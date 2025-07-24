import NextAuth, { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { drupal } from "@/lib/drupal"; // Your Drupal fetch wrapper

// Extend the User type to include uuid
declare module "next-auth" {
  interface User {
    uuid?: string;
  }
  interface Session {
    user?: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
      uuid?: string;
    };
  }
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    // Called during sign-in
    async signIn({ profile, user }) {
      if (!profile?.email || !profile.email.endsWith("@qed42.com"))
        return false;

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

        const drupalUser = await response.json();
        user.uuid = drupalUser.uuid;

        return true;
      } catch (error) {
        console.error("Error syncing with Drupal:", error);
        return false;
      }
    },

    // Called when JWT is created or updated
    async jwt({ token, user }) {
      if (user?.uuid) {
        token.uuid = user.uuid;
      }
      return token;
    },

    // Called whenever `useSession()` is used
    async session({ session, token }) {
      if (token?.uuid && session && session.user) {
        session.user.uuid =
          typeof token.uuid === "string" ? token.uuid : undefined; // Expose in session
      }
      return session;
    },
  },
};

export default NextAuth(authOptions);
