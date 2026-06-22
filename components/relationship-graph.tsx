"use client";

import { useMemo, useState } from "react";
import { GitBranch, Network } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { WikidataItem, WikidataStatement } from "@/lib/wikidata";

type GraphNode = {
  id: string;
  label: string;
  property: string;
  propertyId: string;
  kind: "item" | "property";
  rank: WikidataStatement["rank"];
  dataType: string | null;
  qualifierCount: number;
  referenceCount: number;
  statement: WikidataStatement;
};

type PositionedGraphNode = GraphNode & {
  x: number;
  y: number;
};

type RelationshipGraphProps = {
  item: WikidataItem;
  onEntityClick: (id: string) => void;
};

const CENTER = { x: 50, y: 50 };
const RADIUS = 34;

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
    propertyId: statement.property.id,
    kind: id.startsWith("P") ? "property" : "item",
    rank: statement.rank,
    dataType: statement.property.data_type,
    qualifierCount: statement.qualifiers.length,
    referenceCount: statement.references.length,
    statement,
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

function rankClass(rank: WikidataStatement["rank"]) {
  if (rank === "preferred") return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200";
  if (rank === "deprecated") return "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-200";
  return "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300";
}

function evidenceLabel(node: GraphNode) {
  const parts = [];
  if (node.qualifierCount) parts.push(`${node.qualifierCount} qualifier${node.qualifierCount === 1 ? "" : "s"}`);
  if (node.referenceCount) parts.push(`${node.referenceCount} reference${node.referenceCount === 1 ? "" : "s"}`);
  return parts.length ? parts.join(" · ") : "No qualifiers or references";
}

function positionNodes(item: WikidataItem): PositionedGraphNode[] {
  const graphNodes = collectGraphNodes(item);

  return graphNodes.map((node, index) => {
    const angle = (index / graphNodes.length) * Math.PI * 2 - Math.PI / 2;
    return {
      ...node,
      x: CENTER.x + Math.cos(angle) * RADIUS,
      y: CENTER.y + Math.sin(angle) * RADIUS,
    };
  });
}

export function RelationshipGraph({ item, onEntityClick }: RelationshipGraphProps) {
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const nodes = useMemo(() => positionNodes(item), [item]);
  const selectedNode = nodes.find((node) => node.id === selectedNodeId) || null;
  const hoveredNode = nodes.find((node) => node.id === hoveredNodeId) || null;
  const previewNode = hoveredNode || selectedNode;

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
          <circle cx={CENTER.x} cy={CENTER.y} r="42" fill="url(#graph-center)" />
          {nodes.map((node) => {
            const active = node.id === selectedNodeId || node.id === hoveredNodeId;
            return (
              <g key={node.id}>
                <line
                  x1={CENTER.x}
                  y1={CENTER.y}
                  x2={node.x}
                  y2={node.y}
                  stroke={active ? "#0284c7" : "#94a3b8"}
                  strokeWidth={active ? "0.55" : "0.35"}
                  strokeDasharray="1.2 1.2"
                />
                <circle cx={node.x} cy={node.y} r={active ? "1.7" : "1.2"} fill={node.kind === "property" ? "#10b981" : "#0284c7"} />
              </g>
            );
          })}
        </svg>

        <div className="absolute left-1/2 top-1/2 z-10 w-52 -translate-x-1/2 -translate-y-1/2 rounded-lg border border-sky-200 bg-sky-50 p-4 text-center shadow-sm dark:border-sky-900 dark:bg-sky-950">
          <Network className="mx-auto mb-2 h-5 w-5 text-sky-600 dark:text-sky-300" />
          <div className="text-sm font-semibold text-slate-950 dark:text-slate-50">{entityLabel(item)}</div>
          <Badge variant="secondary" className="mt-2">{item.id}</Badge>
        </div>

        {nodes.map((node) => {
          const selected = node.id === selectedNodeId;
          return (
            <button
              key={node.id}
              type="button"
              onClick={() => onEntityClick(node.id)}
              onFocus={() => setSelectedNodeId(node.id)}
              onMouseEnter={() => setHoveredNodeId(node.id)}
              onMouseLeave={() => setHoveredNodeId(null)}
              className={`absolute z-20 w-44 -translate-x-1/2 -translate-y-1/2 rounded-md border bg-white p-2 text-left text-xs shadow-sm transition hover:border-sky-300 hover:bg-sky-50 dark:bg-slate-900 dark:hover:bg-slate-800 ${
                selected ? "border-sky-400 ring-2 ring-sky-100 dark:border-sky-700 dark:ring-sky-950" : "border-slate-200 dark:border-slate-800"
              }`}
              style={{ left: `${node.x}%`, top: `${node.y}%` }}
              title={`${node.property}: ${node.label}`}
            >
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="truncate font-medium text-slate-950 dark:text-slate-50">{node.label}</span>
                <Badge variant="outline">{node.id}</Badge>
              </div>
              <div className="truncate text-slate-500 dark:text-slate-400">{node.property}</div>
              <div className="mt-1 flex items-center gap-1 text-[10px] uppercase tracking-wide text-slate-400">
                <GitBranch className="h-3 w-3" />
                {node.rank}
              </div>
            </button>
          );
        })}

        {previewNode && (
          <div
            className="pointer-events-none absolute z-30 w-64 rounded-md border border-slate-200 bg-white p-3 text-xs shadow-lg dark:border-slate-800 dark:bg-slate-900"
            style={{
              left: `${Math.min(Math.max(previewNode.x, 18), 82)}%`,
              top: `${previewNode.y < 50 ? Math.min(previewNode.y + 13, 76) : Math.max(previewNode.y - 13, 24)}%`,
              transform: "translate(-50%, -50%)",
            }}
          >
            <div className="mb-2 flex items-start justify-between gap-2">
              <div>
                <div className="font-semibold text-slate-950 dark:text-slate-50">{previewNode.label}</div>
                <div className="text-slate-500 dark:text-slate-400">{previewNode.property}</div>
              </div>
              <Badge variant="outline">{previewNode.id}</Badge>
            </div>
            <div className="flex flex-wrap gap-1">
              <span className={`rounded-full border px-2 py-0.5 ${rankClass(previewNode.rank)}`}>{previewNode.rank}</span>
              <span className="rounded-full border border-slate-200 px-2 py-0.5 text-slate-600 dark:border-slate-800 dark:text-slate-300">
                {previewNode.dataType || "unknown type"}
              </span>
            </div>
            <p className="mt-2 text-slate-600 dark:text-slate-300">{evidenceLabel(previewNode)}</p>
          </div>
        )}
      </div>

      <div className="rounded-md border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950" data-testid="graph-edge-detail">
        {selectedNode ? (
          <>
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="text-sm font-semibold text-slate-950 dark:text-slate-50">Selected relationship</div>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {entityLabel(item)} → {selectedNode.label}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{selectedNode.propertyId}</Badge>
                <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${rankClass(selectedNode.rank)}`}>{selectedNode.rank}</span>
              </div>
            </div>
            <div className="grid gap-3 text-sm md:grid-cols-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Property</div>
                <div className="mt-1 text-slate-950 dark:text-slate-50">{selectedNode.property}</div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Target</div>
                <button type="button" className="mt-1 text-left font-medium text-sky-700 hover:text-sky-900 dark:text-sky-300 dark:hover:text-sky-100" onClick={() => onEntityClick(selectedNode.id)}>
                  {selectedNode.label} <span className="text-xs text-slate-500">{selectedNode.id}</span>
                </button>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Evidence</div>
                <div className="mt-1 text-slate-700 dark:text-slate-200">{evidenceLabel(selectedNode)}</div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-sm text-slate-600 dark:text-slate-300">
            Hover a graph node for a quick preview, or choose a relationship below to inspect its edge details.
          </div>
        )}
      </div>

      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        {nodes.slice(0, 6).map((node) => (
          <button
            key={node.id}
            type="button"
            onClick={() => setSelectedNodeId(node.id)}
            onDoubleClick={() => onEntityClick(node.id)}
            className="rounded-md border border-slate-200 p-3 text-left text-sm hover:bg-sky-50 dark:border-slate-800 dark:hover:bg-slate-800"
          >
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="font-medium">{node.label}</span>
              <Badge variant="outline">{node.id}</Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">{node.property}</p>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{evidenceLabel(node)}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
