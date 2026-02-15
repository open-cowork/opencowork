/**
 * Centralized route builders.
 *
 * Keep all client-side navigation paths in one place to avoid string drift.
 */

function withLng(lng: string | undefined | null, path: string): string {
  const cleanLng = (lng ?? "").trim();
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return cleanLng ? `/${cleanLng}${cleanPath}` : cleanPath;
}

export const routes = {
  home: (lng?: string | null) => withLng(lng, "/home"),
  capabilities: (lng?: string | null) => withLng(lng, "/capabilities"),
  scheduledTasks: (lng?: string | null) =>
    withLng(lng, "/capabilities/scheduled-tasks"),
  scheduledTaskDetail: (lng: string | undefined | null, taskId: string) =>
    withLng(lng, `/capabilities/scheduled-tasks/${encodeURIComponent(taskId)}`),
  chat: (lng: string | undefined | null, sessionId: string) =>
    withLng(lng, `/chat/${encodeURIComponent(sessionId)}`),
  project: (lng: string | undefined | null, projectId: string) =>
    withLng(lng, `/projects/${encodeURIComponent(projectId)}`),
};
