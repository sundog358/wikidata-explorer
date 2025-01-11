"use client";

import { ArrowRight } from "lucide-react";

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-sky-100 dark:from-gray-900 dark:via-gray-800 dark:to-sky-950">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-sky-500 to-cyan-400 text-transparent bg-clip-text">
              Wikidata REST API Documentation
            </h1>
            <p className="text-gray-700 dark:text-gray-300">
              Explore the Wikidata REST API endpoints and data models
            </p>
          </div>

          {/* API Base URL */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-sky-800 dark:text-sky-300">
              Base URL
            </h2>
            <code className="block p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
              https://www.wikidata.org/w/rest.php/wikibase/v1
            </code>
          </section>

          {/* Data Models */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-sky-800 dark:text-sky-300">
              Data Models
            </h2>

            <div className="grid gap-6">
              {/* Item */}
              <div className="p-6 bg-white/80 dark:bg-gray-800/80 rounded-lg border-2 border-sky-300 dark:border-gray-600">
                <h3 className="text-xl font-semibold text-sky-700 dark:text-sky-400 mb-4">
                  Item
                </h3>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-semibold">id</span> - string
                    <br />
                    <span className="text-xs">
                      The unique identifier for the item (e.g., Q24)
                    </span>
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-semibold">type</span> - "item" |
                    "property"
                    <br />
                    <span className="text-xs">The type of the entity</span>
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-semibold">labels</span> -
                    Record&lt;string, string&gt;
                    <br />
                    <span className="text-xs">Language-specific labels</span>
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-semibold">descriptions</span> -
                    Record&lt;string, string&gt;
                    <br />
                    <span className="text-xs">
                      Language-specific descriptions
                    </span>
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-semibold">aliases</span> -
                    Record&lt;string, string[]&gt;
                    <br />
                    <span className="text-xs">
                      Language-specific alternative names
                    </span>
                  </p>
                </div>
              </div>

              {/* Statement */}
              <div className="p-6 bg-white/80 dark:bg-gray-800/80 rounded-lg border-2 border-sky-300 dark:border-gray-600">
                <h3 className="text-xl font-semibold text-sky-700 dark:text-sky-400 mb-4">
                  Statement
                </h3>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-semibold">id</span> - string
                    <br />
                    <span className="text-xs">
                      Unique identifier for the statement
                    </span>
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-semibold">rank</span> - "deprecated" |
                    "normal" | "preferred"
                    <br />
                    <span className="text-xs">The rank of the statement</span>
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-semibold">property</span> - object
                    <br />
                    <span className="text-xs">
                      Property information including ID and data type
                    </span>
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-semibold">value</span> - object
                    <br />
                    <span className="text-xs">The value content and type</span>
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Endpoints */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-sky-800 dark:text-sky-300">
              Key Endpoints
            </h2>

            <div className="space-y-4">
              <div className="p-6 bg-white/80 dark:bg-gray-800/80 rounded-lg border-2 border-sky-300 dark:border-gray-600">
                <div className="flex items-center gap-2 mb-4">
                  <span className="px-2 py-1 text-sm font-semibold bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded">
                    GET
                  </span>
                  <code className="text-sm">/entities/items/{"{item_id}"}</code>
                </div>
                <p className="text-gray-700 dark:text-gray-300 text-sm">
                  Retrieve a single Wikibase Item by ID
                </p>
              </div>

              <div className="p-6 bg-white/80 dark:bg-gray-800/80 rounded-lg border-2 border-sky-300 dark:border-gray-600">
                <div className="flex items-center gap-2 mb-4">
                  <span className="px-2 py-1 text-sm font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded">
                    GET
                  </span>
                  <code className="text-sm">
                    /entities/items/{"{item_id}"}/statements
                  </code>
                </div>
                <p className="text-gray-700 dark:text-gray-300 text-sm">
                  Retrieve statements from an Item
                </p>
              </div>

              <div className="p-6 bg-white/80 dark:bg-gray-800/80 rounded-lg border-2 border-sky-300 dark:border-gray-600">
                <div className="flex items-center gap-2 mb-4">
                  <span className="px-2 py-1 text-sm font-semibold bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 rounded">
                    GET
                  </span>
                  <code className="text-sm">
                    /entities/items/{"{item_id}"}/labels
                  </code>
                </div>
                <p className="text-gray-700 dark:text-gray-300 text-sm">
                  Retrieve an Item's labels
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
