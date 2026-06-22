"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { BrainCircuit, Database, FileAudio, FileText, FileVideo, GitCompareArrows, Globe, Image as ImageIcon, Info, Network, Search, ShieldCheck, Sparkles } from "lucide-react";
import { searchWikidata, WikidataClient, type WikidataItem, type WikidataLanguage, type WikidataMediaInfo, type WikidataStatement } from "@/lib/wikidata";
import { RelationshipGraph } from "@/components/relationship-graph";
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

type AgentAction = "research" | "graph" | "verify" | "compare" | "report";

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
  createdAt: string;
};

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
};

const AGENT_RUNS_STORAGE_KEY = "wikidata-explorer.agentRuns.v1";
const DISMISSED_REVIEW_STORAGE_KEY = "wikidata-explorer.dismissedReviewItems.v1";

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

function statementHasEvidence(statement: WikidataStatement) {
  return statement.qualifiers.length > 0 || statement.references.length > 0;
}

function getSeverityClass(severity: ReviewQueueItem["severity"]) {
  if (severity === "high") return "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-200";
  return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200";
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

function buildReviewQueue(item: WikidataItem | null, dismissedIds: string[]): ReviewQueueItem[] {
  if (!item) return [];

  const dismissed = new Set(dismissedIds);
  const items: ReviewQueueItem[] = [];

  for (const statement of Object.values(item.statements).flat()) {
    const statementId = statement.id || `${item.id}-${statement.property.id}-${formatValueText(statement.value)}`;
    const baseId = `${item.id}:${statementId}`;
    const propertyLabel = statement.property.label || statement.property.id;
    const value = formatValueText(statement.value);

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
        });
      }
    }
  }

  return items
    .sort((a, b) => (a.severity === b.severity ? a.propertyLabel.localeCompare(b.propertyLabel) : a.severity === "high" ? -1 : 1))
    .slice(0, 24);
}

function buildSummaryContext(item: WikidataItem) {
  return Object.values(item.statements)
    .flat()
    .slice(0, 16)
    .map((statement) => ({
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
    }));
}

function getInitialSearchTerm() {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get("q") || "";
}

function getInitialAgentAction(): AgentAction | null {
  if (typeof window === "undefined") return null;
  const action = new URLSearchParams(window.location.search).get("agent");
  return action === "research" || action === "graph" || action === "verify" || action === "compare" || action === "report" ? action : null;
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
  const [searchTerm, setSearchTerm] = useState(getInitialSearchTerm);
  const [results, setResults] = useState<WikidataItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<WikidataItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableLanguages, setAvailableLanguages] = useState<Record<string, WikidataLanguage>>({});
  const [mediaInfo, setMediaInfo] = useState<Record<string, WikidataMediaInfo>>({});
  const [linkedData, setLinkedData] = useState<LinkedData | null>(null);
  const [aiSummary, setAiSummary] = useState<AiSummaryState>(null);
  const [agentResult, setAgentResult] = useState<AgentResultState>(null);
  const [agentLoading, setAgentLoading] = useState<AgentAction | null>(null);
  const [compareEntityId, setCompareEntityId] = useState("Q80");
  const [savedAgentRuns, setSavedAgentRuns] = useState<SavedAgentRun[]>([]);
  const [dismissedReviewIds, setDismissedReviewIds] = useState<string[]>([]);
  const queuedAgentActionRef = useRef<AgentAction | null>(getInitialAgentAction());
  const storageHydratedRef = useRef(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setSavedAgentRuns(readJsonArray<SavedAgentRun>(AGENT_RUNS_STORAGE_KEY).slice(0, 40));
      setDismissedReviewIds(readJsonArray<string>(DISMISSED_REVIEW_STORAGE_KEY));
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
        return;
      }

      setMediaInfo({});

      try {
        const media = await client.fetchCommonsMedia(files.slice(0, 12));
        if (!cancelled) setMediaInfo(media);
      } catch {
        if (!cancelled) setMediaInfo({});
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

  const reviewQueue = useMemo(() => buildReviewQueue(selectedItem, dismissedReviewIds), [dismissedReviewIds, selectedItem]);

  const runSearch = useCallback(async (rawQuery: string) => {
    const query = rawQuery.trim();
    if (!query) {
      setError("Enter a Wikidata search term or entity ID.");
      return;
    }

    setLoading(true);
    setError(null);
    setLinkedData(null);
    setAiSummary(null);
    setAgentResult(null);

    try {
      if (/^[QP]\d+$/i.test(query)) {
        const entity = await client.getDetailedEntity(query.toUpperCase());
        setResults([entity]);
        setSelectedItem(entity);
      } else {
        const searchResults = await searchWikidata(query);
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
    if (!initialQuery) return;

    const timeout = window.setTimeout(() => {
      void runSearch(initialQuery);
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [runSearch]);

  async function handleSearch(event: React.FormEvent) {
    event.preventDefault();
    await runSearch(searchTerm);
  }


  async function loadEntity(id: string) {
    setDetailLoading(true);
    setError(null);
    setLinkedData(null);
    setAiSummary(null);
    setAgentResult(null);

    try {
      const entity = await client.getDetailedEntity(id);
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

  async function summarizeEntity() {
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
    if (!selectedItem || agentLoading) return;

    const normalizedCompareId = compareEntityId.trim().toUpperCase();
    if (action === "compare" && !/^[QP]\d+$/.test(normalizedCompareId)) {
      setError("Enter a valid Wikidata ID to compare, such as Q80.");
      return;
    }

    const titles: Record<AgentAction, string> = {
      research: "Wikidata Research Agent",
      graph: "Graph Analyst Agent",
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
      };
      const savedRun: SavedAgentRun = {
        ...nextResult,
        id: `${selectedItem.id}-${action}-${Date.now()}`,
        entityLabel: getEntityLabel(selectedItem),
        compareEntityId: action === "compare" ? normalizedCompareId : undefined,
        createdAt: new Date().toISOString(),
      };

      setAgentResult(nextResult);
      setSavedAgentRuns((previous) => [savedRun, ...previous].slice(0, 40));
    } catch (err) {
      setError(err instanceof Error ? err.message : "The AG2 workflow could not complete.");
    } finally {
      setAgentLoading(null);
    }
  }, [agentLoading, compareEntityId, selectedItem]);

  useEffect(() => {
    const action = queuedAgentActionRef.current;
    if (!selectedItem || !action || agentLoading || agentResult?.entityId === selectedItem.id) return;

    queuedAgentActionRef.current = null;
    void runAgentWorkflow(action);
  }, [agentLoading, agentResult?.entityId, runAgentWorkflow, selectedItem]);
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
                    <Button type="button" variant="outline" className="gap-2" onClick={summarizeEntity} disabled={summaryLoading}>
                      <Sparkles className="h-4 w-4" />
                      {summaryLoading ? "Summarizing" : "Summarize"}
                    </Button>
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

                {aiSummary?.entityId === selectedItem.id && (
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

                <div className="mb-5 rounded-md border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950" data-testid="ag2-agent-panel">
                  <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-950 dark:text-slate-50">
                        <BrainCircuit className="h-4 w-4 text-sky-600 dark:text-sky-300" />
                        AG2 specialist agents
                      </div>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                        Run focused agents against this entity: fetched research, graph analysis, citation checks, comparison, and Markdown reporting.
                      </p>
                    </div>
                    {agentLoading && <Badge variant="secondary">{agentLoading} running</Badge>}
                  </div>

                  <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-5">
                    <Button type="button" variant="outline" className="gap-2" onClick={() => runAgentWorkflow("research")} disabled={!!agentLoading}>
                      <Search className="h-4 w-4" />
                      Research
                    </Button>
                    <Button type="button" variant="outline" className="gap-2" onClick={() => runAgentWorkflow("graph")} disabled={!!agentLoading}>
                      <Network className="h-4 w-4" />
                      Graph
                    </Button>
                    <Button type="button" variant="outline" className="gap-2" onClick={() => runAgentWorkflow("verify")} disabled={!!agentLoading}>
                      <ShieldCheck className="h-4 w-4" />
                      Verify
                    </Button>
                    <Button type="button" variant="outline" className="gap-2" onClick={() => runAgentWorkflow("report")} disabled={!!agentLoading}>
                      <FileText className="h-4 w-4" />
                      Report
                    </Button>
                    <div className="flex gap-2">
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

                <Tabs defaultValue="graph">
                  <TabsList className="mb-4 flex h-auto flex-wrap justify-start">
                    <TabsTrigger value="graph">
                      <Network className="mr-2 h-4 w-4" />
                      Graph
                    </TabsTrigger>
                    <TabsTrigger value="statements">Statements</TabsTrigger>
                    <TabsTrigger value="aliases">Aliases</TabsTrigger>
                    <TabsTrigger value="media">Media</TabsTrigger>
                    <TabsTrigger value="languages">Languages</TabsTrigger>
                    <TabsTrigger value="links">Linked Data</TabsTrigger>
                    <TabsTrigger value="agent-runs">Agent Runs{!!selectedAgentRuns.length && <Badge variant="secondary" className="ml-2">{selectedAgentRuns.length}</Badge>}</TabsTrigger>
                    <TabsTrigger value="review">Review Queue{!!reviewQueue.length && <Badge variant="secondary" className="ml-2">{reviewQueue.length}</Badge>}</TabsTrigger>
                  </TabsList>

                  <TabsContent value="graph">
                    <RelationshipGraph item={selectedItem} onEntityClick={loadEntity} />
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
                          {group.statements.slice(0, 8).map((statement, index) => (
                            <li key={`${statement.id}-${index}`} className="rounded-md border border-slate-100 p-3 text-slate-700 dark:border-slate-800 dark:text-slate-200">
                              <div className="flex gap-2">
                                <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                    <div>{formatStatementValue(statement, loadEntity)}</div>
                                    <div className="flex shrink-0 flex-wrap gap-1">
                                      <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${rankBadgeClass(statement.rank)}`}>{statement.rank}</span>
                                      {!!statement.qualifiers.length && <Badge variant="outline">{statement.qualifiers.length} qualifier{statement.qualifiers.length === 1 ? "" : "s"}</Badge>}
                                      {!!statement.references.length && <Badge variant="outline">{statement.references.length} reference{statement.references.length === 1 ? "" : "s"}</Badge>}
                                    </div>
                                  </div>

                                  {statementHasEvidence(statement) && (
                                    <details className="mt-2 rounded-md bg-slate-50 p-2 dark:bg-slate-900">
                                      <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                        Evidence details
                                      </summary>
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
                                    </details>
                                  )}
                                </div>
                              </div>
                            </li>
                          ))}
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
                    {Object.keys(mediaInfo).length === 0 ? (
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

                  <TabsContent value="agent-runs" className="space-y-3">
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
                              {run.safety && <Badge variant="secondary">{run.safety.modeLabel}</Badge>}
                              <span className="text-xs text-slate-500 dark:text-slate-400">{new Date(run.createdAt).toLocaleString()}</span>
                            </div>
                            <p className="line-clamp-3 text-slate-700 dark:text-slate-200">{run.result}</p>
                            <div className="mt-3 flex flex-wrap gap-2">
                              <Button type="button" variant="outline" size="sm" onClick={() => setAgentResult({ entityId: run.entityId, action: run.action, title: run.title, result: run.result, safety: run.safety })}>
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
                  </TabsContent>

                  <TabsContent value="review" className="space-y-3">
                    {reviewQueue.length === 0 ? (
                      <div className="rounded-md border border-dashed border-slate-300 p-5 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300">
                        No active review flags for visible statements on {selectedItem.id}.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex flex-col gap-2 text-sm text-slate-600 dark:text-slate-300 sm:flex-row sm:items-center sm:justify-between">
                          <span>{reviewQueue.length} evidence and trust item{reviewQueue.length === 1 ? "" : "s"} need attention.</span>
                          <Button type="button" variant="outline" size="sm" onClick={() => setDismissedReviewIds((ids) => [...ids, ...reviewQueue.map((item) => item.id)])}>
                            Dismiss Visible
                          </Button>
                        </div>
                        {reviewQueue.map((item) => (
                          <div key={item.id} className="rounded-md border border-slate-200 bg-white p-4 text-sm dark:border-slate-800 dark:bg-slate-950">
                            <div className="mb-2 flex flex-wrap items-center gap-2">
                              <span className="font-semibold text-slate-950 dark:text-slate-50">{item.title}</span>
                              <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${getSeverityClass(item.severity)}`}>{item.severity}</span>
                              <Badge variant="outline">{item.propertyLabel}</Badge>
                              <Badge variant="secondary">{item.propertyId}</Badge>
                            </div>
                            <p className="text-slate-700 dark:text-slate-200">{item.detail}</p>
                            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Value: {item.value}</p>
                            <div className="mt-3 flex flex-wrap gap-2">
                              <Button type="button" variant="outline" size="sm" onClick={() => runAgentWorkflow("verify")} disabled={!!agentLoading}>
                                Run Verifier
                              </Button>
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


