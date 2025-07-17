// app/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";

export default async function Check() {
  const session = await getServerSession(authOptions);

  return (
    <div>
      {session ? (
        <p>Welcome, {session.user?.email}</p>
      ) : (
        <p>You are not signed in.</p>
      )}
    </div>
  );
}
