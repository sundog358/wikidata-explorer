"use client";

import dynamic from "next/dynamic";
import { useChat } from "ai/react";
import { useChatContext } from "@/components/context/ChatContext";
import {
  useEffect,
  useState,
  useCallback,
  useRef,
  memo,
  useMemo,
  Suspense,
} from "react";
import { Input } from "@/components/ui/input";
import styles from "./ConversationSummary.module.css";
import { ErrorBoundary } from "./ErrorBoundary";

// Lazy load heavy components
const Avatar = dynamic(
  () => import("@/components/ui/avatar").then((mod) => mod.Avatar),
  {
    loading: () => (
      <div className="w-6 h-6 bg-gray-200 rounded-full animate-pulse" />
    ),
    ssr: false,
  }
);

const AvatarImage = dynamic(() =>
  import("@/components/ui/avatar").then((mod) => mod.AvatarImage)
);
const AvatarFallback = dynamic(() =>
  import("@/components/ui/avatar").then((mod) => mod.AvatarFallback)
);

// Cache for message processing
const messageCache = new Map();

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

// Memoized input component for better performance
const MemoizedInput = memo(
  ({
    value,
    onChange,
    onKeyPress,
    className,
    placeholder,
  }: {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    className: string;
    placeholder: string;
  }) => (
    <Input
      className={className}
      value={value}
      placeholder={placeholder}
      onChange={onChange}
      onKeyPress={onKeyPress}
    />
  )
);

MemoizedInput.displayName = "MemoizedInput";

// Main component wrapped with memo and error boundary
export default memo(function ConversationSummary({
  messageList,
  messageIsLoading,
  systemMessage,
  onRemove,
  index = 0,
}: ChatSummaryProps) {
  const { centralChatComplete, resetState } = useChatContext();
  const [hasStarted, setHasStarted] = useState(false);
  const [summary, setSummary] = useState<string>("");
  const [streamingSummary, setStreamingSummary] = useState<string>("");
  const [customSystemMessage, setCustomSystemMessage] =
    useState<string>(systemMessage);
  const [error, setError] = useState<Error | null>(null);
  const stateVersion = useRef(0);
  const retryCount = useRef(0);
  const MAX_RETRIES = 3;

  // Error handling function
  const handleError = useCallback(
    (error: Error) => {
      console.error("Chat error:", error);
      setError(error);

      if (retryCount.current < MAX_RETRIES) {
        retryCount.current += 1;
        console.log(`Retrying... Attempt ${retryCount.current}`);
        setTimeout(() => {
          handleChatSubmission();
        }, 1000 * retryCount.current);
      } else {
        setError(new Error(`Failed after ${MAX_RETRIES} retries`));
      }
    },
    [MAX_RETRIES]
  );

  const { messages, handleInputChange, handleSubmit, isLoading } = useChat({
    body: { messageList },
    onFinish: (message) => {
      setSummary(message.content);
      setStreamingSummary("");
      retryCount.current = 0;
    },
    onError: (error) => {
      if (error.message.includes("locked to a reader")) {
        console.warn("Stream lock error, retrying...");
        setTimeout(() => handleChatSubmission(), 100);
        return;
      }
      handleError(error);
    },
  });

  // Atomic state updates
  const updateSummaryState = useCallback((newContent: string) => {
    stateVersion.current += 1;
    const currentVersion = stateVersion.current;

    if (currentVersion === stateVersion.current) {
      setStreamingSummary(newContent);
    }
  }, []);

  // Separate the chat submission logic
  const handleChatSubmission = useCallback(() => {
    if (!isLoading && messageList.length > 0) {
      try {
        const syntheticEvent = {
          target: {
            value: JSON.stringify([
              {
                role: "system",
                content: `Your task is to perform an ongoing analysis on a conversation, here is the task you are given: ${customSystemMessage}`,
              },
              ...messageList,
            ]),
          },
        } as React.ChangeEvent<HTMLTextAreaElement>;

        handleInputChange(syntheticEvent);
        handleSubmit(
          new Event("submit") as unknown as React.FormEvent<HTMLFormElement>
        );
        setError(null);
      } catch (error) {
        handleError(error as Error);
      }
    }
  }, [
    isLoading,
    messageList,
    customSystemMessage,
    handleInputChange,
    handleSubmit,
    handleError,
  ]);

  // Optimized callback functions with proper dependencies
  const handleCustomMessageChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setCustomSystemMessage(e.target.value);
    },
    []
  );

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleChatSubmission();
      }
    },
    [handleChatSubmission]
  );

  // Cleanup effect with proper dependency tracking
  useEffect(() => {
    const cleanup = () => {
      stateVersion.current += 1;
      resetState();
    };
    return cleanup;
  }, [resetState]);

  // Start analysis when central chat completes and hasn't started yet
  useEffect(() => {
    if (centralChatComplete && !hasStarted && messageList.length > 0) {
      setHasStarted(true);
      handleChatSubmission();
    }
  }, [centralChatComplete, hasStarted, messageList, handleChatSubmission]);

  // Reset hasStarted when new messages come in
  useEffect(() => {
    if (!centralChatComplete) {
      setHasStarted(false);
    }
  }, [messageList, centralChatComplete]);

  // Memoize expensive computations
  const processedMessageList = useMemo(() => {
    const cacheKey = JSON.stringify(messageList);
    if (messageCache.has(cacheKey)) {
      return messageCache.get(cacheKey);
    }

    const processed = messageList.map((msg) => ({
      ...msg,
      content: msg.content.trim(),
    }));

    messageCache.set(cacheKey, processed);
    if (messageCache.size > 100) {
      // Limit cache size
      const firstKey = messageCache.keys().next().value;
      messageCache.delete(firstKey);
    }

    return processed;
  }, [messageList]);

  // Debounced state updates
  const debouncedSetStreamingSummary = useCallback(
    debounce((content: string) => {
      setStreamingSummary(content);
    }, 100),
    []
  );

  // Optimized stream reading with chunking
  const readStream = useCallback(
    async (reader: ReadableStreamDefaultReader | undefined) => {
      if (!reader) return;

      const decoder = new TextDecoder();
      const textChunks: string[] = [];
      const chunkSize = 1024;

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const text = decoder.decode(value, { stream: true });
          textChunks.push(text);

          // Process chunks in batches
          if (textChunks.join("").length >= chunkSize) {
            debouncedSetStreamingSummary(textChunks.join(""));
            textChunks.length = 0; // Clear array
          }
        }

        // Process remaining chunks
        if (textChunks.length > 0) {
          debouncedSetStreamingSummary(textChunks.join(""));
        }
      } catch (error) {
        console.error("Stream reading error:", error);
        if (reader) reader.cancel();
      } finally {
        if (reader) reader.releaseLock();
      }
    },
    [debouncedSetStreamingSummary]
  );

  // Memory cleanup
  useEffect(() => {
    return () => {
      messageCache.clear();
    };
  }, []);

  // Memoized content rendering
  const renderContent = useCallback(() => {
    if (!hasStarted) {
      return (
        <div className="flex items-center space-x-2 text-gray-500 italic">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" />
          <span>Waiting for main conversation...</span>
        </div>
      );
    }

    if (isLoading) {
      return (
        <>
          <div className="text-gray-500 italic mb-2">
            Analyzing conversation...
          </div>
          {streamingSummary && (
            <div className="text-blue-900 whitespace-pre-wrap">
              {streamingSummary}
            </div>
          )}
        </>
      );
    }

    return <div className="text-blue-900 whitespace-pre-wrap">{summary}</div>;
  }, [hasStarted, isLoading, streamingSummary, summary]);

  // Add a ref to track if we've processed this content
  const processedContentRef = useRef<string>("");

  useEffect(() => {
    if (streamingSummary && streamingSummary !== processedContentRef.current) {
      processedContentRef.current = streamingSummary;
      setSummary((prev) => {
        const newSummary = prev + streamingSummary;
        return newSummary;
      });
    }
  }, [streamingSummary]);

  return (
    <ErrorBoundary>
      <Suspense fallback={<div>Loading...</div>}>
        <div className={styles.container}>
          {error && (
            <div className="p-2 mb-2 text-sm text-red-600 bg-red-50 rounded">
              {error.message}
              <button
                className="ml-2 underline"
                onClick={() => {
                  setError(null);
                  retryCount.current = 0;
                  handleChatSubmission();
                }}
              >
                Retry
              </button>
            </div>
          )}
          <div className={styles.header}>
            <div className="flex items-center space-x-2">
              <Avatar className="w-6 h-6">
                <AvatarImage
                  src={SUMMARY_AGENT_AVATARS[index % 4]}
                  alt={`AI Agent ${index + 1}`}
                />
                <AvatarFallback>A{index + 1}</AvatarFallback>
              </Avatar>
              <MemoizedInput
                value={customSystemMessage}
                placeholder="Enter a summary prompt..."
                onChange={handleCustomMessageChange}
                onKeyPress={handleKeyPress}
                className={`${styles.input} text-blue-900 placeholder-blue-400`}
              />
            </div>
            <button onClick={onRemove} className={styles.removeButton}>
              &times;
            </button>
          </div>
          <div className={`${styles.summary} text-blue-900`}>
            {renderContent()}
          </div>
        </div>
      </Suspense>
    </ErrorBoundary>
  );
});

// Utility function for debouncing
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
