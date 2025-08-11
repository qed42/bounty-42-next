// lib/types.ts
export type DrupalComment = {
  id: string;
  subject?: string | null;
  comment_body?: { value?: string | null } | null;
  uid?: { display_name?: string | null } | null;
  user_id?: { display_name?: string | null } | null;
};
