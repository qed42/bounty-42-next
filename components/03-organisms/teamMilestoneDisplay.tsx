"use client";

import { useState } from "react";
import { postCommentForMilestone } from "@/lib/queries/updateData"
import { updateMilestoneStatus } from "@/lib/queries/updateData"
import { Button } from "@/components/ui/button";

function stripHtml(html: string) {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, "").trim();
}
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
  name: string;
  text: string;
}

interface Milestone {
  id: string;
  field_milestone_name: string;
  field_milestone_details: string;
}

interface ExecutionTrack {
  field_team: {
    name: string;
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
}

export default function TeamMilestoneDisplay({ executionTracks, comments, projectNodeId, userTokenId }: TeamMilestoneDisplayProps) {
  if (!executionTracks || executionTracks.length === 0) {
    return <p className="text-gray-600">No execution tracks found.</p>;
  }

  const firstTrack = executionTracks[0];
  const teamName = firstTrack?.field_team?.name || "Unknown Team";

  const formattedComments: Comment[] = comments.map((c: any) => ({
    name: c.uid?.display_name || "Anonymous",
    text: decodeAndStripHtml(c.comment_body?.value || ""),
  }));
  return (
    <div className="space-y-8">
      <TeamMilestoneGroup teamName={teamName} tracks={[firstTrack]} initialComments={formattedComments} projectNodeId={projectNodeId} userTokenId={userTokenId} />
    </div>
  );
}

interface TeamMilestoneGroupProps {
  teamName: string;
  tracks: ExecutionTrack[];
  initialComments: Comment[];
  projectNodeId: string;
  userTokenId: string;
}

function TeamMilestoneGroup({ teamName, tracks, initialComments, projectNodeId, userTokenId }: TeamMilestoneGroupProps) {
  const milestones = tracks.flatMap((track) =>
    (track?.field_execution_plan || []).map((milestone) => ({
      id: milestone.id,
      name: milestone.field_milestone_name,
      details: milestone.field_milestone_details,
      // Try to get milestone-specific status instead of track-level
      status: (milestone as any).field_milestone_status || track.field_milestone_status || "Not started",
    }))
  ).filter((m) => m.id);


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
    const milestone = milestones.find(m => m.id === milestoneId);
    if (!milestone) return options[0];
    return normalizeStatus(milestone.status);
  }

  const [status, setStatus] = useState(() => getNormalizedStatus(selectedId));

  const handleMilestoneChange = (id: string) => {
    setSelectedId(id);
    setStatus(getNormalizedStatus(id));
  };

  const [comments, setComments] = useState<Comment[]>(initialComments || []);
  const [newComment, setNewComment] = useState("");
  const [notify, setNotify] = useState(false);

  const selectedMilestone = milestones.find((m: ProcessedMilestone) => m.id === selectedId);

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
      projectNodeId: projectNodeId,  // UUID of your project node
      uid: currentUserUid,  // UUID of current user
      text: newComment.trim(),
    });

    if (!commentResult.success) {
      alert("Failed to post comment. Please try again.");
      return;
    }

    // 2. Update milestone status
    const statusResult = await updateMilestoneStatus(selectedMilestone.id, status);

    if (!statusResult.success) {
      alert("Failed to update milestone status. Please try again.");
      return;
    }

    // 3. Update local comments list state
    const newEntry: Comment = {
      name: "Current User", // Or get real user name
      text: newComment.trim(),
    };
    const updatedComments = [...comments, newEntry];
    setComments(updatedComments);
    setNewComment("");

    alert("Submitted! Milestone status and comment updated.");
  };

  return (
    <div className="p-5 bg-gray-50 rounded-xl shadow">
      <h3 className="text-xl font-bold mb-3">{teamName}</h3>

      {/* Milestone Select */}
      <div className="mb-6">
        <label htmlFor="milestone-select" className="block text-sm font-medium text-gray-700 mb-1">
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
          <label htmlFor="milestone-detail" className="block text-sm font-semibold text-gray-700 mb-1">
            Milestone Detail
          </label>
          <p id="milestone-detail">{selectedMilestone.details}</p>
        </div>
      )}

      {/* Status */}
      <div className="mb-4">
        <label htmlFor="milestone-status" className="block text-sm font-semibold text-gray-700 mb-1">
          Status
        </label>
        <div className="flex gap-4" id="milestone-status">
          {options.map((s) => (
            <label key={s} className="inline-flex items-center gap-1 text-sm text-gray-800">
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
        <label className="block text-sm font-medium text-gray-700 mb-1">Comment</label>
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
          {comments.map((comment, index) => (
            <div key={index} className="pl-3 border-l-2 border-primary bg-white py-1">
              <p className="text-sm font-semibold text-gray-900 mb-1">{comment.name}</p>
              <pre className="whitespace-pre-wrap break-words text-sm text-gray-800">
                {comment.text}
              </pre>
            </div>
          ))}
        </div>
      </div>

      {/* Submit */}
      <Button onClick={handleSubmit} className="cursor-pointer">Submit</Button>
    </div>
  );
}
