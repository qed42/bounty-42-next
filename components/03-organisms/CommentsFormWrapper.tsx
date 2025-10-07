// components/03-organisms/CommentsFormWrapper.tsx

"use client";

import { useState } from "react";
import CommentSection from "./CommentSection";
import CommentForm from "./CommentForm";
import { DrupalComment } from "@/lib/type";
export default function CommentsFormWrapper({
  entityId,
  initialComments,
  executionTrackSelected,
}: {
  entityId: string;
  initialComments: DrupalComment[];
  executionTrackSelected: string;
}) {
  const [comments, setComments] = useState(initialComments);

  console.log('executionTrackSelected', executionTrackSelected);

  const handleCommentAdded = (newComment: DrupalComment) => {
    setComments((prev) => [newComment, ...prev]);
  };

  const handleDelete = (id: string) => {
    setComments((prev) => prev.filter((c) => c.id !== id));
  };

  const handleUpdate = (id: string, subject: string, newText: string) => {
    setComments((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              subject,
              comment_body: {
                ...c.comment_body,
                value: newText,
                processed: newText,
              },
            }
          : c
      )
    );
  };


  return (
    <div>
      <CommentSection
        comments={comments}
        onDelete={handleDelete}
        onUpdate={handleUpdate}
        executionTrackSelected={executionTrackSelected}
      />
      {!executionTrackSelected && (
        <CommentForm entityId={entityId} onSuccess={handleCommentAdded} />
      )}
      {/* <CommentForm entityId={entityId} onSuccess={handleCommentAdded} /> */}
    </div>
  );
}
