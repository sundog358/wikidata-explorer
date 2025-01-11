"use client";

import {
  ArrowLeft,
  Database,
  Search,
  Share2,
  Book,
  Code,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function AboutPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-yellow-50 to-blue-100 dark:from-indigo-950 dark:via-purple-900 dark:to-blue-950">
      <div className="container mx-auto px-4 py-16">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => router.push("/")}
          className="mb-8 hover:bg-white/20 dark:hover:bg-gray-800/20"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-500 via-yellow-500 to-blue-500 text-transparent bg-clip-text">
              About Wikidata Explorer
            </h1>
            <p className="text-xl text-gray-700 dark:text-gray-200">
              Your gateway to exploring the world&apos;s largest knowledge base
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-6 rounded-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-2 border-orange-200 dark:border-orange-800">
              <Search className="h-8 w-8 text-orange-500 mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-orange-800 dark:text-orange-200">
                Intelligent Search
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Advanced search capabilities to find exactly what you&apos;re
                looking for in Wikidata&apos;s vast database.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-2 border-green-200 dark:border-green-800">
              <Database className="h-8 w-8 text-green-500 mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-green-800 dark:text-green-200">
                Comprehensive Data
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Access to millions of structured data points, from historical
                figures to scientific concepts.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-2 border-blue-200 dark:border-blue-800">
              <Book className="h-8 w-8 text-blue-500 mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-blue-800 dark:text-blue-200">
                Educational Resource
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Perfect for researchers, students, and curious minds seeking
                reliable information.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-2 border-purple-200 dark:border-purple-800">
              <Globe className="h-8 w-8 text-purple-500 mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-purple-800 dark:text-purple-200">
                Multilingual Support
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Access information in multiple languages, making knowledge truly
                universal.
              </p>
            </div>
          </div>

          {/* How It Works Section */}
          <div className="space-y-6 p-8 rounded-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-2 border-yellow-200 dark:border-yellow-800">
            <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-gray-100">
              How It Works
            </h2>
            <div className="space-y-4">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-orange-500 text-white">
                  1
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-gray-100">
                    Search
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Enter any topic or entity you want to learn about
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-orange-500 text-white">
                  2
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-gray-100">
                    Explore
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Browse through detailed information and related entities
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-orange-500 text-white">
                  3
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-gray-100">
                    Learn
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Discover new connections and expand your knowledge
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Get Started Section */}
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
              Ready to Explore?
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Start your journey through the world&apos;s knowledge base today.
            </p>
            <Button
              onClick={() => router.push("/search")}
              className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white"
              size="lg"
            >
              Start Exploring
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
