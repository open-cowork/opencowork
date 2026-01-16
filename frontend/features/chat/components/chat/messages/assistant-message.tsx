"use client";

import * as React from "react";
import { Bot, Copy, ThumbsUp, Check } from "lucide-react";
import { MessageContent } from "./message-content";
import { TypingIndicator } from "./typing-indicator";
import type { ChatMessage, MessageBlock } from "@/features/chat/types";
import { Button } from "@/components/ui/button";

interface AssistantMessageProps {
  message: ChatMessage;
}

export function AssistantMessage({ message }: AssistantMessageProps) {
  const [isCopied, setIsCopied] = React.useState(false);
  const [isLiked, setIsLiked] = React.useState(false);

  // Helper function to extract text content from message
  const getTextContent = (content: string | MessageBlock[]): string => {
    if (typeof content === "string") {
      return content;
    }

    // If it's an array of blocks, extract text from TextBlock
    if (Array.isArray(content)) {
      const textBlocks = content.filter(
        (block: MessageBlock) => block._type === "TextBlock",
      );
      return textBlocks
        .map((block: MessageBlock) =>
          block._type === "TextBlock" ? block.text : "",
        )
        .join("\n\n");
    }

    return String(content);
  };

  const onCopy = async () => {
    try {
      const textContent = getTextContent(message.content);
      await navigator.clipboard.writeText(textContent);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy message", err);
    }
  };

  const onLike = () => {
    setIsLiked(!isLiked);
    // TODO: Send feedback to API
  };

  return (
    <div className="flex w-full gap-4 group animate-in fade-in slide-in-from-left-4 duration-300 min-w-0">
      {/* Avatar Section */}
      <div className="flex-shrink-0 mt-1">
        <div className="size-8 rounded-full bg-muted border border-border flex items-center justify-center">
          <Bot className="size-4 text-muted-foreground" />
        </div>
      </div>

      {/* Content Section */}
      <div className="flex-1 min-w-0 space-y-2 w-full">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-bold text-foreground/50 tracking-wide uppercase shrink-0">
            COCO
          </span>
          <span className="text-[10px] text-muted-foreground/40 shrink-0">
            {message.timestamp && !isNaN(new Date(message.timestamp).getTime())
              ? new Date(message.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : null}
          </span>
        </div>

        <div className="text-foreground leading-relaxed text-sm break-words w-full min-w-0">
          <MessageContent content={message.content} />
          {message.status === "streaming" && <TypingIndicator />}
        </div>

        {/* Action Buttons - Visible on hover */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pt-2">
          <Button
            variant="ghost"
            size="icon"
            className="size-7 text-muted-foreground hover:text-foreground"
            onClick={onCopy}
            title="Copy message"
          >
            {isCopied ? (
              <Check className="size-3.5" />
            ) : (
              <Copy className="size-3.5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={`size-7 hover:text-foreground ${
              isLiked
                ? "text-primary hover:text-primary/90"
                : "text-muted-foreground"
            }`}
            onClick={onLike}
            title="Like response"
          >
            <ThumbsUp className={`size-3.5 ${isLiked ? "fill-current" : ""}`} />
          </Button>
        </div>
      </div>
    </div>
  );
}
