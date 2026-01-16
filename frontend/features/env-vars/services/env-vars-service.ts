import { apiClient, API_ENDPOINTS } from "@/lib/api-client";
import type {
  EnvVar,
  EnvVarCreateInput,
  EnvVarUpdateInput,
} from "@/features/env-vars/types";

export const envVarsService = {
  list: async (options?: {
    includeSecrets?: boolean;
    revalidate?: number;
  }): Promise<EnvVar[]> => {
    const query = options?.includeSecrets ? "?include_secrets=true" : "";
    return apiClient.get<EnvVar[]>(`${API_ENDPOINTS.envVars}${query}`, {
      next: { revalidate: options?.revalidate },
    });
  },

  create: async (input: EnvVarCreateInput): Promise<EnvVar> => {
    return apiClient.post<EnvVar>(API_ENDPOINTS.envVars, input);
  },

  update: async (
    envVarId: number,
    input: EnvVarUpdateInput,
  ): Promise<EnvVar> => {
    return apiClient.patch<EnvVar>(API_ENDPOINTS.envVar(envVarId), input);
  },

  remove: async (envVarId: number): Promise<Record<string, unknown>> => {
    return apiClient.delete<Record<string, unknown>>(
      API_ENDPOINTS.envVar(envVarId),
    );
  },
};
