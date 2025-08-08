"use client";

import { useState } from "react";


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
}

export default function TeamMilestoneDisplay({ executionTracks, comments }: TeamMilestoneDisplayProps) {
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
      <TeamMilestoneGroup teamName={teamName} tracks={[firstTrack]} initialComments={formattedComments} />
    </div>
  );
}

interface TeamMilestoneGroupProps {
  teamName: string;
  tracks: ExecutionTrack[];
  initialComments: Comment[];
}

function TeamMilestoneGroup({ teamName, tracks, initialComments }: TeamMilestoneGroupProps) {
  const milestones = tracks.flatMap((track) =>
    (track?.field_execution_plan || []).map((milestone) => ({
      id: milestone.id,
      name: milestone.field_milestone_name,
      details: milestone.field_milestone_details,
      status: track.field_milestone_status || "Not started", // ✅ now we can access track
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

  const initialStatus = normalizeStatus(tracks[0]?.field_milestone_status);
  const [status, setStatus] = useState(initialStatus);

//   const initialStatus = tracks[0]?.field_milestone_status || "Not started";
// console.log(initialStatus, 'initialStatus');
  const [selectedId, setSelectedId] = useState<string>(milestones[0]?.id || "");
  // const [status, setStatus] = useState(initialStatus);

  const [comments, setComments] = useState<Comment[]>(initialComments || []);
  const [newComment, setNewComment] = useState("");
  const [notify, setNotify] = useState(false);

  const selectedMilestone = milestones.find((m: ProcessedMilestone) => m.id === selectedId);

  const handleSubmit = () => {
    if (newComment.trim()) {
      const newEntry: Comment = {
        name: "Current User",
        text: newComment.trim(),
      };
      const updatedComments = [...comments, newEntry];
      setComments(updatedComments);
      setNewComment("");

      console.log("=== Submission ===");
      console.log("Milestone:", selectedMilestone?.name);
      console.log("Status:", status);
      console.log("All Comments:", updatedComments);
      console.log("Notify Team:", notify);
      alert("Submitted! Check console.");
    } else {
      alert("Please enter a comment before submitting.");
    }
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
          onChange={(e) => setSelectedId(e.target.value)}
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
          {["Not started", "In-progress", "Completed"].map((s) => (
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
      <button
        type="button"
        onClick={handleSubmit}
        className="mt-2 px-5 py-2 bg-green-600 text-white rounded-sm hover:bg-green-700"
      >
        Submit
      </button>
    </div>
  );
}
