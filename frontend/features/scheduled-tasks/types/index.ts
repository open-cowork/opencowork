import type { TaskConfig } from "@/features/chat/types/api/session";

export interface ScheduledTask {
  scheduled_task_id: string; // UUID
  user_id: string;
  name: string;
  cron: string;
  timezone: string;
  prompt: string;
  enabled: boolean;
  reuse_session: boolean;
  workspace_scope: "session" | "scheduled_task" | "project";
  project_id: string | null;
  session_id: string | null;
  next_run_at: string; // ISO datetime
  last_run_id: string | null;
  last_run_status: string | null;
  last_error: string | null;
  created_at: string; // ISO datetime
  updated_at: string; // ISO datetime
}

export interface ScheduledTaskCreateInput {
  name: string;
  cron: string;
  timezone: string;
  prompt: string;
  enabled?: boolean;
  reuse_session?: boolean;
  workspace_scope?: "session" | "scheduled_task" | "project";
  project_id?: string | null;
  config?: TaskConfig | null;
}

export interface ScheduledTaskUpdateInput {
  name?: string | null;
  cron?: string | null;
  timezone?: string | null;
  prompt?: string | null;
  enabled?: boolean | null;
  reuse_session?: boolean | null;
  workspace_scope?: "session" | "scheduled_task" | "project" | null;
}

export interface ScheduledTaskTriggerResponse {
  session_id: string;
  run_id: string;
}
