"use client";

import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSession } from "next-auth/react";
import { addTeamToProject } from "@/lib/queries/updateData";
import type { ProjectNode } from "@/types/project";

interface TeamModalFormProps {
  project: ProjectNode;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  projectTeams: any;
}

interface ValidationErrors {
  teamName?: string;
  member1?: string;
  member2?: string;
  member3?: string;
}

export default function TeamModalForm({
  project,
  projectTeams,
}: TeamModalFormProps) {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [globalMessage, setGlobalMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);
  const [formData, setFormData] = useState({
    teamName: "",
    teamType: "solo" as "solo" | "team",
    member1: session?.user?.email || "",
    member2: "",
    member3: "",
  });

  const validateEmail = (email: string): boolean => {
    if (!email.trim()) return true; // Empty emails are optional except for member1
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};
    setGlobalMessage(null); // Clear global error

    // Validate team name
    if (!formData.teamName.trim()) {
      newErrors.teamName = "Team name is required";
    } else if (formData.teamName.trim().length < 2) {
      newErrors.teamName = "Team name must be at least 2 characters long";
    }

    // Validate member1 (always required)
    if (!formData.member1.trim()) {
      newErrors.member1 = "Member email is required";
    } else if (!validateEmail(formData.member1)) {
      newErrors.member1 = "Please enter a valid email address";
    }

    // Validate member2 and member3 for team type
    if (formData.teamType === "team") {
      if (formData.member2.trim() && !validateEmail(formData.member2)) {
        newErrors.member2 = "Please enter a valid email address";
      }
      if (formData.member3.trim() && !validateEmail(formData.member3)) {
        newErrors.member3 = "Please enter a valid email address";
      }

      // Check for duplicate emails in team type
      const emails = [formData.member1, formData.member2, formData.member3]
        .filter((email) => email.trim())
        .map((email) => email.toLowerCase().trim());

      const uniqueEmails = new Set(emails);
      if (emails.length !== uniqueEmails.size) {
        setGlobalMessage({
          text: "Duplicate email addresses are not allowed",
          type: "error",
        });
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0 && !globalMessage;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      // Handle form submission here
      const res = await addTeamToProject(formData, project, projectTeams);
      if (!res?.success) {
        setGlobalMessage({
          text: res?.message || "Failed to create team",
          type: "error",
        });
      } else {
        setGlobalMessage({
          text: "Team created successfully! Redirecting...",
          type: "success",
        });

        setTimeout(() => {
          window.location.reload();
          setOpen(false);
        }, 3000);

        // Reset form if needed
        setFormData({
          teamName: "",
          teamType: "solo",
          member1: "",
          member2: "",
          member3: "",
        });
        setErrors({});
      }
    } catch (error) {
      setGlobalMessage({
        text: "Failed to create team. Please try again.",
        type: "error",
      });
      console.error("Team creation error:", error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error for this field when user starts typing
    if (errors[field as keyof ValidationErrors]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }

    // Clear global message when user starts typing
    if (globalMessage) {
      setGlobalMessage(null);
    }
  };

  return (
    <div className="flex items-center justify-center p-4">
      <Dialog
        open={open}
        onOpenChange={(isOpen) => {
          setOpen(isOpen);
          if (!isOpen) {
            setErrors({});
            setGlobalMessage(null);
            // Reset form when dialog closes
            setFormData({
              teamName: "",
              teamType: "solo",
              member1: session?.user?.email || "",
              member2: "",
              member3: "",
            });
          }
        }}
      >
        <DialogTrigger asChild>
          <Button className="cursor-pointer">Claim</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Team</DialogTitle>
            <DialogDescription>
              {"Enter your team details below. Click submit when you're done."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="team-name">Team Name</Label>
                <Input
                  id="team-name"
                  value={formData.teamName}
                  onChange={(e) =>
                    handleInputChange("teamName", e.target.value)
                  }
                  placeholder="Enter team name"
                  className={errors.teamName ? "border-red-500" : ""}
                />
                {errors.teamName && (
                  <p className="text-sm text-red-500">{errors.teamName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Team Type</Label>
                <div className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="solo"
                      name="teamType"
                      value="solo"
                      checked={formData.teamType === "solo"}
                      onChange={(e) =>
                        handleInputChange("teamType", e.target.value)
                      }
                      className="h-4 w-4"
                    />
                    <Label
                      htmlFor="solo"
                      className="text-sm font-normal cursor-pointer"
                    >
                      Solo
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="team"
                      name="teamType"
                      value="team"
                      checked={formData.teamType === "team"}
                      onChange={(e) =>
                        handleInputChange("teamType", e.target.value)
                      }
                      className="h-4 w-4"
                    />
                    <Label
                      htmlFor="team"
                      className="text-sm font-normal cursor-pointer"
                    >
                      Team
                    </Label>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-sm font-medium">
                  {formData.teamType === "solo"
                    ? "Team Member"
                    : "Team Members"}
                </Label>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label
                      htmlFor="member-1"
                      className="text-sm text-muted-foreground"
                    >
                      {formData.teamType === "solo" ? "Member" : "Member 1"}
                    </Label>
                    <Input
                      id="member-1"
                      value={formData.member1}
                      onChange={(e) =>
                        handleInputChange("member1", e.target.value)
                      }
                      placeholder="Enter member email"
                      className={errors.member1 ? "border-red-500" : ""}
                    />
                    {errors.member1 && (
                      <p className="text-sm text-red-500">{errors.member1}</p>
                    )}
                  </div>

                  {formData.teamType === "team" && (
                    <>
                      <div className="space-y-2">
                        <Label
                          htmlFor="member-2"
                          className="text-sm text-muted-foreground"
                        >
                          Member 2
                        </Label>
                        <Input
                          id="member-2"
                          value={formData.member2}
                          onChange={(e) =>
                            handleInputChange("member2", e.target.value)
                          }
                          placeholder="Enter member email"
                          className={errors.member2 ? "border-red-500" : ""}
                        />
                        {errors.member2 && (
                          <p className="text-sm text-red-500">
                            {errors.member2}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="member-3"
                          className="text-sm text-muted-foreground"
                        >
                          Member 3
                        </Label>
                        <Input
                          id="member-3"
                          value={formData.member3}
                          onChange={(e) =>
                            handleInputChange("member3", e.target.value)
                          }
                          placeholder="Enter member email"
                          className={errors.member3 ? "border-red-500" : ""}
                        />
                        {errors.member3 && (
                          <p className="text-sm text-red-500">
                            {errors.member3}
                          </p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
            {globalMessage && (
              <div className="px-1 pb-2">
                <p
                  className={`text-sm ${
                    globalMessage.type === "success"
                      ? "text-green-500 bg-green-50 border-green-200"
                      : "text-red-500 bg-red-50 border-red-200"
                  } border rounded-md p-3`}
                >
                  {globalMessage.text}
                </p>
              </div>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                className="cursor-pointer"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" className="cursor-pointer">
                Submit
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
