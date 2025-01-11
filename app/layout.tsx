import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { ToastProvider } from "@/hooks/use-toast";
import { Header } from "@/components/layout/Header";
import { cn } from "@/lib/utils";
import { ChatProvider } from "@/components/ChatContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Wikidata Explorer",
  description:
    "Explore and learn about Wikidata entities and their relationships",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(inter.className, "min-h-screen bg-background")}>
        <ChatProvider>
          <ToastProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <Header />
              <main className="flex-1">{children}</main>
              <Toaster />
            </ThemeProvider>
          </ToastProvider>
        </ChatProvider>
      </body>
    </html>
  );
}
