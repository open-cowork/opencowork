import { useState, useCallback, useEffect } from "react";
import { listTaskHistoryAction } from "@/features/projects/actions/project-actions";
import type { TaskHistoryItem } from "@/features/projects/types";

interface UseTaskHistoryOptions {
  initialTasks?: TaskHistoryItem[];
}

export function useTaskHistory(options: UseTaskHistoryOptions = {}) {
  const { initialTasks = [] } = options;
  const [taskHistory, setTaskHistory] =
    useState<TaskHistoryItem[]>(initialTasks);
  const [isLoading, setIsLoading] = useState(!initialTasks.length);

  const fetchTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await listTaskHistoryAction();
      setTaskHistory(data);
    } catch (error) {
      console.error("Failed to fetch task history", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const addTask = useCallback(
    (
      title: string,
      options?: {
        timestamp?: string;
        status?: TaskHistoryItem["status"];
        projectId?: string;
        id?: string;
      },
    ) => {
      const newTask: TaskHistoryItem = {
        // Use sessionId if provided, otherwise fallback to random (for optimistic updates)
        id:
          options?.id ||
          `task-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        title,
        timestamp: options?.timestamp || new Date().toISOString(),
        status: options?.status || "pending",
        projectId: options?.projectId,
      };
      setTaskHistory((prev) => [newTask, ...prev]);
      return newTask;
    },
    [],
  );

  const removeTask = useCallback(
    async (taskId: string) => {
      // Optimistic update
      const previousTasks = taskHistory;
      setTaskHistory((prev) => prev.filter((task) => task.id !== taskId));

      try {
        const { deleteSessionAction } =
          await import("@/features/chat/actions/session-actions");
        await deleteSessionAction({ sessionId: taskId });
      } catch (error) {
        console.error("Failed to delete task", error);
        // Rollback on error
        setTaskHistory(previousTasks);
      }
    },
    [taskHistory],
  );

  const moveTask = useCallback((taskId: string, projectId: string | null) => {
    setTaskHistory((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? { ...task, projectId: projectId ?? undefined }
          : task,
      ),
    );
  }, []);

  return {
    taskHistory,
    isLoading,
    addTask,
    removeTask,
    moveTask,
    refreshTasks: fetchTasks,
  };
}
