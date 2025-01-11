"use client";

import { useState } from "react";
import { Search as SearchIcon, ArrowRight, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { searchWikidata } from "@/lib/wikidata";
import type { WikidataItem } from "../../lib/wikidata";

export default function SearchPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<WikidataItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { addToast } = useToast();

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      addToast({
        title: "Please enter a search term",
        description: "Enter an English label to search for Wikidata items",
        variant: "warning",
      });
      return;
    }

    setIsLoading(true);
    try {
      const results = await searchWikidata(searchTerm);
      setResults(results);

      addToast({
        title: "Results found",
        description: `Found ${results.length} items and properties`,
        variant: "success",
      });
    } catch (error) {
      addToast({
        title: "Error",
        description: "Failed to search Wikidata. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-sky-100 dark:from-gray-900 dark:via-gray-800 dark:to-sky-950">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-sky-500 to-cyan-400 text-transparent bg-clip-text">
              Search Wikidata
            </h1>
            <p className="text-gray-700 dark:text-gray-300">
              Enter an English label to find matching Wikidata items.
            </p>
          </div>

          <div className="relative">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  type="text"
                  placeholder="Enter item label (e.g., 'Albert Einstein')"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-2 border-sky-300 dark:border-gray-600 focus:border-sky-500 dark:focus:border-sky-400"
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>
              <Button
                onClick={handleSearch}
                className="bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white transition-all duration-300"
                disabled={isLoading}
              >
                {isLoading ? (
                  "Searching..."
                ) : (
                  <>
                    Search <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Results section */}
          {results.length > 0 && (
            <div className="space-y-4">
              {results.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-2 border-sky-300 dark:border-gray-600 hover:border-sky-500 dark:hover:border-sky-400 transition-all duration-300"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-sky-800 dark:text-sky-300">
                          {item.labels?.["en"] ?? "No label"}
                        </h3>
                        <span
                          className={`px-2 py-0.5 text-xs rounded-full ${
                            item.type === "property"
                              ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                              : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                          }`}
                        >
                          {item.type}
                        </span>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 mt-1">
                        {item.descriptions?.["en"] ?? "No description"}
                      </p>
                      {(item.aliases?.["en"] ?? []).length > 0 && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          Also known as:{" "}
                          {(item.aliases?.["en"] ?? []).join(", ")}
                        </p>
                      )}
                      {Object.keys(item.sitelinks).length > 0 && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          Available in {Object.keys(item.sitelinks).length}{" "}
                          Wikipedia languages
                        </p>
                      )}
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                        ID: {item.id}
                      </p>
                    </div>
                    <a
                      href={`https://www.wikidata.org/wiki/${item.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-cyan-600 hover:text-cyan-800 dark:text-cyan-400 dark:hover:text-cyan-300"
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span className="ml-1">View</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
