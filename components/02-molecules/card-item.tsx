"use client"

import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { Users } from "lucide-react"
// import Image from "next/image"

interface CardItemProps {
  id: string
  title: string
  description: string
  image: string
  teamCount: number
}

export function CardItem({ id, title, description, teamCount, image }: CardItemProps) {
  const router = useRouter()

  const handleViewProject = () => {
    router.push(`/project/${id}`)
  }

  return (
    <Card
      className="flex flex-col h-full transition-all duration-300 hover:shadow-xl group cursor-pointer"
      onClick={handleViewProject}
      tabIndex={0}
      role="button"
      onKeyDown={e => {
        if (e.key === "Enter" || e.key === " ") handleViewProject();
      }}
    >
      {/* Image commented out for now, can be uncommented if needed

      <div className="relative w-full h-56 overflow-hidden rounded-t-lg">
        <Image
          src={image || "/image-placeholder.webp"}
          alt={title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div> */}
      <CardHeader>
        <CardTitle className="text-xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
        {/* Team Count */}
        <div className="flex items-center text-sm text-muted-foreground mt-2">
          <Users className="h-4 w-4 mr-1" />
          <span>{teamCount} Members</span>
        </div>
      </CardHeader>
      <CardFooter>
        <Button className="w-full cursor-pointer text-md">
          View
        </Button>
      </CardFooter>
    </Card>
  )
}
