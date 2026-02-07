import { Layers, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import {
  PanelHeader,
  PanelHeaderAction,
} from "@/components/shared/panel-header";
import type { FileNode } from "@/features/chat/types";

interface ArtifactsHeaderProps {
  title?: string;
  selectedFile?: FileNode;
  isSidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
  sessionId?: string;
  headerAction?: React.ReactNode;
}

/**
 * Header component for artifacts panel
 * Used across all view modes (artifacts list, document preview, empty state)
 */
export function ArtifactsHeader({
  title,
  selectedFile,
  isSidebarCollapsed = false,
  onToggleSidebar,
  headerAction,
}: ArtifactsHeaderProps) {
  const headerTitle = title || selectedFile?.name || "Document Preview";

  return (
    <PanelHeader
      icon={Layers}
      title={headerTitle}
      description="Workspace file preview"
      className="border-b"
      content={
        headerAction ? (
          <div className="flex items-center">{headerAction}</div>
        ) : undefined
      }
      action={
        onToggleSidebar ? (
          <PanelHeaderAction
            onClick={onToggleSidebar}
            aria-label={isSidebarCollapsed ? "Open sidebar" : "Close sidebar"}
          >
            {isSidebarCollapsed ? (
              <PanelLeftOpen className="size-4" />
            ) : (
              <PanelLeftClose className="size-4" />
            )}
          </PanelHeaderAction>
        ) : undefined
      }
    />
  );
}
