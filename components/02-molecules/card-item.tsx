"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { Users } from "lucide-react";
import Image from "next/image"

interface CardItemProps {
  id: string
  title: string
  description: string
  image: string
  teamCount: number
  link: string
}

export function CardItem({ id, title, description, teamCount, image, link }: CardItemProps) {
  // export function CardItem({ id, title, image, link }: CardItemProps) {
  const router = useRouter()

  const handleViewProject = () => {
    const target = link && link !== "#" ? link : `/project/${link}`;
    router.push(target);
  }

  return (
    <Card
      className="flex flex-col h-full text-primary transition-all duration-300 hover:shadow-xl group cursor-pointer pt-0"
      onClick={handleViewProject}
      tabIndex={0}
      role="button"
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") handleViewProject();
      }}
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
        <CardDescription>{description}</CardDescription>
        {/* Team Count */}
        <div className="flex items-center text-sm text-muted-foreground mt-2">
          <Users className="h-4 w-4 mr-1" />
          <span>
            {teamCount} Member{teamCount > 1 ? 's' : ''}
          </span>
        </div>
      </CardHeader>
      <CardFooter className="mt-auto flex flex-col items-start gap-2">
        <Button className="w-full cursor-pointer bg-primary text-md">
          View
        </Button>
      </CardFooter>
    </Card>
  );
}
