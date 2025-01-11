"use client";

import { useState } from "react";
import { WikidataClient } from "@/lib/wikidata";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function EntityViewer() {
  const [entityId, setEntityId] = useState("");
  const [entity, setEntity] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const client = new WikidataClient();

  async function loadEntity() {
    if (!entityId) return;

    setLoading(true);
    setError(null);

    try {
      const data = entityId.startsWith("P")
        ? await client.getProperty(entityId)
        : await client.getItem(entityId);
      setEntity(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load entity");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <Card className="p-6">
        <div className="flex gap-4 mb-6">
          <Input
            placeholder="Enter Wikidata ID (e.g. Q42 or P31)"
            value={entityId}
            onChange={(e) => setEntityId(e.target.value)}
          />
          <Button onClick={loadEntity} disabled={loading}>
            {loading ? "Loading..." : "Load"}
          </Button>
        </div>

        {error && <div className="text-red-500 mb-4">{error}</div>}

        {entity && (
          <Tabs defaultValue="info">
            <TabsList>
              <TabsTrigger value="info">Basic Info</TabsTrigger>
              <TabsTrigger value="statements">Statements</TabsTrigger>
              {entity.type === "item" && (
                <TabsTrigger value="sitelinks">Sitelinks</TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="info" className="mt-4">
              <h2 className="text-2xl font-bold mb-4">
                {entity.labels.en || entity.id}
              </h2>

              <div className="mb-4">
                <h3 className="font-semibold mb-2">Description</h3>
                <p>{entity.descriptions.en || "No English description"}</p>
              </div>

              {entity.aliases.en?.length > 0 && (
                <div className="mb-4">
                  <h3 className="font-semibold mb-2">Aliases</h3>
                  <ul className="list-disc pl-5">
                    {entity.aliases.en.map((alias: string) => (
                      <li key={alias}>{alias}</li>
                    ))}
                  </ul>
                </div>
              )}
            </TabsContent>

            <TabsContent value="statements" className="mt-4">
              <div className="space-y-4">
                {Object.entries(entity.statements).map(([pid, statements]) => (
                  <div key={pid} className="border-b pb-4">
                    <h3 className="font-semibold mb-2">{pid}</h3>
                    <ul className="space-y-2">
                      {statements.map((statement: any) => (
                        <li key={statement.id} className="ml-4">
                          {statement.value.type === "value" ? (
                            <span>
                              {JSON.stringify(statement.value.content)}
                            </span>
                          ) : (
                            <span>{statement.value.type}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </TabsContent>

            {entity.type === "item" && (
              <TabsContent value="sitelinks" className="mt-4">
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(entity.sitelinks).map(
                    ([site, link]: [string, any]) => (
                      <a
                        key={site}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 hover:bg-gray-100 rounded"
                      >
                        {site}: {link.title}
                      </a>
                    ),
                  )}
                </div>
              </TabsContent>
            )}
          </Tabs>
        )}
      </Card>
    </div>
  );
}
