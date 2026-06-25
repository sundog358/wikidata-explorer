import { BookOpen, BrainCircuit, Database, FileText, Link2, Network, Search, ShieldCheck } from "lucide-react";

const sections = [
  {
    icon: Search,
    title: "Search",
    body: "Use the home page or /search to look up a term, QID, or PID. Direct IDs open the record immediately; keyword searches keep results available in the left panel.",
  },
  {
    icon: Database,
    title: "Inspect",
    body: "Entity details are normalized into readable labels, descriptions, aliases, statements, sitelinks, Commons media, and language rows.",
  },
  {
    icon: Network,
    title: "Graph",
    body: "The graph tab maps statement values into clickable related entities with selected-edge qualifier and reference summaries, so exploration feels visual, directional, and evidence-grounded.",
  },
  {
    icon: Link2,
    title: "Follow",
    body: "Linked Data collects related Q and P identifiers from statements and qualifiers so you can branch through the graph without losing context.",
  },
  {
    icon: BrainCircuit,
    title: "Ask",
    body: "The AG2 research assistant and specialist workbench help with Wikidata workflow questions, graph analysis, selected-edge next-entity suggestions, verification, comparison, and reporting while keeping provider keys on the server.",
  },
  {
    icon: ShieldCheck,
    title: "Verify",
    body: "Run lint, build, local smoke, metadata, e2e, visual QA, screenshot refresh, and route/API checks before shipping portfolio changes.",
  },
];

const commands = [
  "npm run dev -- --port 3000",
  "npm run lint",
  "npm run build",
  "npm run smoke",
  "npm run metadata:check",
  "npm run test",
  "npm run e2e",
  "npm run visual:qa",
  "npm run screenshots:update",
];

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-50">
      <div className="container mx-auto px-4 py-10">
        <div className="mb-8 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
            <BookOpen className="h-4 w-4 text-sky-500" />
            Explorer guide
          </div>
          <h1 className="text-4xl font-semibold tracking-tight">Wikidata Explorer Documentation</h1>
          <p className="text-slate-600 dark:text-slate-300">
            A concise reference for the user workflow, data model, AI assistant, and verification commands.
          </p>
        </div>

        <section className="mb-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900" data-testid="case-study-callout">
          <div className="mb-3 flex items-center gap-2">
            <FileText className="h-5 w-5 text-sky-600 dark:text-sky-300" />
            <h2 className="text-lg font-semibold">Portfolio Case Study</h2>
          </div>
          <p className="max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
            A standalone write-up covers the architecture, AI safety boundary, testing strategy, deployment tradeoffs, and seeded proof paths behind Wikidata Explorer.
          </p>
          <a
            href="https://github.com/sundog358/wikidata-explorer/blob/main/docs/case-study.md"
            className="mt-3 inline-flex text-sm font-medium text-sky-700 hover:text-sky-900 hover:underline dark:text-sky-300 dark:hover:text-sky-100"
          >
            Read the case study on GitHub
          </a>
        </section>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <section key={section.title} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="mb-3 flex items-center gap-2">
                  <Icon className="h-5 w-5 text-sky-600 dark:text-sky-300" />
                  <h2 className="text-lg font-semibold">{section.title}</h2>
                </div>
                <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{section.body}</p>
              </section>
            );
          })}
        </div>

        <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-3 text-lg font-semibold">Developer Commands</h2>
          <div className="grid gap-3 text-sm md:grid-cols-2 xl:grid-cols-4">
            {commands.map((command) => (
              <code key={command} className="rounded-md bg-slate-100 p-3 dark:bg-slate-800">{command}</code>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
