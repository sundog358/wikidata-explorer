export type SiteConfig = {
  name: string;
  title: string;
  description: string;
  defaultUrl: string;
  ogImagePath: string;
  keywords: string[];
};

export const siteConfig: SiteConfig;
export function publicSiteUrl(env?: Record<string, string | undefined>): string;
export function absoluteSiteUrl(path?: string, env?: Record<string, string | undefined>): string;