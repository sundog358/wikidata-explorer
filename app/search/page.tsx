"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { BrainCircuit, Database, FileAudio, FileText, FileVideo, GitCompareArrows, Globe, Image as ImageIcon, Info, MessageSquare, Network, Search, ShieldCheck, Sparkles } from "lucide-react";
import { buildQuickStatementsReviewDraft, buildReviewMarkdownExport } from "@/lib/curation-export.mjs";
import { buildGraphPathJsonExport, buildGraphPathMarkdownExport } from "@/lib/graph-path-export.mjs";
import { buildEntityComparison, buildEntityComparisonJsonExport, buildEntityComparisonMarkdownExport, buildEntitySetComparison, buildEntitySetComparisonJsonExport, buildEntitySetComparisonMarkdownExport } from "@/lib/entity-comparison.mjs";
import { sourceHintKindLabel, sourceHintsFromStatement } from "@/lib/review-source-hints.mjs";
import { summarizeEntityDataQuality } from "@/lib/data-quality.mjs";
import { readSearchWorkbenchState, writeSearchWorkbenchState } from "@/lib/search-url-state.mjs";
import { evaluateAutonomyAction } from "@/lib/autonomy-safety.mjs";
import { AG2_CHAT_CONTEXT_STORAGE_KEY, sanitizeChatVisibleContext } from "@/lib/ag2-chat-context.mjs";
import { aiAgentsEnabled, AI_DISABLED_MESSAGE } from "@/lib/ai-feature-flags.mjs";
import { searchWikidata, WikidataClient, type WikidataItem, type WikidataLanguage, type WikidataMediaInfo, type WikidataStatement } from "@/lib/wikidata";
import { RelationshipGraph, type RelationshipGraphFilters, type RelationshipGraphFocus } from "@/components/relationship-graph";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type LinkedData = {
  items: Array<{ id: string; label: string }>;
  properties: Array<{ id: string; label: string }>;
};

type AiSummaryState = {
  entityId: string;
  summary: string;
} | null;

type AgentAction = "research" | "graph" | "suggest" | "verify" | "compare" | "report";
type SearchWorkbenchTab = "graph" | "compare" | "statements" | "aliases" | "media" | "languages" | "links" | "agent-runs" | "review";
type ShareableExportView = "graph-markdown" | "graph-json" | "comparison-markdown" | "comparison-json";

type AgentSafetyState = {
  decisionLabel: string;
  risk: string;
  modeLabel: string;
  reasons: string[];
  requiredControls: string[];
};

type AgentResultState = {
  entityId: string;
  action: AgentAction;
  title: string;
  result: string;
  safety?: AgentSafetyState;
  graphFocus?: RelationshipGraphFocus;
} | null;

type SavedAgentRun = {
  id: string;
  entityId: string;
  entityLabel: string;
  action: AgentAction;
  title: string;
  result: string;
  safety?: AgentSafetyState;
  compareEntityId?: string;
  graphFocus?: RelationshipGraphFocus;
  createdAt: string;
};

type DraftSafetyState = {
  allowed: boolean;
  decisionLabel: string;
  risk: string;
  modeLabel: string;
  reasons: string[];
  requiredControls: string[];
};

type ReviewTaskStatus = "needs_review" | "checking_sources" | "ready_to_draft" | "resolved";
type ReviewSourceHint = ReturnType<typeof sourceHintsFromStatement>[number];

type ReviewQueueItem = {
  id: string;
  entityId: string;
  propertyId: string;
  propertyLabel: string;
  statementId: string;
  severity: "medium" | "high";
  title: string;
  detail: string;
  value: string;
  sourceHints: ReviewSourceHint[];
};

type ReviewQueueItemWithStatus = ReviewQueueItem & {
  status: ReviewTaskStatus;
  statusLabel: string;
};

type RunSearchOptions = {
  graphFocusId?: string | null;
};

function normalizeShareableExportView(value: unknown): ShareableExportView | null {
  return value === "graph-markdown" || value === "graph-json" || value === "comparison-markdown" || value === "comparison-json" ? value : null;
}

const AGENT_RUNS_STORAGE_KEY = "wikidata-explorer.agentRuns.v1";
const DISMISSED_REVIEW_STORAGE_KEY = "wikidata-explorer.dismissedReviewItems.v1";
const REVIEW_TASK_STATUS_STORAGE_KEY = "wikidata-explorer.reviewTaskStatus.v1";

const AI_AGENTS_ENABLED = aiAgentsEnabled({
  NEXT_PUBLIC_ENABLE_AI_AGENTS: process.env.NEXT_PUBLIC_ENABLE_AI_AGENTS,
});

const Q42_PROOF_GRAPH_FILTERS: RelationshipGraphFilters = {
  depth: "1",
  layout: "radial",
  kind: "item",
  rank: "all",
  propertyId: "P31",
  evidence: "referenced",
};
const Q42_PROOF_FOCUS_ID = "Q5";

const REVIEW_TASK_STATUS_OPTIONS: Array<{ value: ReviewTaskStatus; label: string }> = [
  { value: "needs_review", label: "Needs review" },
  { value: "checking_sources", label: "Checking sources" },
  { value: "ready_to_draft", label: "Ready to draft" },
  { value: "resolved", label: "Resolved" },
];

const client = new WikidataClient();

function getEntityLabel(item: WikidataItem | null): string {
  if (!item) return "";
  return item.labels.en || Object.values(item.labels)[0] || item.id;
}

function getEntityDescription(item: WikidataItem | null): string {
  if (!item) return "";
  return item.descriptions.en || Object.values(item.descriptions)[0] || "No description available.";
}

function formatTime(value?: string): string {
  if (!value) return "Unknown time";
  return value.replace(/T.*Z$/, "").replace(/^\+/, "");
}

function rankBadgeClass(rank: WikidataStatement["rank"]) {
  if (rank === "preferred") return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200";
  if (rank === "deprecated") return "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-200";
  return "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300";
}

function formatValueText(value: WikidataStatement["value"]): string {
  const { type, content } = value;

  if (type === "somevalue") return "Unknown value";
  if (type === "novalue") return "No value";
  if (!content) return "No displayable value";
  if (content.label || content.id) return [content.label, content.id].filter(Boolean).join(" ");
  if (content.time) return formatTime(content.time);
  if (content.amount) return `${content.amount}${content.unit && content.unit !== "1" ? ` ${content.unit}` : ""}`;
  if (content.latitude !== undefined && content.longitude !== undefined) return `${content.latitude}, ${content.longitude}`;
  if (content.value !== undefined) return String(content.value);

  return String(content);
}

function formatValue(value: WikidataStatement["value"], onEntityClick: (id: string) => void) {
  const { type, content } = value;

  if (type === "somevalue") return <span className="text-muted-foreground">Unknown value</span>;
  if (type === "novalue") return <span className="text-muted-foreground">No value</span>;
  if (!content) return <span className="text-muted-foreground">No displayable value</span>;

  if (content.id) {
    return (
      <button
        type="button"
        className="text-left font-medium text-sky-700 hover:text-sky-900 dark:text-sky-300 dark:hover:text-sky-100"
        onClick={() => onEntityClick(content.id)}
      >
        {content.label || content.id}
        <span className="ml-1 text-xs text-muted-foreground">{content.id}</span>
      </button>
    );
  }

  if (content.time) return <span>{formatTime(content.time)}</span>;

  if (content.amount) {
    const unit = content.unit && content.unit !== "1" ? ` ${content.unit}` : "";
    return <span>{content.amount}{unit}</span>;
  }

  if (content.latitude !== undefined && content.longitude !== undefined) {
    return <span>{content.latitude}, {content.longitude}</span>;
  }

  if (typeof content.value === "string" && content.value.startsWith("http")) {
    return (
      <a className="text-sky-700 hover:underline dark:text-sky-300" href={content.value} target="_blank" rel="noopener noreferrer">
        {content.value}
      </a>
    );
  }

  if (content.value !== undefined) return <span>{String(content.value)}</span>;

  return <span>{String(content)}</span>;
}

function formatStatementValue(statement: WikidataStatement, onEntityClick: (id: string) => void) {
  return formatValue(statement.value, onEntityClick);
}

function SourceHintList({ hints }: { hints: ReviewSourceHint[] }) {
  if (!hints.length) return null;

  return (
    <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-800 dark:bg-slate-900" data-testid="statement-source-hints">
      <div className="font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Source hints</div>
      <ul className="mt-2 space-y-1">
        {hints.map((hint, index) => (
          <li key={`${hint.propertyId}-${hint.value}-${index}`} className="break-words text-slate-600 dark:text-slate-300">
            <span className="font-medium text-slate-800 dark:text-slate-100">{sourceHintKindLabel(hint.kind)}</span>
            <span className="text-slate-500 dark:text-slate-400"> - {hint.propertyLabel || hint.propertyId}</span>: {hint.url ? (
              <a className="text-sky-700 underline-offset-2 hover:underline dark:text-sky-300" href={hint.url} target="_blank" rel="noopener noreferrer">
                {hint.value}
              </a>
            ) : (
              <span>{hint.value}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function getSeverityClass(severity: ReviewQueueItem["severity"]) {
  if (severity === "high") return "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-200";
  return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200";
}

function dataQualityClass(rating: string) {
  if (rating === "Strong") return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200";
  if (rating === "Mixed") return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200";
  return "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-200";
}
function readJsonArray<T>(key: string): T[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed as T[] : [];
  } catch {
    return [];
  }
}

function readJsonRecord<T extends string>(key: string, allowedValues: readonly T[]): Record<string, T> {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const allowed = new Set(allowedValues);
    return Object.fromEntries(
      Object.entries(parsed).filter((entry): entry is [string, T] => typeof entry[1] === "string" && allowed.has(entry[1] as T)),
    );
  } catch {
    return {};
  }
}

function reviewStatusLabel(status: ReviewTaskStatus): string {
  return REVIEW_TASK_STATUS_OPTIONS.find((option) => option.value === status)?.label || "Needs review";
}

function buildReviewQueue(item: WikidataItem | null, dismissedIds: string[]): ReviewQueueItem[] {
  if (!item) return [];

  const dismissed = new Set(dismissedIds);
  const items: ReviewQueueItem[] = [];

  for (const statement of Object.values(item.statements).flat()) {
    const statementId = statement.id || `${item.id}-${statement.property.id}-${formatValueText(statement.value)}`;
    const baseId = `${item.id}:${statementId}`;
    const propertyLabel = statement.property.label || statement.property.id;
    const value = formatValueText(statement.value);
    const sourceHints = sourceHintsFromStatement(statement);

    if (statement.rank === "deprecated") {
      const id = `${baseId}:deprecated`;
      if (!dismissed.has(id)) {
        items.push({
          id,
          entityId: item.id,
          propertyId: statement.property.id,
          propertyLabel,
          statementId,
          severity: "high",
          title: "Deprecated statement needs review",
          detail: `${propertyLabel} is marked deprecated; verify whether it should remain visible, be explained by qualifiers, or be replaced.`,
          value,
          sourceHints,
        });
      }
    }

    if (statement.references.length === 0 && statement.rank !== "deprecated") {
      const id = `${baseId}:unreferenced`;
      if (!dismissed.has(id)) {
        items.push({
          id,
          entityId: item.id,
          propertyId: statement.property.id,
          propertyLabel,
          statementId,
          severity: "medium",
          title: "Claim has no references",
          detail: `${propertyLabel} has no references in the visible Wikidata statement data. It is a good candidate for verifier follow-up or source discovery.`,
          value,
          sourceHints,
        });
      }
    }
  }

  return items
    .sort((a, b) => (a.severity === b.severity ? a.propertyLabel.localeCompare(b.propertyLabel) : a.severity === "high" ? -1 : 1))
    .slice(0, 24);
}

function buildStatementContext(statement: WikidataStatement) {
  return {
    statementId: statement.id || "",
    propertyId: statement.property.id,
    propertyLabel: statement.property.label || statement.property.id,
    rank: statement.rank,
    value: formatValueText(statement.value),
    qualifiers: statement.qualifiers.slice(0, 4).map((qualifier) => ({
      propertyId: qualifier.property.id,
      propertyLabel: qualifier.property.label || qualifier.property.id,
      value: formatValueText(qualifier.value),
    })),
    references: statement.references.slice(0, 3).map((reference) => ({
      hash: reference.hash,
      parts: reference.parts.slice(0, 4).map((part) => ({
        propertyId: part.property.id,
        propertyLabel: part.property.label || part.property.id,
        value: formatValueText(part.value),
      })),
    })),
  };
}

function buildSummaryContext(item: WikidataItem) {
  return Object.values(item.statements)
    .flat()
    .slice(0, 16)
    .map(buildStatementContext);
}

function buildSelectedStatementContext(item: WikidataItem, focus: RelationshipGraphFocus | null) {
  const statements = Object.values(item.statements).flat();
  const selectedStatements = focus
    ? statements.filter((statement) => statement.id === focus.statementId || statement.property.id === focus.propertyId)
    : statements;
  return selectedStatements.slice(0, 4).map(buildStatementContext);
}

function getInitialSearchTerm() {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get("q") || "";
}

function getInitialAgentAction(): AgentAction | null {
  if (!AI_AGENTS_ENABLED || typeof window === "undefined") return null;
  const action = new URLSearchParams(window.location.search).get("agent");
  return action === "research" || action === "graph" || action === "suggest" || action === "verify" || action === "compare" || action === "report" ? action : null;
}

function getInitialWorkbenchState() {
  if (typeof window === "undefined") return readSearchWorkbenchState("");
  return readSearchWorkbenchState(window.location.search);
}

function normalizeWorkbenchTab(tab: SearchWorkbenchTab): SearchWorkbenchTab {
  if (!AI_AGENTS_ENABLED && tab === "agent-runs") return "graph";
  return tab;
}

function replaceWorkbenchUrlState(updates: { q?: string; tab?: SearchWorkbenchTab; graphFilters?: RelationshipGraphFilters; graphFocusId?: string | null; comparisonTargetId?: string | null; comparisonThirdTargetId?: string | null; exportView?: ShareableExportView | null }) {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  if (updates.q !== undefined) {
    const query = updates.q.trim();
    if (query) params.set("q", query);
    else params.delete("q");
  }
  const currentState = readSearchWorkbenchState(params);
  const nextParams = writeSearchWorkbenchState(params, {
    tab: updates.tab || currentState.tab,
    graphFilters: updates.graphFilters || currentState.graphFilters,
    graphFocusId: Object.prototype.hasOwnProperty.call(updates, "graphFocusId") ? updates.graphFocusId || null : currentState.graphFocusId,
    comparisonTargetId: Object.prototype.hasOwnProperty.call(updates, "comparisonTargetId") ? updates.comparisonTargetId || null : currentState.comparisonTargetId,
    comparisonThirdTargetId: Object.prototype.hasOwnProperty.call(updates, "comparisonThirdTargetId") ? updates.comparisonThirdTargetId || null : currentState.comparisonThirdTargetId,
    exportView: Object.prototype.hasOwnProperty.call(updates, "exportView") ? updates.exportView || null : currentState.exportView,
  });
  const query = nextParams.toString();
  window.history.replaceState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}`);
}
function collectCommonsFiles(item: WikidataItem | null): string[] {
  if (!item) return [];

  return Object.values(item.statements)
    .flat()
    .filter((statement) => statement.value.type === "commonsMedia")
    .map((statement) => statement.value.content?.value)
    .filter(Boolean);
}

export default function SearchPage() {
  const initialWorkbenchState = getInitialWorkbenchState();
  const [searchTerm, setSearchTerm] = useState(getInitialSearchTerm);
  const [results, setResults] = useState<WikidataItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<WikidataItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableLanguages, setAvailableLanguages] = useState<Record<string, WikidataLanguage>>({});
  const [mediaInfo, setMediaInfo] = useState<Record<string, WikidataMediaInfo>>({});
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [linkedData, setLinkedData] = useState<LinkedData | null>(null);
  const [aiSummary, setAiSummary] = useState<AiSummaryState>(null);
  const [agentResult, setAgentResult] = useState<AgentResultState>(null);
  const [agentLoading, setAgentLoading] = useState<AgentAction | null>(null);
  const [compareEntityId, setCompareEntityId] = useState(initialWorkbenchState.comparisonTargetId || "Q80");
  const [compareThirdEntityId, setCompareThirdEntityId] = useState(initialWorkbenchState.comparisonThirdTargetId || "Q25169");
  const [comparisonItem, setComparisonItem] = useState<WikidataItem | null>(null);
  const [comparisonThirdItem, setComparisonThirdItem] = useState<WikidataItem | null>(null);
  const [comparisonLoading, setComparisonLoading] = useState(false);
  const [comparisonError, setComparisonError] = useState<string | null>(null);
  const [selectedGraphFocus, setSelectedGraphFocus] = useState<RelationshipGraphFocus | null>(null);
  const [activeTab, setActiveTab] = useState<SearchWorkbenchTab>(() => normalizeWorkbenchTab(initialWorkbenchState.tab as SearchWorkbenchTab));
  const [graphFilters, setGraphFilters] = useState<RelationshipGraphFilters>(() => initialWorkbenchState.graphFilters as RelationshipGraphFilters);
  const [selectedGraphNodeId, setSelectedGraphNodeId] = useState<string | null>(() => initialWorkbenchState.graphFocusId);
  const [shareableExportView, setShareableExportView] = useState<ShareableExportView | null>(() => normalizeShareableExportView(initialWorkbenchState.exportView));
  const [savedAgentRuns, setSavedAgentRuns] = useState<SavedAgentRun[]>([]);
  const [dismissedReviewIds, setDismissedReviewIds] = useState<string[]>([]);
  const [reviewTaskStatuses, setReviewTaskStatuses] = useState<Record<string, ReviewTaskStatus>>({});
  const [copiedDraft, setCopiedDraft] = useState<string | null>(null);
  const queuedAgentActionRef = useRef<AgentAction | null>(getInitialAgentAction());
  const queuedComparisonTargetRef = useRef<string | null>(initialWorkbenchState.comparisonTargetId);
  const queuedComparisonThirdTargetRef = useRef<string | null>(initialWorkbenchState.comparisonThirdTargetId);
  const storageHydratedRef = useRef(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setSavedAgentRuns(readJsonArray<SavedAgentRun>(AGENT_RUNS_STORAGE_KEY).slice(0, 40));
      setDismissedReviewIds(readJsonArray<string>(DISMISSED_REVIEW_STORAGE_KEY));
      setReviewTaskStatuses(readJsonRecord<ReviewTaskStatus>(REVIEW_TASK_STATUS_STORAGE_KEY, REVIEW_TASK_STATUS_OPTIONS.map((option) => option.value)));
      storageHydratedRef.current = true;
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!storageHydratedRef.current || typeof window === "undefined") return;
    window.localStorage.setItem(AGENT_RUNS_STORAGE_KEY, JSON.stringify(savedAgentRuns.slice(0, 40)));
  }, [savedAgentRuns]);

  useEffect(() => {
    if (!storageHydratedRef.current || typeof window === "undefined") return;
    window.localStorage.setItem(DISMISSED_REVIEW_STORAGE_KEY, JSON.stringify(dismissedReviewIds.slice(-250)));
  }, [dismissedReviewIds]);

  useEffect(() => {
    if (!storageHydratedRef.current || typeof window === "undefined") return;
    const entries = Object.entries(reviewTaskStatuses).slice(-300);
    window.localStorage.setItem(REVIEW_TASK_STATUS_STORAGE_KEY, JSON.stringify(Object.fromEntries(entries)));
  }, [reviewTaskStatuses]);

  useEffect(() => {
    let cancelled = false;

    client
      .fetchAvailableLanguages()
      .then((languages) => {
        if (!cancelled) setAvailableLanguages(languages);
      })
      .catch(() => {
        if (!cancelled) setAvailableLanguages({});
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const files = collectCommonsFiles(selectedItem);

    async function loadMedia() {
      if (!files.length) {
        setMediaInfo({});
        setMediaError(null);
        return;
      }

      setMediaInfo({});
      setMediaError(null);

      try {
        const media = await client.fetchCommonsMedia(files.slice(0, 12));
        if (!cancelled) setMediaInfo(media);
      } catch {
        if (!cancelled) {
          setMediaInfo({});
          setMediaError("Commons media metadata could not be loaded. Try again later.");
        }
      }
    }

    void loadMedia();

    return () => {
      cancelled = true;
    };
  }, [selectedItem]);

  const statementGroups = useMemo(() => {
    if (!selectedItem) return [];
    return Object.entries(selectedItem.statements).map(([propertyId, statements]) => ({
      propertyId,
      propertyLabel: statements[0]?.property.label || propertyId,
      statements,
    }));
  }, [selectedItem]);

  const languageRows = useMemo(() => {
    if (!selectedItem) return [];
    return Object.entries(selectedItem.labels)
      .map(([code, label]) => ({
        code,
        label,
        name: availableLanguages[code]?.name || code,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [availableLanguages, selectedItem]);

  const selectedAgentRuns = useMemo(() => {
    if (!selectedItem) return [];
    return savedAgentRuns.filter((run) => run.entityId === selectedItem.id);
  }, [savedAgentRuns, selectedItem]);

  const dataQuality = useMemo(() => selectedItem ? summarizeEntityDataQuality(selectedItem) : null, [selectedItem]);
  const reviewQueue = useMemo(() => buildReviewQueue(selectedItem, dismissedReviewIds), [dismissedReviewIds, selectedItem]);
  const reviewQueueWithStatus = useMemo<ReviewQueueItemWithStatus[]>(() => reviewQueue.map((item) => {
    const status = reviewTaskStatuses[item.id] || "needs_review";
    return { ...item, status, statusLabel: reviewStatusLabel(status) };
  }), [reviewQueue, reviewTaskStatuses]);
  const draftSafety = useMemo<DraftSafetyState>(() => evaluateAutonomyAction({
    action: "quickstatements_draft",
    mode: "draft_only",
    entityId: selectedItem?.id,
    batchSize: Math.max(1, reviewQueueWithStatus.length),
    dryRun: true,
  }), [reviewQueueWithStatus.length, selectedItem?.id]);
  const quickStatementsDraft = useMemo(() => buildQuickStatementsReviewDraft(reviewQueueWithStatus, {
    entityId: selectedItem?.id,
    entityLabel: getEntityLabel(selectedItem),
  }), [reviewQueueWithStatus, selectedItem]);
  const markdownDraft = useMemo(() => buildReviewMarkdownExport(reviewQueueWithStatus, {
    entityId: selectedItem?.id,
    entityLabel: getEntityLabel(selectedItem),
  }), [reviewQueueWithStatus, selectedItem]);
  const graphPathMarkdownDraft = useMemo(() => buildGraphPathMarkdownExport({
    entityId: selectedItem?.id,
    entityLabel: getEntityLabel(selectedItem),
  }, selectedGraphFocus), [selectedGraphFocus, selectedItem]);
  const graphPathJsonDraft = useMemo(() => buildGraphPathJsonExport({
    entityId: selectedItem?.id,
    entityLabel: getEntityLabel(selectedItem),
  }, selectedGraphFocus), [selectedGraphFocus, selectedItem]);
  const entityComparison = useMemo<ReturnType<typeof buildEntityComparison> | null>(() => {
    if (!selectedItem || !comparisonItem) return null;
    return buildEntityComparison(selectedItem, comparisonItem);
  }, [comparisonItem, selectedItem]);
  const entitySetComparison = useMemo<ReturnType<typeof buildEntitySetComparison> | null>(() => {
    if (!selectedItem || !comparisonItem || !comparisonThirdItem) return null;
    return buildEntitySetComparison([selectedItem, comparisonItem, comparisonThirdItem]);
  }, [comparisonItem, comparisonThirdItem, selectedItem]);
  const comparisonMarkdownDraft = useMemo(() => {
    if (entitySetComparison) return buildEntitySetComparisonMarkdownExport(entitySetComparison);
    return entityComparison ? buildEntityComparisonMarkdownExport(entityComparison) : "";
  }, [entityComparison, entitySetComparison]);
  const comparisonJsonDraft = useMemo(() => {
    if (entitySetComparison) return buildEntitySetComparisonJsonExport(entitySetComparison);
    return entityComparison ? buildEntityComparisonJsonExport(entityComparison) : "";
  }, [entityComparison, entitySetComparison]);

  function updateReviewTaskStatus(itemId: string, status: ReviewTaskStatus) {
    setReviewTaskStatuses((current) => ({ ...current, [itemId]: status }));
  }
  async function copyDraftToClipboard(label: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedDraft(label);
      window.setTimeout(() => setCopiedDraft(null), 1800);
    } catch {
      setError(`Could not copy ${label}. Your browser may require manual selection.`);
    }
  }

  function updateShareableExportView(nextView: ShareableExportView | null, tab: SearchWorkbenchTab) {
    setShareableExportView(nextView);
    setActiveTab(tab);
    replaceWorkbenchUrlState({ tab, exportView: nextView });
  }

  const runSearch = useCallback(async (rawQuery: string, options: RunSearchOptions = {}) => {
    const query = rawQuery.trim();
    const graphFocusId = Object.prototype.hasOwnProperty.call(options, "graphFocusId") ? options.graphFocusId || null : null;
    if (!query) {
      setError("Enter a Wikidata search term or entity ID.");
      return;
    }

    setLoading(true);
    setError(null);
    setLinkedData(null);
    setAiSummary(null);
    setAgentResult(null);
    setSelectedGraphFocus(null);
    setSelectedGraphNodeId(graphFocusId);

    try {
      if (/^[QP]\d+$/i.test(query)) {
        const entityId = query.toUpperCase();
        const entity = await client.getDetailedEntity(entityId);
        replaceWorkbenchUrlState({ q: entityId, graphFocusId });
        setResults([entity]);
        setSelectedItem(entity);
      } else {
        const searchResults = await searchWikidata(query);
        replaceWorkbenchUrlState({ q: query, graphFocusId: null });
        setResults(searchResults);
        setSelectedItem(null);
        if (!searchResults.length) setError("No Wikidata entities matched that search.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed. Try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialQuery = getInitialSearchTerm();
    const initialState = getInitialWorkbenchState();

    const timeout = window.setTimeout(() => {
        setActiveTab(normalizeWorkbenchTab(initialState.tab as SearchWorkbenchTab));
        setGraphFilters(initialState.graphFilters as RelationshipGraphFilters);
        setSelectedGraphNodeId(initialState.graphFocusId);
        setShareableExportView(normalizeShareableExportView(initialState.exportView));
        setCompareEntityId(initialState.comparisonTargetId || "Q80");
        setCompareThirdEntityId(initialState.comparisonThirdTargetId || "Q25169");
      queuedComparisonTargetRef.current = initialState.comparisonTargetId;
      queuedComparisonThirdTargetRef.current = initialState.comparisonThirdTargetId;
      if (initialQuery) {
        void runSearch(initialQuery, { graphFocusId: initialState.graphFocusId });
      }
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [runSearch]);

  async function handleSearch(event: React.FormEvent) {
    event.preventDefault();
    await runSearch(searchTerm);
  }

  function openQ42ProofGraph() {
    setActiveTab("graph");
    setGraphFilters(Q42_PROOF_GRAPH_FILTERS);
    setSelectedGraphNodeId(Q42_PROOF_FOCUS_ID);
    replaceWorkbenchUrlState({ tab: "graph", graphFilters: Q42_PROOF_GRAPH_FILTERS, graphFocusId: Q42_PROOF_FOCUS_ID });
  }

  function openQ42ProofReview() {
    setActiveTab("review");
    replaceWorkbenchUrlState({ tab: "review" });
  }

  async function loadEntity(id: string) {
    setDetailLoading(true);
    setError(null);
    setLinkedData(null);
    setAiSummary(null);
    setAgentResult(null);
    setSelectedGraphFocus(null);
    setSelectedGraphNodeId(null);

    try {
      const entityId = id.toUpperCase();
      const entity = await client.getDetailedEntity(entityId);
      replaceWorkbenchUrlState({ q: entityId, graphFocusId: null });
      setSearchTerm(entityId);
      setSelectedItem(entity);
    } catch (err) {
      setError(err instanceof Error ? err.message : `Could not load ${id}.`);
    } finally {
      setDetailLoading(false);
    }
  }

  async function loadLinkedData() {
    if (!selectedItem) return;

    setDetailLoading(true);
    setError(null);

    try {
      const ids = client.getAllIdsFromItem(selectedItem).filter((id) => id !== selectedItem.id);
      const labels = await client.getLabels(ids);
      setLinkedData({
        items: ids.filter((id) => id.startsWith("Q")).map((id) => ({ id, label: labels[id] || id })),
        properties: ids.filter((id) => id.startsWith("P")).map((id) => ({ id, label: labels[id] || id })),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load linked data.");
    } finally {
      setDetailLoading(false);
    }
  }

  const loadComparisonTarget = useCallback(async (targetId?: string, slot: "primary" | "third" = "primary") => {
    if (!selectedItem || comparisonLoading) return;

    const entityId = (targetId || (slot === "third" ? compareThirdEntityId : compareEntityId)).trim().toUpperCase();
    if (!/^[QP]\d+$/.test(entityId)) {
      setComparisonError("Enter a valid Wikidata ID to compare, such as Q80.");
      return;
    }

    if (entityId === selectedItem.id || (slot === "primary" && comparisonThirdItem?.id === entityId) || (slot === "third" && comparisonItem?.id === entityId)) {
      setComparisonError("Choose a different Wikidata ID for comparison.");
      return;
    }

    setComparisonLoading(true);
    setComparisonError(null);
    setError(null);

    try {
      const entity = await client.getDetailedEntity(entityId);
      if (slot === "third") {
        setComparisonThirdItem(entity);
        setCompareThirdEntityId(entity.id);
      } else {
        setComparisonItem(entity);
        setCompareEntityId(entity.id);
      }
      setActiveTab("compare");
      if (slot === "third") {
        replaceWorkbenchUrlState({ tab: "compare", comparisonThirdTargetId: entity.id });
      } else {
        replaceWorkbenchUrlState({ tab: "compare", comparisonTargetId: entity.id });
      }
    } catch (err) {
      setComparisonError(err instanceof Error ? err.message : `Could not load ${entityId} for comparison.`);
    } finally {
      setComparisonLoading(false);
    }
  }, [compareEntityId, compareThirdEntityId, comparisonItem?.id, comparisonLoading, comparisonThirdItem?.id, selectedItem]);

  async function summarizeEntity() {
    if (!AI_AGENTS_ENABLED) {
      setError(AI_DISABLED_MESSAGE);
      return;
    }
    if (!selectedItem || summaryLoading) return;

    setSummaryLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/entity-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entity: {
            id: selectedItem.id,
            type: selectedItem.type,
            label: getEntityLabel(selectedItem),
            description: getEntityDescription(selectedItem),
            statements: buildSummaryContext(selectedItem),
          },
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not summarize this entity.");

      setAiSummary({ entityId: selectedItem.id, summary: data.summary });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not summarize this entity.");
    } finally {
      setSummaryLoading(false);
    }
  }
  const runAgentWorkflow = useCallback(async (action: AgentAction) => {
    if (!AI_AGENTS_ENABLED) {
      setError(AI_DISABLED_MESSAGE);
      return;
    }
    if (!selectedItem || agentLoading) return;

    const normalizedCompareId = compareEntityId.trim().toUpperCase();
    if (action === "compare" && !/^[QP]\d+$/.test(normalizedCompareId)) {
      setError("Enter a valid Wikidata ID to compare, such as Q80.");
      return;
    }

    const titles: Record<AgentAction, string> = {
      research: "Wikidata Research Agent",
      graph: "Graph Analyst Agent",
      suggest: "Next Entity Suggestions Agent",
      verify: "Citation/Verifier Agent",
      compare: "Comparison Agent",
      report: "Report Agent",
    };

    setAgentLoading(action);
    setError(null);

    try {
      const response = await fetch("/api/ag2-workflow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          entityId: selectedItem.id,
          compareEntityId: action === "compare" ? normalizedCompareId : undefined,
          graphFocus: selectedGraphFocus || undefined,
          entity: {
            id: selectedItem.id,
            type: selectedItem.type,
            label: getEntityLabel(selectedItem),
            description: getEntityDescription(selectedItem),
            statements: buildSummaryContext(selectedItem),
          },
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "The AG2 workflow could not complete.");

      const nextResult = {
        entityId: selectedItem.id,
        action,
        title: titles[action],
        result: data.result,
        safety: data.safety,
        graphFocus: selectedGraphFocus || undefined,
      };
      const savedRun: SavedAgentRun = {
        ...nextResult,
        id: `${selectedItem.id}-${action}-${Date.now()}`,
        entityLabel: getEntityLabel(selectedItem),
        compareEntityId: action === "compare" ? normalizedCompareId : undefined,
        graphFocus: selectedGraphFocus || undefined,
        createdAt: new Date().toISOString(),
      };

      setAgentResult(nextResult);
      setSavedAgentRuns((previous) => [savedRun, ...previous].slice(0, 40));
    } catch (err) {
      setError(err instanceof Error ? err.message : "The AG2 workflow could not complete.");
    } finally {
      setAgentLoading(null);
    }
  }, [agentLoading, compareEntityId, selectedGraphFocus, selectedItem]);

  function openChatWithVisibleContext() {
    if (!AI_AGENTS_ENABLED) {
      setError(AI_DISABLED_MESSAGE);
      return;
    }
    if (!selectedItem || typeof window === "undefined") return;

    const context = sanitizeChatVisibleContext({
      source: "search-workbench",
      createdAt: new Date().toISOString(),
      entity: {
        id: selectedItem.id,
        type: selectedItem.type,
        label: getEntityLabel(selectedItem),
        description: getEntityDescription(selectedItem),
        statements: buildSummaryContext(selectedItem),
      },
      graphFocus: selectedGraphFocus || undefined,
      selectedStatements: buildSelectedStatementContext(selectedItem, selectedGraphFocus),
      graphPathExport: selectedGraphFocus ? {
        markdown: graphPathMarkdownDraft,
        json: graphPathJsonDraft,
      } : undefined,
    });

    if (!context) {
      setError("Could not prepare selected context for the AG2 chat.");
      return;
    }

    window.localStorage.setItem(AG2_CHAT_CONTEXT_STORAGE_KEY, JSON.stringify(context));
    window.location.assign("/chat?context=workbench");
  }

  useEffect(() => {
    const action = queuedAgentActionRef.current;
    if (!selectedItem || !action || agentLoading || agentResult?.entityId === selectedItem.id) return;

    queuedAgentActionRef.current = null;
    void runAgentWorkflow(action);
  }, [agentLoading, agentResult?.entityId, runAgentWorkflow, selectedItem]);

  useEffect(() => {
    const targetId = queuedComparisonTargetRef.current;
    if (activeTab !== "compare" || !selectedItem || !targetId || comparisonLoading) return;

    const normalizedTargetId = targetId.toUpperCase();
    if (normalizedTargetId === selectedItem.id || comparisonItem?.id === normalizedTargetId) {
      queuedComparisonTargetRef.current = null;
      return;
    }

    queuedComparisonTargetRef.current = null;
    void loadComparisonTarget(normalizedTargetId);
  }, [activeTab, comparisonItem?.id, comparisonLoading, loadComparisonTarget, selectedItem]);

  useEffect(() => {
    const targetId = queuedComparisonThirdTargetRef.current;
    if (activeTab !== "compare" || !selectedItem || !comparisonItem || !targetId || comparisonLoading) return;

    const normalizedTargetId = targetId.toUpperCase();
    if (normalizedTargetId === selectedItem.id || normalizedTargetId === comparisonItem.id || comparisonThirdItem?.id === normalizedTargetId) {
      queuedComparisonThirdTargetRef.current = null;
      return;
    }

    queuedComparisonThirdTargetRef.current = null;
    void loadComparisonTarget(normalizedTargetId, "third");
  }, [activeTab, comparisonItem, comparisonLoading, comparisonThirdItem?.id, loadComparisonTarget, selectedItem]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">Wikidata Explorer</h1>
          <p className="max-w-3xl text-sm text-slate-600 dark:text-slate-300">
            Search by topic or paste an entity ID such as Q42 or P31 to inspect labels, statements, media, languages, and linked entities.
          </p>
        </div>

        <form onSubmit={handleSearch} className="mb-4 flex flex-col gap-2 sm:flex-row">
          <Input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search Wikidata or enter Q/P ID"
            className="h-11 flex-1 bg-white dark:bg-slate-900"
          />
          <Button type="submit" disabled={loading} className="h-11 gap-2">
            <Search className="h-4 w-4" />
            {loading ? "Searching" : "Search"}
          </Button>
        </form>

        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
            {error}
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Results</h2>
              {!!results.length && <Badge variant="secondary">{results.length}</Badge>}
            </div>

            {results.length === 0 && (
              <Card className="p-5 text-sm text-slate-600 dark:text-slate-300">
                Search results will appear here.
              </Card>
            )}

            <div className="space-y-2">
              {results.map((item) => {
                const active = selectedItem?.id === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => loadEntity(item.id)}
                    className={`w-full rounded-lg border bg-white p-4 text-left shadow-sm transition hover:border-sky-300 hover:bg-sky-50 dark:bg-slate-900 dark:hover:bg-slate-800 ${
                      active ? "border-sky-500 ring-2 ring-sky-100 dark:ring-sky-900" : "border-slate-200 dark:border-slate-800"
                    }`}
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <span className="font-medium text-slate-950 dark:text-slate-50">{getEntityLabel(item)}</span>
                      <Badge variant="outline">{item.id}</Badge>
                    </div>
                    <p className="line-clamp-2 text-sm text-slate-600 dark:text-slate-300">{getEntityDescription(item)}</p>
                  </button>
                );
              })}
            </div>
          </section>

          <section>
            {!selectedItem ? (
              <Card className="flex min-h-[420px] items-center justify-center p-8 text-center text-slate-600 dark:text-slate-300">
                <div className="max-w-md space-y-3">
                  <Database className="mx-auto h-10 w-10 text-sky-500" />
                  <h2 className="text-xl font-semibold text-slate-950 dark:text-slate-50">Select an entity to inspect</h2>
                  <p className="text-sm">Details, statements, media, languages, and linked entities will appear here.</p>
                </div>
              </Card>
            ) : (
              <Card className="p-5">
                <div className="mb-5 flex flex-col gap-4 border-b pb-5 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <h2 className="text-2xl font-semibold text-slate-950 dark:text-slate-50">{getEntityLabel(selectedItem)}</h2>
                      <Badge variant="secondary" data-testid="selected-entity-id">{selectedItem.id}</Badge>
                      <Badge variant="outline">{selectedItem.type}</Badge>
                    </div>
                    <p className="max-w-3xl text-sm text-slate-600 dark:text-slate-300">{getEntityDescription(selectedItem)}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {AI_AGENTS_ENABLED && (
                      <Button type="button" variant="outline" className="gap-2" onClick={summarizeEntity} disabled={summaryLoading}>
                        <Sparkles className="h-4 w-4" />
                        {summaryLoading ? "Summarizing" : "Summarize"}
                      </Button>
                    )}
                    <Button type="button" variant="outline" className="gap-2" onClick={loadLinkedData} disabled={detailLoading}>
                      <Database className="h-4 w-4" />
                      Collect Links
                    </Button>
                    <Button asChild variant="outline" className="gap-2">
                      <a href={`https://www.wikidata.org/wiki/${selectedItem.id}`} target="_blank" rel="noopener noreferrer">
                        <Globe className="h-4 w-4" />
                        Source
                      </a>
                    </Button>
                  </div>
                </div>

                {selectedItem.id === "Q42" && (
                  <div className="mb-5 rounded-md border border-sky-200 bg-sky-50 p-4 dark:border-sky-900 dark:bg-sky-950" data-testid="recruiter-proof-path">
                    <div className="mb-3 flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-950 dark:text-slate-50">
                          <Sparkles className="h-4 w-4 text-sky-600 dark:text-sky-300" />
                          Recruiter proof path
                        </div>
                        <p className="mt-1 max-w-3xl text-sm text-slate-700 dark:text-slate-200">
                          Douglas Adams shows the full Wikidata Explorer loop: graph context, evidence depth, draft-only exports, and the AI safety boundary in one review path.
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">Seed Q42</Badge>
                        <Badge variant="outline">Under 5 minutes</Badge>
                      </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                      <div className="rounded-md border border-sky-200 bg-white p-3 text-sm dark:border-sky-900 dark:bg-slate-950">
                        <div className="mb-2 flex items-center gap-2 font-semibold text-slate-950 dark:text-slate-50">
                          <Network className="h-4 w-4 text-sky-600 dark:text-sky-300" />
                          Graph context
                        </div>
                        <p className="min-h-10 text-slate-600 dark:text-slate-300">Q42 -&gt; human through instance of (P31).</p>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <Badge variant={selectedGraphFocus?.id === Q42_PROOF_FOCUS_ID ? "secondary" : "outline"}>{selectedGraphFocus?.id === Q42_PROOF_FOCUS_ID ? "Focused" : "Ready"}</Badge>
                          <Button type="button" variant="outline" size="sm" className="gap-2" onClick={openQ42ProofGraph} data-testid="proof-path-graph-focus">
                            <Network className="h-4 w-4" />
                            Focus
                          </Button>
                        </div>
                      </div>

                      <div className="rounded-md border border-sky-200 bg-white p-3 text-sm dark:border-sky-900 dark:bg-slate-950">
                        <div className="mb-2 flex items-center gap-2 font-semibold text-slate-950 dark:text-slate-50">
                          <ShieldCheck className="h-4 w-4 text-sky-600 dark:text-sky-300" />
                          Evidence depth
                        </div>
                        <p className="min-h-10 text-slate-600 dark:text-slate-300">
                          {dataQuality ? `${dataQuality.referencedStatementCount}/${dataQuality.statementCount} referenced statements; ${dataQuality.qualifierCount} qualifiers.` : "Evidence counts load with the selected entity."}
                        </p>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <Badge variant="outline">{reviewQueue.length} review flags</Badge>
                          <Button type="button" variant="outline" size="sm" className="gap-2" onClick={openQ42ProofReview} data-testid="proof-path-review">
                            <Database className="h-4 w-4" />
                            Review
                          </Button>
                        </div>
                      </div>

                      <div className="rounded-md border border-sky-200 bg-white p-3 text-sm dark:border-sky-900 dark:bg-slate-950">
                        <div className="mb-2 flex items-center gap-2 font-semibold text-slate-950 dark:text-slate-50">
                          <FileText className="h-4 w-4 text-sky-600 dark:text-sky-300" />
                          Safe exports
                        </div>
                        <p className="min-h-10 text-slate-600 dark:text-slate-300">
                          {selectedGraphFocus ? `Path export ready for ${selectedGraphFocus.propertyId} -&gt; ${selectedGraphFocus.id}.` : "Focus the P31 edge to reveal Markdown and JSON path exports."}
                        </p>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <Badge variant={draftSafety.allowed ? "secondary" : "destructive"}>{draftSafety.decisionLabel}</Badge>
                          <Button type="button" variant="outline" size="sm" className="gap-2" onClick={openQ42ProofGraph} data-testid="proof-path-safe-exports">
                            <FileText className="h-4 w-4" />
                            Export
                          </Button>
                        </div>
                      </div>

                      <div className="rounded-md border border-sky-200 bg-white p-3 text-sm dark:border-sky-900 dark:bg-slate-950" data-testid="proof-path-ai-boundary">
                        <div className="mb-2 flex items-center gap-2 font-semibold text-slate-950 dark:text-slate-50">
                          <BrainCircuit className="h-4 w-4 text-sky-600 dark:text-sky-300" />
                          AI boundary
                        </div>
                        <p className="min-h-10 text-slate-600 dark:text-slate-300">
                          {AI_AGENTS_ENABLED ? "AG2 mode sends selected context through server-side safety gates." : "Public mode keeps AG2 hidden and API routes fail closed."}
                        </p>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <Badge variant={AI_AGENTS_ENABLED ? "secondary" : "outline"}>{AI_AGENTS_ENABLED ? "AI enabled" : "AI off"}</Badge>
                          <Badge variant="outline">Safety gated</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {dataQuality && (
                  <div className="mb-5 rounded-md border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900" data-testid="data-quality-summary">
                    <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-950 dark:text-slate-50">
                          <ShieldCheck className="h-4 w-4 text-sky-600 dark:text-sky-300" />
                          Data quality summary
                        </div>
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                          Evidence coverage and curation risk across the visible statement set for {selectedItem.id}.
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${dataQualityClass(dataQuality.rating)}`}>{dataQuality.rating}</span>
                        <Badge variant="outline">{dataQuality.score}/100</Badge>
                      </div>
                    </div>

                    <div className="grid gap-3 text-sm md:grid-cols-2 xl:grid-cols-5">
                      <div className="rounded-md border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950">
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Statements</div>
                        <div className="mt-1 text-lg font-semibold text-slate-950 dark:text-slate-50">{dataQuality.statementCount}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{dataQuality.propertyCount} properties</div>
                      </div>
                      <div className="rounded-md border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950">
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">References</div>
                        <div className="mt-1 text-lg font-semibold text-slate-950 dark:text-slate-50">{dataQuality.referencedStatementCount}/{dataQuality.statementCount}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{dataQuality.referenceCount} reference blocks</div>
                      </div>
                      <div className="rounded-md border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950">
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Source Links</div>
                        <div className="mt-1 text-lg font-semibold text-slate-950 dark:text-slate-50">{dataQuality.sourceLinkedStatementCount}/{dataQuality.referencedStatementCount}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{dataQuality.sourceLinkCount} clickable links</div>
                      </div>
                      <div className="rounded-md border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950">
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Qualifier Context</div>
                        <div className="mt-1 text-lg font-semibold text-slate-950 dark:text-slate-50">{dataQuality.qualifiedStatementCount}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{dataQuality.qualifierCount} qualifiers</div>
                      </div>
                      <div className="rounded-md border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950">
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Ranks</div>
                        <div className="mt-1 text-lg font-semibold text-slate-950 dark:text-slate-50">{dataQuality.preferredStatementCount}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{dataQuality.deprecatedStatementCount} deprecated</div>
                      </div>
                    </div>

                    <div className="mt-3 grid gap-3 text-sm lg:grid-cols-2">
                      <div className="rounded-md border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950">
                        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Review focus</div>
                        {dataQuality.issues.length ? (
                          <ul className="space-y-1 text-slate-700 dark:text-slate-200">
                            {dataQuality.issues.slice(0, 3).map((issue) => <li key={issue}>{issue}</li>)}
                          </ul>
                        ) : (
                          <p className="text-slate-700 dark:text-slate-200">No immediate evidence flags in the visible statement set.</p>
                        )}
                      </div>
                      <div className="rounded-md border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950">
                        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Trust signals</div>
                        {dataQuality.strengths.length ? (
                          <ul className="space-y-1 text-slate-700 dark:text-slate-200">
                            {dataQuality.strengths.slice(0, 3).map((strength) => <li key={strength}>{strength}</li>)}
                          </ul>
                        ) : (
                          <p className="text-slate-700 dark:text-slate-200">Add references, qualifiers, or preferred ranks to strengthen this entity.</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                {AI_AGENTS_ENABLED && aiSummary?.entityId === selectedItem.id && (
                  <div className="mb-5 rounded-md border border-sky-200 bg-sky-50 p-4 text-sm text-slate-700 dark:border-sky-900 dark:bg-sky-950 dark:text-slate-200" data-testid="entity-ai-summary">
                    <div className="mb-2 flex items-center gap-2 font-semibold text-slate-950 dark:text-slate-50">
                      <BrainCircuit className="h-4 w-4 text-sky-600 dark:text-sky-300" />
                      Grounded AI summary
                    </div>
                    <p className="whitespace-pre-wrap leading-6">{aiSummary.summary}</p>
                    <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                      Generated from the visible Wikidata label, description, statement values, qualifiers, references, ranks, and IDs for {selectedItem.id}.
                    </p>
                  </div>
                )}

                {AI_AGENTS_ENABLED && (
                <div className="mb-5 rounded-md border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950" data-testid="ag2-agent-panel">
                  <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-950 dark:text-slate-50">
                        <BrainCircuit className="h-4 w-4 text-sky-600 dark:text-sky-300" />
                        AG2 specialist agents
                      </div>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                        Run focused agents against this entity: fetched research, graph analysis, next-entity suggestions, citation checks, comparison, and Markdown reporting.
                      </p>
                    </div>
                    {agentLoading && <Badge variant="secondary">{agentLoading} running</Badge>}
                  </div>

                  {selectedGraphFocus && (
                    <div className="mb-3 flex flex-wrap items-center gap-2 rounded-md border border-sky-200 bg-sky-50 p-3 text-xs text-sky-950 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-100" data-testid="agent-graph-focus">
                      <span className="font-semibold">Graph focus</span>
                      <Badge variant="outline">{selectedGraphFocus.propertyId}</Badge>
                      <span>{selectedGraphFocus.property} -&gt; {selectedGraphFocus.label}</span>
                      <Badge variant="secondary">{selectedGraphFocus.id}</Badge>
                      <Badge variant="outline">{selectedGraphFocus.referenceCount} ref</Badge>
                      <Button type="button" variant="outline" size="sm" onClick={() => setSelectedGraphFocus(null)}>
                        Clear
                      </Button>
                    </div>
                  )}

                  <div className="mb-3 flex flex-col gap-2 rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 sm:flex-row sm:items-center sm:justify-between" data-testid="agent-chat-context-handoff">
                    <div>
                      <div className="font-semibold text-slate-950 dark:text-slate-50">Chat handoff</div>
                      <p className="mt-1">
                        Open AG2 chat with this entity, selected statements, and {selectedGraphFocus ? "the selected path export attached." : "the visible statement context attached."}
                      </p>
                    </div>
                    <Button type="button" variant="outline" size="sm" className="shrink-0 gap-2" onClick={openChatWithVisibleContext}>
                      <MessageSquare className="h-4 w-4" />
                      Open Chat
                    </Button>
                  </div>

                  <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-6">
                    <Button type="button" variant="outline" className="gap-2" onClick={() => runAgentWorkflow("research")} disabled={!!agentLoading}>
                      <Search className="h-4 w-4" />
                      Research
                    </Button>
                    <Button type="button" variant="outline" className="gap-2" onClick={() => runAgentWorkflow("graph")} disabled={!!agentLoading}>
                      <Network className="h-4 w-4" />
                      Graph
                    </Button>
                    <Button type="button" variant="outline" className="gap-2" onClick={() => runAgentWorkflow("suggest")} disabled={!!agentLoading}>
                      <Sparkles className="h-4 w-4" />
                      Suggest
                    </Button>
                    <Button type="button" variant="outline" className="gap-2" onClick={() => runAgentWorkflow("verify")} disabled={!!agentLoading}>
                      <ShieldCheck className="h-4 w-4" />
                      Verify
                    </Button>
                    <Button type="button" variant="outline" className="gap-2" onClick={() => runAgentWorkflow("report")} disabled={!!agentLoading}>
                      <FileText className="h-4 w-4" />
                      Report
                    </Button>
                    <div className="flex gap-2 md:col-span-2 xl:col-span-2">
                      <Input
                        value={compareEntityId}
                        onChange={(event) => setCompareEntityId(event.currentTarget.value.toUpperCase())}
                        placeholder="Q80"
                        className="h-10 min-w-0 bg-white dark:bg-slate-900"
                        aria-label="Comparison entity ID"
                      />
                      <Button type="button" variant="outline" className="gap-2" onClick={() => runAgentWorkflow("compare")} disabled={!!agentLoading}>
                        <GitCompareArrows className="h-4 w-4" />
                        Compare
                      </Button>
                    </div>
                  </div>

                  {agentResult?.entityId === selectedItem.id && (
                    <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-4 text-sm dark:border-slate-800 dark:bg-slate-900" data-testid="ag2-agent-result">
                      <div className="mb-2 flex flex-wrap items-center gap-2 font-semibold text-slate-950 dark:text-slate-50">
                        <Sparkles className="h-4 w-4 text-sky-600 dark:text-sky-300" />
                        {agentResult.title}
                        <Badge variant="outline">{agentResult.action}</Badge>
                        {agentResult.safety && <Badge variant="secondary">{agentResult.safety.modeLabel}</Badge>}
                        {agentResult.safety && <Badge variant="outline">{agentResult.safety.risk} risk</Badge>}
                        {agentResult.graphFocus && <Badge variant="outline">focus {agentResult.graphFocus.propertyId} -&gt; {agentResult.graphFocus.id}</Badge>}
                      </div>
                      {agentResult.safety && (
                        <div className="mb-3 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100">
                          <div className="font-semibold">Safety layer: {agentResult.safety.decisionLabel}</div>
                          <div className="mt-1">{agentResult.safety.reasons[0]}</div>
                          <div className="mt-2 text-emerald-800 dark:text-emerald-200">Controls: {agentResult.safety.requiredControls.join("; ")}</div>
                        </div>
                      )}
                      <div className="whitespace-pre-wrap leading-6 text-slate-700 dark:text-slate-200">{agentResult.result}</div>
                    </div>
                  )}
                </div>
                )}

                <Tabs value={activeTab} onValueChange={(value) => {
                  const tab = value as SearchWorkbenchTab;
                  setActiveTab(tab);
                  replaceWorkbenchUrlState({ tab });
                }}>
                  <TabsList className="mb-4 flex h-auto flex-wrap justify-start">
                    <TabsTrigger value="graph">
                      <Network className="mr-2 h-4 w-4" />
                      Graph
                    </TabsTrigger>
                    <TabsTrigger value="compare">
                      <GitCompareArrows className="mr-2 h-4 w-4" />
                      Compare
                    </TabsTrigger>
                    <TabsTrigger value="statements">Statements</TabsTrigger>
                    <TabsTrigger value="aliases">Aliases</TabsTrigger>
                    <TabsTrigger value="media">Media</TabsTrigger>
                    <TabsTrigger value="languages">Languages</TabsTrigger>
                    <TabsTrigger value="links">Linked Data</TabsTrigger>
                    {AI_AGENTS_ENABLED && <TabsTrigger value="agent-runs">Agent Runs{!!selectedAgentRuns.length && <Badge variant="secondary" className="ml-2">{selectedAgentRuns.length}</Badge>}</TabsTrigger>}
                    <TabsTrigger value="review">Review Queue{!!reviewQueue.length && <Badge variant="secondary" className="ml-2">{reviewQueue.length}</Badge>}</TabsTrigger>
                  </TabsList>

                  <TabsContent value="graph" className="space-y-4">
                    <RelationshipGraph
                      item={selectedItem}
                      onEntityClick={loadEntity}
                      onGraphFocus={setSelectedGraphFocus}
                      filters={graphFilters}
                      selectedNodeId={selectedGraphNodeId}
                      onSelectedNodeIdChange={(nextId) => {
                        setSelectedGraphNodeId(nextId);
                        replaceWorkbenchUrlState({ graphFocusId: nextId });
                      }}
                      onFiltersChange={(nextFilters) => {
                        setGraphFilters(nextFilters);
                        replaceWorkbenchUrlState({ graphFilters: nextFilters });
                      }}
                    />

                    {selectedGraphFocus && (
                      <div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm dark:border-slate-800 dark:bg-slate-900" data-testid="graph-path-export">
                        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <div className="font-semibold text-slate-950 dark:text-slate-50">Selected path export</div>
                            <p className="mt-1 text-slate-600 dark:text-slate-300" data-testid="graph-path-export-summary">
                              {getEntityLabel(selectedItem)} -&gt; {selectedGraphFocus.label} through {selectedGraphFocus.property} ({selectedGraphFocus.propertyId}).
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outline">{selectedGraphFocus.id}</Badge>
                            <Badge variant="secondary">{selectedGraphFocus.referenceCount} ref</Badge>
                          </div>
                        </div>
                        <p className="mb-3 text-xs text-slate-600 dark:text-slate-300">
                          Export this edge as a draft research artifact for reports, handoff notes, or future graph-path sharing. Verify references and qualifiers before using it as evidence.
                        </p>
                        {shareableExportView?.startsWith("graph-") && (
                          <div className="mb-3 flex flex-col gap-2 rounded-md border border-sky-200 bg-sky-50 p-3 text-xs text-slate-700 dark:border-sky-900 dark:bg-sky-950 dark:text-slate-200" data-testid="shareable-export-view">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="font-semibold text-slate-950 dark:text-slate-50">Shareable graph export view</span>
                              <Button type="button" variant="outline" size="sm" onClick={() => updateShareableExportView(null, "graph")}>
                                Close
                              </Button>
                            </div>
                            <p>
                              This URL restores {getEntityLabel(selectedItem)} with the selected {selectedGraphFocus.propertyId} path export open for handoff.
                            </p>
                          </div>
                        )}
                        <div className="grid gap-3 xl:grid-cols-2">
                          <div>
                            <div className="mb-2 flex items-center justify-between gap-2">
                              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Markdown path note</span>
                              <div className="flex gap-2">
                                <Button type="button" variant="outline" size="sm" onClick={() => updateShareableExportView("graph-markdown", "graph")} data-testid="view-graph-markdown-export">
                                  {shareableExportView === "graph-markdown" ? "Viewing" : "View"}
                                </Button>
                                <Button type="button" variant="outline" size="sm" onClick={() => copyDraftToClipboard("Graph path Markdown", graphPathMarkdownDraft)}>
                                  {copiedDraft === "Graph path Markdown" ? "Copied" : "Copy"}
                                </Button>
                              </div>
                            </div>
                            <textarea readOnly value={graphPathMarkdownDraft} className={`h-44 w-full resize-y rounded-md border bg-white p-3 font-mono text-xs text-slate-700 dark:bg-slate-950 dark:text-slate-200 ${shareableExportView === "graph-markdown" ? "border-sky-300 ring-2 ring-sky-100 dark:border-sky-700 dark:ring-sky-950" : "border-slate-200 dark:border-slate-800"}`} aria-label="Graph path Markdown export" data-testid="graph-path-markdown-export" />
                          </div>
                          <div>
                            <div className="mb-2 flex items-center justify-between gap-2">
                              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">JSON path context</span>
                              <div className="flex gap-2">
                                <Button type="button" variant="outline" size="sm" onClick={() => updateShareableExportView("graph-json", "graph")} data-testid="view-graph-json-export">
                                  {shareableExportView === "graph-json" ? "Viewing" : "View"}
                                </Button>
                                <Button type="button" variant="outline" size="sm" onClick={() => copyDraftToClipboard("Graph path JSON", graphPathJsonDraft)}>
                                  {copiedDraft === "Graph path JSON" ? "Copied" : "Copy"}
                                </Button>
                              </div>
                            </div>
                            <textarea readOnly value={graphPathJsonDraft} className={`h-44 w-full resize-y rounded-md border bg-white p-3 font-mono text-xs text-slate-700 dark:bg-slate-950 dark:text-slate-200 ${shareableExportView === "graph-json" ? "border-sky-300 ring-2 ring-sky-100 dark:border-sky-700 dark:ring-sky-950" : "border-slate-200 dark:border-slate-800"}`} aria-label="Graph path JSON export" data-testid="graph-path-json-export" />
                          </div>
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="compare" className="space-y-4">
                    <div className="rounded-md border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900" data-testid="comparison-panel">
                      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <div className="flex items-center gap-2 text-sm font-semibold text-slate-950 dark:text-slate-50">
                            <GitCompareArrows className="h-4 w-4 text-sky-600 dark:text-sky-300" />
                            Entity comparison
                          </div>
                          <p className="mt-1 max-w-3xl text-sm text-slate-600 dark:text-slate-300">
                            Compare visible Wikidata statements for shared properties, distinctive claims, overlapping linked entities, and an optional three-entity property matrix.
                          </p>
                        </div>
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <Input
                            value={compareEntityId}
                            onChange={(event) => setCompareEntityId(event.currentTarget.value.toUpperCase())}
                            placeholder="Q80"
                            className="h-10 min-w-40 bg-white dark:bg-slate-950"
                            aria-label="Comparison target entity ID"
                          />
                          <Button type="button" variant="outline" className="gap-2" onClick={() => loadComparisonTarget()} disabled={comparisonLoading}>
                            <GitCompareArrows className="h-4 w-4" />
                            {comparisonLoading ? "Loading" : "Compare"}
                          </Button>
                          <Input
                            value={compareThirdEntityId}
                            onChange={(event) => setCompareThirdEntityId(event.currentTarget.value.toUpperCase())}
                            placeholder="Q25169"
                            className="h-10 min-w-40 bg-white dark:bg-slate-950"
                            aria-label="Third comparison entity ID"
                          />
                          <Button type="button" variant="outline" className="gap-2" onClick={() => loadComparisonTarget(undefined, "third")} disabled={comparisonLoading || !comparisonItem}>
                            <GitCompareArrows className="h-4 w-4" />
                            Add third
                          </Button>
                        </div>
                      </div>

                      {comparisonError && (
                        <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
                          {comparisonError}
                        </div>
                      )}

                      {!entityComparison ? (
                        <div className="rounded-md border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
                          Start with the seeded target Q80, then add Q25169 for a three-entity property matrix against {selectedItem.id}.
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3" data-testid="comparison-summary">
                            {(entitySetComparison?.entities || [entityComparison.source, entityComparison.target]).map((entity) => (
                              <div key={entity.id} className="rounded-md border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
                                <div className="mb-2 flex flex-wrap items-center gap-2">
                                  <span className="font-semibold text-slate-950 dark:text-slate-50">{entity.label}</span>
                                  <Badge variant="secondary">{entity.id}</Badge>
                                </div>
                                <p className="mb-3 line-clamp-2 text-sm text-slate-600 dark:text-slate-300">{entity.description}</p>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <Badge variant="outline">{entity.propertyCount} properties</Badge>
                                  <Badge variant="outline">{entity.statementCount} statements</Badge>
                                  <Badge variant="outline">{entity.referencedStatementCount} referenced</Badge>
                                  <Badge variant="outline">{entity.sitelinkCount} sitelinks</Badge>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                            <div className="rounded-md border border-slate-200 bg-white p-3 text-sm dark:border-slate-800 dark:bg-slate-950">
                              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Shared properties</div>
                              <div className="mt-1 text-xl font-semibold text-slate-950 dark:text-slate-50">{entityComparison.sharedProperties.length}</div>
                            </div>
                            <div className="rounded-md border border-slate-200 bg-white p-3 text-sm dark:border-slate-800 dark:bg-slate-950">
                              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Unique to {entityComparison.source.id}</div>
                              <div className="mt-1 text-xl font-semibold text-slate-950 dark:text-slate-50">{entityComparison.sourceUniqueProperties.length}</div>
                            </div>
                            <div className="rounded-md border border-slate-200 bg-white p-3 text-sm dark:border-slate-800 dark:bg-slate-950">
                              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Unique to {entityComparison.target.id}</div>
                              <div className="mt-1 text-xl font-semibold text-slate-950 dark:text-slate-50">{entityComparison.targetUniqueProperties.length}</div>
                            </div>
                            <div className="rounded-md border border-slate-200 bg-white p-3 text-sm dark:border-slate-800 dark:bg-slate-950">
                              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Overlapping entities</div>
                              <div className="mt-1 text-xl font-semibold text-slate-950 dark:text-slate-50">{entityComparison.overlappingEntities.length}</div>
                            </div>
                            {entitySetComparison && (
                              <div className="rounded-md border border-sky-200 bg-sky-50 p-3 text-sm dark:border-sky-900 dark:bg-sky-950">
                                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Shared by all</div>
                                <div className="mt-1 text-xl font-semibold text-slate-950 dark:text-slate-50">{entitySetComparison.sharedByAllProperties.length}</div>
                              </div>
                            )}
                          </div>

                          {entitySetComparison && (
                            <div className="rounded-md border border-slate-200 bg-white p-4 text-sm dark:border-slate-800 dark:bg-slate-950" data-testid="comparison-property-matrix">
                              <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                  <div className="font-semibold text-slate-950 dark:text-slate-50">Three-entity property matrix</div>
                                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">Statement counts by property across the source, comparison target, and third entity.</p>
                                </div>
                                <Badge variant="secondary">{entitySetComparison.entities.length} entities</Badge>
                              </div>
                              <div className="overflow-x-auto">
                                <table className="w-full min-w-[720px] text-left text-xs">
                                  <thead className="text-slate-500 dark:text-slate-400">
                                    <tr>
                                      <th className="border-b border-slate-200 py-2 pr-3 dark:border-slate-800">Property</th>
                                      {entitySetComparison.entities.map((entity) => (
                                        <th key={entity.id} className="border-b border-slate-200 px-3 py-2 dark:border-slate-800">{entity.id}</th>
                                      ))}
                                      <th className="border-b border-slate-200 px-3 py-2 dark:border-slate-800">Coverage</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {entitySetComparison.propertyMatrix.slice(0, 10).map((row) => (
                                      <tr key={row.id}>
                                        <td className="border-b border-slate-100 py-2 pr-3 font-medium text-slate-950 dark:border-slate-800 dark:text-slate-50">{row.label} <span className="text-slate-500">{row.id}</span></td>
                                        {row.cells.map((cell) => (
                                          <td key={cell.entityId} className="border-b border-slate-100 px-3 py-2 dark:border-slate-800">{cell.count ? `${cell.count} (${cell.referencedCount} ref)` : "-"}</td>
                                        ))}
                                        <td className="border-b border-slate-100 px-3 py-2 dark:border-slate-800">{row.sharedByAll ? "All" : `${row.presentCount}/${entitySetComparison.entities.length}`}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}

                          <div className="grid gap-4 xl:grid-cols-3">
                            <div className="rounded-md border border-slate-200 bg-white p-4 text-sm dark:border-slate-800 dark:bg-slate-950" data-testid="comparison-shared-properties">
                              <div className="mb-3 font-semibold text-slate-950 dark:text-slate-50">Shared properties</div>
                              <div className="space-y-2">
                                {entityComparison.sharedProperties.slice(0, 8).map((property) => (
                                  <button key={property.id} type="button" onClick={() => loadEntity(property.id)} className="w-full rounded-md border border-slate-200 p-2 text-left hover:bg-sky-50 dark:border-slate-800 dark:hover:bg-slate-900">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className="font-medium">{property.label}</span>
                                      <Badge variant="outline">{property.id}</Badge>
                                    </div>
                                    <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{entityComparison.source.id}: {property.sourceCount}; {entityComparison.target.id}: {property.targetCount}</div>
                                  </button>
                                ))}
                                {entityComparison.sharedProperties.length === 0 && <p className="text-slate-600 dark:text-slate-300">No shared properties in the loaded statement sets.</p>}
                              </div>
                            </div>

                            <div className="rounded-md border border-slate-200 bg-white p-4 text-sm dark:border-slate-800 dark:bg-slate-950">
                              <div className="mb-3 font-semibold text-slate-950 dark:text-slate-50">Distinctive properties</div>
                              <div className="grid gap-3">
                                <div>
                                  <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Only {entityComparison.source.label}</div>
                                  <div className="flex flex-wrap gap-2">
                                    {entityComparison.sourceUniqueProperties.slice(0, 8).map((property) => <Badge key={property.id} variant="outline">{property.label} {property.id}</Badge>)}
                                  </div>
                                </div>
                                <div>
                                  <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Only {entityComparison.target.label}</div>
                                  <div className="flex flex-wrap gap-2">
                                    {entityComparison.targetUniqueProperties.slice(0, 8).map((property) => <Badge key={property.id} variant="outline">{property.label} {property.id}</Badge>)}
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="rounded-md border border-slate-200 bg-white p-4 text-sm dark:border-slate-800 dark:bg-slate-950">
                              <div className="mb-3 font-semibold text-slate-950 dark:text-slate-50">Overlapping linked entities</div>
                              <div className="space-y-2">
                                {entityComparison.overlappingEntities.slice(0, 8).map((entity) => (
                                  <button key={entity.id} type="button" onClick={() => loadEntity(entity.id)} className="w-full rounded-md border border-slate-200 p-2 text-left hover:bg-sky-50 dark:border-slate-800 dark:hover:bg-slate-900">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className="font-medium">{entity.label}</span>
                                      <Badge variant="outline">{entity.id}</Badge>
                                    </div>
                                  </button>
                                ))}
                                {entityComparison.overlappingEntities.length === 0 && <p className="text-slate-600 dark:text-slate-300">No overlapping linked entities in visible statement values.</p>}
                              </div>
                            </div>
                          </div>

                          {shareableExportView?.startsWith("comparison-") && (
                            <div className="flex flex-col gap-2 rounded-md border border-sky-200 bg-sky-50 p-3 text-xs text-slate-700 dark:border-sky-900 dark:bg-sky-950 dark:text-slate-200" data-testid="shareable-export-view">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="font-semibold text-slate-950 dark:text-slate-50">Shareable comparison export view</span>
                                <Button type="button" variant="outline" size="sm" onClick={() => updateShareableExportView(null, "compare")}>
                                  Close
                                </Button>
                              </div>
                              <p>
                                This URL restores {entityComparison.source.id} against {entityComparison.target.id}{comparisonThirdItem ? ` and ${comparisonThirdItem.id}` : ""} with the selected comparison export open for handoff.
                              </p>
                            </div>
                          )}

                          <div className="grid gap-4 xl:grid-cols-2">
                            <div className="rounded-md border border-slate-200 bg-white p-4 text-sm dark:border-slate-800 dark:bg-slate-950">
                              <div className="mb-2 flex items-center justify-between gap-2">
                                <span className="font-semibold text-slate-950 dark:text-slate-50">Markdown comparison export</span>
                                <div className="flex gap-2">
                                  <Button type="button" variant="outline" size="sm" onClick={() => updateShareableExportView("comparison-markdown", "compare")} data-testid="view-comparison-markdown-export">
                                    {shareableExportView === "comparison-markdown" ? "Viewing" : "View"}
                                  </Button>
                                  <Button type="button" variant="outline" size="sm" onClick={() => copyDraftToClipboard("Comparison Markdown", comparisonMarkdownDraft)}>
                                    {copiedDraft === "Comparison Markdown" ? "Copied" : "Copy"}
                                  </Button>
                                </div>
                              </div>
                              <textarea readOnly value={comparisonMarkdownDraft} className={`h-52 w-full resize-y rounded-md border bg-slate-50 p-3 font-mono text-xs text-slate-700 dark:bg-slate-900 dark:text-slate-200 ${shareableExportView === "comparison-markdown" ? "border-sky-300 ring-2 ring-sky-100 dark:border-sky-700 dark:ring-sky-950" : "border-slate-200 dark:border-slate-800"}`} aria-label="Comparison Markdown export" data-testid="comparison-markdown-export" />
                            </div>

                            <div className="rounded-md border border-slate-200 bg-white p-4 text-sm dark:border-slate-800 dark:bg-slate-950">
                              <div className="mb-2 flex items-center justify-between gap-2">
                                <span className="font-semibold text-slate-950 dark:text-slate-50">JSON comparison export</span>
                                <div className="flex gap-2">
                                  <Button type="button" variant="outline" size="sm" onClick={() => updateShareableExportView("comparison-json", "compare")} data-testid="view-comparison-json-export">
                                    {shareableExportView === "comparison-json" ? "Viewing" : "View"}
                                  </Button>
                                  <Button type="button" variant="outline" size="sm" onClick={() => copyDraftToClipboard("Comparison JSON", comparisonJsonDraft)}>
                                    {copiedDraft === "Comparison JSON" ? "Copied" : "Copy"}
                                  </Button>
                                </div>
                              </div>
                              <textarea readOnly value={comparisonJsonDraft} className={`h-52 w-full resize-y rounded-md border bg-slate-50 p-3 font-mono text-xs text-slate-700 dark:bg-slate-900 dark:text-slate-200 ${shareableExportView === "comparison-json" ? "border-sky-300 ring-2 ring-sky-100 dark:border-sky-700 dark:ring-sky-950" : "border-slate-200 dark:border-slate-800"}`} aria-label="Comparison JSON export" data-testid="comparison-json-export" />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="statements" className="space-y-3">
                    {statementGroups.length === 0 && <p className="text-sm text-slate-600 dark:text-slate-300">No statements found.</p>}
                    {statementGroups.slice(0, 80).map((group) => (
                      <div key={group.propertyId} className="rounded-md border border-slate-200 p-3 dark:border-slate-800">
                        <button
                          type="button"
                          className="mb-2 inline-flex items-center gap-2 text-sm font-semibold text-slate-950 hover:text-sky-700 dark:text-slate-50 dark:hover:text-sky-300"
                          onClick={() => loadEntity(group.propertyId)}
                        >
                          {group.propertyLabel}
                          <span className="text-xs text-muted-foreground">{group.propertyId}</span>
                        </button>
                        <ul className="space-y-2 text-sm">
                          {group.statements.slice(0, 8).map((statement, index) => {
                            const statementSourceHints = sourceHintsFromStatement(statement);
                            return (
                              <li key={`${statement.id}-${index}`} className="rounded-md border border-slate-100 p-3 text-slate-700 dark:border-slate-800 dark:text-slate-200">
                                <div className="flex gap-2">
                                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                                  <div className="min-w-0 flex-1">
                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                      <div>{formatStatementValue(statement, loadEntity)}</div>
                                      <div className="flex shrink-0 flex-wrap gap-1" data-testid="statement-evidence-badges">
                                        <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${rankBadgeClass(statement.rank)}`}>{statement.rank}</span>
                                        {statement.references.length ? <Badge variant="secondary">referenced</Badge> : <Badge variant="outline">unreferenced</Badge>}
                                        {!!statement.qualifiers.length && <Badge variant="outline">{statement.qualifiers.length} qualifier{statement.qualifiers.length === 1 ? "" : "s"}</Badge>}
                                        {!!statement.references.length && <Badge variant="outline">{statement.references.length} reference{statement.references.length === 1 ? "" : "s"}</Badge>}
                                        <Badge variant="outline">{statement.value.type}</Badge>
                                      </div>
                                    </div>

                                    <details className="mt-2 rounded-md bg-slate-50 p-2 dark:bg-slate-900" data-testid="statement-detail-view">
                                      <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                        Statement details
                                      </summary>
                                      <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
                                        <div className="rounded border border-slate-200 bg-white p-2 dark:border-slate-800 dark:bg-slate-950">
                                          <div className="font-semibold text-slate-500 dark:text-slate-400">Statement ID</div>
                                          <div className="mt-1 break-all text-slate-700 dark:text-slate-200">{statement.id || "Unavailable"}</div>
                                        </div>
                                        <div className="rounded border border-slate-200 bg-white p-2 dark:border-slate-800 dark:bg-slate-950">
                                          <div className="font-semibold text-slate-500 dark:text-slate-400">Evidence status</div>
                                          <div className="mt-1 text-slate-700 dark:text-slate-200">{statement.references.length ? `${statement.references.length} reference${statement.references.length === 1 ? "" : "s"}` : "No visible references"}</div>
                                        </div>
                                      </div>

                                      {!!statement.qualifiers.length && (
                                        <div className="mt-3 space-y-2">
                                          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Qualifiers</div>
                                          {statement.qualifiers.map((qualifier, qualifierIndex) => (
                                            <div key={`${statement.id}-qualifier-${qualifierIndex}`} className="grid gap-1 rounded border border-slate-200 bg-white p-2 dark:border-slate-800 dark:bg-slate-950 sm:grid-cols-[180px_1fr]">
                                              <div className="text-xs text-slate-500 dark:text-slate-400">{qualifier.property.label || qualifier.property.id}</div>
                                              <div>{formatValue(qualifier.value, loadEntity)}</div>
                                            </div>
                                          ))}
                                        </div>
                                      )}

                                      {!!statement.references.length && (
                                        <div className="mt-3 space-y-2">
                                          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">References</div>
                                          {statement.references.map((reference, referenceIndex) => (
                                            <div key={reference.hash || `${statement.id}-reference-${referenceIndex}`} className="rounded border border-slate-200 bg-white p-2 dark:border-slate-800 dark:bg-slate-950">
                                              <div className="mb-2 text-xs text-slate-500 dark:text-slate-400">Reference {referenceIndex + 1}</div>
                                              <div className="space-y-2">
                                                {reference.parts.map((part, partIndex) => (
                                                  <div key={`${reference.hash}-${partIndex}`} className="grid gap-1 sm:grid-cols-[180px_1fr]">
                                                    <div className="text-xs text-slate-500 dark:text-slate-400">{part.property.label || part.property.id}</div>
                                                    <div>{formatValue(part.value, loadEntity)}</div>
                                                  </div>
                                                ))}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      )}

                                      <SourceHintList hints={statementSourceHints} />
                                    </details>
                                  </div>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ))}
                  </TabsContent>

                  <TabsContent value="aliases">
                    <div className="flex flex-wrap gap-2">
                      {(selectedItem.aliases.en || []).length === 0 && <p className="text-sm text-slate-600 dark:text-slate-300">No English aliases found.</p>}
                      {(selectedItem.aliases.en || []).map((alias) => (
                        <Badge key={alias} variant="outline">{alias}</Badge>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="media">
                    {mediaError ? (
                      <p className="text-sm text-amber-700 dark:text-amber-300">{mediaError}</p>
                    ) : Object.keys(mediaInfo).length === 0 ? (
                      <p className="text-sm text-slate-600 dark:text-slate-300">No Commons media found for this entity.</p>
                    ) : (
                      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {Object.entries(mediaInfo).map(([title, info]) => (
                          <div key={title} className="rounded-md border border-slate-200 p-3 dark:border-slate-800">
                            {info.mediatype === "BITMAP" && (
                              <Image src={info.url} alt={title} width={640} height={420} className="mb-3 h-48 w-full rounded object-contain" />
                            )}
                            {info.mediatype === "AUDIO" && <audio controls src={info.url} className="mb-3 w-full" />}
                            {info.mediatype === "VIDEO" && <video controls src={info.url} className="mb-3 w-full" />}
                            {info.mediatype === "OTHER" && <ImageIcon className="mb-3 h-8 w-8 text-slate-400" />}
                            <div className="flex items-start gap-2 text-sm">
                              {info.mediatype === "AUDIO" ? <FileAudio className="h-4 w-4" /> : info.mediatype === "VIDEO" ? <FileVideo className="h-4 w-4" /> : <ImageIcon className="h-4 w-4" />}
                              <div>
                                <p className="font-medium">{title}</p>
                                <p className="text-xs text-slate-500">{info.mime}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="languages">
                    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                      {languageRows.map((row) => (
                        <div key={row.code} className="rounded-md border border-slate-200 p-3 text-sm dark:border-slate-800">
                          <div className="mb-1 flex items-center justify-between gap-2">
                            <span className="font-medium">{row.name}</span>
                            <Badge variant="outline">{row.code}</Badge>
                          </div>
                          <p className="text-slate-600 dark:text-slate-300">{row.label}</p>
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  {AI_AGENTS_ENABLED && <TabsContent value="agent-runs" className="space-y-3">
                    {selectedAgentRuns.length === 0 ? (
                      <div className="rounded-md border border-dashed border-slate-300 p-5 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300">
                        Run an AG2 specialist agent to save research history for {selectedItem.id}.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-sm text-slate-600 dark:text-slate-300">Saved locally in this browser for {selectedItem.id}.</div>
                          <Button type="button" variant="outline" size="sm" onClick={() => setSavedAgentRuns((runs) => runs.filter((run) => run.entityId !== selectedItem.id))}>
                            Clear Entity Runs
                          </Button>
                        </div>
                        {selectedAgentRuns.map((run) => (
                          <div key={run.id} className="rounded-md border border-slate-200 bg-white p-4 text-sm dark:border-slate-800 dark:bg-slate-950">
                            <div className="mb-2 flex flex-wrap items-center gap-2">
                              <span className="font-semibold text-slate-950 dark:text-slate-50">{run.title}</span>
                              <Badge variant="outline">{run.action}</Badge>
                              {run.compareEntityId && <Badge variant="secondary">vs {run.compareEntityId}</Badge>}
                              {run.graphFocus && <Badge variant="outline">focus {run.graphFocus.propertyId} -&gt; {run.graphFocus.id}</Badge>}
                              {run.safety && <Badge variant="secondary">{run.safety.modeLabel}</Badge>}
                              <span className="text-xs text-slate-500 dark:text-slate-400">{new Date(run.createdAt).toLocaleString()}</span>
                            </div>
                            <p className="line-clamp-3 text-slate-700 dark:text-slate-200">{run.result}</p>
                            <div className="mt-3 flex flex-wrap gap-2">
                              <Button type="button" variant="outline" size="sm" onClick={() => setAgentResult({ entityId: run.entityId, action: run.action, title: run.title, result: run.result, safety: run.safety, graphFocus: run.graphFocus })}>
                                Restore Result
                              </Button>
                              <Button type="button" variant="outline" size="sm" onClick={() => setSavedAgentRuns((runs) => runs.filter((item) => item.id !== run.id))}>
                                Remove
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>}

                  <TabsContent value="review" className="space-y-3">
                    {reviewQueue.length === 0 ? (
                      <div className="rounded-md border border-dashed border-slate-300 p-5 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300">
                        No active review flags for visible statements on {selectedItem.id}.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex flex-col gap-2 text-sm text-slate-600 dark:text-slate-300 sm:flex-row sm:items-center sm:justify-between">
                          <span>{reviewQueue.length} evidence and trust item{reviewQueue.length === 1 ? "" : "s"} need attention; {reviewQueueWithStatus.filter((item) => item.status === "ready_to_draft").length} ready to draft.</span>
                          <Button type="button" variant="outline" size="sm" onClick={() => setDismissedReviewIds((ids) => [...ids, ...reviewQueue.map((item) => item.id)])}>
                            Dismiss Visible
                          </Button>
                        </div>

                        <div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm dark:border-slate-800 dark:bg-slate-900">
                          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <div className="font-semibold text-slate-950 dark:text-slate-50">Bot-ready draft exports</div>
                              <p className="mt-1 text-slate-600 dark:text-slate-300">
                                Export review findings as safe draft artifacts. QuickStatements rows are commented out until a human adds sources and approves live edits. Persisted task statuses travel with the draft artifacts.
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <Badge variant={draftSafety.allowed ? "secondary" : "destructive"}>{draftSafety.decisionLabel}</Badge>
                              <Badge variant="outline">{draftSafety.risk} risk</Badge>
                            </div>
                          </div>
                          <div className="mb-3 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100">
                            <div className="font-semibold">{draftSafety.modeLabel}</div>
                            <div className="mt-1">{draftSafety.reasons[0]}</div>
                            <div className="mt-2 text-emerald-800 dark:text-emerald-200">Controls: {draftSafety.requiredControls.join("; ")}</div>
                          </div>
                          <div className="grid gap-3 xl:grid-cols-2">
                            <div>
                              <div className="mb-2 flex items-center justify-between gap-2">
                                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">QuickStatements draft</span>
                                <Button type="button" variant="outline" size="sm" onClick={() => copyDraftToClipboard("QuickStatements draft", quickStatementsDraft)}>
                                  {copiedDraft === "QuickStatements draft" ? "Copied" : "Copy"}
                                </Button>
                              </div>
                              <textarea readOnly value={quickStatementsDraft} className="h-40 w-full resize-y rounded-md border border-slate-200 bg-white p-3 font-mono text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200" aria-label="QuickStatements draft export" />
                            </div>
                            <div>
                              <div className="mb-2 flex items-center justify-between gap-2">
                                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Markdown review notes</span>
                                <Button type="button" variant="outline" size="sm" onClick={() => copyDraftToClipboard("Markdown review notes", markdownDraft)}>
                                  {copiedDraft === "Markdown review notes" ? "Copied" : "Copy"}
                                </Button>
                              </div>
                              <textarea readOnly value={markdownDraft} className="h-40 w-full resize-y rounded-md border border-slate-200 bg-white p-3 font-mono text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200" aria-label="Markdown review notes export" />
                            </div>
                          </div>
                        </div>

                        {reviewQueueWithStatus.map((item) => (
                          <div key={item.id} className="rounded-md border border-slate-200 bg-white p-4 text-sm dark:border-slate-800 dark:bg-slate-950">
                            <div className="mb-2 flex flex-wrap items-center gap-2">
                              <span className="font-semibold text-slate-950 dark:text-slate-50">{item.title}</span>
                              <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${getSeverityClass(item.severity)}`}>{item.severity}</span>
                              <Badge variant="outline">{item.propertyLabel}</Badge>
                              <Badge variant="secondary">{item.propertyId}</Badge>
                              <Badge variant="outline">{item.statusLabel}</Badge>
                            </div>
                            <p className="text-slate-700 dark:text-slate-200">{item.detail}</p>
                            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Value: {item.value}</p>
                            {item.sourceHints.length > 0 && (
                              <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-800 dark:bg-slate-900">
                                <div className="font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Source hints</div>
                                <ul className="mt-2 space-y-1">
                                  {item.sourceHints.map((hint, index) => (
                                    <li key={`${hint.propertyId}-${hint.value}-${index}`} className="break-words text-slate-600 dark:text-slate-300">
                                      <span className="font-medium text-slate-800 dark:text-slate-100">{sourceHintKindLabel(hint.kind)}</span>
                                      <span className="text-slate-500 dark:text-slate-400"> - {hint.propertyLabel || hint.propertyId}</span>: {hint.url ? (
                                        <a className="text-sky-700 underline-offset-2 hover:underline dark:text-sky-300" href={hint.url} target="_blank" rel="noopener noreferrer">
                                          {hint.value}
                                        </a>
                                      ) : (
                                        <span>{hint.value}</span>
                                      )}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            <label className="mt-3 grid max-w-xs gap-1 text-xs font-medium text-slate-600 dark:text-slate-300">
                              <span>Task status</span>
                              <select
                                value={item.status}
                                onChange={(event) => updateReviewTaskStatus(item.id, event.currentTarget.value as ReviewTaskStatus)}
                                className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm text-slate-950 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50"
                                aria-label={`Review status for ${item.propertyLabel}`}
                              >
                                {REVIEW_TASK_STATUS_OPTIONS.map((option) => (
                                  <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                              </select>
                            </label>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {AI_AGENTS_ENABLED && (
                                <Button type="button" variant="outline" size="sm" onClick={() => runAgentWorkflow("verify")} disabled={!!agentLoading}>
                                  Run Verifier
                                </Button>
                              )}
                              <Button type="button" variant="outline" size="sm" onClick={() => setDismissedReviewIds((ids) => ids.includes(item.id) ? ids : [...ids, item.id])}>
                                Dismiss
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="links">
                    {!linkedData ? (
                      <div className="rounded-md border border-dashed border-slate-300 p-5 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300">
                        Click Links to collect related entities and properties from this item.
                      </div>
                    ) : (
                      <div className="grid gap-4 lg:grid-cols-2">
                        <div>
                          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Related Items ({linkedData.items.length})</h3>
                          <div className="max-h-[420px] space-y-2 overflow-y-auto pr-2">
                            {linkedData.items.map((item) => (
                              <button key={item.id} type="button" onClick={() => loadEntity(item.id)} className="flex w-full items-center justify-between rounded-md border border-slate-200 p-2 text-left text-sm hover:bg-sky-50 dark:border-slate-800 dark:hover:bg-slate-800">
                                <span>{item.label}</span>
                                <Badge variant="outline">{item.id}</Badge>
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Properties ({linkedData.properties.length})</h3>
                          <div className="max-h-[420px] space-y-2 overflow-y-auto pr-2">
                            {linkedData.properties.map((property) => (
                              <button key={property.id} type="button" onClick={() => loadEntity(property.id)} className="flex w-full items-center justify-between rounded-md border border-slate-200 p-2 text-left text-sm hover:bg-sky-50 dark:border-slate-800 dark:hover:bg-slate-800">
                                <span>{property.label}</span>
                                <Badge variant="outline">{property.id}</Badge>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </Card>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
