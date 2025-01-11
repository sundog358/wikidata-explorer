"use client";

import { useChatContext } from "@/components/context/ChatContext";
import { useState } from "react";
import { AvatarImage, AvatarFallback, Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SendIcon, PlusIcon, BarChartIcon, MenuIcon } from "@/components/icons";
import ConversationSummary from "@/components/ConversationSummary";

const defaultSystemMessages = [
  "Summarize the main points of the conversation.",
  "Identify the key takeaways from the discussion.",
  "Analyze the sentiment of the conversation.",
  "Highlight any action items or next steps mentioned.",
  "Summarize the pros and cons discussed.",
  "Identify any unresolved questions or concerns.",
  "Summarize the key arguments made by each participant.",
  "Provide a brief overview of the entire conversation.",
];

const AVATAR_IMAGES = {
  user: "/images/default-user.png",
  assistant: "/images/socrates.png",
  system: "/images/system-avatar.png",
};

export function MultiChat() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } =
    useChatContext();
  const [leftSummaries, setLeftSummaries] = useState([true, true]);
  const [rightSummaries, setRightSummaries] = useState([true, true]);

  const handleRemoveSummary = (index: number, side: "left" | "right") => {
    if (side === "left") {
      setLeftSummaries((prev) =>
        prev.map((visible, i) => (i === index ? false : visible))
      );
    } else {
      setRightSummaries((prev) =>
        prev.map((visible, i) => (i === index ? false : visible))
      );
    }
  };

  const handleAddSummary = (side: "left" | "right") => {
    if (side === "left" && leftSummaries.filter(Boolean).length < 4) {
      setLeftSummaries((prev) => [...prev, true]);
    } else if (side === "right" && rightSummaries.filter(Boolean).length < 4) {
      setRightSummaries((prev) => [...prev, true]);
    }
  };

  // Filter out system messages
  const filteredMessages = messages.filter(
    (message) => message.role !== "system"
  );

  // Add handler for Enter key
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>);
    }
  };

  return (
    <div className="flex flex-col h-screen relative">
      {/* Background Image */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: 'url("/images/aibinarycodeart.jpg")',
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          opacity: "0.15",
        }}
      />
      <header className="relative px-6 py-5 bg-gradient-to-r from-blue-600 via-blue-500 to-green-400 shadow-xl">
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-400 via-green-300 to-blue-300"></div>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm border border-white/30 shadow-lg transform hover:scale-105 transition-transform">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-4l-4 4z"
                />
              </svg>
            </div>
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold text-white tracking-tight">
                Sun & Rain Works
                <span className="ml-2 text-yellow-300">Multi-Agent Chat</span>
              </h1>
              <p className="text-blue-100 text-sm">
                Powered by Advanced AI Technology
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="px-4 py-2 rounded-lg bg-gradient-to-r from-green-400/20 to-blue-400/20 backdrop-blur-sm border border-white/20">
              <span className="flex items-center space-x-2">
                <span className="flex space-x-1">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                  <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse delay-75"></span>
                  <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse delay-150"></span>
                </span>
                AI Powered Conversations
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden bg-gradient-to-br from-blue-50 via-white to-green-50/30 p-4 gap-4">
        {/* Left Chat Box */}
        <div className="w-[300px] flex flex-col bg-white rounded-2xl shadow-lg border border-green-100 overflow-hidden backdrop-blur-sm">
          <div className="p-4 border-b border-green-100 bg-gradient-to-r from-green-50 to-white">
            <h2 className="text-lg font-semibold text-blue-900 flex items-center">
              <BarChartIcon className="w-5 h-5 mr-2 text-green-500" />
              Analysis Tools
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {leftSummaries.map(
              (visible, index) =>
                visible && (
                  <ConversationSummary
                    key={index}
                    index={index}
                    messageList={filteredMessages}
                    messageIsLoading={isLoading}
                    systemMessage={defaultSystemMessages[index]}
                    onRemove={() => handleRemoveSummary(index, "left")}
                  />
                )
            )}
          </div>
          {leftSummaries.filter(Boolean).length < 4 && (
            <Button
              variant="outline"
              className="m-4 border-slate-200 dark:border-gray-700 hover:bg-slate-100 dark:hover:bg-gray-700/50 text-slate-600 dark:text-gray-300"
              onClick={() => handleAddSummary("left")}
            >
              <PlusIcon className="w-5 h-5" />
            </Button>
          )}
        </div>

        {/* Central Chat Box */}
        <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-lg border border-blue-100 overflow-hidden backdrop-blur-sm">
          <div className="p-4 border-b border-blue-100 bg-gradient-to-r from-blue-50 to-white">
            <h2 className="text-lg font-semibold text-blue-900 flex items-center">
              <MenuIcon className="w-5 h-5 mr-2 text-blue-500" />
              Central Chat
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages
              .filter((message) => message.role !== "system")
              .map((message, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage
                      src={
                        AVATAR_IMAGES[
                          message.role as keyof typeof AVATAR_IMAGES
                        ]
                      }
                      alt={message.role}
                      onError={(e) => {
                        // Fallback if image fails to load
                        e.currentTarget.src = "/images/default-user.png";
                      }}
                    />
                    <AvatarFallback>
                      {message.role === "assistant" ? "AI" : "You"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div
                      className={`p-3 rounded-lg ${
                        message.role === "user"
                          ? "bg-blue-100 text-blue-900"
                          : "bg-green-100 text-green-900"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">
                        {message.content}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            {isLoading && (
              <div className="flex items-center space-x-2 text-blue-500">
                <div className="animate-bounce">●</div>
                <div className="animate-bounce delay-100">●</div>
                <div className="animate-bounce delay-200">●</div>
              </div>
            )}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit(e);
            }}
            className="p-4 border-t border-blue-100 bg-gradient-to-r from-blue-50 to-white flex items-center space-x-2"
          >
            <textarea
              className="flex-1 bg-blue-50 border border-blue-300 focus:ring-2 focus:ring-blue-500 rounded-md p-2 text-blue-900 placeholder-blue-400"
              value={input}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              rows={1}
            />
            <Button
              type="submit"
              variant="default"
              className="bg-blue-500 text-white hover:bg-blue-600"
            >
              <SendIcon className="w-5 h-5" />
            </Button>
          </form>
        </div>

        {/* Right Chat Box */}
        <div className="w-[300px] flex flex-col bg-white rounded-2xl shadow-lg border border-yellow-100 overflow-hidden backdrop-blur-sm">
          <div className="p-4 border-b border-yellow-100 bg-gradient-to-r from-yellow-50 to-white">
            <h2 className="text-lg font-semibold text-blue-900 flex items-center">
              <MenuIcon className="w-5 h-5 mr-2 text-yellow-500" />
              Conversation Insights
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {rightSummaries.map(
              (visible, index) =>
                visible && (
                  <ConversationSummary
                    key={index}
                    index={index + 2}
                    messageList={filteredMessages}
                    messageIsLoading={isLoading}
                    systemMessage={defaultSystemMessages[index + 4]}
                    onRemove={() => handleRemoveSummary(index, "right")}
                  />
                )
            )}
          </div>
          {rightSummaries.filter(Boolean).length < 4 && (
            <Button
              variant="outline"
              className="m-4 border-slate-200 dark:border-gray-700 hover:bg-slate-100 dark:hover:bg-gray-700/50 text-slate-600 dark:text-gray-300"
              onClick={() => handleAddSummary("right")}
            >
              <PlusIcon className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>

      <footer className="p-4 bg-gradient-to-r from-blue-600 via-blue-500 to-green-400 text-white text-center">
        © 2024 Sun & Rain Works. All rights reserved.
      </footer>
    </div>
  );
}
