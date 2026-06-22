"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Database, FileAudio, FileVideo, Globe, Image as ImageIcon, Info, Network, Search } from "lucide-react";
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

function formatStatementValue(statement: WikidataStatement, onEntityClick: (id: string) => void) {
  const { type, content } = statement.value;

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

function getInitialSearchTerm() {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get("q") || "";
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
  const [error, setError] = useState<string | null>(null);
  const [availableLanguages, setAvailableLanguages] = useState<Record<string, WikidataLanguage>>({});
  const [mediaInfo, setMediaInfo] = useState<Record<string, WikidataMediaInfo>>({});
  const [linkedData, setLinkedData] = useState<LinkedData | null>(null);

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

  const runSearch = useCallback(async (rawQuery: string) => {
    const query = rawQuery.trim();
    if (!query) {
      setError("Enter a Wikidata search term or entity ID.");
      return;
    }

    setLoading(true);
    setError(null);
    setLinkedData(null);

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
                  <div className="flex gap-2">
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
                            <li key={`${statement.id}-${index}`} className="flex gap-2 text-slate-700 dark:text-slate-200">
                              <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                              <div>{formatStatementValue(statement, loadEntity)}</div>
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