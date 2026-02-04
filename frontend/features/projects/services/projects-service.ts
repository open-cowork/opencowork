import { apiClient, API_ENDPOINTS } from "@/lib/api-client";
import type { SessionResponse } from "@/features/chat/types";
import type { ProjectItem, TaskHistoryItem } from "@/features/projects/types";

interface ProjectApiResponse {
  project_id: string;
  user_id?: string;
  name: string;
  created_at?: string;
  updated_at?: string;
  task_count?: number;
}

function mapProject(project: ProjectApiResponse): ProjectItem {
  return {
    id: project.project_id,
    name: project.name,
    userId: project.user_id,
    createdAt: project.created_at,
    updatedAt: project.updated_at,
    taskCount:
      typeof project.task_count === "number" ? project.task_count : undefined,
  };
}

function resolveSessionTitle(session: SessionResponse): string {
  if (session.title?.trim()) {
    return session.title.trim();
  }

  const todoContent = session.state_patch?.todos?.[0]?.content;
  if (todoContent?.trim()) {
    const content = todoContent.trim();
    return content.length > 50 ? `${content.slice(0, 50)}...` : content;
  }

  // Return empty string to let UI layer handle i18n "New Chat" display
  return "";
}

function mapSessionToTask(session: SessionResponse): TaskHistoryItem {
  let status: TaskHistoryItem["status"] = "completed";
  const apiStatus = session.status?.toLowerCase();
  if (apiStatus === "running" || apiStatus === "processing") {
    status = "running";
  } else if (apiStatus === "failed" || apiStatus === "error") {
    status = "failed";
  } else if (apiStatus === "canceled" || apiStatus === "cancelled") {
    status = "canceled";
  } else if (apiStatus === "pending" || apiStatus === "queued") {
    status = "pending";
  }

  return {
    id: session.session_id,
    title: resolveSessionTitle(session),
    timestamp: session.updated_at || session.created_at,
    status,
    projectId: session.project_id || undefined,
  };
}

export const projectsService = {
  listProjects: async (options?: {
    revalidate?: number;
  }): Promise<ProjectItem[]> => {
    try {
      const projects = await apiClient.get<ProjectApiResponse[]>(
        API_ENDPOINTS.projects,
        {
          next: { revalidate: options?.revalidate },
        },
      );
      return projects.map(mapProject);
    } catch (error) {
      console.warn(
        "[Projects] Failed to fetch projects, using empty list",
        error,
      );
      return [];
    }
  },

  createProject: async (payload: {
    name: string;
    repo_url?: string;
    git_branch?: string;
    git_token_env_key?: string | null;
  }): Promise<ProjectItem> => {
    const project = await apiClient.post<ProjectApiResponse>(
      API_ENDPOINTS.projects,
      payload,
    );
    return mapProject(project);
  },

  updateProject: async (
    projectId: string,
    payload: { name?: string },
  ): Promise<ProjectItem> => {
    const project = await apiClient.patch<ProjectApiResponse>(
      API_ENDPOINTS.project(projectId),
      payload,
    );
    return mapProject(project);
  },

  deleteProject: async (projectId: string): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.project(projectId));
  },
};

export const tasksService = {
  listHistory: async (options?: {
    revalidate?: number;
  }): Promise<TaskHistoryItem[]> => {
    try {
      const sessions = await apiClient.get<SessionResponse[]>(
        API_ENDPOINTS.sessions,
        {
          next: { revalidate: options?.revalidate },
        },
      );

      return sessions.map(mapSessionToTask);
    } catch (error) {
      console.warn(
        "[Tasks] Failed to fetch task history, using empty list",
        error,
      );
      return [];
    }
  },

  updateTaskProject: async (
    sessionId: string,
    projectId: string | null,
  ): Promise<void> => {
    await apiClient.patch(API_ENDPOINTS.session(sessionId), {
      project_id: projectId,
    });
  },
};
