export interface McpPreset {
  id: number;
  name: string;
  display_name: string;
  description: string | null;
  category: string | null;
  transport: string;
  default_config: Record<string, unknown> | null;
  config_schema: Record<string, unknown> | null;
  source: string;
  owner_user_id: string | null;
  version: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface McpPresetCreateInput {
  name: string;
  display_name: string;
  transport: string;
  description?: string | null;
  category?: string | null;
  default_config?: Record<string, unknown> | null;
  config_schema?: Record<string, unknown> | null;
  version?: string | null;
}

export interface McpPresetUpdateInput {
  display_name?: string | null;
  description?: string | null;
  category?: string | null;
  transport?: string | null;
  default_config?: Record<string, unknown> | null;
  config_schema?: Record<string, unknown> | null;
  version?: string | null;
  is_active?: boolean | null;
}

export interface UserMcpConfig {
  id: number;
  user_id: string;
  preset_id: number;
  enabled: boolean;
  overrides: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface UserMcpConfigCreateInput {
  preset_id: number;
  enabled?: boolean;
  overrides?: Record<string, unknown> | null;
}

export interface UserMcpConfigUpdateInput {
  enabled?: boolean | null;
  overrides?: Record<string, unknown> | null;
}
