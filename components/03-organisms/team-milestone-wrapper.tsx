/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import dynamic from "next/dynamic";
import { DrupalComment } from "../../lib/type";

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
  currentUserEmail: string;
  projectMentor?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  projectDetails?: any;
}

export default function TeamMilestoneWrapper({
  executionTracks,
  comments,
  projectMentor,
  projectDetails,
  projectNodeId,
  userTokenId,
  currentUserEmail,
}: TeamMilestoneWrapperProps) {
  const safeComments = comments.map((c) => ({
    ...c,
    subject: c.subject ?? "",
    comment_body: { value: c.comment_body?.value ?? "" },
    user_id: { display_name: c.user_id?.display_name ?? "" },
  }));
  return (
    <TeamMilestoneDisplay
      executionTracks={executionTracks}
      comments={safeComments}
      projectNodeId={projectNodeId}
      userTokenId={userTokenId}
      currentUserEmail={currentUserEmail}
      mentorEmails={projectMentor || []}
      projectDetails={projectDetails}
    />
  );
}
