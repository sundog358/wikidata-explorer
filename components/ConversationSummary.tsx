"use client";

import dynamic from "next/dynamic";
import { useChat } from "ai/react";
import { useChatContext } from "@/components/context/ChatContext";
import { memo, Suspense, useCallback, useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import styles from "./ConversationSummary.module.css";
import { ErrorBoundary } from "./ErrorBoundary";

const Avatar = dynamic(
  () => import("@/components/ui/avatar").then((mod) => mod.Avatar),
  {
    loading: () => (
      <div className="h-6 w-6 animate-pulse rounded-full bg-gray-200" />
    ),
    ssr: false,
  },
);

const AvatarImage = dynamic(() =>
  import("@/components/ui/avatar").then((mod) => mod.AvatarImage),
);
const AvatarFallback = dynamic(() =>
  import("@/components/ui/avatar").then((mod) => mod.AvatarFallback),
);

interface ChatSummaryProps {
  messageList: { role: string; content: string }[];
  messageIsLoading: boolean;
  systemMessage: string;
  onRemove: () => void;
  index?: number;
}

const SUMMARY_AGENT_AVATARS = [
  "/images/lisa.png",
  "/images/frog.png",
  "/images/ezraaiagent.png",
  "/images/eagle.png",
];

function buildSummaryPrompt(
  systemMessage: string,
  messageList: { role: string; content: string }[],
) {
  const transcript = messageList
    .map((message) => `${message.role}: ${message.content.trim()}`)
    .join("\n\n");

  return `Task: ${systemMessage}\n\nConversation:\n${transcript}`;
}

export default memo(function ConversationSummary({
  messageList,
  messageIsLoading,
  systemMessage,
  onRemove,
  index = 0,
}: ChatSummaryProps) {
  const { centralChatComplete, resetState } = useChatContext();
  const [hasStarted, setHasStarted] = useState(false);
  const [customSystemMessage, setCustomSystemMessage] = useState(systemMessage);
  const [error, setError] = useState<string | null>(null);

  const { messages, input, handleInputChange, handleSubmit, isLoading, setInput } =
    useChat({
      api: "/api/chat",
      onFinish: () => setError(null),
      onError: (chatError) => {
        setError(chatError.message || "Could not generate this summary.");
      },
    });

  const submitSummary = useCallback(() => {
    if (isLoading || messageIsLoading || messageList.length === 0) return;

    const prompt = buildSummaryPrompt(customSystemMessage, messageList);
    setInput(prompt);

    window.setTimeout(() => {
      const event = new Event("submit") as unknown as React.FormEvent<HTMLFormElement>;
      handleSubmit(event);
      setHasStarted(true);
    }, 0);
  }, [customSystemMessage, handleSubmit, isLoading, messageIsLoading, messageList, setInput]);

  useEffect(() => {
    if (centralChatComplete && !hasStarted && messageList.length > 0) {
      submitSummary();
    }
  }, [centralChatComplete, hasStarted, messageList.length, submitSummary]);

  useEffect(() => {
    if (!centralChatComplete) {
      setHasStarted(false);
    }
  }, [centralChatComplete]);

  useEffect(() => {
    return () => {
      resetState();
    };
  }, [resetState]);

  const latestAssistantMessage = [...messages]
    .reverse()
    .find((message) => message.role === "assistant");

  const content = latestAssistantMessage?.content;

  return (
    <ErrorBoundary>
      <Suspense fallback={<div>Loading...</div>}>
        <div className={styles.container}>
          {error && (
            <div className="mb-2 rounded bg-red-50 p-2 text-sm text-red-600">
              {error}
              <button className="ml-2 underline" onClick={submitSummary}>
                Retry
              </button>
            </div>
          )}
          <div className={styles.header}>
            <div className="flex items-center space-x-2">
              <Avatar className="h-6 w-6">
                <AvatarImage
                  src={SUMMARY_AGENT_AVATARS[index % SUMMARY_AGENT_AVATARS.length]}
                  alt={`AI Agent ${index + 1}`}
                />
                <AvatarFallback>A{index + 1}</AvatarFallback>
              </Avatar>
              <Input
                className={`${styles.input} text-blue-900 placeholder-blue-400`}
                value={customSystemMessage}
                placeholder="Enter a summary prompt..."
                onChange={(event) => setCustomSystemMessage(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    submitSummary();
                  }
                }}
              />
            </div>
            <button onClick={onRemove} className={styles.removeButton}>
              &times;
            </button>
          </div>
          <div className={`${styles.summary} text-blue-900`}>
            {!hasStarted && !isLoading && (
              <div className="flex items-center space-x-2 text-gray-500 italic">
                <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-blue-500" />
                <span>Waiting for main conversation...</span>
              </div>
            )}
            {isLoading && (
              <div className="text-gray-500 italic">Analyzing conversation...</div>
            )}
            {content && <div className="whitespace-pre-wrap">{content}</div>}
            <input
              aria-hidden="true"
              tabIndex={-1}
              className="hidden"
              value={input}
              onChange={handleInputChange}
            />
          </div>
        </div>
      </Suspense>
    </ErrorBoundary>
  );
});