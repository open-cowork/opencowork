"use client";

import * as React from "react";
import { Bot, Copy, ThumbsUp, Check } from "lucide-react";
import { MessageContent } from "./message-content";
import { TypingIndicator } from "./typing-indicator";
import type {
  ChatMessage,
  MessageBlock,
  UsageResponse,
} from "@/features/chat/types";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n/client";

interface AssistantMessageProps {
  message: ChatMessage;
  runUsage?: UsageResponse | null;
}

function pickNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function formatCostUsd(value: number | null | undefined): string | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return `$${value.toFixed(6)}`;
}

function formatDurationMs(value: number | null | undefined): string | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return null;
  }
  const seconds = value / 1000;
  // Keep it compact and consistent across locales.
  return seconds >= 60 ? `${Math.round(seconds)}s` : `${seconds.toFixed(1)}s`;
}

export function AssistantMessage({ message, runUsage }: AssistantMessageProps) {
  const { t } = useT("translation");
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

  const usageJson = runUsage?.usage_json as
    | Record<string, unknown>
    | null
    | undefined;
  const inputTokens = pickNumber(usageJson?.input_tokens);
  const outputTokens = pickNumber(usageJson?.output_tokens);
  const tokenSegments: string[] = [];
  if (inputTokens !== null) {
    tokenSegments.push(
      `${t("chat.tokenInput")} ${inputTokens.toLocaleString()}`,
    );
  }
  if (outputTokens !== null) {
    tokenSegments.push(
      `${t("chat.tokenOutput")} ${outputTokens.toLocaleString()}`,
    );
  }
  const tokensLabel =
    tokenSegments.length > 0 ? tokenSegments.join(" · ") : null;
  const costLabel = formatCostUsd(runUsage?.total_cost_usd);
  const durationLabel = formatDurationMs(runUsage?.total_duration_ms);
  const showUsage =
    !!runUsage &&
    message.status !== "streaming" &&
    (costLabel !== null || tokensLabel !== null || durationLabel !== null);
  const timestampLabel =
    message.timestamp && !isNaN(new Date(message.timestamp).getTime())
      ? new Date(message.timestamp).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      : null;

  return (
    <div className="group w-full min-w-0 animate-in fade-in slide-in-from-left-4 duration-300">
      <div className="flex min-w-0 items-center gap-2">
        <div className="size-8 shrink-0 rounded-full border border-border bg-muted">
          <div className="flex size-full items-center justify-center">
            <Bot className="size-4 text-muted-foreground" />
          </div>
        </div>
        <span className="shrink-0 text-xs font-bold uppercase tracking-wide text-foreground/50">
          Poco
        </span>
        {timestampLabel ? (
          <span className="shrink-0 text-[10px] text-muted-foreground/40">
            {timestampLabel}
          </span>
        ) : null}
      </div>

      <div className="mt-2 w-full min-w-0 overflow-hidden break-words text-base text-foreground [overflow-wrap:anywhere]">
        <MessageContent content={message.content} />
        {message.status === "streaming" && <TypingIndicator />}
      </div>

      <div className="mt-2 flex min-w-0 items-center gap-2 pt-2">
        <div className="shrink-0 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
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

        {showUsage ? (
          <div className="w-0 flex-1 overflow-hidden truncate text-right font-mono text-xs tabular-nums text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
            {costLabel ? `${t("chat.cost")}: ${costLabel}` : null}
            {tokensLabel
              ? `${costLabel ? " · " : ""}${t("chat.tokens")}: ${tokensLabel}`
              : null}
            {durationLabel
              ? `${costLabel || tokensLabel ? " · " : ""}${t("chat.duration")}: ${durationLabel}`
              : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
