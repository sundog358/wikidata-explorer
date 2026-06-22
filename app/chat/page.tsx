"use client";

import { FormEvent, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { BrainCircuit, Database, Search, Send, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const starterPrompts = [
  "Explain how Q42 is connected to notable works and occupations.",
  "What should I look for when evaluating Wikidata statement quality?",
  "Suggest a research path for exploring linked open data about museums.",
];

function messageText(message: { parts?: Array<{ type: string; text?: string }> }) {
  return (message.parts || [])
    .filter((part) => part.type === "text")
    .map((part) => part.text || "")
    .join("");
}

export default function ChatPage() {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status, error } = useChat();

  const isLoading = status === "submitted" || status === "streaming";

  function submitPrompt(prompt: string) {
    setInput(prompt);
  }

  async function submitMessage(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    setInput("");
    await sendMessage({ text: trimmed });
  }

  function submitOnEnter(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void submitMessage();
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-50">
      <div className="container mx-auto grid gap-6 px-4 py-8 lg:grid-cols-[320px_1fr]">
        <aside className="space-y-4">
          <div className="space-y-3">
            <Badge variant="outline" className="bg-white dark:bg-slate-900">
              <Sparkles className="mr-2 h-4 w-4 text-sky-500" />
              AI research assistant
            </Badge>
            <h1 className="text-3xl font-semibold tracking-tight">Ask about linked data</h1>
            <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
              Use chat for research planning, statement interpretation, and Wikidata workflow questions. The assistant does not browse Wikidata for you, so verify factual claims in the explorer.
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
            The chat endpoint validates requests, streams through AI SDK 6, and keeps the OpenAI key server-side.
          </Card>
        </aside>

        <section className="flex min-h-[calc(100vh-8rem)] flex-col rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-200 p-4 dark:border-slate-800">
            <div className="flex items-center gap-2 font-semibold">
              <BrainCircuit className="h-5 w-5 text-sky-600 dark:text-sky-300" />
              Wikidata Research Chat
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

            {messages.map((message) => {
              const content = messageText(message);
              return (
                <div key={message.id} className={message.role === "user" ? "flex justify-end" : "flex justify-start"}>
                  <div
                    className={
                      message.role === "user"
                        ? "max-w-[80%] rounded-lg bg-sky-600 px-4 py-3 text-sm text-white"
                        : "max-w-[80%] rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                    }
                  >
                    <div className="mb-1 text-xs font-medium uppercase tracking-wide opacity-70">
                      {message.role === "user" ? "You" : "Assistant"}
                    </div>
                    <div className="whitespace-pre-wrap leading-6">{content}</div>
                  </div>
                </div>
              );
            })}

            {isLoading && <div className="text-sm text-slate-500 dark:text-slate-400">Assistant is thinking...</div>}
            {error && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200">{error.message}</div>}
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