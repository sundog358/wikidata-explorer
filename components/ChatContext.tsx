"use client";

import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useEffect,
} from "react";
import { useChat } from "ai/react";

interface ChatContextType {
  messages: { role: string; content: string }[];
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
  centralChatComplete: boolean;
  setCentralChatComplete: (complete: boolean) => void;
  streamingContent: string;
  resetState: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [centralChatComplete, setCentralChatComplete] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const isCleaningUp = useRef(false);

  // Remove streamReader ref since we'll use AI SDK's stream handling
  const stateVersion = useRef(0);

  const handleStreamCleanup = useCallback(async () => {
    if (isCleaningUp.current) return;
    isCleaningUp.current = true;

    try {
      setStreamingContent("");
    } finally {
      isCleaningUp.current = false;
    }
  }, []);

  const chat = useChat({
    api: "/api/chat",
    initialMessages: [],
    onFinish: (message) => {
      setCentralChatComplete(true);
      setStreamingContent("");
      handleStreamCleanup();
    },
    onResponse: async (response) => {
      setCentralChatComplete(false);
      // Let the AI SDK handle the stream
    },
    onError: (error) => {
      console.error("Stream error:", error);
      handleStreamCleanup();
    },
    body: {
      stream: true,
    },
  });

  // Update streaming content from AI SDK's stream
  useEffect(() => {
    if (chat.isLoading && chat.messages.length > 0) {
      const lastMessage = chat.messages[chat.messages.length - 1];
      setStreamingContent(lastMessage.content);
    }
  }, [chat.messages, chat.isLoading]);

  return (
    <ChatContext.Provider
      value={{
        ...chat,
        centralChatComplete,
        setCentralChatComplete,
        streamingContent,
        resetState: handleStreamCleanup,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChatContext() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChatContext must be used within a ChatProvider");
  }
  return context;
}
