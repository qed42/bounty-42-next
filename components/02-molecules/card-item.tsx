"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle, } from "@/components/ui/card";
import { Users } from "lucide-react";
import Image from "next/image";
// importing types
import type { CardItemProps } from "@/types/project";

export function CardItem({
  title,
  description,
  teamCount,
  image,
  link,
}: CardItemProps) {
  const target = link && link !== "#" ? link : `/project/${link}`;

  return (
    <Link
      href={target}
      rel="noopener noreferrer"
      passHref
      className="no-underline"
    >
      <Card
        className="flex flex-col h-full text-primary transition-all duration-300 hover:shadow-xl group cursor-pointer pt-0"
        tabIndex={0}
        role="link"
      >
        {/* Card Image */}
        <div className="relative w-full h-56 overflow-hidden rounded-t-lg">
          <Image
            src={image || "/image-placeholder.webp"}
            alt={title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>

        <CardHeader>
          <CardTitle className="text-xl">{title}</CardTitle>
          <CardDescription className="line-clamp-5">{description}</CardDescription>
          <div className="flex items-center text-sm text-muted-foreground mt-2">
            <Users className="h-4 w-4 mr-1" />
            <span>{teamCount} Member{teamCount > 1 ? "s" : ""}</span>
          </div>
        </CardHeader>

        <CardFooter className="mt-auto flex flex-col items-start gap-2">
          <Button className="w-full cursor-pointer bg-primary text-md">
            View
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
}
