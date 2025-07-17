import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Frown } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-128px)] text-center px-4">
      <Frown className="h-24 w-24 text-primary mb-6" />
      <h1 className="text-5xl font-bold mb-4">404 - Project Not Found</h1>
      <p className="text-lg text-muted-foreground mb-8">
        We couldn`t find the project you were looking for. It might have been moved or deleted.
      </p>
      <Link href="/project">
        <Button>Go back to Project List</Button>
      </Link>
    </div>
  )
}