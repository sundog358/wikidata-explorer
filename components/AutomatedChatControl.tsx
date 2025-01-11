"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Play, Square, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useChatContext } from "@/components/context/ChatContext";

const INITIAL_PROMPT = `I am your AI assistant focused on improving this codebase. I will:
1. Analyze the current implementation
2. Suggest specific improvements
3. Help implement changes
4. Test and validate updates
5. Document modifications

Let's begin with analyzing the current state. What would you like me to focus on first?`;

export function AutomatedChatControl({
  visible = true,
}: {
  visible?: boolean;
}) {
  const [isRunning, setIsRunning] = useState(false);
  const [iterationCount, setIterationCount] = useState(0);
  const { addToast } = useToast();
  const { handleSubmit, input, handleInputChange, messages } = useChatContext();

  const automatedMessages = [
    "Based on the current codebase, what specific improvements should we implement next?",
    "Let's implement those changes. Please provide the code modifications.",
    "Review the implementation and identify any potential issues or optimizations.",
    "Generate documentation for the changes we've made.",
    "What should be our focus for the next iteration of improvements?",
  ];

  const startAutomation = useCallback(async () => {
    setIsRunning(true);
    addToast({
      title: "Automated Improvement Started",
      description: "Initializing AI-driven code improvement cycle",
      variant: "default",
    });

    // Send initial prompt
    handleInputChange({ target: { value: INITIAL_PROMPT } } as any);
    await handleSubmit({} as any);

    const runIteration = async () => {
      if (!isRunning) return;

      const message =
        automatedMessages[iterationCount % automatedMessages.length];
      handleInputChange({ target: { value: message } } as any);
      await handleSubmit({} as any);

      setIterationCount((prev) => prev + 1);
      setTimeout(runIteration, 30000);
    };

    // Start the iteration cycle after initial prompt response
    setTimeout(runIteration, 35000);
  }, [isRunning, iterationCount, handleSubmit, handleInputChange, addToast]);

  const stopAutomation = useCallback(() => {
    setIsRunning(false);
    addToast({
      title: "Automated Chat Stopped",
      description: `Completed ${iterationCount} iterations`,
      variant: "default",
    });
  }, [iterationCount, addToast]);

  if (!visible) return null;

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        className={`${
          isRunning
            ? "bg-red-100 hover:bg-red-200 text-red-700"
            : "bg-green-100 hover:bg-green-200 text-green-700"
        } transition-colors duration-200`}
        onClick={isRunning ? stopAutomation : startAutomation}
      >
        {isRunning ? (
          <>
            <Square className="w-4 h-4 mr-2" />
            Stop Auto-Improve
          </>
        ) : (
          <>
            <Play className="w-4 h-4 mr-2" />
            Start Auto-Improve
          </>
        )}
      </Button>
      {isRunning && (
        <span className="text-sm text-gray-600">
          Iterations: {iterationCount}
        </span>
      )}
    </div>
  );
}
