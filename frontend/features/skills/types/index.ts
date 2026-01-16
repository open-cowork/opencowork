export interface SkillPreset {
  id: number;
  name: string;
  display_name: string;
  description: string | null;
  category: string | null;
  entry: Record<string, unknown> | null;
  default_config: Record<string, unknown> | null;
  config_schema: Record<string, unknown> | null;
  source: string;
  owner_user_id: string | null;
  version: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SkillPresetCreateInput {
  name: string;
  display_name: string;
  description?: string | null;
  category?: string | null;
  entry?: Record<string, unknown> | null;
  default_config?: Record<string, unknown> | null;
  config_schema?: Record<string, unknown> | null;
  version?: string | null;
}

export interface SkillPresetUpdateInput {
  display_name?: string | null;
  description?: string | null;
  category?: string | null;
  entry?: Record<string, unknown> | null;
  default_config?: Record<string, unknown> | null;
  config_schema?: Record<string, unknown> | null;
  version?: string | null;
  is_active?: boolean | null;
}

export interface UserSkillInstall {
  id: number;
  user_id: string;
  preset_id: number;
  enabled: boolean;
  overrides: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface SkillInstallCreateInput {
  preset_id: number;
  enabled?: boolean;
  overrides?: Record<string, unknown> | null;
}

export interface SkillInstallUpdateInput {
  enabled?: boolean | null;
  overrides?: Record<string, unknown> | null;
}
