"use client";

import Link from "next/link";
import { MainNav } from "@/components/nav/main-nav";
import { ThemeToggle } from "@/components/theme-toggle";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex min-h-14 flex-wrap items-center gap-2 py-2">
        <Link className="mr-auto flex items-center text-sm font-bold sm:text-base" href="/">
          Wikidata Explorer
        </Link>
        <div className="flex items-center gap-2">
          <MainNav />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}