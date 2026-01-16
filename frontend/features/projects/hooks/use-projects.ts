import { useState, useCallback, useEffect } from "react";
import {
  createProjectAction,
  listProjectsAction,
} from "@/features/projects/actions/project-actions";
import type { ProjectItem } from "@/features/projects/types";

interface UseProjectsOptions {
  initialProjects?: ProjectItem[];
  enableClientFetch?: boolean;
}

export function useProjects(options: UseProjectsOptions = {}) {
  const { initialProjects = [], enableClientFetch = false } = options;
  const [projects, setProjects] = useState<ProjectItem[]>(initialProjects);
  const [isLoading, setIsLoading] = useState(!initialProjects.length);

  const fetchProjects = useCallback(async () => {
    try {
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

  const addProject = useCallback(async (name: string) => {
    try {
      const newProject = await createProjectAction({ name });
      setProjects((prev) => [...prev, newProject]);
      return newProject;
    } catch (error) {
      console.error("Failed to create project", error);
      return null;
    }
  }, []);

  return {
    projects,
    isLoading,
    addProject,
  };
}
