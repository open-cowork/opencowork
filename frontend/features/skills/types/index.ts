export interface Skill {
  id: number;
  name: string;
  entry: Record<string, unknown>;
  scope: string;
  owner_user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface SkillCreateInput {
  name: string;
  entry: Record<string, unknown>;
  scope?: string | null;
}

export interface SkillUpdateInput {
  name?: string | null;
  entry?: Record<string, unknown> | null;
  scope?: string | null;
}

export interface UserSkillInstall {
  id: number;
  user_id: string;
  skill_id: number;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface SkillInstallCreateInput {
  skill_id: number;
  enabled?: boolean;
}

export interface SkillInstallUpdateInput {
  enabled?: boolean | null;
}

export interface SkillImportCandidate {
  relative_path: string;
  skill_name: string | null;
  requires_name: boolean;
  will_overwrite: boolean;
}

export interface SkillImportDiscoverResponse {
  archive_key: string;
  candidates: SkillImportCandidate[];
}

export interface SkillImportSelection {
  relative_path: string;
  name_override?: string | null;
}

export interface SkillImportCommitInput {
  archive_key: string;
  selections: SkillImportSelection[];
}

export interface SkillImportResultItem {
  relative_path: string;
  skill_name: string | null;
  skill_id: number | null;
  overwritten: boolean;
  status: string;
  error: string | null;
}

export interface SkillImportCommitResponse {
  items: SkillImportResultItem[];
}
