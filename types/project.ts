// TypeScript type for a project node
export type ProjectNode = {
  id: string;
  title: string;
  durations?: string;
  body?: { value?: string; summary?: string };
  path: string,
  defaultImage?: { url?: string };
  projectTeam?: Array<{ email: string; name: string; employeeImage: { url: string } }> | null;
};

export type ProjectEdge = {
  node: ProjectNode
};

export type Card = {
  id: string;
  title: string;
  description: string;
  teamCount: number;
  image: string;
  link: string;
};

export type PageInfo ={
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
  title: string;
  description: string;
  image: string;
  teamCount: number;
  link: string;
}
