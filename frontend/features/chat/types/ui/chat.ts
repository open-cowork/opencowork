import type { InputFile } from "../api/session";

/**
 * Chat-related UI types (frontend-specific)
 */

export type MessageRole = "user" | "assistant" | "system";

export type MessageStatus =
  | "sending"
  | "sent"
  | "streaming"
  | "completed"
  | "failed";

export type TextBlock = {
  _type: "TextBlock";
  text: string;
};

export type ToolUseBlock = {
  _type: "ToolUseBlock";
  id: string;
  name: string;
  input: Record<string, unknown>;
};

export type ToolResultBlock = {
  _type: "ToolResultBlock";
  tool_use_id: string;
  content: string;
  is_error: boolean;
};

export type MessageBlock = TextBlock | ToolUseBlock | ToolResultBlock;

export type ToolCall = {
  id: string;
  name: string;
  input: Record<string, unknown>;
  output?: string;
  status: "pending" | "running" | "completed" | "failed";
};

export type ChatMessage = {
  id: string;
  role: MessageRole;
  content: string | MessageBlock[];
  status: MessageStatus;
  timestamp?: string;
  metadata?: {
    model?: string;
    tokensUsed?: number;
    duration?: number;
    toolCalls?: ToolCall[];
  };
  parentId?: string;
  attachments?: InputFile[];
};

export type ChatSession = {
  id: string;
  taskId: string;
  title: string;
  messages: ChatMessage[];
  status: "pending" | "running" | "completed" | "failed";
  model: string;
  createdAt: string;
  updatedAt: string;
};
