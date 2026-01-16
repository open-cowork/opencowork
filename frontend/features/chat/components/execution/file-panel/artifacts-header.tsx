import { Layers, PanelRight, PanelRightClose } from "lucide-react";
import {
  PanelHeader,
  PanelHeaderAction,
} from "@/components/shared/panel-header";
import type { FileNode } from "@/features/chat/types";
import { useEffect, useState, useRef } from "react";

interface ArtifactsHeaderProps {
  title?: string;
  selectedFile?: FileNode;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  sessionStatus?: "running" | "accepted" | "completed" | "failed" | "cancelled";
}

/**
 * Header component for artifacts panel
 * Used across all view modes (artifacts list, document preview, empty state)
 */
export function ArtifactsHeader({
  title,
  selectedFile,
  isSidebarOpen,
  onToggleSidebar,
  sessionStatus,
}: ArtifactsHeaderProps) {
  const headerTitle = title || selectedFile?.name || "文档预览";

  // Track if session just finished to trigger flash animation
  const [shouldFlash, setShouldFlash] = useState(false);
  const prevStatusRef = useRef<typeof sessionStatus>(undefined);

  useEffect(() => {
    if (!sessionStatus) return;

    const wasActive =
      prevStatusRef.current === "running" ||
      prevStatusRef.current === "accepted";
    const isFinished =
      sessionStatus === "completed" ||
      sessionStatus === "failed" ||
      sessionStatus === "cancelled";

    // Trigger flash animation when transitioning from active to finished
    if (wasActive && isFinished) {
      // Use setTimeout to avoid synchronous setState in effect
      const startTimer = setTimeout(() => {
        setShouldFlash(true);
      }, 0);

      // Remove flash animation after 2 seconds
      const endTimer = setTimeout(() => {
        setShouldFlash(false);
      }, 2000);

      // Update ref and return cleanup
      prevStatusRef.current = sessionStatus;
      return () => {
        clearTimeout(startTimer);
        clearTimeout(endTimer);
      };
    }

    // Update ref for next comparison
    prevStatusRef.current = sessionStatus;
  }, [sessionStatus]);

  // Determine if button should be disabled (session is running)
  const isSessionRunning =
    sessionStatus === "running" || sessionStatus === "accepted";

  // Build dynamic className for flash animation (only when button is enabled)
  const buttonClassName =
    shouldFlash && !isSessionRunning
      ? "animate-pulse ring-2 ring-primary ring-offset-2 ring-offset-background"
      : "";

  return (
    <PanelHeader
      icon={Layers}
      title={headerTitle}
      description="工作区文件预览"
      action={
        <PanelHeaderAction
          onClick={onToggleSidebar}
          disabled={isSessionRunning}
          className={buttonClassName}
        >
          {isSidebarOpen ? (
            <PanelRightClose className="size-4" />
          ) : (
            <PanelRight className="size-4" />
          )}
        </PanelHeaderAction>
      }
    />
  );
}
