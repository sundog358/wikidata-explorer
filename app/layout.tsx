import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { siteConfig, publicSiteUrl } from "@/lib/site-config.mjs";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"] });

const siteIcon = "/images/8sprocket.jpg";
const siteUrl = publicSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteConfig.title,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  keywords: siteConfig.keywords,
  authors: [{ name: "Wikidata Explorer" }],
  creator: "Wikidata Explorer",
  publisher: "Wikidata Explorer",
  category: "technology",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: siteConfig.name,
    title: siteConfig.title,
    description: siteConfig.description,
    images: [
      {
        url: siteConfig.ogImagePath,
        width: siteConfig.ogImageWidth,
        height: siteConfig.ogImageHeight,
        alt: siteConfig.ogImageAlt,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.title,
    description: siteConfig.description,
    images: [siteConfig.ogImagePath],
  },
  icons: {
    icon: [{ url: siteIcon, type: "image/jpeg" }],
    shortcut: [{ url: siteIcon, type: "image/jpeg" }],
    apple: [{ url: siteIcon, type: "image/jpeg" }],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#020617" },
  ],
  colorScheme: "light dark",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(inter.className, "flex min-h-screen flex-col bg-background")}>
        <ThemeProvider defaultTheme="system">
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}

