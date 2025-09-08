"use client";

import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import ExecutionTrackSwitch from "@/components/01-atoms/ExecutionTrackSwitch";
import { useState } from "react";

interface Milestone {
  id: string;
  milestoneName: string;
  milestoneDetails: string;
  milestoneStatus: string;
}

interface ExecutionTrack {
  id: string;
  selected: boolean;
  executionPlan: Milestone[];
}

interface ExecutionTrackSectionProps {
  executionTracks: ExecutionTrack[];
}

export default function ExecutionTrackSection({ executionTracks: initialTracks }: ExecutionTrackSectionProps) {
  const [executionTracks, setExecutionTracks] = useState<ExecutionTrack[]>(initialTracks);

  const handleTrackToggle = (id: string, selected: boolean) => {
    setExecutionTracks((prev) =>
      prev.map((track) =>
        track.id === id ? { ...track, selected } : track
      )
    );
  };

  if (!executionTracks || executionTracks.length === 0) return null;

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Execution Tracks</h2>
      <Accordion type="single" collapsible>
        {executionTracks.map((track, idx) => (
          <AccordionItem key={track.id} value={`track-${idx}`} className="p-0 border-b bg-white border-gray-200 mb-4 last:mb-0 rounded-2xl shadow">
            <AccordionTrigger className={`p-4 hover:no-underline hover:cursor-pointer bg-gray-200 accordion-trigger ${track.selected ? " bg-primary text-white active" : " "} `}>
              <div className="text-xl">Execution Track - Plan {String.fromCharCode(65 + idx)}</div>
            </AccordionTrigger>

            <AccordionContent className="px-4">
              <div className="border-b-2 border-gray-200 mt-4">
                <ExecutionTrackSwitch
                  id={track.id}
                  selected={track.selected}
                  onToggle={handleTrackToggle}
                />
              </div>

              <Accordion type="single" collapsible>
                {track.executionPlan?.map((plan, pIdx) => (
                  <AccordionItem key={plan.id} value={`milestone-${pIdx}`} className="p-0">
                    <AccordionTrigger className="py-4 hover:no-underline hover:cursor-pointer accordion-trigger">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-medium">{plan.milestoneName}</h3>
                        <Badge
                          className={`
                            rounded-full px-2 py-0.5 text-xs
                            ${
                              plan.milestoneStatus === "in_progress"
                                ? "bg-yellow-100 text-yellow-800"
                                : plan.milestoneStatus === "completed"
                                ? "bg-green-100 text-green-800"
                                : plan.milestoneStatus === "not_started"
                                ? "bg-gray-100 text-gray-800"
                                : "bg-blue-100 text-blue-800"
                            }
                          `}
                        >
                          {plan.milestoneStatus.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4">
                      <div className="text-md text-gray-700">{plan.milestoneDetails}</div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
