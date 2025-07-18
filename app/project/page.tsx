import { CardsSection } from "@/components/03-organisms/cards-section"
import { Suspense } from "react";
import ProjectListSkeleton from "@/components/03-organisms/ProjectListSuspense";

const sampleCards = [
  {
    id: "1",
    title: "Portfolio Website",
    description: "A personal portfolio site built to showcase skills, projects, and experience using modern frameworks.",
    teamCount: 2,
    image: "/image-placeholder.webp?height=200&width=400",
  },
  {
    id: "2",
    title: "E-commerce App",
    description: "A complete online shopping platform with secure payment gateway and mobile-friendly UI.",
    teamCount: 2,
    image: "/image-placeholder.webp?height=200&width=400",
  },
  {
    id: "3",
    title: "Design System",
    description: "A custom design system created for a consistent and scalable product UI across platforms.",
    teamCount: 3,
    image: "/image-placeholder.webp?height=200&width=400",
  },
  {
    id: "4",
    title: "Cloud Migration",
    description: "Successfully migrated legacy infrastructure to a modern cloud-native solution for better scalability.",
    teamCount: 2,
    image: "/image-placeholder.webp?height=200&width=400",
  },
  {
    id: "5",
    title: "Data Dashboard",
    description: "Interactive analytics dashboard for visualizing business KPIs using real-time data.",
    teamCount: 1,
    image: "/image-placeholder.webp?height=200&width=400",
  },
  {
    id: "6",
    title: "AI Chatbot",
    description: "A conversational chatbot built with NLP to assist users and automate customer support.",
    teamCount: 2,
    image: "/image-placeholder.webp?height=200&width=400",
  },
  {
    id: "7",
    title: "Event Management Tool",
    description: "An all-in-one platform to create, promote, and manage events with real-time attendee tracking.",
    teamCount: 3,
    image: "/image-placeholder.webp?height=200&width=400",
  },
  {
    id: "8",
    title: "Remote Collaboration Suite",
    description: "A toolkit for teams to collaborate remotely, including video calls, file sharing, and task tracking.",
    teamCount: 4,
    image: "/image-placeholder.webp?height=200&width=400",
  },
]

export default function Project() {
  return (
    <div className="min-h-screen bg-background">
      <Suspense fallback={<ProjectListSkeleton />}>
        <CardsSection
          title="Our Projects"
          description="Explore some of our most impactful and innovative projects that solve real-world problems and deliver results."
          cards={sampleCards}
        />
      </Suspense>
    </div>
  )
}
