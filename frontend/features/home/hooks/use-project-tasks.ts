"use client";

import * as React from "react";
import type { TaskHistoryItem } from "@/features/projects/types";

export function useProjectTasks(
  initialTasksFn?: () => TaskHistoryItem[],
  projectId?: string,
) {
  // Initialize task list
  const [tasks, setTasks] = React.useState<TaskHistoryItem[]>(() => {
    if (initialTasksFn) {
      const allTasks = initialTasksFn();
      // If projectId is specified, return only tasks for that project
      if (projectId) {
        return allTasks.filter((task) => task.projectId === projectId);
      }
      return allTasks;
    }
    return [];
  });

  // Add task
  const addTask = React.useCallback(
    (title: string, metadata?: Partial<TaskHistoryItem>) => {
      const newTask: TaskHistoryItem = {
        id: `task-${Date.now()}`,
        title,
        status: "pending",
        timestamp: metadata?.timestamp || new Date().toISOString(),
        projectId: metadata?.projectId || projectId || undefined,
      };

      setTasks((prev) => [newTask, ...prev]);
      return newTask;
    },
    [projectId],
  );

  // Remove task
  const removeTask = React.useCallback((taskId: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== taskId));
  }, []);

  // Update task-project association
  const updateTaskProject = React.useCallback(
    (taskId: string, newProjectId: string | undefined) => {
      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId ? { ...task, projectId: newProjectId } : task,
        ),
      );
    },
    [],
  );

  // Rename task
  const renameTask = React.useCallback((taskId: string, newName: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, title: newName } : task,
      ),
    );
  }, []);

  return {
    taskHistory: tasks,
    addTask,
    removeTask,
    updateTaskProject,
    renameTask,
  };
}
