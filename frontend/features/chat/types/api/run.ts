/**
 * Run/Task-related API types matching backend schemas
 */

import type { TaskConfig } from "./session";

export type { TaskConfig, InputFile } from "./session";

export interface TaskEnqueueRequest {
  prompt: string;
  config?: TaskConfig | null;
  session_id?: string | null; // UUID, optional for continuing session
  schedule_mode?: string; // defaults to "immediate"
  timezone?: string | null;
  scheduled_at?: string | null; // ISO datetime
}

export interface TaskEnqueueResponse {
  session_id: string; // UUID
  run_id: string; // UUID
  status: string;
}

export interface RunResponse {
  run_id: string; // UUID
  session_id: string; // UUID
  user_message_id: number;
  status: string;
  progress: number;
  schedule_mode: string;
  scheduled_at: string; // ISO datetime
  claimed_by: string | null;
  lease_expires_at: string | null;
  attempts: number;
  last_error: string | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string; // ISO datetime
  updated_at: string; // ISO datetime
}

export interface RunClaimRequest {
  worker_id: string;
  lease_seconds?: number; // defaults to 30
  schedule_modes?: string[] | null;
}

export interface RunClaimResponse {
  run: RunResponse;
  user_id: string;
  prompt: string;
  config_snapshot: Record<string, unknown> | null;
  sdk_session_id: string | null;
}

export interface RunStartRequest {
  worker_id: string;
}

export interface RunFailRequest {
  worker_id: string;
  error_message?: string | null;
}
