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
import { ProjectNode } from "@/types/project";

interface TeamModalFormProps {
  project: ProjectNode;
}

export default function TeamModalForm({ project, projectTeams }: TeamModalFormProps) {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [currentView, setCurrentView] = useState<"initial" | "createTeam">(
    "initial"
  );
  const [enrollTeamName, setEnrollTeamName] = useState("");
  const [formData, setFormData] = useState({
    teamName: "",
    teamType: "solo" as "solo" | "team",
    member1: session ? session?.user?.email : "",
    member2: "",
    member3: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // console.log("Form submitted:", formData);
    // Handle form submission here
    const res = await addTeamToProject(formData, project, projectTeams);
    console.log(`MODAL RES`, res);
    setOpen(false);
    setCurrentView("initial"); // Reset to initial view
    // Reset form if needed
    setFormData({
      teamName: "",
      teamType: "solo",
      member1: "",
      member2: "",
      member3: "",
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="flex items-center justify-center p-4">
      <Dialog
        open={open}
        onOpenChange={(isOpen) => {
          setOpen(isOpen);
          if (!isOpen) {
            setCurrentView("initial");
            setEnrollTeamName("");
          }
        }}
      >
        <DialogTrigger asChild>
          <Button>Claim</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          {currentView === "initial" ? (
            <>
              <DialogHeader>
                <DialogTitle>Join or Create Team</DialogTitle>
                <DialogDescription>
                  Choose to create a new team or enroll in an existing one.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-6 py-4">
                <div className="space-y-4">
                  <Button
                    onClick={() => setCurrentView("createTeam")}
                    className="w-full"
                    size="lg"
                  >
                    Create a new team
                  </Button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        Or
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="enroll-team">
                      Enter existing team name
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="enroll-team"
                        value={enrollTeamName}
                        onChange={(e) => setEnrollTeamName(e.target.value)}
                        placeholder="Team name"
                        className="flex-1"
                      />
                      <Button
                        onClick={() => {
                          console.log("Enrolling in team:", enrollTeamName);
                          setOpen(false);
                          setEnrollTeamName("");
                        }}
                        disabled={!enrollTeamName.trim()}
                      >
                        Enroll now
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Create New Team</DialogTitle>
                <DialogDescription>
                  Enter your team details below. Click submit when youre done.
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
                      required
                    />
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
                        />
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
                            />
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
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentView("initial")}
                  >
                    Back
                  </Button>
                  <Button type="submit">Submit</Button>
                </DialogFooter>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
