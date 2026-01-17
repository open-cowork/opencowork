import { Layers, ChevronLeft, ChevronRight } from "lucide-react";
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
}: ArtifactsHeaderProps) {
  const headerTitle = title || selectedFile?.name || "文档预览";

  return (
    <PanelHeader
      icon={Layers}
      title={headerTitle}
      description="工作区文件预览"
      className="border-b"
      action={
        onToggleSidebar ? (
          <PanelHeaderAction
            onClick={onToggleSidebar}
            title={isSidebarCollapsed ? "展开文件侧边栏" : "折叠文件侧边栏"}
          >
            {isSidebarCollapsed ? (
              <ChevronLeft className="size-4" />
            ) : (
              <ChevronRight className="size-4" />
            )}
          </PanelHeaderAction>
        ) : undefined
      }
    />
  );
}
