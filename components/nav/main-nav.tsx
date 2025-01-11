"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/docs/utils";
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
    name: "AI Chat",
    href: "/chat",
    icon: MessageSquareIcon,
  },
  {
    name: "Documentation",
    href: "/docs",
    icon: BookIcon,
  },
];

export function MainNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center space-x-6">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center text-sm font-medium transition-colors hover:text-blue-800 dark:hover:text-blue-400",
              pathname === item.href
                ? "text-green-700 dark:text-green-500"
                : "text-muted-foreground",
            )}
          >
            <Icon className="h-4 w-4 mr-2" />
            {item.name}
          </Link>
        );
      })}
    </nav>
  );
}
