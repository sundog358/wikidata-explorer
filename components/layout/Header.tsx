"use client";

import { MainNav } from "@/components/nav/main-nav";
import { ThemeToggle } from "@/components/theme-toggle";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="flex items-center space-x-4">
          <div className="text-xl font-bold bg-gradient-to-r from-blue-600 to-green-400 bg-clip-text text-transparent">
            Wikidata Explorer
          </div>
          <MainNav />
        </div>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
