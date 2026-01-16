export interface EnvVar {
  id: number;
  user_id: string;
  key: string;
  value: string | null;
  is_secret: boolean;
  description: string | null;
  scope: string;
  created_at: string;
  updated_at: string;
}

export interface EnvVarCreateInput {
  key: string;
  value: string;
  description?: string | null;
  is_secret?: boolean;
  scope?: string;
}

export interface EnvVarUpdateInput {
  value?: string | null;
  description?: string | null;
  is_secret?: boolean | null;
  scope?: string | null;
}
