"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  MessageSquareIcon,
  SearchIcon,
  HomeIcon,
  BookIcon,
} from "lucide-react";

const navItems = [
  {
    name: "Home",
    href: "/",
    icon: HomeIcon,
  },
  {
    name: "Search",
    href: "/search",
    icon: SearchIcon,
  },
  {
    name: "Research Assistant",
    href: "/chat",
    icon: MessageSquareIcon,
  },
  {
    name: "Docs",
    href: "/docs",
    icon: BookIcon,
  },
];

export function MainNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap items-center gap-1 sm:gap-3">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "inline-flex h-9 items-center gap-2 rounded-md px-2 text-sm font-medium transition-colors hover:bg-sky-50 hover:text-sky-800 dark:hover:bg-slate-800 dark:hover:text-sky-300 sm:px-3",
              pathname === item.href
                ? "text-sky-700 dark:text-sky-300"
                : "text-muted-foreground",
            )}
            title={item.name}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}