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
import { Textarea } from "@/components/ui/textarea";
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
  milestones?: { [key: number]: { title?: string; description?: string } };
}

interface Milestone {
  id: number;
  title: string;
  description: string;
}

export default function TeamModalForm({
  project,
  projectTeams,
}: TeamModalFormProps) {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<"team" | "milestones">("team");
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
  const [milestones, setMilestones] = useState<Milestone[]>([
    { id: 1, title: "", description: "" }
  ]);

  const validateEmail = (email: string): boolean => {
    if (!email.trim()) return true; // Empty emails are optional except for member1
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateTeamForm = (): boolean => {
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

  const validateMilestonesForm = (): boolean => {
    const newErrors: ValidationErrors = { milestones: {} };
    setGlobalMessage(null);

    // Check if at least one milestone has both title and description
    const hasValidMilestone = milestones.some(
      milestone => milestone.title.trim() && milestone.description.trim()
    );

    if (!hasValidMilestone) {
      setGlobalMessage({
        text: "At least one milestone with both title and description is required",
        type: "error",
      });
    }

    // Validate individual milestones that have content
    milestones.forEach((milestone, index) => {
      const milestoneErrors: { title?: string; description?: string } = {};
      
      if (milestone.title.trim() || milestone.description.trim()) {
        if (!milestone.title.trim()) {
          milestoneErrors.title = "Milestone title is required";
        }
        if (!milestone.description.trim()) {
          milestoneErrors.description = "Milestone description is required";
        }
      }

      if (Object.keys(milestoneErrors).length > 0) {
        newErrors.milestones![milestone.id] = milestoneErrors;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors.milestones || {}).length === 0 && !globalMessage;
  };

  const handleTeamSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateTeamForm()) {
      setCurrentStep("milestones");
    }
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateMilestonesForm()) {
      return;
    }

    try {
      // Filter out empty milestones
      const validMilestones = milestones.filter(
        milestone => milestone.title.trim() && milestone.description.trim()
      );

      const submitData = {
        ...formData,
        milestones: validMilestones
      };

      const res = await addTeamToProject(submitData, project, projectTeams);
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

        // Reset form
        resetForm();
      }
    } catch (error) {
      setGlobalMessage({
        text: "Failed to create team. Please try again.",
        type: "error",
      });
      console.error("Team creation error:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      teamName: "",
      teamType: "solo",
      member1: session?.user?.email || "",
      member2: "",
      member3: "",
    });
    setMilestones([{ id: 1, title: "", description: "" }]);
    setErrors({});
    setGlobalMessage(null);
    setCurrentStep("team");
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

  const handleMilestoneChange = (id: number, field: "title" | "description", value: string) => {
    setMilestones(prev => 
      prev.map(milestone => 
        milestone.id === id 
          ? { ...milestone, [field]: value }
          : milestone
      )
    );

    // Clear errors for this milestone when user starts typing
    if (errors.milestones?.[id]?.[field]) {
      setErrors(prev => ({
        ...prev,
        milestones: {
          ...prev.milestones,
          [id]: {
            ...prev.milestones?.[id],
            [field]: undefined
          }
        }
      }));
    }

    // Clear global message when user starts typing
    if (globalMessage) {
      setGlobalMessage(null);
    }
  };

  const addNewMilestone = () => {
    const newId = Math.max(...milestones.map(m => m.id)) + 1;
    setMilestones(prev => [
      ...prev,
      { id: newId, title: "", description: "" }
    ]);
  };

  const removeMilestone = (id: number) => {
    if (milestones.length > 1) {
      setMilestones(prev => prev.filter(milestone => milestone.id !== id));
      // Remove errors for this milestone
      setErrors(prev => {
        const newErrors = { ...prev };
        if (newErrors.milestones) {
          delete newErrors.milestones[id];
        }
        return newErrors;
      });
    }
  };

  const goBackToTeam = () => {
    setCurrentStep("team");
    setErrors({});
    setGlobalMessage(null);
  };

  return (
    <div className="flex items-center justify-center p-4">
      <Dialog
        open={open}
        onOpenChange={(isOpen) => {
          setOpen(isOpen);
          if (!isOpen) {
            resetForm();
          }
        }}
      >
        <DialogTrigger asChild>
          <Button className="cursor-pointer">Claim</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              {currentStep === "team" ? "Create New Team" : "Project Milestones"}
            </DialogTitle>
            <DialogDescription>
              {currentStep === "team" 
                ? "Enter your team details below. Click next when you're done."
                : "Define your project milestones. At least one milestone is required."
              }
            </DialogDescription>
          </DialogHeader>

          {currentStep === "team" ? (
            <form onSubmit={handleTeamSubmit}>
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
                  Next
                </Button>
              </DialogFooter>
            </form>
          ) : (
            <form onSubmit={handleFinalSubmit}>
              <div className="grid gap-4 py-4 max-h-96 overflow-y-auto">
                <div className="space-y-4">
                  {milestones.map((milestone, index) => (
                    <div key={milestone.id} className="space-y-3 p-4 border rounded-lg bg-gray-50">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">
                          Milestone {index + 1}
                        </Label>
                        {milestones.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeMilestone(milestone.id)}
                            className="h-6 w-6 p-0 cursor-pointer"
                          >
                            ×
                          </Button>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor={`milestone-title-${milestone.id}`} className="text-sm text-muted-foreground">
                          Milestone Name
                        </Label>
                        <Input
                          id={`milestone-title-${milestone.id}`}
                          value={milestone.title}
                          onChange={(e) =>
                            handleMilestoneChange(milestone.id, "title", e.target.value)
                          }
                          placeholder="Enter milestone name"
                          className={errors.milestones?.[milestone.id]?.title ? "border-red-500" : ""}
                        />
                        {errors.milestones?.[milestone.id]?.title && (
                          <p className="text-sm text-red-500">
                            {errors.milestones[milestone.id].title}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`milestone-desc-${milestone.id}`} className="text-sm text-muted-foreground">
                          Milestone Details
                        </Label>
                        <Textarea
                          id={`milestone-desc-${milestone.id}`}
                          value={milestone.description}
                          onChange={(e) =>
                            handleMilestoneChange(milestone.id, "description", e.target.value)
                          }
                          placeholder="Enter milestone details"
                          className={errors.milestones?.[milestone.id]?.description ? "border-red-500" : ""}
                          rows={3}
                        />
                        {errors.milestones?.[milestone.id]?.description && (
                          <p className="text-sm text-red-500">
                            {errors.milestones[milestone.id].description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={addNewMilestone}
                  className="cursor-pointer w-full"
                >
                  Add New Milestone
                </Button>
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
                  onClick={goBackToTeam}
                >
                  Back
                </Button>
                <Button type="submit" className="cursor-pointer">
                  Submit
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
