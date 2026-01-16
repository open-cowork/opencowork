import { apiClient, API_ENDPOINTS } from "@/lib/api-client";
import type {
  McpPreset,
  McpPresetCreateInput,
  McpPresetUpdateInput,
  UserMcpConfig,
  UserMcpConfigCreateInput,
  UserMcpConfigUpdateInput,
} from "@/features/mcp/types";

export const mcpService = {
  listPresets: async (options?: {
    includeInactive?: boolean;
    revalidate?: number;
  }): Promise<McpPreset[]> => {
    const query = options?.includeInactive ? "?include_inactive=true" : "";
    return apiClient.get<McpPreset[]>(`${API_ENDPOINTS.mcpPresets}${query}`, {
      next: { revalidate: options?.revalidate },
    });
  },

  getPreset: async (
    presetId: number,
    options?: { revalidate?: number },
  ): Promise<McpPreset> => {
    return apiClient.get<McpPreset>(API_ENDPOINTS.mcpPreset(presetId), {
      next: { revalidate: options?.revalidate },
    });
  },

  createPreset: async (input: McpPresetCreateInput): Promise<McpPreset> => {
    return apiClient.post<McpPreset>(API_ENDPOINTS.mcpPresets, input);
  },

  updatePreset: async (
    presetId: number,
    input: McpPresetUpdateInput,
  ): Promise<McpPreset> => {
    return apiClient.patch<McpPreset>(API_ENDPOINTS.mcpPreset(presetId), input);
  },

  deletePreset: async (presetId: number): Promise<Record<string, unknown>> => {
    return apiClient.delete<Record<string, unknown>>(
      API_ENDPOINTS.mcpPreset(presetId),
    );
  },

  listConfigs: async (options?: {
    revalidate?: number;
  }): Promise<UserMcpConfig[]> => {
    return apiClient.get<UserMcpConfig[]>(API_ENDPOINTS.mcpConfigs, {
      next: { revalidate: options?.revalidate },
    });
  },

  createConfig: async (
    input: UserMcpConfigCreateInput,
  ): Promise<UserMcpConfig> => {
    return apiClient.post<UserMcpConfig>(API_ENDPOINTS.mcpConfigs, input);
  },

  updateConfig: async (
    configId: number,
    input: UserMcpConfigUpdateInput,
  ): Promise<UserMcpConfig> => {
    return apiClient.patch<UserMcpConfig>(
      API_ENDPOINTS.mcpConfig(configId),
      input,
    );
  },

  deleteConfig: async (configId: number): Promise<Record<string, unknown>> => {
    return apiClient.delete<Record<string, unknown>>(
      API_ENDPOINTS.mcpConfig(configId),
    );
  },
};
