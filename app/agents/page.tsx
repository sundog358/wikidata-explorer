import Link from "next/link";
import { BrainCircuit, FileText, GitCompareArrows, Network, Search, ShieldCheck } from "lucide-react";

const primaryLinkClass = "inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";
const outlineLinkClass = "inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-md border border-input bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

const agents = [
  {
    action: "research",
    icon: Search,
    name: "Wikidata Research Agent",
    body: "Fetches fresh entity context from Wikidata and turns it into an overview, relationship leads, data-quality risks, and next research steps.",
  },
  {
    action: "graph",
    icon: Network,
    name: "Graph Analyst Agent",
    body: "Reads the selected entity context and explains relationship neighborhoods, weak edges, and the most useful next graph clicks.",
  },
  {
    action: "verify",
    icon: ShieldCheck,
    name: "Citation/Verifier Agent",
    body: "Reviews statement ranks, qualifiers, references, and Wikidata IDs so important claims are easier to trust or challenge.",
  },
  {
    action: "compare",
    icon: GitCompareArrows,
    name: "Comparison Agent",
    body: "Compares the selected entity against another Q/P ID such as Q80, highlighting shared themes, unique statements, evidence differences, and graph overlap.",
  },
  {
    action: "report",
    icon: FileText,
    name: "Report Agent",
    body: "Exports a Markdown-style research note with summary, key statements, evidence notes, graph leads, and open questions.",
  },
];

export default function AgentsPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-50">
      <div className="container mx-auto px-4 py-10">
        <div className="mb-8 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
            <BrainCircuit className="h-4 w-4 text-sky-500" />
            AG2 specialist agents
          </div>
          <h1 className="text-4xl font-semibold tracking-tight">Agent Workbench</h1>
          <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
            Choose an agent card to open Q42 and run that specialist automatically, or open a workbench and pick an agent from the entity page.
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
            <Link href="/search?q=Q42" className={primaryLinkClass}>
              <Search className="h-4 w-4" />
              Open Q42 Workbench
            </Link>
            <Link href="/search?q=P31" className={outlineLinkClass}>
              <Network className="h-4 w-4" />
              Open P31 Workbench
            </Link>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {agents.map((agent) => {
            const Icon = agent.icon;
            return (
              <Link key={agent.name} href={`/search?q=Q42&agent=${agent.action}`} className="group block rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-sky-300 hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800">
                <div className="mb-3 flex items-center gap-2">
                  <Icon className="h-5 w-5 text-sky-600 dark:text-sky-300" />
                  <h2 className="text-lg font-semibold group-hover:text-sky-700 dark:group-hover:text-sky-300">{agent.name}</h2>
                </div>
                <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{agent.body}</p>
                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-sky-700 dark:text-sky-300">Open with this agent</p>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
