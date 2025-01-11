"use client";

import { usePathname } from "next/navigation";
import { MainNav } from "@/components/nav/main-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { AutomatedChatControl } from "@/components/AutomatedChatControl";

export function Header() {
  const pathname = usePathname();
  const showAutoControl = pathname === "/" || pathname === "/chat";

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <a className="mr-6 flex items-center space-x-2" href="/">
            <span className="font-bold sm:inline-block">Wikidata Explorer</span>
          </a>
        </div>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <nav className="flex items-center space-x-6">
            <AutomatedChatControl visible={showAutoControl} />
            <MainNav />
            <ThemeToggle />
          </nav>
        </div>
      </div>
    </header>
  );
}
