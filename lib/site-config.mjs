export const siteConfig = {
  name: "Wikidata Explorer",
  title: "Wikidata Explorer | Evidence-first linked-data research",
  description:
    "Search Wikidata, inspect references and qualifiers, then follow evidence-grounded paths through linked records.",
  defaultUrl: "https://www.wikidataexplorer.com",
  faviconPath: "/favicon.ico",
  siteIconPath: "/images/8sprocket.jpg",
  ogImagePath: "/opengraph-image",
  ogImageWidth: 330,
  ogImageHeight: 247,
  ogImageAlt: "Jean-Francois Millet's The Gleaners, used as the Wikidata Explorer link preview image",
  keywords: [
    "Wikidata",
    "linked data",
    "knowledge graph",
    "research assistant",
    "entity explorer",
    "evidence review",
    "Next.js portfolio",
  ],
};

export function publicSiteUrl(env = process.env) {
  const explicitUrl = String(env.NEXT_PUBLIC_SITE_URL || "").trim();
  const vercelUrl = String(env.VERCEL_URL || "").trim();
  const rawUrl = explicitUrl || siteConfig.defaultUrl || (vercelUrl ? `https://${vercelUrl}` : "");

  try {
    const url = new URL(rawUrl);
    return url.toString().replace(/\/+$/, "");
  } catch {
    return siteConfig.defaultUrl;
  }
}

export function absoluteSiteUrl(path = "/", env = process.env) {
  return new URL(path, `${publicSiteUrl(env)}/`).toString();
}
