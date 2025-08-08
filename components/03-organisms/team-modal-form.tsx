"use client";

import type React from "react";
import { useState, useCallback, useMemo, useTransition } from "react";
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
import { Loader2, X, Plus } from "lucide-react";

import type { ProjectTeam } from "@/types/project";

interface TeamModalFormProps {
  project: ProjectNode;
  projectTeams: ProjectTeam[];
  onTeamCreated?: () => void;
}

interface ValidationErrors {
  teamName?: string;
  teamType?: string;
  member1?: string;
  member2?: string;
  member3?: string;
  milestones?: { [key: number]: { title?: string; description?: string } };
}

type TeamType = "solo" | "team";

interface FormData {
  teamName: string;
  teamType: TeamType;
  member1: string;
  member2: string;
  member3: string;
}

interface Milestone {
  id: number;
  title: string;
  description: string;
}

export default function TeamModalForm({
  project,
  projectTeams,
  onTeamCreated,
}: TeamModalFormProps) {
  const { data: session } = useSession();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<"team" | "milestones">("team");
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [globalMessage, setGlobalMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);
  
  const initialFormData: FormData = useMemo(() => ({
    teamName: "",
    teamType: "solo",
    member1: session?.user?.email || "",
    member2: "",
    member3: "",
  }), [session?.user?.email]);
  
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [milestones, setMilestones] = useState<Milestone[]>([
    { id: 1, title: "", description: "" }
  ]);

  const validateEmail = useCallback((email: string): boolean => {
    if (!email.trim()) return true;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }, []);

  const validateTeamForm = useCallback((): boolean => {
    const newErrors: ValidationErrors = {};
    setGlobalMessage(null);

    if (!formData.teamName.trim()) {
      newErrors.teamName = "Team name is required";
    } else if (formData.teamName.trim().length < 2) {
      newErrors.teamName = "Team name must be at least 2 characters long";
    }

    if (!formData.member1.trim()) {
      newErrors.member1 = "Member email is required";
    } else if (!validateEmail(formData.member1)) {
      newErrors.member1 = "Please enter a valid email address";
    }

    if (formData.teamType === "team") {
      if (formData.member2.trim() && !validateEmail(formData.member2)) {
        newErrors.member2 = "Please enter a valid email address";
      }
      if (formData.member3.trim() && !validateEmail(formData.member3)) {
        newErrors.member3 = "Please enter a valid email address";
      }

      const emails = [formData.member1, formData.member2, formData.member3]
        .filter((email) => email.trim())
        .map((email) => email.toLowerCase().trim());

      const uniqueEmails = new Set(emails);
      if (emails.length !== uniqueEmails.size) {
        setGlobalMessage({
          text: "Duplicate email addresses are not allowed",
          type: "error",
        });
        setErrors(newErrors);
        return false;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, validateEmail]);

  const validateMilestonesForm = useCallback((): boolean => {
    const newErrors: ValidationErrors = { milestones: {} };
    setGlobalMessage(null);

    const hasValidMilestone = milestones.some(
      milestone => milestone.title.trim() && milestone.description.trim()
    );

    if (!hasValidMilestone) {
      setGlobalMessage({
        text: "At least one milestone with both title and description is required",
        type: "error",
      });
      setErrors(newErrors);
      return false;
    }

    milestones.forEach((milestone) => {
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
    return Object.keys(newErrors.milestones || {}).length === 0;
  }, [milestones]);

  const handleTeamSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (validateTeamForm()) {
      setCurrentStep("milestones");
    }
  }, [validateTeamForm]);

  const handleFinalSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();

    if (!validateMilestonesForm()) {
      return;
    }

    startTransition(async () => {
      try {
        const validMilestones = milestones.filter(
          milestone => milestone.title.trim() && milestone.description.trim()
        );

        const submitData = {
          ...formData,
          milestones: validMilestones
        };

        const res = await addTeamToProject(submitData, project.id, projectTeams);
        if (!res?.success) {
          setGlobalMessage({
            text: res?.message || "Failed to create team",
            type: "error",
          });
        } else {
          setGlobalMessage({
            text: "Team created successfully!",
            type: "success",
          });

          setTimeout(() => {
            setOpen(false);
            onTeamCreated?.();
          }, 1500);
        }
      } catch (error) {
        setGlobalMessage({
          text: "Failed to create team. Please try again.",
          type: "error",
        });
        console.error("Team creation error:", error);
      }
    });
  }, [validateMilestonesForm, milestones, formData, project.id, projectTeams, onTeamCreated]);

  const resetForm = useCallback(() => {
    setFormData(initialFormData);
    setMilestones([{ id: 1, title: "", description: "" }]);
    setErrors({});
    setGlobalMessage(null);
    setCurrentStep("team");
  }, [initialFormData]);

  const handleInputChange = useCallback((field: keyof FormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }

    if (globalMessage) {
      setGlobalMessage(null);
    }
  }, [errors, globalMessage]);

  const handleMilestoneChange = useCallback((id: number, field: "title" | "description", value: string) => {
    setMilestones(prev => 
      prev.map(milestone => 
        milestone.id === id 
          ? { ...milestone, [field]: value }
          : milestone
      )
    );

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

    if (globalMessage) {
      setGlobalMessage(null);
    }
  }, [errors.milestones, globalMessage]);

  const addNewMilestone = useCallback(() => {
    const newId = Math.max(...milestones.map(m => m.id)) + 1;
    setMilestones(prev => [
      ...prev,
      { id: newId, title: "", description: "" }
    ]);
  }, [milestones]);

  const removeMilestone = useCallback((id: number) => {
    if (milestones.length > 1) {
      setMilestones(prev => prev.filter(milestone => milestone.id !== id));
      setErrors(prev => {
        const newErrors = { ...prev };
        if (newErrors.milestones) {
          delete newErrors.milestones[id];
        }
        return newErrors;
      });
    }
  }, [milestones.length]);

  const goBackToTeam = useCallback(() => {
    setCurrentStep("team");
    setErrors({});
    setGlobalMessage(null);
  }, []);

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
        <DialogContent 
          className="sm:max-w-[600px] max-h-[80vh]"
          aria-describedby="team-modal-description"
        >
          <DialogHeader>
            <DialogTitle>
              {currentStep === "team" ? "Create New Team" : "Project Milestones"}
            </DialogTitle>
            <DialogDescription id="team-modal-description">
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
                  <div className="flex gap-6">
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="solo"
                        name="teamType"
                        value="solo"
                        checked={formData.teamType === "solo"}
                        onChange={(e) => handleInputChange("teamType", e.target.value as TeamType)}
                        className="h-4 w-4"
                      />
                      <Label htmlFor="solo" className="text-sm font-normal cursor-pointer">
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
                        onChange={(e) => handleInputChange("teamType", e.target.value as TeamType)}
                        className="h-4 w-4"
                      />
                      <Label htmlFor="team" className="text-sm font-normal cursor-pointer">
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
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" className="cursor-pointer" disabled={isPending}>
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Next"
                  )}
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
                            className="h-8 w-8 p-0 cursor-pointer"
                            aria-label={`Remove milestone ${index + 1}`}
                          >
                            <X className="h-4 w-4" />
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
                  disabled={isPending}
                >
                  <Plus className="h-4 w-4 mr-2" />
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
                  disabled={isPending}
                >
                  Back
                </Button>
                <Button type="submit" className="cursor-pointer" disabled={isPending}>
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Team...
                    </>
                  ) : (
                    "Submit"
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
