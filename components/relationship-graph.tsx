"use client";

import { Network } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { WikidataItem, WikidataStatement } from "@/lib/wikidata";

type GraphNode = {
  id: string;
  label: string;
  property: string;
  kind: "item" | "property";
};

type RelationshipGraphProps = {
  item: WikidataItem;
  onEntityClick: (id: string) => void;
};

function entityLabel(item: WikidataItem): string {
  return item.labels.en || Object.values(item.labels)[0] || item.id;
}

function relationshipFromStatement(statement: WikidataStatement): GraphNode | null {
  const id = statement.value.content?.id;
  if (!id) return null;

  return {
    id,
    label: statement.value.content?.label || id,
    property: statement.property.label || statement.property.id,
    kind: id.startsWith("P") ? "property" : "item",
  };
}

function collectGraphNodes(item: WikidataItem): GraphNode[] {
  const seen = new Set<string>();
  const nodes: GraphNode[] = [];

  for (const statements of Object.values(item.statements)) {
    for (const statement of statements) {
      const node = relationshipFromStatement(statement);
      if (!node || seen.has(node.id)) continue;
      seen.add(node.id);
      nodes.push(node);
      if (nodes.length >= 14) return nodes;
    }
  }

  return nodes;
}

export function RelationshipGraph({ item, onEntityClick }: RelationshipGraphProps) {
  const nodes = collectGraphNodes(item);
  const center = { x: 50, y: 50 };
  const radius = 34;

  if (!nodes.length) {
    return (
      <div className="rounded-md border border-dashed border-slate-300 p-6 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300">
        No entity relationships were found in the first statement set for this record.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative min-h-[440px] overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" role="img" aria-label={`Relationship graph for ${entityLabel(item)}`}>
          <defs>
            <radialGradient id="graph-center" cx="50%" cy="50%" r="60%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.32" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx={center.x} cy={center.y} r="42" fill="url(#graph-center)" />
          {nodes.map((node, index) => {
            const angle = (index / nodes.length) * Math.PI * 2 - Math.PI / 2;
            const x = center.x + Math.cos(angle) * radius;
            const y = center.y + Math.sin(angle) * radius;

            return (
              <g key={node.id}>
                <line x1={center.x} y1={center.y} x2={x} y2={y} stroke="#94a3b8" strokeWidth="0.35" strokeDasharray="1.2 1.2" />
                <circle cx={x} cy={y} r="1.2" fill={node.kind === "property" ? "#10b981" : "#0284c7"} />
              </g>
            );
          })}
        </svg>

        <div className="absolute left-1/2 top-1/2 z-10 w-52 -translate-x-1/2 -translate-y-1/2 rounded-lg border border-sky-200 bg-sky-50 p-4 text-center shadow-sm dark:border-sky-900 dark:bg-sky-950">
          <Network className="mx-auto mb-2 h-5 w-5 text-sky-600 dark:text-sky-300" />
          <div className="text-sm font-semibold text-slate-950 dark:text-slate-50">{entityLabel(item)}</div>
          <Badge variant="secondary" className="mt-2">{item.id}</Badge>
        </div>

        {nodes.map((node, index) => {
          const angle = (index / nodes.length) * Math.PI * 2 - Math.PI / 2;
          const x = center.x + Math.cos(angle) * radius;
          const y = center.y + Math.sin(angle) * radius;

          return (
            <button
              key={node.id}
              type="button"
              onClick={() => onEntityClick(node.id)}
              className="absolute z-20 w-44 -translate-x-1/2 -translate-y-1/2 rounded-md border border-slate-200 bg-white p-2 text-left text-xs shadow-sm transition hover:border-sky-300 hover:bg-sky-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800"
              style={{ left: `${x}%`, top: `${y}%` }}
              title={`${node.property}: ${node.label}`}
            >
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="truncate font-medium text-slate-950 dark:text-slate-50">{node.label}</span>
                <Badge variant="outline">{node.id}</Badge>
              </div>
              <div className="truncate text-slate-500 dark:text-slate-400">{node.property}</div>
            </button>
          );
        })}
      </div>

      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        {nodes.slice(0, 6).map((node) => (
          <button
            key={node.id}
            type="button"
            onClick={() => onEntityClick(node.id)}
            className="rounded-md border border-slate-200 p-3 text-left text-sm hover:bg-sky-50 dark:border-slate-800 dark:hover:bg-slate-800"
          >
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="font-medium">{node.label}</span>
              <Badge variant="outline">{node.id}</Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">{node.property}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
