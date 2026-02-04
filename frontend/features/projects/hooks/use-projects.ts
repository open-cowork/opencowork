import { useState, useCallback, useEffect } from "react";
import {
  createProjectAction,
  deleteProjectAction,
  listProjectsAction,
  updateProjectAction,
} from "@/features/projects/actions/project-actions";
import type { ProjectItem } from "@/features/projects/types";
import type { ProjectRepoDefaultsInput } from "@/components/shared/app-shell-context";

interface UseProjectsOptions {
  initialProjects?: ProjectItem[];
  enableClientFetch?: boolean;
}

export function useProjects(options: UseProjectsOptions = {}) {
  const { initialProjects = [] } = options;
  const enableClientFetch =
    options.enableClientFetch ?? initialProjects.length === 0;
  const [projects, setProjects] = useState<ProjectItem[]>(initialProjects);
  const [isLoading, setIsLoading] = useState(enableClientFetch);

  const fetchProjects = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await listProjectsAction();
      setProjects(data);
    } catch (error) {
      console.error("Failed to fetch projects", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enableClientFetch) {
      setIsLoading(false);
      return;
    }
    fetchProjects();
  }, [enableClientFetch, fetchProjects]);

  const addProject = useCallback(
    async (name: string, options?: ProjectRepoDefaultsInput) => {
      try {
        const newProject = await createProjectAction({
          name,
          ...(options ?? {}),
        });
        setProjects((prev) => [...prev, newProject]);
        return newProject;
      } catch (error) {
        console.error("Failed to create project", error);
        return null;
      }
    },
    [],
  );

  const updateProject = useCallback(
    async (projectId: string, updates: { name?: string }) => {
      try {
        const updated = await updateProjectAction({
          projectId,
          name: updates.name,
        });
        setProjects((prev) =>
          prev.map((project) =>
            project.id === projectId ? { ...project, ...updated } : project,
          ),
        );
        return updated;
      } catch (error) {
        console.error("Failed to update project", error);
        return null;
      }
    },
    [],
  );

  const removeProject = useCallback(
    async (projectId: string) => {
      const previousProjects = projects;
      setProjects((prev) => prev.filter((project) => project.id !== projectId));
      try {
        await deleteProjectAction({ projectId });
      } catch (error) {
        console.error("Failed to delete project", error);
        setProjects(previousProjects);
      }
    },
    [projects],
  );

  return {
    projects,
    isLoading,
    addProject,
    updateProject,
    removeProject,
    refreshProjects: fetchProjects,
  };
}
