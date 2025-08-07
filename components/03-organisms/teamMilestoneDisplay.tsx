"use client";

import { useState, useEffect } from "react";

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
}

interface MilestoneData {
  status: string;
  comments: Comment[];
  newComment: string;
  notify: boolean;
}

interface ProcessedMilestone {
  id: string;
  name: string;
  details: string;
}

interface TeamMilestoneDisplayProps {
  executionTracks: ExecutionTrack[];
}

export default function TeamMilestoneDisplay({ executionTracks }: TeamMilestoneDisplayProps) {
  if (!executionTracks || executionTracks.length === 0) {
    return <p className="text-gray-600">No execution tracks found.</p>;
  }

  const firstTrack = executionTracks[0];
  const teamName = firstTrack?.field_team?.name || "Unknown Team";

  return (
    <div className="space-y-8">
      <TeamMilestoneGroup teamName={teamName} tracks={[firstTrack]} />
    </div>
  );
}

interface TeamMilestoneGroupProps {
  teamName: string;
  tracks: ExecutionTrack[];
}

function TeamMilestoneGroup({ teamName, tracks }: TeamMilestoneGroupProps) {
  const milestones = tracks
    .flatMap((track) => track?.field_execution_plan || [])
    .map((milestone) => ({
      id: milestone.id,
      name: milestone.field_milestone_name,
      details: milestone.field_milestone_details,
    }))
    .filter((m) => m.id);

  const [selectedId, setSelectedId] = useState<string>(milestones[0]?.id || "");

  const defaultDummyComments = [
    {
      name: "Alice",
      text: "Mussum Ipsum, cacilds vidis litro abertis. Manduma pindureta quium dia nois paga. Delegadis gente finis, bibendum egestas augue arcu ut est. Leite de capivaris, leite de mula manquis sem cabeça. Mais vale um bebadis conhecidiss, que um alcoolatra anonimis.",
    },
    {
      name: "Bob",
      text: "Mussum Ipsum, cacilds vidis litro abertis. In elementis mé pra quem é amistosis quis leo. Nec orci ornare consequat. Praesent lacinia ultrices consectetur. Sed non ipsum felis. Todo mundo vê os porris que eu tomo, mas ninguém vê os tombis que eu levo! Admodum accumsan disputationi eu sit. Vide electram sadipscing et per.",
    },
    {
      name: "Charlie",
      text: "Mussum Ipsum, cacilds vidis litro abertis. Mé faiz elementum girarzis, nisi eros vermeio. Suco de cevadiss, é um leite divinis, qui tem lupuliz, matis, aguis e fermentis. Nullam volutpat risus nec leo commodo, ut interdum diam laoreet. Sed non consequat odio. Delegadis gente finis, bibendum egestas augue arcu ut est.",
    },
    {
      name: "Diana",
      text: "Mussum Ipsum, cacilds vidis litro abertis. Aenean aliquam molestie leo, vitae iaculis nisl. Detraxit consequat et quo num tendi nada. Atirei o pau no gatis, per gatis num morreus. In elementis mé pra quem é amistosis quis leo.",
    },
    {
      name: "Eve",
      text: "Mussum Ipsum, cacilds vidis litro abertis. Mauris nec dolor in eros commodo tempor. Aenean aliquam molestie leo, vitae iaculis nisl. Todo mundo vê os porris que eu tomo, mas ninguém vê os tombis que eu levo! Mé faiz elementum girarzis, nisi eros vermeio. In elementis mé pra quem é amistosis quis leo.",
    },
  ];

  const [milestoneData, setMilestoneData] = useState<Record<string, MilestoneData>>({});

  const selectedMilestone = milestones.find((m: ProcessedMilestone) => m.id === selectedId);

  useEffect(() => {
    if (!selectedId) return;
    setMilestoneData((prev) => {
      if (prev[selectedId]) return prev;
      return {
        ...prev,
        [selectedId]: {
          status: "Not started",
          comments: defaultDummyComments,
          newComment: "",
          notify: false,
        },
      };
    });
  }, [selectedId]);

  const data = milestoneData[selectedId] || {
    status: "Not started",
    comments: defaultDummyComments,
    newComment: "",
    notify: false,
  };

  const updateMilestoneData = (updatedFields: Partial<MilestoneData>) => {
    setMilestoneData((prev) => ({
      ...prev,
      [selectedId]: {
        ...prev[selectedId],
        ...updatedFields,
      },
    }));
  };

  const handleSubmit = () => {
    if (data.newComment.trim()) {
      const newEntry: Comment = {
        name: "Current User",
        text: data.newComment.trim(),
      };
      const updatedComments = [...(data.comments || []), newEntry];
      updateMilestoneData({ comments: updatedComments, newComment: "" });

      console.log("=== Milestone Submission ===");
      console.log("Milestone:", selectedMilestone?.name);
      console.log("Status:", data.status);
      console.log("All Comments:", updatedComments);
      console.log("Notify Team:", data.notify);
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

      {/* Milestone Detail & Status */}
      {selectedMilestone && (
        <>
          <div className="text-gray-800 mb-4">
            <label
              htmlFor="milestone-detail"
              className="block text-sm font-semibold text-gray-700 mb-1"
            >
              Milestone Detail
            </label>
            <p id="milestone-detail">{selectedMilestone.details}</p>
          </div>

          <div className="mb-4">
            <label
              htmlFor="milestone-status"
              className="block text-sm font-semibold text-gray-700 mb-1"
            >
              Status
            </label>
            <div className="flex gap-4" id="milestone-status">
              {["Not started", "In-progress", "Completed"].map((status) => (
                <label
                  key={status}
                  className="inline-flex items-center gap-1 text-sm text-gray-800"
                >
                  <input
                    type="radio"
                    name={`status-${selectedId}`}
                    value={status}
                    checked={data.status === status}
                    onChange={(e) =>
                      updateMilestoneData({ status: e.target.value })
                    }
                    className="text-blue-600"
                  />
                  {status}
                </label>
              ))}
            </div>
          </div>
        </>
      )}

      {/* New Comment Textarea */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Comment</label>
        <textarea
          value={data.newComment}
          onChange={(e) => updateMilestoneData({ newComment: e.target.value })}
          className="block w-full bg-white border border-gray-300 text-gray-700 py-2 px-4 pr-10 rounded-sm shadow-sm focus:outline-none"
          rows={3}
          placeholder="Write your comment here"
        />
      </div>

      {/* Checkbox: Notify team */}
      <div className="mb-4 flex items-center gap-2">
        <input
          type="checkbox"
          id="notify"
          checked={data.notify}
          onChange={(e) => updateMilestoneData({ notify: e.target.checked })}
          className="text-blue-600"
        />
        <label htmlFor="notify" className="text-sm text-gray-700">
          Notify team members via Email
        </label>
      </div>

      {/* Existing Comments */}
      <div className="mb-4">
        <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
          {data.comments?.map((comment: Comment, index: number) => (
            <div
              key={index}
              className="pl-3 border-l-2 border-primary bg-white py-1"
            >
              <p className="text-sm font-semibold text-gray-900 mb-1">
                {comment.name}:
              </p>
              <pre className="whitespace-pre-wrap break-words text-sm text-gray-800">
                {comment.text}
              </pre>
            </div>
          ))}
        </div>
      </div>

      {/* Submit Button */}
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
