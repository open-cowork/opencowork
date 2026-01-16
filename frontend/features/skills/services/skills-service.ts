import { apiClient, API_ENDPOINTS } from "@/lib/api-client";
import type {
  SkillInstallCreateInput,
  SkillInstallUpdateInput,
  SkillPreset,
  SkillPresetCreateInput,
  SkillPresetUpdateInput,
  UserSkillInstall,
} from "@/features/skills/types";

export const skillsService = {
  listPresets: async (options?: {
    includeInactive?: boolean;
    revalidate?: number;
  }): Promise<SkillPreset[]> => {
    const query = options?.includeInactive ? "?include_inactive=true" : "";
    return apiClient.get<SkillPreset[]>(
      `${API_ENDPOINTS.skillPresets}${query}`,
      {
        next: { revalidate: options?.revalidate },
      },
    );
  },

  getPreset: async (
    presetId: number,
    options?: { revalidate?: number },
  ): Promise<SkillPreset> => {
    return apiClient.get<SkillPreset>(API_ENDPOINTS.skillPreset(presetId), {
      next: { revalidate: options?.revalidate },
    });
  },

  createPreset: async (input: SkillPresetCreateInput): Promise<SkillPreset> => {
    return apiClient.post<SkillPreset>(API_ENDPOINTS.skillPresets, input);
  },

  updatePreset: async (
    presetId: number,
    input: SkillPresetUpdateInput,
  ): Promise<SkillPreset> => {
    return apiClient.patch<SkillPreset>(
      API_ENDPOINTS.skillPreset(presetId),
      input,
    );
  },

  deletePreset: async (presetId: number): Promise<Record<string, unknown>> => {
    return apiClient.delete<Record<string, unknown>>(
      API_ENDPOINTS.skillPreset(presetId),
    );
  },

  listInstalls: async (options?: {
    revalidate?: number;
  }): Promise<UserSkillInstall[]> => {
    return apiClient.get<UserSkillInstall[]>(API_ENDPOINTS.skillInstalls, {
      next: { revalidate: options?.revalidate },
    });
  },

  createInstall: async (
    input: SkillInstallCreateInput,
  ): Promise<UserSkillInstall> => {
    return apiClient.post<UserSkillInstall>(API_ENDPOINTS.skillInstalls, input);
  },

  updateInstall: async (
    installId: number,
    input: SkillInstallUpdateInput,
  ): Promise<UserSkillInstall> => {
    return apiClient.patch<UserSkillInstall>(
      API_ENDPOINTS.skillInstall(installId),
      input,
    );
  },

  deleteInstall: async (
    installId: number,
  ): Promise<Record<string, unknown>> => {
    return apiClient.delete<Record<string, unknown>>(
      API_ENDPOINTS.skillInstall(installId),
    );
  },

  // Backward-compatible alias used by server components
  list: async (options?: { includeInactive?: boolean; revalidate?: number }) =>
    skillsService.listPresets(options),
};
