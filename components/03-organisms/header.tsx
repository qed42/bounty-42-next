"use client";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet"; // Import SheetTitle
import { LogOut, Menu } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import Image from "next/image";
import { signOut, useSession } from "next-auth/react";

const navigationItems = [
  { title: "Home", href: "/" },
  { title: "Projects", href: "/project-list" },
];

export function Header() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);

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
            <Link
              key={item.title}
              href={item.href}
              className="text-18 font-medium text-foreground hover:text-primary no-underline"
            >
              {item.title}
            </Link>
          ))}
          {session && (
            <button
              onClick={() => signOut()}
              className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center space-x-2 cursor-pointer"
            >
              <LogOut className="w-5 h-5" />
              <span>Sign out</span>
            </button>
          )}
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

              {session && (
                <button
                  onClick={() => signOut()}
                  className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center space-x-2"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Sign out</span>
                </button>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
