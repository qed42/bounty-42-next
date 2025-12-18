import { collectAndStoreDrupalUserData } from "@/lib/os/api-utils";

export default async function DrupalWrapPage() {
  const data = await collectAndStoreDrupalUserData(
    "xjm",
    12
  );
  console.log(`user`, data);

  return (
    <div>
      <h1>Drupal Wrap Page</h1>
    </div>
  );
}
