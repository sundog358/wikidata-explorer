"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { aiAgentsEnabled } from "@/lib/ai-feature-flags.mjs";
import { cn } from "@/lib/utils";
import {
  MessageSquareIcon,
  SearchIcon,
  HomeIcon,
  BookIcon,
  BrainCircuitIcon,
  type LucideIcon,
} from "lucide-react";

const AI_AGENTS_ENABLED = aiAgentsEnabled({
  NEXT_PUBLIC_ENABLE_AI_AGENTS: process.env.NEXT_PUBLIC_ENABLE_AI_AGENTS,
});

type NavItem = {
  name: string;
  href: string;
  icon: LucideIcon;
  persistentLabel?: boolean;
};

const coreNavItems: NavItem[] = [
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
];

const aiNavItems: NavItem[] = [
  {
    name: "Agents",
    href: "/agents",
    icon: BrainCircuitIcon,
    persistentLabel: true,
  },
  {
    name: "Research Assistant",
    href: "/chat",
    icon: MessageSquareIcon,
  },
];

const docsNavItem: NavItem = {
  name: "Docs",
  href: "/docs",
  icon: BookIcon,
};

export const navItems = [
  ...coreNavItems,
  ...(AI_AGENTS_ENABLED ? aiNavItems : []),
  docsNavItem,
];

export function MainNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Primary" className="flex flex-wrap items-center gap-1 sm:gap-3">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-label={item.name}
            data-primary-nav={item.href === "/agents" ? "agents" : undefined}
            className={cn(
              "inline-flex h-9 shrink-0 items-center gap-2 rounded-md px-2 text-sm font-medium transition-colors hover:bg-sky-50 hover:text-sky-800 dark:hover:bg-slate-800 dark:hover:text-sky-300 sm:px-3",
              isActive ? "text-sky-700 dark:text-sky-300" : "text-muted-foreground",
              item.persistentLabel && "border border-sky-200 bg-sky-50 text-sky-800 dark:border-slate-700 dark:bg-slate-800 dark:text-sky-300",
            )}
            title={item.name}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className={item.persistentLabel ? "inline" : "hidden sm:inline"}>{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
