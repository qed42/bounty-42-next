// TypeScript type for a project node
export type ProjectNode = {
  id: string;
  title: string;
  durations?: string;
  body?: { value?: string; summary?: string };
  path: string;
  reward?: number;
  category: {
    id: string;
    name: string;
    weight: number; 
  };
  defaultImage?: { url?: string };
  projectTeam?: Array<{
    email: string;
    name: string;
    employeeImage: { url: string };
  }> | null;
  executionTracks?: Array<{
    __typename: "ParagraphProjectMilestone";
    id: string;
    selected?: boolean;
    team?: {
      __typename: "TermProjectTeam";
      id: string;
      name: string;
    } | null;
    executionPlan?: Array<{
      __typename: "ParagraphMilestone";
      id: string;
      status?: boolean; // GraphQL shows `true/false`
      milestoneStatus?: string; // "in_progress", "completed", etc.
      milestoneName?: string;
      milestoneDetails?: string;
    }> | null;
  }> | null;
  teams?: Array<{
    __typename: "TermProjectTeam";
    id: string;
    name: string;
    teamMembers?: Array<{
      id: string;
      name: string;
      mail: string;
    }> | null;
  }> | null;
  projectMentor?: {
    mail: string;
    name: string;
  };
};

export type ProjectEdge = {
  node: ProjectNode;
};

export type Card = {
  id: string;
  title: string;
  description: string;
  category: string;
  weight: number; 
  image: string;
  link: string;
};

export type PageInfo = {
  hasNextPage: boolean;
  endCursor: string | null;
};

export type CardsSectionProps = {
  title: string;
  description: string;
  cards: Card[];
  pageInfo: PageInfo;
};

export type CardItemProps = {
  id: string;
  index: number;
  title: string;
  description: string;
  category: string;
  weight: number;
  image: string;
  link: string;
};

// TYPES
export type TeamMember = {
  uuid: string;
  email?: string;
};

export type TeamMem = {
  id: string;
  name: string;
  mail: string;
};

export type ProjectTeam = {
  id: string;
  name: string;
  field_team_members: TeamMem[];
};

// INTERFACES
export interface TeamData {
  teamName: string;
  teamType?: "team" | "solo";
  member1: string;
  member2: string;
  member3: string;
  milestones: Milestone[]; // Added missing milestones property
}

export interface ProjectTeamMember {
  email: string;
  name: string;
  employeeImage: {
    url: string;
  };
}

export interface Project {
  id: string;
  title?: string;
  durations?: string;
  body?: {
    value?: string;
    summary?: string;
  };
  path?: string;
  defaultImage?: {
    url?: string;
  };
  projectTeam?: ProjectTeamMember[] | null;
  teams?: {
    id: string;
    type?: string;
  }[];
}

export interface Milestone {
  title: string;
  description: string;
}

export interface ProjectTeamEntity {
  id: string;
}

export interface DrupalResource {
  id: string;
  type: string;
  drupal_internal__id: string;
  drupal_internal__revision_id: string;
}

export interface ErrorResult {
  success: false;
  message: string;
}

export interface SuccessResult extends DrupalResource {
  success?: never; // This ensures success result doesn't have success property
}

export interface MilestoneResult {
  success: boolean;
  id?: string;
  type?: string;
  drupal_internal__id?: string;
  drupal_internal__revision_id?: string;
  message?: string;
}
