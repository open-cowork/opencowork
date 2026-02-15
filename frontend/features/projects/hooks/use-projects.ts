import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createProject as createProjectApi,
  deleteProject as deleteProjectApi,
  listProjects as listProjectsApi,
  updateProject as updateProjectApi,
} from "@/features/projects/api/projects";
import type { ProjectItem } from "@/features/projects/types";
import type {
  ProjectRepoDefaultsInput,
  ProjectUpdatesInput,
} from "@/components/shared/app-shell-context";
import { logger } from "@/lib/logger";

interface UseProjectsOptions {
  initialProjects?: ProjectItem[];
  enableClientFetch?: boolean;
}

const PROJECTS_QUERY_KEY = ["projects"] as const;

export function useProjects(options: UseProjectsOptions = {}) {
  const { initialProjects = [] } = options;
  const enableClientFetch =
    options.enableClientFetch ?? initialProjects.length === 0;
  const queryClient = useQueryClient();

  const projectsQuery = useQuery({
    queryKey: PROJECTS_QUERY_KEY,
    queryFn: () => listProjectsApi(),
    enabled: enableClientFetch,
    initialData: initialProjects,
  });

  const projects = projectsQuery.data ?? [];

  const createMutation = useMutation({
    mutationFn: createProjectApi,
    onSuccess: (created) => {
      queryClient.setQueryData<ProjectItem[]>(PROJECTS_QUERY_KEY, (prev) => [
        ...(prev ?? []),
        created,
      ]);
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateProjectApi,
    onSuccess: (updated, variables) => {
      queryClient.setQueryData<ProjectItem[]>(PROJECTS_QUERY_KEY, (prev) =>
        (prev ?? []).map((project) =>
          project.id === variables.projectId
            ? { ...project, ...updated }
            : project,
        ),
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (projectId: string) => deleteProjectApi({ projectId }),
    onMutate: async (projectId) => {
      await queryClient.cancelQueries({ queryKey: PROJECTS_QUERY_KEY });
      const previousProjects =
        queryClient.getQueryData<ProjectItem[]>(PROJECTS_QUERY_KEY) ?? [];
      queryClient.setQueryData<ProjectItem[]>(PROJECTS_QUERY_KEY, (prev) =>
        (prev ?? []).filter((project) => project.id !== projectId),
      );
      return { previousProjects };
    },
    onError: (error, _projectId, ctx) => {
      logger.error("Failed to delete project", error);
      if (ctx?.previousProjects) {
        queryClient.setQueryData<ProjectItem[]>(
          PROJECTS_QUERY_KEY,
          ctx.previousProjects,
        );
      }
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: PROJECTS_QUERY_KEY });
    },
  });

  const addProject = useCallback(
    async (name: string, options?: ProjectRepoDefaultsInput) => {
      try {
        return await createMutation.mutateAsync({ name, ...(options ?? {}) });
      } catch (error) {
        logger.error("Failed to create project", error);
        return null;
      }
    },
    [createMutation],
  );

  const updateProject = useCallback(
    async (projectId: string, updates: ProjectUpdatesInput) => {
      try {
        return await updateMutation.mutateAsync({ projectId, ...updates });
      } catch (error) {
        logger.error("Failed to update project", error);
        return null;
      }
    },
    [updateMutation],
  );

  const removeProject = useCallback(
    async (projectId: string) => {
      try {
        await deleteMutation.mutateAsync(projectId);
      } catch {
        // Handled by mutation error/rollback.
      }
    },
    [deleteMutation],
  );

  return {
    projects,
    isLoading: projectsQuery.isLoading,
    addProject,
    updateProject,
    removeProject,
    refreshProjects: async () => {
      await projectsQuery.refetch();
    },
  };
}
