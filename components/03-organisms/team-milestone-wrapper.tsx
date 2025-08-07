"use client";

import dynamic from "next/dynamic";

const TeamMilestoneDisplay = dynamic(() => import("./teamMilestoneDisplay"), {
  ssr: false,
});

export default function TeamMilestoneWrapper({ executionTracks }) {
  return <TeamMilestoneDisplay executionTracks={executionTracks} />;
}
