/**
 * Execution-related UI types (frontend-specific)
 */

import type { ApiStatePatch } from "../api/callback";

export type ExecutionStatus = "accepted" | "running" | "completed" | "failed";

export type ArtifactType =
  | "text"
  | "code_diff"
  | "image"
  | "ppt"
  | "pdf"
  | "markdown"
  | "json";

export interface Artifact {
  id: string;
  type: ArtifactType;
  title: string;
  content?: string;
  url?: string;
  metadata?: {
    language?: string;
    size?: number;
    format?: string;
  };
  created_at: string;
}

export interface SkillUse {
  id: string;
  name: string;
  description: string;
  status: "pending" | "running" | "completed" | "failed";
  duration?: number;
  created_at: string;
}

export interface NewMessage {
  title: string;
}

/**
 * Frontend StatePatch extends API StatePatch with UI-specific fields
 */
export interface StatePatch extends ApiStatePatch {
  artifacts?: Artifact[];
  skills_used?: SkillUse[];
}

/**
 * Frontend aggregation of session execution state
 * Used for real-time UI updates during agent execution
 */
export interface ExecutionSession {
  session_id: string;
  time: string;
  status: ExecutionStatus;
  progress: number;
  new_message?: NewMessage;
  state_patch: StatePatch;
  task_name?: string;
  user_prompt?: string;
}
