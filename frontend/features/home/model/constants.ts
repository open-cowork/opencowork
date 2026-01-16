import type { LucideIcon } from "lucide-react";
import {
  Code,
  Globe,
  MoreHorizontal,
  Palette,
  Presentation,
} from "lucide-react";

import type { ModelInfo } from "@/types";
import type { ConnectedTool } from "@/features/home/types";
import type { MessageStatus } from "@/features/chat/types";

type TaskStatus = "pending" | "running" | "completed" | "failed";

export type QuickAction = {
  id: string;
  labelKey: string;
  icon: LucideIcon;
};

export const QUICK_ACTIONS: QuickAction[] = [
  { id: "slides", labelKey: "prompts.createSlides", icon: Presentation },
  { id: "website", labelKey: "prompts.createWebsite", icon: Globe },
  { id: "app", labelKey: "prompts.developApp", icon: Code },
  { id: "design", labelKey: "prompts.design", icon: Palette },
  { id: "more", labelKey: "prompts.more", icon: MoreHorizontal },
];

export const CONNECTED_TOOLS: ConnectedTool[] = [
  { id: "gmail", name: "Gmail", icon: "📧" },
  { id: "drive", name: "Drive", icon: "📁" },
  { id: "notion", name: "Notion", icon: "📝" },
  { id: "slack", name: "Slack", icon: "💬" },
  { id: "figma", name: "Figma", icon: "🎨" },
];

export const TASK_STATUS_META: Record<
  TaskStatus,
  { dotClassName: string; labelKey: string }
> = {
  pending: {
    dotClassName: "bg-muted-foreground/40",
    labelKey: "status.pending",
  },
  running: { dotClassName: "bg-chart-2", labelKey: "status.running" },
  completed: { dotClassName: "bg-chart-1", labelKey: "status.completed" },
  failed: { dotClassName: "bg-destructive", labelKey: "status.failed" },
};

// Chat-related constants
export const AVAILABLE_MODELS: ModelInfo[] = [
  {
    id: "claude-sonnet-4.5",
    name: "Claude Sonnet 4.5",
    description: "平衡速度和智能",
    icon: "⚡",
    provider: "anthropic",
  },
  {
    id: "claude-opus-4.5",
    name: "Claude Opus 4.5",
    description: "最强大的模型",
    icon: "🚀",
    provider: "anthropic",
  },
  {
    id: "gpt-4-turbo",
    name: "GPT-4 Turbo",
    description: "快速高效",
    icon: "🧠",
    provider: "openai",
  },
];

export const MESSAGE_STATUS_META: Record<
  MessageStatus,
  { labelKey: string; className: string }
> = {
  sending: {
    labelKey: "message.status.sending",
    className: "text-muted-foreground",
  },
  sent: {
    labelKey: "message.status.sent",
    className: "text-muted-foreground",
  },
  streaming: {
    labelKey: "message.status.streaming",
    className: "text-chart-2 animate-pulse",
  },
  completed: {
    labelKey: "message.status.completed",
    className: "text-chart-1",
  },
  failed: {
    labelKey: "message.status.failed",
    className: "text-destructive",
  },
};

// Streaming animation delay (ms per character)
export const STREAMING_CHAR_DELAY = 30;
