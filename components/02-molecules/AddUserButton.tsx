"use client";

import { useState } from "react";

interface AddUserButtonProps {
  projectSlug: string;
  userEmail: string;
}

export default function AddUserButton({
  projectSlug,
  userEmail,
}: AddUserButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleAddUser = async () => {
    setIsLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/projects/add-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectSlug,
          userEmail,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setMessage("Successfully joined the project!");
        // Optionally reload the page to show updated team
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setMessage(result.message || "Failed to join project");
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
