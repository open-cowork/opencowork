export interface ProjectItem {
  id: string;
  name: string;
  icon?: string;
  taskCount: number;
}

export interface TaskHistoryItem {
  id: string;
  title: string;
  timestamp: string;
  status: "pending" | "running" | "completed" | "failed";
  projectId?: string;
}
