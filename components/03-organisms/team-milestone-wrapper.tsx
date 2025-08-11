"use client";

import dynamic from "next/dynamic";

const TeamMilestoneDisplay = dynamic(() => import("./teamMilestoneDisplay"), {
  ssr: false,
});

interface ExecutionTrack {
  field_team: {
    name: string;
  };
  field_execution_plan: Array<{
    id: string;
    field_milestone_name: string;
    field_milestone_details: string;
  }>;
}

interface TeamMilestoneWrapperProps {
  executionTracks: ExecutionTrack[];
  comments: DrupalComment[];
  projectNodeId: string;
  userTokenId: string;
}

export default function TeamMilestoneWrapper({
  executionTracks,
  comments,
  projectNodeId,
  userTokenId,
}: TeamMilestoneWrapperProps) {
  return <TeamMilestoneDisplay executionTracks={executionTracks} comments={comments} projectNodeId={projectNodeId} userTokenId={userTokenId} />;
}
