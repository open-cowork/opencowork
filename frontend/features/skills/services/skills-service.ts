import { apiClient, API_ENDPOINTS } from "@/lib/api-client";
import type {
  SkillInstallCreateInput,
  SkillInstallUpdateInput,
  Skill,
  SkillCreateInput,
  SkillUpdateInput,
  UserSkillInstall,
  SkillImportDiscoverResponse,
  SkillImportCommitInput,
  SkillImportCommitResponse,
} from "@/features/skills/types";

export const skillsService = {
  listSkills: async (options?: { revalidate?: number }): Promise<Skill[]> => {
    return apiClient.get<Skill[]>(API_ENDPOINTS.skills, {
      next: { revalidate: options?.revalidate },
    });
  },

  getSkill: async (
    skillId: number,
    options?: { revalidate?: number },
  ): Promise<Skill> => {
    return apiClient.get<Skill>(API_ENDPOINTS.skill(skillId), {
      next: { revalidate: options?.revalidate },
    });
  },

  createSkill: async (input: SkillCreateInput): Promise<Skill> => {
    return apiClient.post<Skill>(API_ENDPOINTS.skills, input);
  },

  updateSkill: async (
    skillId: number,
    input: SkillUpdateInput,
  ): Promise<Skill> => {
    return apiClient.patch<Skill>(API_ENDPOINTS.skill(skillId), input);
  },

  deleteSkill: async (skillId: number): Promise<Record<string, unknown>> => {
    return apiClient.delete<Record<string, unknown>>(
      API_ENDPOINTS.skill(skillId),
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

  importDiscover: async (
    formData: FormData,
  ): Promise<SkillImportDiscoverResponse> => {
    return apiClient.post<SkillImportDiscoverResponse>(
      API_ENDPOINTS.skillImportDiscover,
      formData,
    );
  },

  importCommit: async (
    input: SkillImportCommitInput,
  ): Promise<SkillImportCommitResponse> => {
    return apiClient.post<SkillImportCommitResponse>(
      API_ENDPOINTS.skillImportCommit,
      input,
    );
  },

  // Backward-compatible alias used by server components
  list: async (options?: { revalidate?: number }) =>
    skillsService.listSkills(options),
};
