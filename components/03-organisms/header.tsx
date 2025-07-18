"use client"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet" // Import SheetTitle
import { Menu } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import Image from "next/image"

const navigationItems = [
  { title: "Home", href: "/" },
  { title: "Projects", href: "/project" },
]

export function Header() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-md border-b border-muted">
      <div className="container mx-auto px-4 min-h-20 h-auto flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <Image
            src="/QED42 logo.svg"
            alt="Logo"
            width={150}
            height={50}
            className="inline-block mr-2"
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          {navigationItems.map((item) => (
            <Link key={item.title} href={item.href} className="text-18 font-medium text-foreground hover:text-primary no-underline">
              {item.title}
            </Link>
          ))}
        </nav>

        {/* Mobile Navigation */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-8 w-8" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px] sm:w-[400px]">
            {/* Added SheetTitle for accessibility */}
            <SheetTitle className="sr-only">Main Menu</SheetTitle>
            <div className="flex flex-col space-y-4 mt-4 p-4">
              {navigationItems.map((item) => (
                <Link
                  key={item.title}
                  href={item.href}
                  className="text-lg font-medium text-primary hover:text-primary no-underline transition-colors"
                  onClick={() => setIsOpen(false)} // Close sheet on link click
                >
                  {item.title}
                </Link>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}
