"use client";

import { useState } from "react";
import { addUserToProject } from "@/lib/queries/updateData";
import { ProjectNode } from "@/types/project";

interface AddUserButtonProps {
  project: ProjectNode;
  userEmail: string;
}

export default function BeAMemberButton({
  project,
  userEmail,
}: AddUserButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleAddUser = async () => {
    setIsLoading(true);
    setMessage("");

    try {
      const response = await addUserToProject(project, userEmail);
      const result = await response;

      if (result.termAdded) {
        setMessage(result.message || "Successfully joined the project!");
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setMessage("Failed to join project");
      }
    } catch (error) {
      setMessage("An error occurred. Please try again.");
      console.error("Error adding user to project:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleAddUser}
        disabled={isLoading}
        className="px-6 py-2 text-white bg-primary hover:bg-primary-dark rounded-lg transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? "Joining..." : "Be a Member"}
      </button>

      {message && (
        <p
          className={`text-sm ${
            message.includes("Successfully") ? "text-green-600" : "text-red-600"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
