"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { BrainCircuit, Database, GitBranch, Search, Send, Sparkles, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AG2_CHAT_CONTEXT_STORAGE_KEY, sanitizeChatVisibleContext } from "@/lib/ag2-chat-context.mjs";
import { aiAgentsEnabled, AI_DISABLED_MESSAGE } from "@/lib/ai-feature-flags.mjs";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type Ag2ChatVisibleContext = NonNullable<ReturnType<typeof sanitizeChatVisibleContext>>;

const starterPrompts = [
  "Explain how Q42 is connected to notable works and occupations.",
  "What should I look for when evaluating Wikidata statement quality?",
  "Suggest a research path for exploring linked open data about museums.",
];

const AI_AGENTS_ENABLED = aiAgentsEnabled({
  NEXT_PUBLIC_ENABLE_AI_AGENTS: process.env.NEXT_PUBLIC_ENABLE_AI_AGENTS,
});

function DisabledChatPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-50">
      <div className="container mx-auto px-4 py-10">
        <div className="max-w-3xl space-y-4">
          <Badge variant="outline" className="bg-white dark:bg-slate-900">
            <Sparkles className="mr-2 h-4 w-4 text-sky-500" />
            Feature flagged
          </Badge>
          <h1 className="text-4xl font-semibold tracking-tight">Research Assistant is disabled for the public demo</h1>
          <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{AI_DISABLED_MESSAGE}</p>
          <div className="flex flex-wrap gap-2 pt-2">
            <Link href="/search?q=Q42" className="inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              <Search className="h-4 w-4" />
              Open Q42 Workbench
            </Link>
            <Link href="/docs" className="inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-md border border-input bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              <Database className="h-4 w-4" />
              Read Developer Docs
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function newMessage(role: ChatMessage["role"], content: string): ChatMessage {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    role,
    content,
  };
}

function initialVisibleContext(): Ag2ChatVisibleContext | null {
  if (!AI_AGENTS_ENABLED || typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(AG2_CHAT_CONTEXT_STORAGE_KEY);
    if (!raw) return null;
    return sanitizeChatVisibleContext(JSON.parse(raw));
  } catch {
    return null;
  }
}

export default function ChatPage() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [visibleContext, setVisibleContext] = useState<Ag2ChatVisibleContext | null>(initialVisibleContext);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function submitPrompt(prompt: string) {
    setInput(prompt);
  }

  function clearVisibleContext() {
    setVisibleContext(null);
    if (typeof window !== "undefined") window.localStorage.removeItem(AG2_CHAT_CONTEXT_STORAGE_KEY);
  }

  async function submitMessage(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const nextMessages = [...messages, newMessage("user", trimmed)];
    setMessages(nextMessages);
    setInput("");
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.map((message) => ({
            role: message.role,
            content: message.content,
          })),
          context: visibleContext || undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "The AG2 chat service could not complete the response.");

      setMessages((current) => [...current, newMessage("assistant", data.message || "")]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The AG2 chat service could not complete the response.");
    } finally {
      setIsLoading(false);
    }
  }

  function submitOnEnter(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void submitMessage();
    }
  }

  if (!AI_AGENTS_ENABLED) return <DisabledChatPage />;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-50">
      <div className="container mx-auto grid gap-6 px-4 py-8 lg:grid-cols-[320px_1fr]">
        <aside className="space-y-4">
          <div className="space-y-3">
            <Badge variant="outline" className="bg-white dark:bg-slate-900">
              <Sparkles className="mr-2 h-4 w-4 text-sky-500" />
              AG2 research assistant
            </Badge>
            <h1 className="text-3xl font-semibold tracking-tight">Ask about linked data</h1>
            <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
              Use chat for research planning, statement interpretation, and Wikidata workflow questions. The AG2 agent does not browse Wikidata for you, so verify factual claims in the explorer.
            </p>
          </div>

          <Card className="space-y-3 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Search className="h-4 w-4 text-sky-600 dark:text-sky-300" />
              Starter prompts
            </div>
            <div className="space-y-2">
              {starterPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => submitPrompt(prompt)}
                  className="w-full rounded-md border border-slate-200 p-3 text-left text-sm text-slate-700 transition hover:border-sky-300 hover:bg-sky-50 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </Card>

          <Card className="p-4 text-sm text-slate-600 dark:text-slate-300">
            <div className="mb-2 flex items-center gap-2 font-semibold text-slate-950 dark:text-slate-50">
              <Database className="h-4 w-4 text-sky-600 dark:text-sky-300" />
              Portfolio note
            </div>
            The chat endpoint validates requests, then runs a bounded AG2 agent through the local conda bridge or the containerized AG2 service while keeping provider keys server-side.
          </Card>

          {visibleContext && (
            <Card className="space-y-3 p-4 text-sm" data-testid="ag2-chat-visible-context">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 font-semibold text-slate-950 dark:text-slate-50">
                  <GitBranch className="h-4 w-4 text-sky-600 dark:text-sky-300" />
                  Attached context
                </div>
                <Button type="button" variant="outline" size="sm" className="h-8 gap-1" onClick={clearVisibleContext}>
                  <X className="h-3.5 w-3.5" />
                  Clear
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {visibleContext.entity && <Badge variant="secondary">{visibleContext.entity.id}</Badge>}
                {visibleContext.graphFocus && <Badge variant="outline">{visibleContext.graphFocus.propertyId} -&gt; {visibleContext.graphFocus.id}</Badge>}
                {!!visibleContext.selectedStatements.length && <Badge variant="outline">{visibleContext.selectedStatements.length} statements</Badge>}
                {visibleContext.graphPathExport && <Badge variant="outline">path export</Badge>}
              </div>
              <p className="text-xs leading-5 text-slate-600 dark:text-slate-300">
                The next message will include the selected entity, statement evidence, graph focus, and selected-path export from the workbench.
              </p>
            </Card>
          )}
        </aside>

        <section className="flex min-h-[calc(100vh-8rem)] flex-col rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-200 p-4 dark:border-slate-800">
            <div className="flex items-center gap-2 font-semibold">
              <BrainCircuit className="h-5 w-5 text-sky-600 dark:text-sky-300" />
              AG2 Wikidata Research Chat
            </div>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            {messages.length === 0 && (
              <div className="flex h-full items-center justify-center text-center text-sm text-slate-500 dark:text-slate-400">
                <div className="max-w-sm space-y-2">
                  <BrainCircuit className="mx-auto h-10 w-10 text-sky-500" />
                  <p>Ask a question about Wikidata exploration, linked-data modeling, or how to evaluate an entity record.</p>
                </div>
              </div>
            )}

            {messages.map((message) => (
              <div key={message.id} className={message.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <div
                  className={
                    message.role === "user"
                      ? "max-w-[80%] rounded-lg bg-sky-600 px-4 py-3 text-sm text-white"
                      : "max-w-[80%] rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                  }
                >
                  <div className="mb-1 text-xs font-medium uppercase tracking-wide opacity-70">
                    {message.role === "user" ? "You" : "AG2 Assistant"}
                  </div>
                  <div className="whitespace-pre-wrap leading-6">{message.content}</div>
                </div>
              </div>
            ))}

            {isLoading && <div className="text-sm text-slate-500 dark:text-slate-400">AG2 agent is thinking...</div>}
            {error && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200">{error}</div>}
          </div>

          <form onSubmit={submitMessage} className="border-t border-slate-200 p-4 dark:border-slate-800">
            <div className="flex gap-2">
              <textarea
                value={input}
                onChange={(event) => setInput(event.currentTarget.value)}
                onKeyDown={submitOnEnter}
                placeholder="Ask about an entity, property, statement pattern, or research path..."
                rows={2}
                className="min-h-12 flex-1 resize-none rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 dark:border-slate-800 dark:bg-slate-950"
              />
              <Button type="submit" disabled={isLoading || !input.trim()} className="h-auto gap-2 px-4">
                <Send className="h-4 w-4" />
                Send
              </Button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
