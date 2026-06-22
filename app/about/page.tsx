import { BookOpen, BrainCircuit, Database, GitBranch, Network, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";

const strengths = [
  {
    icon: Database,
    title: "Structured Entity Inspection",
    body: "Search by term, QID, or PID, then inspect normalized labels, descriptions, aliases, sitelinks, and statements.",
  },
  {
    icon: Network,
    title: "Relationship Graph",
    body: "Turn statement values into a clickable graph so reviewers can see linked-data traversal at a glance.",
  },
  {
    icon: BrainCircuit,
    title: "AI Research Assistant",
    body: "Ask workflow and modeling questions through a server-side OpenAI route with validation and safe error handling.",
  },
  {
    icon: ShieldCheck,
    title: "Shipping Discipline",
    body: "The project includes lint/build verification, smoke checks, ignored local credentials, and a repeatable ship workflow.",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-50">
      <div className="container mx-auto px-4 py-10">
        <div className="mb-8 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
            <BookOpen className="h-4 w-4 text-sky-500" />
            Portfolio project
          </div>
          <h1 className="text-4xl font-semibold tracking-tight">About Wikidata Explorer</h1>
          <p className="text-slate-600 dark:text-slate-300">
            A focused Next.js application for exploring Wikidata records, following entity relationships, and using AI to reason about linked-data research workflows.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {strengths.map((strength) => {
            const Icon = strength.icon;
            return (
              <Card key={strength.title} className="p-5">
                <div className="mb-3 flex items-center gap-2">
                  <Icon className="h-5 w-5 text-sky-600 dark:text-sky-300" />
                  <h2 className="text-lg font-semibold">{strength.title}</h2>
                </div>
                <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{strength.body}</p>
              </Card>
            );
          })}
        </div>

        <Card className="mt-4 p-5">
          <div className="mb-3 flex items-center gap-2">
            <GitBranch className="h-5 w-5 text-emerald-600 dark:text-emerald-300" />
            <h2 className="text-lg font-semibold">What This Demonstrates</h2>
          </div>
          <div className="grid gap-3 text-sm text-slate-600 dark:text-slate-300 md:grid-cols-3">
            <p>API integration with Wikidata Action API, Wikibase REST, and Wikimedia Commons metadata.</p>
            <p>Client-side product UX for search, selection, linked traversal, media, languages, and graph exploration.</p>
            <p>Server-side AI route design with request validation, key isolation, streaming, and portfolio-ready verification scripts.</p>
          </div>
        </Card>
      </div>
    </div>
  );
}