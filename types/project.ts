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
  };
  defaultImage?: { url?: string };
  projectTeam?: Array<{
    email: string;
    name: string;
    employeeImage: { url: string };
  }> | null;
};

export type ProjectEdge = {
  node: ProjectNode;
};

export type Card = {
  id: string;
  title: string;
  description: string;
  category: string;
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
