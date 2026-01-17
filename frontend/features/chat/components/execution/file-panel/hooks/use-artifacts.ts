import { useState, useEffect, useCallback, useRef } from "react";
import { getFilesAction } from "@/features/chat/actions/query-actions";
import type { FileNode } from "@/features/chat/types";

export type ViewMode = "artifacts" | "document";

interface UseArtifactsOptions {
  sessionId?: string;
  sessionStatus?:
    | "running"
    | "accepted"
    | "completed"
    | "failed"
    | "cancelled"
    | "stopped";
}

interface UseArtifactsReturn {
  files: FileNode[];
  selectedFile: FileNode | undefined;
  viewMode: ViewMode;
  isRefreshing: boolean;
  selectFile: (file: FileNode) => void;
  closeViewer: () => void;
  refreshFiles: () => Promise<void>;
}

/**
 * Manages artifacts panel state and file list fetching
 *
 * Responsibilities:
 * - Fetch workspace file list from API
 * - Auto-refresh when session finishes
 * - Manage view mode (artifacts list vs document preview)
 * - Manage sidebar open/close state
 * - Handle file selection
 * - Force open sidebar for file preview
 */
export function useArtifacts({
  sessionId,
  sessionStatus,
}: UseArtifactsOptions): UseArtifactsReturn {
  const [files, setFiles] = useState<FileNode[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileNode | undefined>();
  const [viewMode, setViewMode] = useState<ViewMode>("artifacts");
  const [isRefreshing, setIsRefreshing] = useState(false);
  // Track previous session status to detect when session finishes
  const prevStatusRef = useRef<typeof sessionStatus>(undefined);

  // Manual refresh method
  const refreshFiles = useCallback(async () => {
    if (!sessionId) return;

    try {
      setIsRefreshing(true);
      const data = await getFilesAction({ sessionId });
      setFiles(data);
    } catch (error) {
      console.error("[Artifacts] Failed to fetch workspace files:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [sessionId]);

  // Handle file fetching: initial load and auto-refresh on session finish
  useEffect(() => {
    if (!sessionId) return;

    // Determine if we should fetch files:
    // 1. Initial fetch when sessionId changes (handled by sessionId in deps)
    // 2. Auto-refresh when session transitions from active to finished
    const shouldAutoRefresh =
      sessionStatus &&
      (prevStatusRef.current === "running" ||
        prevStatusRef.current === "accepted") &&
      (sessionStatus === "completed" ||
        sessionStatus === "failed" ||
        sessionStatus === "cancelled" ||
        sessionStatus === "stopped");

    if (shouldAutoRefresh) {
      console.log("[Artifacts] Session finished, refreshing file list...");
    }

    // Fetch files (initial or auto-refresh)
    const doFetch = async () => {
      try {
        console.log(
          `[Artifacts] Fetching file tree for session ${sessionId}, status: ${sessionStatus}`,
        );
        setIsRefreshing(true);
        const data = await getFilesAction({ sessionId });
        setFiles(data);
        console.log(
          `[Artifacts] Successfully fetched ${data.length} root nodes`,
        );
      } catch (error) {
        console.error("[Artifacts] Failed to fetch workspace files:", error);
      } finally {
        setIsRefreshing(false);
      }
    };

    doFetch();

    // Update ref for next comparison
    if (sessionStatus) {
      prevStatusRef.current = sessionStatus;
    }
  }, [sessionId, sessionStatus]); // Include both deps - sessionId changes trigger initial fetch, sessionStatus changes trigger auto-refresh

  // Select a file and switch to document view
  const selectFile = useCallback((file: FileNode) => {
    setSelectedFile(file);
    setViewMode("document");
  }, []);

  const closeViewer = useCallback(() => {
    setViewMode("artifacts");
    setSelectedFile(undefined);
  }, []);

  // Listen for close-document-viewer event
  useEffect(() => {
    const handleCloseViewer = () => {
      closeViewer();
    };

    window.addEventListener("close-document-viewer", handleCloseViewer);
    return () => {
      window.removeEventListener("close-document-viewer", handleCloseViewer);
    };
  }, [closeViewer]);

  return {
    files,
    selectedFile,
    viewMode,
    isRefreshing,
    selectFile,
    closeViewer,
    refreshFiles,
  };
}
