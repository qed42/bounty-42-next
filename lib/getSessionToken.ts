import { cookies } from "next/headers";
import { decode } from "next-auth/jwt";

/**
 * Retrieves and decodes the NextAuth session token from cookies.
 *
 * @returns The decoded token object if valid, otherwise null.
 * @throws Error if NEXTAUTH_SECRET is not set in environment variables.
 */
export async function getSessionToken() {
  const cookieStore = cookies();
  const sessionToken =
    (await cookieStore).get("next-auth.session-token")?.value ||
    (await cookieStore).get("__Secure-next-auth.session-token")?.value; // Handles secure cookie in production

  if (!sessionToken) {
    return null; // No session found
  }

  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error("NEXTAUTH_SECRET environment variable is not set");
  }

  const token = await decode({
    token: sessionToken,
    secret,
  });

  return token ?? null; // Null if decoding failed
}
