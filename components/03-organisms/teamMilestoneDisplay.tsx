"use client";

import { useState } from "react";

export default function TeamMilestoneDisplay({ executionTracks }) {
  if (!executionTracks || executionTracks.length === 0) {
    return <p className="text-gray-600">No execution tracks found.</p>;
  }

  // ✅ Take only the first track
  const firstTrack = executionTracks[0];
  const teamName = firstTrack?.field_team?.name || "Unknown Team";

  return (
    <div className="space-y-8">
      <TeamMilestoneGroup teamName={teamName} tracks={[firstTrack]} />
    </div>
  );
}

function TeamMilestoneGroup({ teamName, tracks }) {
  const milestones = tracks
    .flatMap((track) => track?.field_execution_plan || [])
    .map((milestone) => ({
      id: milestone.id,
      name: milestone.field_milestone_name,
      details: milestone.field_milestone_details,
    }))
    .filter((m) => m.id);

  const [selectedId, setSelectedId] = useState(milestones[0]?.id);
  const selectedMilestone = milestones.find((m) => m.id === selectedId);

  return (
    <div className="p-5 bg-gray-50 rounded-xl shadow">
      <h3 className="text-xl font-bold mb-3">{teamName}</h3>
      <h4 className="text-md text-gray-600 mb-2">
        Mentor: {tracks[0]?.field_project_mentor?.display_name || "N/A"}
      </h4>
      <div className="mb-6">
        <label
          htmlFor="milestone-select"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Select a Milestone
        </label>
        <div className="relative">
          <select
            id="milestone-select"
            className="block w-full appearance-none bg-white border border-gray-300 text-gray-700 py-2 px-4 pr-10 rounded-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
          >
            {milestones.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
            <svg
              className="h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 12a1 1 0 01-.707-.293l-3-3a1 1 0 111.414-1.414L10 9.586l2.293-2.293a1 1 0 111.414 1.414l-3 3A1 1 0 0110 12z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>
      </div>

      {selectedMilestone && (
        <div className="text-gray-800">
          <p className="text-sm font-semibold">Details:</p>
          <p>{selectedMilestone.details}</p>
        </div>
      )}
    </div>
  );
}
