import type { MetadataRoute } from "next";
import { absoluteSiteUrl } from "@/lib/site-config.mjs";

const routes = [
  { path: "/", priority: 1 },
  { path: "/search", priority: 0.9 },
  { path: "/docs", priority: 0.7 },
  { path: "/about", priority: 0.6 },
  { path: "/chat", priority: 0.4 },
  { path: "/agents", priority: 0.4 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((route) => ({
    url: absoluteSiteUrl(route.path),
    changeFrequency: "weekly",
    priority: route.priority,
  }));
}