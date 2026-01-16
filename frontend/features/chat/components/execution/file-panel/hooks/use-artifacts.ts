import { useState, useEffect, useCallback, useRef } from "react";
import { getFilesAction } from "@/features/chat/actions/query-actions";
import type { FileNode } from "@/features/chat/types";

export type ViewMode = "artifacts" | "document";

interface UseArtifactsOptions {
  sessionId?: string;
  sessionStatus?: "running" | "accepted" | "completed" | "failed" | "cancelled";
}

interface UseArtifactsReturn {
  files: FileNode[];
  selectedFile: FileNode | undefined;
  viewMode: ViewMode;
  isSidebarOpen: boolean;
  isRefreshing: boolean;
  selectFile: (file: FileNode) => void;
  toggleSidebar: (forceOpen?: boolean) => void;
  setViewMode: (mode: ViewMode) => void;
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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
        sessionStatus === "cancelled");

    if (shouldAutoRefresh) {
      console.log("[Artifacts] Session finished, refreshing file list...");
    }

    // Fetch files (initial or auto-refresh)
    const doFetch = async () => {
      try {
        setIsRefreshing(true);
        const data = await getFilesAction({ sessionId });
        setFiles(data);
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

  // Toggle sidebar and sync view mode
  const toggleSidebar = useCallback((forceOpen?: boolean) => {
    if (forceOpen === true) {
      // Force open sidebar and switch to document mode
      setViewMode("document");
      setIsSidebarOpen(true);
    } else if (forceOpen === false) {
      // Force close sidebar and switch to artifacts mode
      setViewMode("artifacts");
      setIsSidebarOpen(false);
      setSelectedFile(undefined);
    } else {
      // Toggle based on current mode
      setViewMode((currentMode) => {
        if (currentMode === "document") {
          // If in document mode, close sidebar and switch to artifacts
          setIsSidebarOpen(false);
          setSelectedFile(undefined);
          return "artifacts";
        } else {
          // If in artifacts mode, open sidebar and switch to document
          setIsSidebarOpen(true);
          return "document";
        }
      });
    }
  }, []);

  return {
    files,
    selectedFile,
    viewMode,
    isSidebarOpen,
    isRefreshing,
    selectFile,
    toggleSidebar,
    setViewMode,
    refreshFiles,
  };
}
