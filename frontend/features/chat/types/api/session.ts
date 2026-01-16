/**
 * Session-related API types matching backend schemas
 */

import type { ApiStatePatch } from "./callback";

export interface SessionCreateRequest {
  config?: TaskConfig | null;
}

export interface SessionUpdateRequest {
  status?: string | null;
  sdk_session_id?: string | null;
  workspace_archive_url?: string | null;
  state_patch?: ApiStatePatch | null;
  workspace_files_prefix?: string | null;
  workspace_manifest_key?: string | null;
  workspace_archive_key?: string | null;
  workspace_export_status?: string | null;
}

export interface SessionResponse {
  session_id: string; // UUID
  user_id: string;
  sdk_session_id: string | null;
  config_snapshot: Record<string, unknown> | null;
  workspace_archive_url: string | null;
  state_patch?: ApiStatePatch | null;
  workspace_export_status?: string | null;
  workspace_files_prefix?: string | null;
  workspace_manifest_key?: string | null;
  workspace_archive_key?: string | null;
  status: string;
  created_at: string; // ISO datetime
  updated_at: string; // ISO datetime
}

export interface SessionStateResponse {
  session_id: string;
  status: string;
  state_patch?: ApiStatePatch | null;
  workspace_export_status?: string | null;
  updated_at: string;
}

export interface MessageResponse {
  id: number;
  role: string;
  content: Record<string, unknown>;
  created_at: string; // ISO datetime
  updated_at: string; // ISO datetime
}

export interface ToolExecutionResponse {
  id: string; // UUID
  message_id: number | null;
  tool_use_id: string | null;
  tool_name: string;
  tool_input: Record<string, unknown> | null;
  tool_output: Record<string, unknown> | null;
  is_error: boolean;
  duration_ms: number | null;
  created_at: string; // ISO datetime
}

export interface UsageResponse {
  total_cost_usd: number | null;
  total_duration_ms: number | null;
  usage_json: Record<string, unknown> | null;
}

export interface InputFile {
  id?: string | null;
  type?: "file" | "url";
  name: string;
  source: string;
  size?: number | null;
  content_type?: string | null;
  path?: string | null;
}

export interface TaskConfig {
  repo_url?: string | null;
  git_branch?: string; // defaults to "main"
  mcp_config?: Record<string, unknown>;
  skill_files?: Record<string, unknown>;
  input_files?: InputFile[];
}
