import Image from "next/image";
import Link from "next/link";
import { ExternalLink, Github, Network, ShieldCheck } from "lucide-react";

export function Footer() {
  return (
    <footer className="relative mt-auto overflow-hidden border-t border-slate-800 bg-slate-950 text-white">
      <div className="container grid gap-8 py-10 sm:py-12 lg:grid-cols-[minmax(0,1.4fr)_minmax(9rem,0.55fr)_minmax(11rem,0.7fr)_8rem] lg:items-start">
        <div className="max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/25 bg-sky-400/10 px-3 py-1 text-xs font-semibold text-sky-100">
            <Network className="h-3.5 w-3.5" />
            Evidence-first linked-data research
          </div>
          <div className="space-y-2">
            <p className="text-xl font-semibold tracking-tight sm:text-2xl">Wikidata Explorer</p>
            <p className="max-w-xl text-sm leading-6 text-slate-300">
              A public research workspace for following Wikidata entities, statements, references, and graph paths into a trustworthy evidence trail.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-medium text-slate-200">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
              AI disabled in public mode
            </span>
            <span className="rounded-full border border-slate-700 bg-white/5 px-3 py-1">Verified by CI</span>
          </div>
        </div>

        <nav aria-label="Footer navigation" className="grid gap-3 text-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Explore</p>
          <Link className="text-slate-300 transition-colors hover:text-white motion-reduce:transition-none" href="/">
            Home
          </Link>
          <Link className="text-slate-300 transition-colors hover:text-white motion-reduce:transition-none" href="/search?q=Q42">
            Q42 proof path
          </Link>
          <Link className="text-slate-300 transition-colors hover:text-white motion-reduce:transition-none" href="/docs">
            Documentation
          </Link>
        </nav>

        <div className="grid gap-4 text-sm">
          <div className="grid gap-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Project</p>
            <a
              className="inline-flex items-center gap-2 text-slate-300 transition-colors hover:text-white motion-reduce:transition-none"
              href="https://github.com/sundog358/wikidata-explorer"
              target="_blank"
              rel="noreferrer"
            >
              <Github className="h-4 w-4" />
              GitHub
              <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
              <span className="sr-only">opens in a new tab</span>
            </a>
            <Link className="text-slate-300 transition-colors hover:text-white motion-reduce:transition-none" href="/about">
              About
            </Link>
          </div>
          <div className="border-t border-slate-800 pt-4 text-sm text-slate-400">
            <p className="font-medium text-slate-200">Sun & Rain Works</p>
            <p>Copyright Sun & Rain Works 2026</p>
          </div>
        </div>

        <div className="flex justify-end">
          <Image
            src="/images/Wikidata_stamp.png"
            alt=""
            width={1061}
            height={886}
            aria-hidden="true"
            className="pointer-events-none h-20 w-auto opacity-90 sm:h-24 lg:h-28"
          />
        </div>
      </div>
    </footer>
  );
}
