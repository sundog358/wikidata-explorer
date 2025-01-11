"use client";

import { useChatContext } from "@/components/context/ChatContext";
import { useEffect, useState } from "react";
import styles from "./ConversationSummary.module.css";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ChatSummaryProps {
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

export default function ConversationSummary({
systemMessage,
onRemove,
index = 0,
}: ChatSummaryProps) {
const { streamingContent, isLoading } = useChatContext();
const [summary, setSummary] = useState<string>("");

useEffect(() => {
if (streamingContent) {
setSummary((prev) => prev + streamingContent);
}
}, [streamingContent]);

return (
<div className={styles.container}>
<div className={styles.header}>
<Avatar className="w-6 h-6">
<AvatarImage
src={SUMMARY_AGENT_AVATARS[index % 4]}
alt={`AI Agent ${index + 1}`}
/>
<AvatarFallback>A{index + 1}</AvatarFallback>
</Avatar>
<button onClick={onRemove} className={styles.removeButton}>
&times;
</button>
</div>
<div className={styles.content}>
{isLoading ? (
<div className="text-gray-500 italic">Processing conversation...</div>
) : (
<div className="text-blue-900 whitespace-pre-wrap">{summary}</div>
)}
</div>
</div>
);
}
