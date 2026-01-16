import { apiClient, API_ENDPOINTS } from "@/lib/api-client";
import type { ProjectItem, TaskHistoryItem } from "@/features/projects/types";

export const projectsService = {
  listProjects: async (): Promise<ProjectItem[]> => {
    // TODO: Projects API temporarily disabled
    return [];
    // try {
    //   return await apiClient.get<ProjectItem[]>(API_ENDPOINTS.projects, {
    //     next: { revalidate: options?.revalidate },
    //   });
    // } catch (error) {
    //   console.warn(
    //     "[Projects] Failed to fetch projects, using empty list",
    //     error,
    //   );
    //   return [];
    // }
  },

  createProject: async (name: string): Promise<ProjectItem> => {
    // TODO: Projects API temporarily disabled - using local fallback only
    return {
      id: `project-${Date.now()}`,
      name,
      taskCount: 0,
    };
    // try {
    //   return await apiClient.post<ProjectItem>(API_ENDPOINTS.projects, {
    //     name,
    //   });
    // } catch (error) {
    //   console.warn(
    //     "[Projects] Create project API unavailable, using local fallback",
    //     error,
    //   );
    //   return {
    //     id: `project-${Date.now()}`,
    //     name,
    //     taskCount: 0,
    //   };
    // }
  },
};

// Internal type for API response matching user provided JSON
interface SessionResponse {
  session_id: string;
  created_at: string;
  updated_at: string;
  status: string;
  state_patch?: {
    todos?: { content: string }[];
  };
}

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

      // Map API sessions to TaskHistoryItems
      return sessions.map((session) => {
        // Try to find a meaningful title
        let title = "New Chat";
        if (
          session.state_patch?.todos &&
          session.state_patch.todos.length > 0 &&
          session.state_patch.todos[0].content
        ) {
          title = session.state_patch.todos[0].content;
          // Truncate if too long
          if (title.length > 50) {
            title = title.substring(0, 50) + "...";
          }
        } else {
          // Fallback to ID slice if no title
          title = `Chat ${session.session_id.slice(0, 8)}`;
        }

        // Map status (simple mapping for now, adjust as needed)
        let status: TaskHistoryItem["status"] = "completed";
        const apiStatus = session.status?.toLowerCase();
        if (apiStatus === "running" || apiStatus === "processing") {
          status = "running";
        } else if (apiStatus === "failed" || apiStatus === "error") {
          status = "failed";
        } else if (apiStatus === "pending" || apiStatus === "queued") {
          status = "pending";
        }

        return {
          id: session.session_id,
          title: title,
          timestamp: session.updated_at || session.created_at, // Use updated_at for sorting usually
          status: status,
          projectId: undefined, // TODO: project backend not implemented yet
        };
      });
    } catch (error) {
      console.warn(
        "[Tasks] Failed to fetch task history, using empty list",
        error,
      );
      return [];
    }
  },
};
