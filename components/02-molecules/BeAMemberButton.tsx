"use client";

import { useState } from "react";
import { ProjectNode } from "@/types/project";

interface AddUserButtonProps {
  project: ProjectNode;
  userName: string;
  userEmail: string;
}

export default function BeAMemberButton({
  project,
  userName,
  userEmail,
}: AddUserButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleAddUser = async () => {
    setIsLoading(true);
    setMessage("");
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
