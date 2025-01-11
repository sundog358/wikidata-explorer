"use client";

import { Search, Database, Share2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

export default function Home() {
  const { addToast } = useToast();
  const router = useRouter();

  const handleExploreClick = () => {
    addToast({
      title: "Welcome aboard! 🚀",
      description: "Start exploring Wikidata's vast knowledge graph.",
      variant: "success",
    });
    router.push("/search");
  };

  const handleLearnMoreClick = () => {
    addToast({
      title: "Learn More",
      description:
        "Discover all the features and capabilities of Wikidata Explorer.",
      variant: "default",
    });
    router.push("/about");
  };

  const handleGetStartedClick = () => {
    addToast({
      title: "Let's get started! ✨",
      description:
        "Welcome to your journey through the world's knowledge base.",
      variant: "success",
    });
    router.push("/search");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-sky-100 dark:from-gray-900 dark:via-gray-800 dark:to-sky-950">
      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-20 pb-16">
        <div className="text-center space-y-6">
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-sky-500 to-cyan-400 dark:from-sky-400 dark:to-cyan-300 text-transparent bg-clip-text">
            Wikidata Explorer
          </h1>
          <p className="text-xl text-gray-700 dark:text-gray-300 max-w-2xl mx-auto">
            Discover and explore the vast knowledge graph of Wikidata with our
            intuitive interface.
          </p>
          <div className="flex justify-center gap-4">
            <Button
              size="lg"
              className="bg-gradient-to-r from-sky-400 to-cyan-500 hover:from-sky-500 hover:to-cyan-600 text-white transition-all duration-300"
              onClick={handleExploreClick}
            >
              Start Exploring
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-sky-500 text-sky-600 hover:text-sky-700 hover:border-sky-600 dark:text-sky-400 dark:hover:text-sky-300 dark:border-sky-400 dark:hover:border-sky-300 transition-all duration-300"
              onClick={handleLearnMoreClick}
            >
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="p-6 rounded-2xl bg-gradient-to-br from-sky-50 to-sky-100 dark:from-gray-800 dark:to-gray-700 backdrop-blur-sm border border-sky-200 dark:border-gray-600 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <Search className="w-12 h-12 text-sky-500 dark:text-sky-300 mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-sky-800 dark:text-sky-200">
              Intuitive Search
            </h3>
            <p className="text-sky-700 dark:text-sky-300">
              Find entities and relationships with our powerful search
              capabilities.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-gradient-to-br from-teal-50 to-teal-100 dark:from-gray-800 dark:to-gray-700 backdrop-blur-sm border border-teal-200 dark:border-gray-600 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <Database className="w-12 h-12 text-teal-500 dark:text-teal-300 mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-teal-800 dark:text-teal-200">
              Rich Data
            </h3>
            <p className="text-teal-700 dark:text-teal-300">
              Access millions of structured data points from Wikidata.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-gray-800 dark:to-gray-700 backdrop-blur-sm border border-indigo-200 dark:border-gray-600 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <Share2 className="w-12 h-12 text-indigo-500 dark:text-indigo-300 mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-indigo-800 dark:text-indigo-200">
              Easy Sharing
            </h3>
            <p className="text-indigo-700 dark:text-indigo-300">
              Share your discoveries with others through simple links.
            </p>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="container mx-auto px-4 py-16">
        <div className="relative p-8 rounded-3xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-500 dark:from-cyan-600 dark:via-sky-600 dark:to-blue-600">
          <div className="absolute inset-0 bg-white/20 dark:bg-black/10 rounded-3xl backdrop-blur-xl"></div>
          <div className="relative z-10 text-center space-y-4">
            <Sparkles className="w-12 h-12 mx-auto mb-4 text-white animate-pulse" />
            <h2 className="text-3xl font-bold text-white">Ready to Start?</h2>
            <p className="max-w-2xl mx-auto text-lg text-white/90">
              Begin your journey through the world&apos;s largest knowledge
              base.
            </p>
            <Button
              size="lg"
              className="bg-white hover:bg-gray-50 text-cyan-600 hover:text-cyan-700 mt-4 border-2 border-transparent hover:border-cyan-200 transition-all duration-300"
              onClick={handleGetStartedClick}
            >
              Get Started Now
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
