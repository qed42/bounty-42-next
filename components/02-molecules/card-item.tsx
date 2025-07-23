"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle, } from "@/components/ui/card";
import Image from "next/image";
// importing types
import type { CardItemProps } from "@/types/project";

export function CardItem({
  title,
  description,
  category,
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
        className="relative flex flex-col h-full text-primary transition-all duration-300 hover:shadow-xl group cursor-pointer pt-0"
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
          <div className='absolute inset-0 bg-black/20 pointer-events-none'></div>
        </div>

        <CardHeader>
          <CardTitle className="text-xl">{title}</CardTitle>
          <CardDescription className="line-clamp-5">{description}</CardDescription>

          {/* Category */}
          <div
            className={`project-category w-max absolute top-4 right-4 text-xs ${
              category.toLowerCase().replace(/\s+/g, '') === 'pool1'
                ? 'project-category--1'
                : category.toLowerCase().replace(/\s+/g, '') === 'pool2'
                ? 'project-category--2'
                : category.toLowerCase().replace(/\s+/g, '') === 'pool3'
                ? 'project-category--3'
                : 'text-black'
            }`}
          >
            {category}
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
