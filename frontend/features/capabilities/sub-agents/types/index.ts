import type { SourceInfo } from "@/features/capabilities/types/source";

export type SubAgentMode = "raw" | "structured";

export interface SubAgent {
  id: number;
  user_id: string;
  name: string;
  source?: SourceInfo | null;
  enabled: boolean;
  mode: SubAgentMode;

  description?: string | null;
  prompt?: string | null;
  tools?: string[] | null;
  raw_markdown?: string | null;

  created_at: string;
  updated_at: string;
}

export interface SubAgentCreateInput {
  name: string;
  enabled?: boolean;
  mode?: SubAgentMode;

  description?: string | null;
  prompt?: string | null;
  tools?: string[] | null;

  raw_markdown?: string | null;
}

export interface SubAgentUpdateInput {
  name?: string | null;
  enabled?: boolean | null;
  mode?: SubAgentMode | null;

  description?: string | null;
  prompt?: string | null;
  tools?: string[] | null;

  raw_markdown?: string | null;
}
