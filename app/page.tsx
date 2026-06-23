"use client";

import { FormEvent, useState } from "react";
import { ArrowRight, Database, Network, Search, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const examples = ["Douglas Adams", "Q42", "P31", "linked open data"];
const proofPaths = [
  {
    title: "Graph context",
    body: "Open Douglas Adams with relationship filters ready for inspection.",
    href: "/search?q=Q42",
    icon: Network,
    testId: "home-proof-path-graph",
  },
  {
    title: "Evidence review",
    body: "Jump to references, qualifiers, ranks, and curation draft exports.",
    href: "/search?q=Q42&tab=review",
    icon: Database,
    testId: "home-proof-path-review",
  },
];

export default function Home() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  function openExplorer(nextQuery: string) {
    const trimmed = nextQuery.trim();
    router.push(trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : "/search");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    openExplorer(query);
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-50">
      <section className="container mx-auto grid min-h-[calc(100vh-3.5rem)] gap-8 px-4 py-10 lg:grid-cols-[1fr_420px] lg:items-center">
        <div className="max-w-4xl space-y-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
            <Sparkles className="h-4 w-4 text-sky-500" />
            Wikidata graph exploration
          </div>

          <div className="space-y-4">
            <h1 className="max-w-3xl text-5xl font-semibold tracking-tight md:text-6xl">
              Wikidata Explorer
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
              Search entities, inspect statements, follow linked items, compare labels across languages, and open the source record without leaving your flow.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex max-w-2xl flex-col gap-2 rounded-lg border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row">
            <Input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search a topic or enter Q/P ID"
              className="h-12 border-0 bg-transparent text-base shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            <Button type="submit" size="lg" className="h-12 gap-2">
              Explore
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-slate-500 dark:text-slate-400">Try</span>
            {examples.map((example) => (
              <button key={example} type="button" onClick={() => openExplorer(example)}>
                <Badge variant="outline" className="cursor-pointer bg-white hover:bg-sky-50 dark:bg-slate-900 dark:hover:bg-slate-800">
                  {example}
                </Badge>
              </button>
            ))}
          </div>
        </div>

        <Card className="overflow-hidden border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-200 p-5 dark:border-slate-800">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-sky-700 dark:text-sky-300">
              <Network className="h-4 w-4" />
              Explorer workflow
            </div>
            <h2 className="text-xl font-semibold">From search to graph context</h2>
          </div>
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            <div className="flex gap-3 p-5">
              <Search className="mt-1 h-5 w-5 shrink-0 text-slate-500" />
              <div>
                <h3 className="font-medium">Find an entity</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">Search by natural language or jump straight to a Q/P identifier.</p>
              </div>
            </div>
            <div className="flex gap-3 p-5">
              <Database className="mt-1 h-5 w-5 shrink-0 text-slate-500" />
              <div>
                <h3 className="font-medium">Inspect evidence</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">Review property labels, values, references, qualifiers, ranks, media, and languages.</p>
              </div>
            </div>
            <div className="flex gap-3 p-5">
              <ArrowRight className="mt-1 h-5 w-5 shrink-0 text-slate-500" />
              <div>
                <h3 className="font-medium">Follow linked data</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">Branch into related entities and properties without starting over.</p>
              </div>
            </div>
          </div>
          <div className="border-t border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950">
            <div className="mb-4">
              <p className="text-sm font-semibold text-slate-950 dark:text-slate-50">Proof paths</p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Open a seeded workbench that shows the graph and evidence workflow immediately.</p>
            </div>
            <div className="grid gap-3">
              {proofPaths.map((path) => {
                const Icon = path.icon;

                return (
                  <div key={path.href} className="rounded-md border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
                    <div className="mb-3 flex gap-3">
                      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-sky-600 dark:text-sky-300" />
                      <div>
                        <p className="text-sm font-medium">{path.title}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-300">{path.body}</p>
                      </div>
                    </div>
                    <Button asChild variant="outline" size="sm" className="w-full gap-2">
                      <Link href={path.href} aria-label={`Open ${path.title}`} data-testid={path.testId}>
                        Open
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
}
