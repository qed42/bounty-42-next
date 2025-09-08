"use client";

import {  useTransition } from "react";
import { Switch } from "@/components/ui/switch"; // shadcn/ui
import { updateExecutionTrackStatus } from "@/lib/queries/updateData";
interface ExecutionTrackSwitchProps {
  id: string;
  selected: boolean;
  onToggle: (id: string, selected: boolean) => void;
}

export default function ExecutionTrackSwitch({ id, selected, onToggle }: ExecutionTrackSwitchProps) {
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    startTransition(async () => {
      const result = await updateExecutionTrackStatus(id, !selected);
      if (result.success) {
        onToggle(id, !selected); // notify parent
      } else {
        alert("❌ Failed to update execution track");
      }
    });
  };

  return (
    <div className={`flex items-center gap-6 justify-between py-4 text-gray-700 ${selected ? " text-primary" : " "}`}>
      <span className="text-lg font-bold">Execution Plan: {selected ? "Selected" : "Not selected"}</span>
      <Switch checked={selected} onCheckedChange={handleToggle} disabled={isPending} className="scale-150 hover:cursor-pointer mr-2"/>
    </div>
  );
}

