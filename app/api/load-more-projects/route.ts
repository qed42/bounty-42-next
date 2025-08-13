// app/api/load-more-projects/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { GET_PROJECTS } from '@/lib/queries/getData';
import { getGraphQLClient } from '@/utils/getGraphQLClient'
// importing types
import type { ProjectEdge } from "@/types/project";

export async function GET(req: NextRequest) {
  const after = req.nextUrl.searchParams.get("after");

  const client = await getGraphQLClient();

  const { data, error } = await client.query(GET_PROJECTS, {
    first: 8,         // Only 8 items per load
    after: after || null, // This must change per call
  });

  if (error || !data?.nodeProjects?.edges) {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }

  const newCards = data.nodeProjects.edges.map(({ node }: ProjectEdge) => ({
    id: node.id,
    title: node.title,
    description: node.body?.summary ?? "",
    image: node.defaultImage?.url ?? "/image-placeholder.webp",
    link: node.path,
    category: node.category?.name || "Uncategorized",
    weight: node.category?.weight || 0, // Ensure weight is always defined
  }));

  return NextResponse.json({
    newCards,
    newPageInfo: data.nodeProjects.pageInfo,
  });
}
