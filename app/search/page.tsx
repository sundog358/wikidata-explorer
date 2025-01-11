"use client";

import { useState } from "react";
import { Search as SearchIcon, ArrowRight, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface WikidataItem {
  id: string;
  label: string;
  description: string;
  url: string;
}

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
      const response = await fetch(
        `https://www.wikidata.org/w/api.php?` +
          new URLSearchParams({
            action: "wbsearchentities",
            search: searchTerm,
            language: "en",
            format: "json",
            origin: "*",
            limit: "10",
          })
      );

      const data = await response.json();

      if (data.search && data.search.length > 0) {
        const items: WikidataItem[] = data.search.map((item: any) => ({
          id: item.id,
          label: item.label || "No label",
          description: item.description || "No description available",
          url: `https://www.wikidata.org/wiki/${item.id}`,
        }));
        setResults(items);
        addToast({
          title: "Results found",
          description: `Found ${items.length} matching items`,
          variant: "success",
        });
      } else {
        setResults([]);
        addToast({
          title: "No results",
          description: "No matching items found in Wikidata",
          variant: "default",
        });
      }
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
                      <h3 className="text-lg font-semibold text-sky-800 dark:text-sky-300">
                        {item.label}
                      </h3>
                      <p className="text-gray-700 dark:text-gray-300 mt-1">
                        {item.description}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                        ID: {item.id}
                      </p>
                    </div>
                    <a
                      href={item.url}
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
