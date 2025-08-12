"use client";

import { useState } from "react";
import {
  postCommentForMilestone,
  sendNotificationEmail,
} from "@/lib/queries/updateData";
import { updateMilestoneStatus, deleteComment } from "@/lib/queries/updateData";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

function decodeAndStripHtml(html: string) {
  if (!html) return "";

  // Create a temporary element to decode HTML entities
  const tempElement = document.createElement("textarea");
  tempElement.innerHTML = html;

  // Decode entities
  const decoded = tempElement.value;

  // Strip remaining HTML tags
  return decoded.replace(/<[^>]*>/g, "").trim();
}

interface Comment {
  id: string;
  name: string;
  text: string;
}

interface Milestone {
  id: string;
  field_milestone_name: string;
  field_milestone_details: string;
  field_milestone_status?: string;
}

interface ExecutionTrack {
  field_team: {
    name: string;
    field_team_members?: Array<{
      mail: string;
    }>;
  };
  field_execution_plan: Milestone[];
  field_milestone_status?: string;
}

interface ProcessedMilestone {
  id: string;
  name: string;
  details: string;
}

interface TeamMilestoneDisplayProps {
  executionTracks: ExecutionTrack[];
  comments: {
    id: string;
    subject?: string;
    comment_body?: { value: string };
    user_id?: { display_name: string };
  }[];
  projectNodeId: string;
  userTokenId: string;
  currentUserEmail: string;
  mentorEmail: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  projectDetails?: any;
}

export default function TeamMilestoneDisplay({
  executionTracks,
  comments,
  projectNodeId,
  userTokenId,
  currentUserEmail,
  mentorEmail,
  projectDetails
}: TeamMilestoneDisplayProps) {
  if (!executionTracks || executionTracks.length === 0) {
    return <p className="text-gray-600">No execution tracks found.</p>;
  }

  const firstTrack = executionTracks[0];
  const teamName = firstTrack?.field_team?.name || "Unknown Team";

  const formattedComments: Comment[] = comments.map((c) => ({
    id: c.id,
    name: c.user_id?.display_name || "Anonymous",
    text: decodeAndStripHtml(c.comment_body?.value || ""),
  }));

  return (
    <div className="space-y-8">
      <TeamMilestoneGroup teamName={teamName} tracks={[firstTrack]} initialComments={formattedComments} projectNodeId={projectNodeId} userTokenId={userTokenId} currentUserEmail={currentUserEmail} mentorEmail={mentorEmail}
        projectDetails={projectDetails} />
    </div>
  );
}

interface TeamMilestoneGroupProps {
  teamName: string;
  tracks: ExecutionTrack[];
  initialComments: Comment[];
  projectNodeId: string;
  userTokenId: string;
  mentorEmail: string;
  currentUserEmail: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  projectDetails?: any;
}

function TeamMilestoneGroup({
  teamName,
  tracks,
  initialComments,
  projectNodeId,
  userTokenId,
  currentUserEmail,
  mentorEmail,
  projectDetails
}: TeamMilestoneGroupProps) {
  const milestones = tracks
    .flatMap((track) =>
      (track?.field_execution_plan || []).map((milestone) => ({
        id: milestone.id,
        name: milestone.field_milestone_name,
        details: milestone.field_milestone_details,
        status:
          milestone.field_milestone_status ||
          track.field_milestone_status ||
          "Not started",
      }))
    )
    .filter((m) => m.id);

  const options = ["Not started", "In-progress", "Completed"];

  function normalizeStatus(raw: string): string {
    if (!raw) return options[0];
    const lower = raw.toLowerCase();
    if (lower.includes("not")) return "Not started";
    if (lower.includes("progress")) return "In-progress";
    if (lower.includes("complete")) return "Completed";
    return options[0]; // default fallback
  }
  const [selectedId, setSelectedId] = useState<string>(milestones[0]?.id || "");

  const getNormalizedStatus = (milestoneId: string) => {
    const milestone = milestones.find((m) => m.id === milestoneId);
    if (!milestone) return options[0];
    return normalizeStatus(milestone.status);
  };

  const [status, setStatus] = useState(() => getNormalizedStatus(selectedId));

  const handleMilestoneChange = (id: string) => {
    setSelectedId(id);
    setStatus(getNormalizedStatus(id));
  };

  const [comments, setComments] = useState<Comment[]>(initialComments || []);
  const [newComment, setNewComment] = useState("");
  const [notify, setNotify] = useState(false);

  const selectedMilestone = milestones.find(
    (m: ProcessedMilestone) => m.id === selectedId
  );

  const handleSubmit = async () => {
    if (!newComment.trim()) {
      alert("Please enter a comment before submitting.");
      return;
    }

    if (!selectedMilestone) {
      alert("Please select a milestone.");
      return;
    }

    // Assume you have current user's Drupal UID somewhere - replace with your actual logic
    const currentUserUid = userTokenId; // Replace with real UID

    // 1. Post comment to Drupal
    const commentResult = await postCommentForMilestone({
      projectNodeId,
      uid: currentUserUid,
      text: newComment.trim(),
    });
    if (!commentResult.success) {
      alert("Failed to post comment. Please try again.");
      return;
    }

    // 2. Update milestone status
    const currentStatus = getNormalizedStatus(selectedMilestone.id);
    if (currentStatus !== status) {
      const statusResult = await updateMilestoneStatus(
        selectedMilestone.id,
        status
      );
      if (!statusResult.success) {
        alert("Failed to update milestone status. Please try again.");
        return;
      }
    }

    // 3. Update local comments list state
    const formattedNewComment: Comment = {
      name: currentUserEmail,
      text: decodeAndStripHtml(newComment.trim()),
    };
    setComments((prev) => [formattedNewComment, ...prev]);

    setNewComment("");

    // 4. Notify team members via email
    const teamMembersEmail = mentorEmail.length > 0 ? [mentorEmail] : [];
    tracks?.map((track) => {
      track.field_team?.field_team_members?.forEach((member) => {
        teamMembersEmail.push(member.mail);
      });
    });
    if (notify) {
      await sendNotificationEmail(teamMembersEmail, projectDetails);
    }

    alert(
      currentStatus !== status
        ? "Submitted! Milestone status and comment updated."
        : "Submitted! Comment posted (status unchanged)."
    );

  };

  const handleDelete = async (commentId: string) => {
    if (!confirm("Are you sure you want to delete this comment?")) return;
    const result = await deleteComment(commentId);
    if (result.success) {
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } else {
      alert("Failed to delete comment.");
    }
  };


  return (
    <div className="p-5 bg-gray-50 rounded-xl shadow">
      <h3 className="text-xl font-bold mb-3">{teamName}</h3>

      {/* Milestone Select */}
      <div className="mb-6">
        <label
          htmlFor="milestone-select"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Select a Milestone
        </label>
        <select
          id="milestone-select"
          className="block w-full bg-white border border-gray-300 text-gray-700 py-2 px-4 pr-10 rounded-sm shadow-sm focus:outline-none"
          value={selectedId}
          onChange={(e) => handleMilestoneChange(e.target.value)}
        >
          {milestones.map((m: ProcessedMilestone) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>

      {/* Milestone Detail */}
      {selectedMilestone && (
        <div className="text-gray-800 mb-4">
          <label
            htmlFor="milestone-detail"
            className="block text-sm font-semibold text-gray-700 mb-1"
          >
            Milestone Detail
          </label>
          <p id="milestone-detail">{selectedMilestone.details}</p>
        </div>
      )}

      {/* Status */}
      <div className="mb-4">
        <label
          htmlFor="milestone-status"
          className="block text-sm font-semibold text-gray-700 mb-1"
        >
          Status
        </label>
        <div className="flex gap-4" id="milestone-status">
          {options.map((s) => (
            <label
              key={s}
              className="inline-flex items-center gap-1 text-sm text-gray-800"
            >
              <input
                type="radio"
                name="status"
                value={s}
                checked={status === s}
                onChange={(e) => setStatus(e.target.value)}
                className="text-primary"
              />
              {s}
            </label>
          ))}
        </div>
      </div>

      {/* New Comment */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Comment
        </label>
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="block w-full bg-white border border-gray-300 text-gray-700 py-2 px-4 pr-10 rounded-sm shadow-sm focus:outline-none"
          rows={3}
          placeholder="Write your comment here"
        />
      </div>

      {/* Notify */}
      <div className="mb-4 flex items-center gap-2">
        <input
          type="checkbox"
          id="notify"
          checked={notify}
          onChange={(e) => setNotify(e.target.checked)}
          className="text-blue-600"
        />
        <label htmlFor="notify" className="text-sm text-gray-700">
          Notify team members via Email
        </label>
      </div>

      {/* Comments List */}
      <div className="mb-4">
        <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="flex justify-between items-start p-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Comment text */}
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">{comment.name}</p>
                <p className="mt-1 text-sm text-gray-800 whitespace-pre-wrap break-words">
                  {comment.text}
                </p>
              </div>

              {/* Delete button (only for current user) */}
              {comment.name === currentUserEmail && (
                <button
                  onClick={() => handleDelete(comment.id)}
                  className="ml-3 text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 transition-colors cursor-pointer"
          title="Delete comment">
                  <Trash2 size={16} strokeWidth={2} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Submit */}
      <Button onClick={handleSubmit} className="cursor-pointer">
        Submit
      </Button>
    </div>
  );
}
