export const siteConfig = {
  name: "Wikidata Explorer",
  title: "Wikidata Explorer | Evidence-first linked-data research",
  description:
    "Search Wikidata, inspect references and qualifiers, explore relationship graphs, and export evidence-grounded research paths.",
  defaultUrl: "http://localhost:3000",
  ogImagePath: "/images/jean-francois-millet-gleaners-google-art-project-2.jpg",
  ogImageWidth: 330,
  ogImageHeight: 247,
  ogImageAlt: "Jean-Francois Millet's The Gleaners, used as the History Puzzle link preview image",
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
  const rawUrl = explicitUrl || (vercelUrl ? `https://${vercelUrl}` : siteConfig.defaultUrl);

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