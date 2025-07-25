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
import { usePathname } from "next/navigation";

const navItems = {
  loggedIn: [{ title: "Projects", href: "/project" }],
  notLoggedIn: [{ title: "Login", href: "/login" }],
};

export function Header() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-md border-b border-muted header">
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
          {session ? (
            <>
              {navItems.loggedIn.map((item) => (
                <Link
                  key={item.title}
                  href={item.href}
                  className={`text-18 font-medium no-underline ${
                    pathname === item.href
                      ? "text-primary" // Active link color
                      : "text-gray-800 hover:text-primary" // Inactive link color
                  }`}
                >
                  {item.title}
                </Link>
              ))}
              <Button className="cursor-pointer" onClick={() => signOut()}>
                <LogOut className="w-5 h-5" />
                Sign out
              </Button>
            </>
          ) : (
            <>
              {navItems.notLoggedIn.map((item) => (
                <Link
                  key={item.title}
                  href={item.href}
                  className={`text-18 font-medium no-underline ${
                    pathname === item.href
                      ? "text-primary" // Active link color
                      : "text-gray-800 hover:text-primary" // Inactive link color
                  }`}
                >
                  {item.title}
                </Link>
              ))}
            </>
          )}
        </nav>

        {/* Mobile Navigation */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost">
              <Menu className="h-8 w-8" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px] sm:w-[400px]">
            {/* Added SheetTitle for accessibility */}
            <SheetTitle className="sr-only">Main Menu</SheetTitle>
            <div className="flex flex-col space-y-4 mt-4 p-4">
              {session ? (
                <>
                  {navItems.loggedIn.map((item) => (
                    <Link
                      key={item.title}
                      href={item.href}
                      className={`text-lg font-medium no-underline transition-colors
                  ${
                    pathname === item.href
                      ? "text-primary" // Active link color
                      : "text-gray-800 hover:text-primary" // Inactive link color
                  }`}
                      onClick={() => setIsOpen(false)} // Close sheet on link click
                    >
                      {item.title}
                    </Link>
                  ))}
                  <Button className="cursor-pointer" onClick={() => signOut()}>
                    <LogOut className="w-5 h-5" />
                    Sign out
                  </Button>
                </>
              ) : (
                <>
                  {navItems.notLoggedIn.map((item) => (
                    <Link
                      key={item.title}
                      href={item.href}
                      className={`text-lg font-medium no-underline transition-colors
                  ${
                    pathname === item.href
                      ? "text-primary" // Active link color
                      : "text-gray-800 hover:text-primary" // Inactive link color
                  }`}
                      onClick={() => setIsOpen(false)} // Close sheet on link click
                    >
                      {item.title}
                    </Link>
                  ))}
                </>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
