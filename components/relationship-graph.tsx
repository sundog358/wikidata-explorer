"use client";

import { useEffect, useMemo, useState } from "react";
import { FileText, Filter, GitBranch, Network, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  collectRelationshipGraphNodes,
  filterRelationshipGraphNodes,
  graphFocusFromNode,
  relationshipEvidenceSummary,
  graphPropertyOptions,
  relationshipGraphSummary,
} from "@/lib/relationship-graph-utils.mjs";
import type { WikidataItem, WikidataStatement } from "@/lib/wikidata";

type RelationshipGraphNode = {
  id: string;
  label: string;
  property: string;
  propertyId: string;
  sourceProperty: string;
  sourcePropertyId: string;
  kind: "item" | "property";
  rank: WikidataStatement["rank"];
  dataType: string | null;
  qualifierCount: number;
  referenceCount: number;
  depth: 1 | 2;
  source: "statement" | "qualifier" | "reference";
  statement: WikidataStatement;
};

export type RelationshipGraphFilters = {
  depth: "1" | "2" | "property";
  layout: "radial" | "property" | "timeline";
  kind: "all" | "item" | "property";
  rank: "all" | WikidataStatement["rank"];
  propertyId: string;
  evidence: "all" | "referenced" | "unreferenced" | "qualified";
};

type PositionedGraphNode = RelationshipGraphNode & {
  x: number;
  y: number;
  timelineLabel?: string;
};

type GraphNodeTerm = {
  label: string;
  description: string;
};

export type RelationshipGraphFocus = {
  id: string;
  label: string;
  property: string;
  propertyId: string;
  kind: "item" | "property";
  rank: WikidataStatement["rank"];
  dataType: string | null;
  qualifierCount: number;
  referenceCount: number;
  statementId: string | null;
  value: string;
  evidenceSummary?: {
    qualifiers: string[];
    references: string[];
    qualifierOverflow: number;
    referenceOverflow: number;
  };
};


type RelationshipGraphProps = {
  item: WikidataItem;
  onEntityClick: (id: string) => void;
  onGraphFocus?: (focus: RelationshipGraphFocus | null) => void;
  filters?: RelationshipGraphFilters;
  onFiltersChange?: (filters: RelationshipGraphFilters) => void;
  selectedNodeId?: string | null;
  onSelectedNodeIdChange?: (id: string | null) => void;
};

const CENTER = { x: 50, y: 50 };
const RADIUS = 34;
export const DEFAULT_RELATIONSHIP_GRAPH_FILTERS: RelationshipGraphFilters = {
  depth: "1",
  layout: "radial",
  kind: "all",
  rank: "all",
  propertyId: "all",
  evidence: "all",
};

function entityLabel(item: WikidataItem): string {
  return item.labels.en || Object.values(item.labels)[0] || item.id;
}

function rankClass(rank: WikidataStatement["rank"]) {
  if (rank === "preferred") return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200";
  if (rank === "deprecated") return "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-200";
  return "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300";
}

function evidenceLabel(node: RelationshipGraphNode) {
  const parts = [];
  if (node.qualifierCount) parts.push(`${node.qualifierCount} qualifier${node.qualifierCount === 1 ? "" : "s"}`);
  if (node.referenceCount) parts.push(`${node.referenceCount} reference${node.referenceCount === 1 ? "" : "s"}`);
  return parts.length ? parts.join(" · ") : "No qualifiers or references";
}

function graphNodeAriaLabel(node: PositionedGraphNode): string {
  const parts = [
    `${node.label} (${node.id})`,
    `relationship ${node.property} (${node.propertyId})`,
    `${node.rank} rank`,
    evidenceLabel(node),
  ];
  if (node.timelineLabel) parts.push(`timeline ${node.timelineLabel}`);
  return parts.join(", ");
}

function formatGraphValueText(value: WikidataStatement["value"]): string {
  const content = value?.content;
  if (value?.type === "somevalue") return "Unknown value";
  if (value?.type === "novalue") return "No value";
  if (!content) return "No displayable value";
  if (content.label || content.id) return [content.label, content.id].filter(Boolean).join(" ");
  if (content.time) return String(content.time).replace(/T.*Z$/, "").replace(/^\+/, "");
  if (content.amount) return `${content.amount}${content.unit && content.unit !== "1" ? ` ${content.unit}` : ""}`;
  if (content.latitude !== undefined && content.longitude !== undefined) return `${content.latitude}, ${content.longitude}`;
  if (content.value !== undefined) return String(content.value);
  return String(content);
}

function sourceLabel(source: RelationshipGraphNode["source"]) {
  if (source === "qualifier") return "Qualifier expansion";
  if (source === "reference") return "Reference expansion";
  return "Statement edge";
}

function comparePinnedRelationships(nodes: RelationshipGraphNode[]) {
  const propertyIds = new Set(nodes.map((node) => node.propertyId));
  const rankIds = new Set(nodes.map((node) => node.rank));
  const depthIds = new Set(nodes.map((node) => String(node.depth)));
  const totalReferences = nodes.reduce((sum, node) => sum + node.referenceCount, 0);
  const totalQualifiers = nodes.reduce((sum, node) => sum + node.qualifierCount, 0);
  const bestSupported = nodes.reduce<RelationshipGraphNode | null>((best, node) => {
    if (!best) return node;
    const nodeEvidence = node.referenceCount * 2 + node.qualifierCount;
    const bestEvidence = best.referenceCount * 2 + best.qualifierCount;
    return nodeEvidence > bestEvidence ? node : best;
  }, null);

  return {
    propertyCount: propertyIds.size,
    rankCount: rankIds.size,
    depthCount: depthIds.size,
    totalReferences,
    totalQualifiers,
    bestSupported,
  };
}

async function fetchGraphNodeTerms(ids: string[]): Promise<Record<string, GraphNodeTerm>> {
  const uniqueIds = Array.from(new Set(ids.filter((id) => /^[PQ]\d+$/.test(id)))).slice(0, 24);
  if (!uniqueIds.length) return {};

  const response = await fetch(
    `https://www.wikidata.org/w/api.php?${new URLSearchParams({
      action: "wbgetentities",
      ids: uniqueIds.join("|"),
      props: "labels|descriptions",
      languages: "en",
      languagefallback: "1",
      format: "json",
      origin: "*",
    })}`,
  );

  if (!response.ok) return {};

  const data = await response.json();
  return Object.fromEntries(
    Object.entries(data.entities || {}).map(([id, entity]: [string, any]) => [
      id,
      {
        label: entity?.labels?.en?.value || id,
        description: entity?.descriptions?.en?.value || "",
      },
    ]),
  );
}

function positionNodes(graphNodes: RelationshipGraphNode[]): PositionedGraphNode[] {
  return graphNodes.map((node, index) => {
    const angle = (index / graphNodes.length) * Math.PI * 2 - Math.PI / 2;
    return {
      ...node,
      x: CENTER.x + Math.cos(angle) * RADIUS,
      y: CENTER.y + Math.sin(angle) * RADIUS,
    };
  });
}

function positionNodesByProperty(graphNodes: RelationshipGraphNode[]): PositionedGraphNode[] {
  const propertyIds = Array.from(new Set(graphNodes.map((node) => node.sourcePropertyId || node.propertyId)));
  const columnCount = Math.max(1, propertyIds.length);
  const rowsByProperty = new Map(propertyIds.map((propertyId) => [propertyId, graphNodes.filter((node) => (node.sourcePropertyId || node.propertyId) === propertyId)]));

  return graphNodes.map((node) => {
    const propertyIndex = propertyIds.indexOf(node.sourcePropertyId || node.propertyId);
    const rows = rowsByProperty.get(node.sourcePropertyId || node.propertyId) || [node];
    const rowIndex = rows.findIndex((row) => row.id === node.id);
    const x = columnCount === 1 ? 50 : 18 + (propertyIndex / Math.max(1, columnCount - 1)) * 64;
    const y = rows.length === 1 ? 50 : 18 + (rowIndex / Math.max(1, rows.length - 1)) * 64;

    return {
      ...node,
      x,
      y,
    };
  });
}

function yearFromWikidataTime(value: unknown): number | null {
  const match = String(value || "").match(/^([+-]?\d{1,})/);
  if (!match) return null;
  const year = Number(match[1]);
  return Number.isFinite(year) ? year : null;
}

function timelineYearFromNode(node: RelationshipGraphNode): number | null {
  const directYear = yearFromWikidataTime(node.statement?.value?.content?.time);
  if (directYear !== null) return directYear;

  for (const qualifier of node.statement?.qualifiers || []) {
    const qualifierYear = yearFromWikidataTime(qualifier?.value?.content?.time);
    if (qualifierYear !== null) return qualifierYear;
  }

  for (const reference of node.statement?.references || []) {
    for (const part of reference.parts || []) {
      const referenceYear = yearFromWikidataTime(part?.value?.content?.time);
      if (referenceYear !== null) return referenceYear;
    }
  }

  return null;
}

function formatTimelineYear(year: number): string {
  if (year < 0) return `${Math.abs(year)} BCE`;
  return String(year);
}

function positionNodesByTimeline(graphNodes: RelationshipGraphNode[]): PositionedGraphNode[] {
  const indexedNodes = graphNodes.map((node, index) => ({ node, index, year: timelineYearFromNode(node) }));
  const orderedNodes = indexedNodes.sort((a, b) => {
    if (a.year === null && b.year === null) return a.index - b.index;
    if (a.year === null) return 1;
    if (b.year === null) return -1;
    return a.year - b.year || a.index - b.index;
  });
  const columnCount = Math.min(4, Math.max(1, orderedNodes.length));
  const rowCount = Math.ceil(orderedNodes.length / columnCount);
  const positioned = new Map<string, PositionedGraphNode>();

  orderedNodes.forEach((item, orderedIndex) => {
    const columnIndex = orderedIndex % columnCount;
    const rowIndex = Math.floor(orderedIndex / columnCount);
    const x = columnCount === 1 ? 50 : 16 + (columnIndex / Math.max(1, columnCount - 1)) * 68;
    const y = rowCount === 1 ? 50 : 18 + (rowIndex / Math.max(1, rowCount - 1)) * 64;
    positioned.set(item.node.id, {
      ...item.node,
      x,
      y,
      timelineLabel: item.year === null ? "Undated" : formatTimelineYear(item.year),
    });
  });

  return graphNodes.map((node) => positioned.get(node.id) || { ...node, x: 50, y: 50, timelineLabel: "Undated" });
}

function SelectControl({
  id,
  label,
  value,
  children,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  children: React.ReactNode;
  onChange: (value: string) => void;
}) {
  return (
    <label htmlFor={id} className="grid min-w-0 gap-1 text-xs font-medium text-slate-600 dark:text-slate-300">
      <span>{label}</span>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 w-full min-w-0 truncate rounded-md border border-slate-200 bg-white px-2 pr-8 text-sm text-slate-950 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50"
      >
        {children}
      </select>
    </label>
  );
}

export function RelationshipGraph({ item, onEntityClick, onGraphFocus, filters: controlledFilters, onFiltersChange, selectedNodeId: controlledSelectedNodeId, onSelectedNodeIdChange }: RelationshipGraphProps) {
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [internalSelectedNodeId, setInternalSelectedNodeId] = useState<string | null>(null);
  const [internalFilters, setInternalFilters] = useState(DEFAULT_RELATIONSHIP_GRAPH_FILTERS);
  const [nodeTerms, setNodeTerms] = useState<Record<string, GraphNodeTerm>>({});
  const [pinnedNodes, setPinnedNodes] = useState<RelationshipGraphNode[]>([]);
  const selectedNodeId = controlledSelectedNodeId ?? internalSelectedNodeId;
  const filters = controlledFilters || internalFilters;
  const allNodes = useMemo(() => collectRelationshipGraphNodes(item), [item]);
  const matchingNodes = useMemo(() => filterRelationshipGraphNodes(allNodes, filters), [allNodes, filters]);
  const visibleNodeLimit = filters.depth === "1" ? 14 : 24;
  const nodes = useMemo(() => {
    const visibleNodes = matchingNodes.slice(0, visibleNodeLimit);
    if (filters.layout === "property") return positionNodesByProperty(visibleNodes);
    if (filters.layout === "timeline") return positionNodesByTimeline(visibleNodes);
    return positionNodes(visibleNodes);
  }, [filters.layout, matchingNodes, visibleNodeLimit]);
  const propertyOptions = useMemo(() => graphPropertyOptions(allNodes), [allNodes]);
  const selectedNode = nodes.find((node) => node.id === selectedNodeId) || null;
  const selectedEvidenceSummary = selectedNode ? relationshipEvidenceSummary(selectedNode) : null;
  const hoveredNode = nodes.find((node) => node.id === hoveredNodeId) || null;
  const previewNode = hoveredNode || selectedNode;
  const hasActiveFilters = Object.entries(filters).some(([key, value]) => DEFAULT_RELATIONSHIP_GRAPH_FILTERS[key as keyof typeof DEFAULT_RELATIONSHIP_GRAPH_FILTERS] !== value);
  const pinnedComparison = useMemo(() => comparePinnedRelationships(pinnedNodes), [pinnedNodes]);
  const graphDescriptionId = `${item.id}-relationship-graph-description`;

  function setSelectedGraphNodeId(nextId: string | null) {
    if (onSelectedNodeIdChange) {
      onSelectedNodeIdChange(nextId);
    } else {
      setInternalSelectedNodeId(nextId);
    }
  }

  function selectNode(node: RelationshipGraphNode | null) {
    setSelectedGraphNodeId(node?.id || null);
  }

  function pinNode(node: RelationshipGraphNode) {
    setPinnedNodes((current) => [node, ...current.filter((item) => item.id !== node.id)].slice(0, 6));
  }

  useEffect(() => {
    onGraphFocus?.(selectedNode ? graphFocusFromNode(selectedNode) : null);
  }, [onGraphFocus, selectedNode]);

  useEffect(() => {
    let cancelled = false;
    const ids = nodes.map((node) => node.id);

    fetchGraphNodeTerms(ids)
      .then((terms) => {
        if (!cancelled) setNodeTerms(terms);
      })
      .catch(() => {
        if (!cancelled) setNodeTerms({});
      });

    return () => {
      cancelled = true;
    };
  }, [nodes]);

  function setGraphFilters(nextFilters: RelationshipGraphFilters) {
    if (onFiltersChange) {
      onFiltersChange(nextFilters);
    } else {
      setInternalFilters(nextFilters);
    }
  }

  function updateFilter<Key extends keyof Required<RelationshipGraphFilters>>(key: Key, value: Required<RelationshipGraphFilters>[Key]) {
    setGraphFilters({ ...filters, [key]: value });
    setHoveredNodeId(null);
    selectNode(null);
  }

  const selectedTerm = selectedNode ? nodeTerms[selectedNode.id] : null;

  if (!allNodes.length) {
    return (
      <div className="rounded-md border border-dashed border-slate-300 p-6 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300">
        No entity relationships were found in the first statement set for this record.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950" data-testid="graph-filters">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-950 dark:text-slate-50">
              <Filter className="h-4 w-4 text-sky-600 dark:text-sky-300" />
              Graph filters
            </div>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300" data-testid="graph-filter-summary" aria-live="polite">
              {relationshipGraphSummary(item, allNodes, matchingNodes)} {matchingNodes.length > nodes.length ? `Showing the first ${nodes.length} matching nodes.` : ""}
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" className="shrink-0 gap-2" aria-label="Clear graph filters" data-testid="clear-graph-filters" onClick={() => {
            setGraphFilters(DEFAULT_RELATIONSHIP_GRAPH_FILTERS);
            selectNode(null);
          }} disabled={!hasActiveFilters}>
            <RotateCcw className="h-4 w-4" />
            Clear
          </Button>
        </div>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,10rem),1fr))] gap-3">
          <SelectControl id="graph-depth-filter" label="Depth" value={filters.depth} onChange={(value) => updateFilter("depth", value as Required<RelationshipGraphFilters>["depth"])}>
            <option value="1">1-hop statements</option>
            <option value="2">2-hop evidence</option>
            <option value="property">Selected property</option>
          </SelectControl>
          <SelectControl id="graph-layout-filter" label="Layout" value={filters.layout} onChange={(value) => updateFilter("layout", value as Required<RelationshipGraphFilters>["layout"])}>
            <option value="radial">Radial</option>
            <option value="property">Grouped by property</option>
            <option value="timeline">Timeline evidence</option>
          </SelectControl>
          <SelectControl id="graph-kind-filter" label="Target type" value={filters.kind} onChange={(value) => updateFilter("kind", value as Required<RelationshipGraphFilters>["kind"])}>
            <option value="all">All targets</option>
            <option value="item">Items only</option>
            <option value="property">Properties only</option>
          </SelectControl>
          <SelectControl id="graph-rank-filter" label="Rank" value={filters.rank} onChange={(value) => updateFilter("rank", value as Required<RelationshipGraphFilters>["rank"])}>
            <option value="all">All ranks</option>
            <option value="preferred">Preferred</option>
            <option value="normal">Normal</option>
            <option value="deprecated">Deprecated</option>
          </SelectControl>
          <SelectControl id="graph-property-filter" label="Relationship" value={filters.propertyId} onChange={(value) => updateFilter("propertyId", value)}>
            <option value="all">All relationships</option>
            {propertyOptions.map((property) => (
              <option key={property.id} value={property.id}>{property.label} ({property.id})</option>
            ))}
          </SelectControl>
          <SelectControl id="graph-evidence-filter" label="Evidence" value={filters.evidence} onChange={(value) => updateFilter("evidence", value as Required<RelationshipGraphFilters>["evidence"])}>
            <option value="all">All evidence</option>
            <option value="referenced">Referenced</option>
            <option value="unreferenced">Unreferenced</option>
            <option value="qualified">Has qualifiers</option>
          </SelectControl>
        </div>
      </div>

      {!nodes.length ? (
        <div className="rounded-md border border-dashed border-slate-300 p-6 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300">
          No relationships match the current filters.
        </div>
      ) : (
        <>
          <div className={`relative overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 ${filters.layout === "timeline" ? "min-h-[560px]" : "min-h-[440px]"}`}>
            <p id={graphDescriptionId} className="sr-only">
              Relationship graph nodes are focusable buttons. Focus a node to preview its statement evidence, or activate it to open that linked entity.
            </p>
            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" role="img" aria-label={`Relationship graph for ${entityLabel(item)}`} aria-describedby={graphDescriptionId}>
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
                      strokeDasharray={filters.layout === "radial" ? "1.2 1.2" : "0.8 1.4"}
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
                  onFocus={() => selectNode(node)}
                  onMouseEnter={() => setHoveredNodeId(node.id)}
                  onMouseLeave={() => setHoveredNodeId(null)}
                  aria-label={graphNodeAriaLabel(node)}
                  data-testid={`graph-node-${node.id}`}
                  className={`absolute ${filters.layout === "timeline" ? "w-40" : "w-44"} -translate-x-1/2 -translate-y-1/2 rounded-md border bg-white p-2 text-left text-xs shadow-sm transition motion-reduce:transition-none hover:border-sky-300 hover:bg-sky-50 dark:bg-slate-900 dark:hover:bg-slate-800 ${
                    selected || node.id === hoveredNodeId ? "z-30" : "z-20"
                  } ${
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
                  {filters.layout === "timeline" && node.timelineLabel && (
                    <div className="mt-1 text-[10px] font-medium text-slate-500 dark:text-slate-400">{node.timelineLabel}</div>
                  )}
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
                <p className="mt-1 text-slate-500 dark:text-slate-400">{sourceLabel(previewNode.source)}</p>
                {nodeTerms[previewNode.id]?.description && (
                  <p className="mt-2 line-clamp-2 text-slate-600 dark:text-slate-300" data-testid="graph-node-preview-description">
                    {nodeTerms[previewNode.id].description}
                  </p>
                )}
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
                      {entityLabel(item)} {"->"} {selectedNode.label}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{selectedNode.propertyId}</Badge>
                    <Badge variant="secondary">{selectedNode.depth}-hop</Badge>
                    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${rankClass(selectedNode.rank)}`}>{selectedNode.rank}</span>
                    <Button type="button" variant="outline" size="sm" onClick={() => pinNode(selectedNode)} data-testid="pin-graph-relationship">
                      Pin
                    </Button>
                  </div>
                </div>
                <div className="grid gap-3 text-sm md:grid-cols-3">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Property</div>
                    <div className="mt-1 text-slate-950 dark:text-slate-50">{selectedNode.property}</div>
                    {selectedNode.sourcePropertyId !== selectedNode.propertyId && (
                      <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">From {selectedNode.sourceProperty} ({selectedNode.sourcePropertyId})</div>
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Target</div>
                    <button type="button" className="mt-1 text-left font-medium text-sky-700 hover:text-sky-900 dark:text-sky-300 dark:hover:text-sky-100" onClick={() => onEntityClick(selectedNode.id)}>
                      {selectedNode.label} <span className="text-xs text-slate-500">{selectedNode.id}</span>
                    </button>
                    {selectedTerm?.description && (
                      <div className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400" data-testid="selected-graph-node-description">
                        {selectedTerm.description}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Evidence</div>
                    <div className="mt-1 text-slate-700 dark:text-slate-200">{evidenceLabel(selectedNode)}</div>
                  </div>
                </div>

                <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-800 dark:bg-slate-900" data-testid="graph-statement-detail-drawer">
                  <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2 font-semibold text-slate-950 dark:text-slate-50">
                        <FileText className="h-4 w-4 text-sky-600 dark:text-sky-300" />
                        Statement detail drawer
                      </div>
                      <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                        Full context for the selected edge, including source depth, statement ID, value, qualifiers, and references.
                      </p>
                    </div>
                    <Badge variant="outline">{sourceLabel(selectedNode.source)}</Badge>
                  </div>

                  <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-md border border-slate-200 bg-white p-2 dark:border-slate-800 dark:bg-slate-950">
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Statement ID</div>
                      <div className="mt-1 break-all text-slate-800 dark:text-slate-100">{selectedNode.statement.id || "Not provided"}</div>
                    </div>
                    <div className="rounded-md border border-slate-200 bg-white p-2 dark:border-slate-800 dark:bg-slate-950">
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Value</div>
                      <div className="mt-1 text-slate-800 dark:text-slate-100">{formatGraphValueText(selectedNode.statement.value)}</div>
                    </div>
                    <div className="rounded-md border border-slate-200 bg-white p-2 dark:border-slate-800 dark:bg-slate-950">
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Data type</div>
                      <div className="mt-1 text-slate-800 dark:text-slate-100">{selectedNode.dataType || "unknown"}</div>
                    </div>
                    <div className="rounded-md border border-slate-200 bg-white p-2 dark:border-slate-800 dark:bg-slate-950">
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Context</div>
                      <div className="mt-1 text-slate-800 dark:text-slate-100">{selectedNode.depth}-hop via {selectedNode.sourcePropertyId}</div>
                    </div>
                  </div>

                  <div className="mt-3 grid gap-3 lg:grid-cols-2">
                    <div className="rounded-md border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950">
                      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Qualifiers</div>
                      {selectedNode.statement.qualifiers.length ? (
                        <div className="space-y-2">
                          {selectedNode.statement.qualifiers.map((qualifier, index) => (
                            <div key={`${selectedNode.statement.id}-drawer-qualifier-${index}`} className="grid gap-1 rounded border border-slate-100 p-2 dark:border-slate-800 sm:grid-cols-[150px_1fr]">
                              <div className="text-xs text-slate-500 dark:text-slate-400">{qualifier.property.label || qualifier.property.id}</div>
                              <div className="text-slate-800 dark:text-slate-100">{formatGraphValueText(qualifier.value)}</div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-slate-600 dark:text-slate-300">No qualifiers on this statement.</p>
                      )}
                    </div>

                    <div className="rounded-md border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950">
                      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">References</div>
                      {selectedNode.statement.references.length ? (
                        <div className="space-y-2">
                          {selectedNode.statement.references.map((reference, referenceIndex) => (
                            <div key={reference.hash || `${selectedNode.statement.id}-drawer-reference-${referenceIndex}`} className="rounded border border-slate-100 p-2 dark:border-slate-800">
                              <div className="mb-2 text-xs text-slate-500 dark:text-slate-400">Reference {referenceIndex + 1}</div>
                              <div className="space-y-1">
                                {reference.parts.map((part, partIndex) => (
                                  <div key={`${reference.hash || referenceIndex}-drawer-part-${partIndex}`} className="grid gap-1 sm:grid-cols-[150px_1fr]">
                                    <div className="text-xs text-slate-500 dark:text-slate-400">{part.property.label || part.property.id}</div>
                                    <div className="break-words text-slate-800 dark:text-slate-100">{formatGraphValueText(part.value)}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-slate-600 dark:text-slate-300">No references on this statement.</p>
                      )}
                    </div>
                  </div>
                </div>

                {selectedEvidenceSummary && (selectedEvidenceSummary.qualifiers.length > 0 || selectedEvidenceSummary.references.length > 0) && (
                  <div className="mt-4 grid gap-3 text-sm lg:grid-cols-2" data-testid="graph-edge-evidence-summary">
                    {selectedEvidenceSummary.qualifiers.length > 0 && (
                      <div className="rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
                        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Qualifiers</div>
                        <ul className="space-y-1 text-slate-700 dark:text-slate-200">
                          {selectedEvidenceSummary.qualifiers.map((qualifier: string) => (
                            <li key={qualifier}>{qualifier}</li>
                          ))}
                          {selectedEvidenceSummary.qualifierOverflow > 0 && <li className="text-slate-500 dark:text-slate-400">+{selectedEvidenceSummary.qualifierOverflow} more</li>}
                        </ul>
                      </div>
                    )}
                    {selectedEvidenceSummary.references.length > 0 && (
                      <div className="rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
                        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">References</div>
                        <ul className="space-y-1 text-slate-700 dark:text-slate-200">
                          {selectedEvidenceSummary.references.map((reference: string) => (
                            <li key={reference}>{reference}</li>
                          ))}
                          {selectedEvidenceSummary.referenceOverflow > 0 && <li className="text-slate-500 dark:text-slate-400">+{selectedEvidenceSummary.referenceOverflow} more</li>}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
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
                onClick={() => selectNode(node)}
                onDoubleClick={() => onEntityClick(node.id)}
                data-testid={`graph-focus-${node.id}`}
                className="rounded-md border border-slate-200 p-3 text-left text-sm hover:bg-sky-50 dark:border-slate-800 dark:hover:bg-slate-800"
              >
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="font-medium">{node.label}</span>
                  <Badge variant="outline">{node.id}</Badge>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">{node.property}</p>
                {nodeTerms[node.id]?.description && (
                  <p className="mt-2 line-clamp-2 text-xs text-slate-600 dark:text-slate-300">{nodeTerms[node.id].description}</p>
                )}
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{evidenceLabel(node)}</p>
              </button>
            ))}
          </div>

          {pinnedNodes.length > 0 && (
            <div className="rounded-md border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950" data-testid="pinned-relationship-history">
              <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="text-sm font-semibold text-slate-950 dark:text-slate-50">Pinned relationship history</div>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    Keep important edges visible while comparing graph paths or moving between tabs.
                  </p>
                </div>
                <Button type="button" variant="outline" size="sm" aria-label="Clear pinned relationship history" data-testid="clear-pinned-relationships" onClick={() => setPinnedNodes([])}>
                  Clear pins
                </Button>
              </div>
              <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                {pinnedNodes.map((node) => (
                  <button
                    key={node.id}
                    type="button"
                    onClick={() => selectNode(node)}
                    onDoubleClick={() => onEntityClick(node.id)}
                    className="rounded-md border border-slate-200 p-3 text-left text-sm hover:bg-sky-50 dark:border-slate-800 dark:hover:bg-slate-800"
                  >
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <span className="font-medium text-slate-950 dark:text-slate-50">{entityLabel(item)} {"->"} {node.label}</span>
                      <Badge variant="outline">{node.id}</Badge>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{node.property} ({node.propertyId})</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      <Badge variant="secondary">{node.depth}-hop</Badge>
                      <Badge variant="outline">{node.referenceCount} ref</Badge>
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900" data-testid="pinned-relationship-comparison">
                <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="text-sm font-semibold text-slate-950 dark:text-slate-50">Pinned comparison</div>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                      Compare pinned edges by relationship, rank, depth, and evidence strength.
                    </p>
                  </div>
                  <Badge variant="secondary">{pinnedNodes.length} edge{pinnedNodes.length === 1 ? "" : "s"}</Badge>
                </div>
                <div className="grid gap-2 text-sm md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-md border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Relationships</div>
                    <div className="mt-1 text-lg font-semibold text-slate-950 dark:text-slate-50">{pinnedComparison.propertyCount}</div>
                  </div>
                  <div className="rounded-md border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Ranks</div>
                    <div className="mt-1 text-lg font-semibold text-slate-950 dark:text-slate-50">{pinnedComparison.rankCount}</div>
                  </div>
                  <div className="rounded-md border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Evidence</div>
                    <div className="mt-1 text-lg font-semibold text-slate-950 dark:text-slate-50">{pinnedComparison.totalReferences} ref / {pinnedComparison.totalQualifiers} qual</div>
                  </div>
                  <div className="rounded-md border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Strongest edge</div>
                    <div className="mt-1 truncate text-sm font-semibold text-slate-950 dark:text-slate-50">{pinnedComparison.bestSupported?.label || "None"}</div>
                  </div>
                </div>
                {pinnedNodes.length < 2 && (
                  <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                    Pin another relationship to compare evidence and rank differences side by side.
                  </p>
                )}
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full min-w-[720px] text-left text-sm">
                    <thead className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      <tr>
                        <th className="border-b border-slate-200 px-2 py-2 dark:border-slate-800">Edge</th>
                        <th className="border-b border-slate-200 px-2 py-2 dark:border-slate-800">Relationship</th>
                        <th className="border-b border-slate-200 px-2 py-2 dark:border-slate-800">Rank</th>
                        <th className="border-b border-slate-200 px-2 py-2 dark:border-slate-800">Depth</th>
                        <th className="border-b border-slate-200 px-2 py-2 dark:border-slate-800">Evidence</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pinnedNodes.map((node) => (
                        <tr key={`${node.id}-${node.statement.id}`} className="text-slate-700 dark:text-slate-200">
                          <td className="border-b border-slate-200 px-2 py-2 dark:border-slate-800">
                            <button type="button" onClick={() => selectNode(node)} className="font-medium text-sky-700 hover:text-sky-900 dark:text-sky-300 dark:hover:text-sky-100">
                              {entityLabel(item)} {"->"} {node.label}
                            </button>
                          </td>
                          <td className="border-b border-slate-200 px-2 py-2 dark:border-slate-800">{node.property} ({node.propertyId})</td>
                          <td className="border-b border-slate-200 px-2 py-2 dark:border-slate-800">{node.rank}</td>
                          <td className="border-b border-slate-200 px-2 py-2 dark:border-slate-800">{node.depth}-hop {sourceLabel(node.source).toLowerCase()}</td>
                          <td className="border-b border-slate-200 px-2 py-2 dark:border-slate-800">{node.referenceCount} ref / {node.qualifierCount} qual</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
