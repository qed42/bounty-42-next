
// components/03-organisms/CommentSection.tsx

"use client";

import { MessageCircle, Edit, Trash2, Save, X } from "lucide-react";
import { updateComment, deleteCommentnew } from "@/lib/queries/updateData";
import { useState } from "react";

export default function CommentSection({
  comments,
  onDelete,
  onUpdate,
}: {
   // eslint-disable-next-line @typescript-eslint/no-explicit-any
  comments: any[];
  onDelete?: (id: string) => void;
  onUpdate?: (id: string, subject: string, body: string) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editSubject, setEditSubject] = useState<string>("");
  const [editText, setEditText] = useState<string>("");

   // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleEdit = (comment: any) => {
    setEditingId(comment.id);
    setEditSubject(comment.subject);
    setEditText(comment.comment_body.value);
  };

  const handleSave = async (id: string) => {
    const res = await updateComment(id, editSubject, editText);
    if (res.success) {
      onUpdate?.(id, editSubject, editText); // let parent update state
    } else {
      alert("Failed to update comment");
    }
    setEditingId(null);
    setEditSubject("");
    setEditText("");
  };

  const handleDelete = async (id: string) => {
    const res = await deleteCommentnew(id);
    if (res.success) {
      onDelete?.(id);
    } else {
      alert("Failed to delete comment");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mt-6 mb-6">
        <MessageCircle className="h-7 w-7 text-primary" />
        <h4 className="text-2xl font-semibold text-foreground">
          Comments ({comments.length})
        </h4>
      </div>

      {comments.map((comment) => (
        <div
          key={comment.id}
          className="p-4 border shadow-sm rounded-xl py-6 border-border/50 hover:shadow-md transition-shadow duration-200"
        >
          <div className="flex items-start justify-between mb-2">
            <div>
              {editingId === comment.id ? (
                <input
                  type="text"
                  value={editSubject}
                  onChange={(e) => setEditSubject(e.target.value)}
                  className="w-full border rounded-lg p-2 mt-1"
                />
              ) : (
                <h4 className="font-semibold">{comment.subject}</h4>
              )}

              <p className="text-sm text-gray-500">
                {/* By <span className="font-medium">{comment.uid?.display_name}</span> on{" "} */}
                {new Date(comment.created).toLocaleString()}
              </p>
            </div>

            <div className="flex gap-2">
              {editingId === comment.id ? (
                <>
                  <button
                    onClick={() => handleSave(comment.id)}
                    className="text-green-600 hover:text-green-800"
                  >
                    <Save className="h-5 w-5 cursor-pointer" />
                  </button>
                  <button
                    onClick={() => {
                      setEditingId(null);
                      setEditSubject("");
                      setEditText("");
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="h-5 w-5 cursor-pointer" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => handleEdit(comment)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Edit className="h-5 w-5 cursor-pointer" />
                  </button>
                  <button
                    onClick={() => handleDelete(comment.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-5 w-5 cursor-pointer" />
                  </button>
                </>
              )}
            </div>
          </div>

          {editingId === comment.id ? (
            <textarea
              className="w-full border min-h-[100px] rounded-lg p-2 text-sm mt-2"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
            />
          ) : (
            <div
              className="prose"
              dangerouslySetInnerHTML={{ __html: comment.comment_body.processed }}
            />
          )}
        </div>
      ))}
    </div>
  );
}
