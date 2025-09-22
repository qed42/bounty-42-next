// components/03-organisms/CommentForm.tsx

"use client";

import { useState, useTransition } from "react";
import { createComment } from "@/lib/queries/updateData";

interface CommentFormProps {
  entityId: string;
  // Pass the new comment object back
   // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSuccess?: (newComment: any) => void;
}

export default function CommentForm({ entityId, onSuccess }: CommentFormProps) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      const result = await createComment(entityId, subject, body);
      if (result.success) {
        setSubject("");
        setBody("");

        // ✅ Pass created comment to parent so UI updates immediately
        onSuccess?.(result.data);
      } else {
        alert("❌ Failed to create comment");
      }
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 p-4 border rounded-lg shadow-sm mt-6"
    >
      <div>
        <label className="block text-sm font-medium">Subject</label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          required
          className="w-full border rounded-lg p-2 mt-1"
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Comment</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          required
          className="w-full border rounded-lg p-2 mt-1"
        />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="px-4 py-2 bg-primary text-white rounded-lg disabled:opacity-50"
      >
        {isPending ? "Posting..." : "Post Comment"}
      </button>
    </form>
  );
}
