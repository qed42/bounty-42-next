// components/03-organisms/cards-section.tsx

"use client";

import { useState } from "react";
import { CardItem } from "@/components/02-molecules/card-item";
import { Button } from "@/components/ui/button";
// importing types
import type { Card, PageInfo, CardsSectionProps } from "@/types/project";

export function CardsSection({
  title,
  description,
  cards: initialCards,
  pageInfo: initialPageInfo,
}: CardsSectionProps) {
  const [cards, setCards] = useState<Card[]>(initialCards);
  const [pageInfo, setPageInfo] = useState<PageInfo>(initialPageInfo);
  const [loading, setLoading] = useState(false);

  const loadMore = async () => {
    if (!pageInfo.endCursor) return;

    setLoading(true);
    const res = await fetch(`/api/load-more-projects?after=${pageInfo.endCursor}`);
    const json = await res.json();

    setCards((prev) => [...prev, ...json.newCards]);
    setPageInfo(json.newPageInfo);
    setLoading(false);
  };

  return (
    <section className="py-12 lg:py-20 px-4 container mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-primary text-4xl font-bold tracking-tight mb-4">{title}</h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{description}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-7">
        {cards.map((card, index) => (
          <CardItem key={card.id} index={index} {...card} />
        ))}
      </div>

      {pageInfo.hasNextPage && (
        <div className="text-center mt-10">
          <Button onClick={loadMore} disabled={loading} className="cursor-pointer">
            {loading ? "Loading...." : "Load More"}
          </Button>
        </div>
      )}
    </section>
  );
}
