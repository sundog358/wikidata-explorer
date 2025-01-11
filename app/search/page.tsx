"use client";

import { useState } from "react";
import { searchWikidata, WikidataItem } from "@/lib/wikidata";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { WikidataClient } from "@/lib/wikidata";

export default function SearchPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<WikidataItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<WikidataItem | null>(null);
  const [loading, setLoading] = useState(false);
  const client = new WikidataClient();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const searchResults = await searchWikidata(searchTerm);
      setResults(searchResults);
      setSelectedItem(null);
    } catch (error) {
      console.error("Search error:", error);
    }
    setLoading(false);
  };

  const handleItemClick = async (item: WikidataItem) => {
    setLoading(true);
    try {
      const detailedItem = await client.getDetailedEntity(item.id);
      setSelectedItem(detailedItem);
    } catch (error) {
      console.error("Error fetching details:", error);
    }
    setLoading(false);
  };

  const handlePropertyClick = async (property: string) => {
    try {
      setLoading(true);
      // Extract property ID if it exists in the claim
      const propertyId =
        Object.values(selectedItem?.statements || {})
          .flat()
          .find((claim) => claim.propertyId === property)?.propertyId ||
        property;

      if (!propertyId) {
        console.warn("No property ID found for:", property);
        return;
      }

      const client = new WikidataClient();
      const detailedProperty = await client.getDetailedEntity(propertyId);
      setSelectedItem(detailedProperty);
    } catch (error) {
      console.error("Error fetching property details:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEntityClick = async (entityId: string) => {
    setLoading(true);
    try {
      const detailedItem = await client.getDetailedEntity(entityId);
      setSelectedItem(detailedItem);
    } catch (error) {
      console.error("Error fetching details:", error);
    }
    setLoading(false);
  };

  return (
    <div className="container mx-auto p-4 space-y-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search Wikidata..."
          className="flex-1"
        />
        <Button type="submit" disabled={loading}>
          {loading ? "Searching..." : "Search"}
        </Button>
      </form>

      <div className="grid gap-4">
        {results.map((item) => (
          <div
            key={item.id}
            className="p-4 border rounded-lg hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => handleItemClick(item)}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold">
                  {item.labels?.["en"] || item.id}
                </h3>
                <p className="text-gray-600">
                  {item.descriptions?.["en"] || "No description available"}
                </p>
                {selectedItem?.id === item.id && (
                  <div className="mt-4 space-y-4">
                    {/* Aliases */}
                    {selectedItem.aliases?.["en"]?.length > 0 && (
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <h4 className="font-semibold text-gray-700">
                          Also known as:
                        </h4>
                        <p className="text-gray-600">
                          {Array.isArray(selectedItem.aliases["en"])
                            ? selectedItem.aliases["en"].join(", ")
                            : "No aliases available"}
                        </p>
                      </div>
                    )}

                    {/* Statements/Claims */}
                    {Object.keys(selectedItem.statements || {}).length > 0 && (
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <h4 className="font-semibold text-gray-700">
                          Properties:
                        </h4>
                        <div className="space-y-2 mt-2">
                          {Object.entries(selectedItem.statements).map(
                            ([property, claims]) => (
                              <div
                                key={property}
                                className="border-b border-gray-200 pb-2"
                              >
                                <span
                                  className="font-medium text-gray-800 cursor-pointer hover:text-blue-600"
                                  onClick={() => handlePropertyClick(property)}
                                >
                                  {property}:
                                </span>
                                <ul className="ml-4 space-y-1">
                                  {Array.isArray(claims) &&
                                    claims.map((claim: any, idx: number) => (
                                      <li key={idx} className="text-gray-600">
                                        {claim.type === "image" ? (
                                          <img
                                            src={claim.url}
                                            alt={claim.value}
                                            className="max-w-xs h-auto rounded-lg my-2"
                                          />
                                        ) : claim.entityId ? (
                                          <span
                                            className="cursor-pointer hover:text-blue-600"
                                            onClick={() =>
                                              handleEntityClick(claim.entityId)
                                            }
                                          >
                                            {typeof claim.value === "object"
                                              ? claim.value.value
                                              : claim.value}
                                          </span>
                                        ) : (
                                          <span>
                                            {typeof claim.value === "object"
                                              ? claim.value.value
                                              : typeof claim === "object"
                                              ? claim.value
                                              : claim}
                                          </span>
                                        )}
                                        {/* Qualifiers */}
                                        {Object.keys(claim.qualifiers || {})
                                          .length > 0 && (
                                          <ul className="ml-4 text-sm text-gray-500">
                                            {Object.entries(
                                              claim.qualifiers
                                            ).map(([qProp, qVals]) => (
                                              <li key={qProp}>
                                                <span
                                                  className="cursor-pointer hover:text-blue-600"
                                                  onClick={() =>
                                                    handlePropertyClick(qProp)
                                                  }
                                                >
                                                  {qProp}
                                                </span>
                                                :{" "}
                                                {Array.isArray(qVals)
                                                  ? qVals
                                                      .map((val: any) =>
                                                        typeof val === "object"
                                                          ? val.value
                                                          : val
                                                      )
                                                      .join(", ")
                                                  : (qVals as string)}
                                              </li>
                                            ))}
                                          </ul>
                                        )}
                                      </li>
                                    ))}
                                </ul>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}

                    {/* Sitelinks */}
                    {Object.keys(selectedItem.sitelinks || {}).length > 0 && (
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <h4 className="font-semibold text-gray-700">
                          Available in{" "}
                          {Object.keys(selectedItem.sitelinks).length}{" "}
                          languages:
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                          {Object.entries(selectedItem.sitelinks).map(
                            ([site, link]) => (
                              <a
                                key={site}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline text-sm flex items-center gap-1"
                              >
                                <span>{site.replace("wiki", "")}</span>
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <a
                href={`https://www.wikidata.org/wiki/${item.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-blue-600 hover:text-blue-800"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="h-4 w-4" />
                <span className="ml-1">View</span>
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
