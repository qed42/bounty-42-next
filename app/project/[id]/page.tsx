import { notFound } from "next/navigation"

// Sample data
const projectsData = {
  "1": { id: "1", title: "Portfolio Website" },
  "2": { id: "2", title: "E-commerce App" },
  "3": { id: "3", title: "Design System" },
  "4": { id: "4", title: "Cloud Migration" },
  "5": { id: "5", title: "Data Dashboard" },
  "6": { id: "6", title: "AI Chatbot" },
}

interface ProjectDetailPageProps {
  params: {
    id: string
  }
}

export default function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const project = projectsData[params.id as keyof typeof projectsData]

  if (!project) {
    notFound()
  }

  return (
    <main className="min-h-screen flex items-center justify-center">
      <h1 className="text-4xl font-bold">{project.title}</h1>
    </main>
  )
}
