"use client";

import * as React from "react";
import { FileSidebar } from "./file-sidebar";
import { DocumentViewer } from "./document-viewer";
import { ArtifactsHeader } from "./artifacts-header";
import { FileChangesList } from "./file-changes-list";
import { ArtifactsEmpty } from "./artifacts-empty";
import { useArtifacts } from "./hooks/use-artifacts";
import type { FileChange, FileNode } from "@/features/chat/types";
import { cn } from "@/lib/utils";

interface ArtifactsPanelProps {
  fileChanges?: FileChange[];
  sessionId?: string;
  sessionStatus?:
    | "running"
    | "accepted"
    | "completed"
    | "failed"
    | "canceled"
    | "stopped";
  headerAction?: React.ReactNode;
}

/**
 * Artifacts Panel Container Component
 *
 * Displays file changes in a card-based layout
 *
 * Responsibilities:
 * - Manage view mode switching (file changes list / document preview)
 * - Coordinate between file browser and document viewer
 * - Render appropriate view based on state
 * - Auto-refresh file list when session finishes
 *
 * Delegates to:
 * - useArtifacts: State management and file fetching
 * - ArtifactsHeader: Shared header component
 * - FileChangesList: File changes list view with summary
 * - ArtifactsEmpty: Empty state view
 * - DocumentViewer: Document preview
 * - FileSidebar: File browser sidebar
 */
export function ArtifactsPanel({
  fileChanges = [],
  sessionId,
  sessionStatus,
  headerAction,
}: ArtifactsPanelProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);
  const {
    files,
    selectedFile,
    viewMode,
    selectFile,
    closeViewer,
    ensureFreshFile,
  } = useArtifacts({ sessionId, sessionStatus });
  const mainContent = (() => {
    if (viewMode === "document") {
      return (
        <DocumentViewer file={selectedFile} ensureFreshFile={ensureFreshFile} />
      );
    }

    if (fileChanges.length === 0) {
      return <ArtifactsEmpty sessionStatus={sessionStatus} />;
    }

    return (
      <FileChangesList
        fileChanges={fileChanges}
        sessionStatus={sessionStatus}
        onFileClick={(filePath) => {
          const findFileByPath = (
            nodes: FileNode[],
            path: string,
          ): FileNode | undefined => {
            for (const node of nodes) {
              if (node.path === path) return node;
              if (node.children) {
                const found = findFileByPath(node.children, path);
                if (found) return found;
              }
            }
            return undefined;
          };

          let file = findFileByPath(files, filePath);

          if (!file) {
            const name = filePath.split("/").pop() || filePath;
            file = {
              id: filePath,
              name,
              path: filePath,
              type: "file",
            };
          }

          if (file) {
            selectFile(file);
          }
        }}
      />
    );
  })();

  const contentNode =
    viewMode === "document" ? (
      <div className="h-full min-h-0 max-h-full overflow-hidden">
        {mainContent}
      </div>
    ) : (
      <div className="h-full min-h-0 max-h-full overflow-hidden rounded-xl border bg-card">
        {mainContent}
      </div>
    );

  const handleToggleSidebar = React.useCallback(() => {
    const willCollapse = !isSidebarCollapsed;
    setIsSidebarCollapsed(willCollapse);

    // If collapsing sidebar and currently in document view, switch to artifacts view
    if (willCollapse && viewMode === "document") {
      closeViewer();
    }
  }, [isSidebarCollapsed, viewMode, closeViewer]);

  return (
    <div className="flex h-full min-h-0 flex-col min-w-0 overflow-hidden">
      <ArtifactsHeader
        title="文件变更"
        selectedFile={selectedFile}
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebar={handleToggleSidebar}
        sessionId={sessionId}
        headerAction={headerAction}
      />
      <div
        className={cn(
          "flex-1 min-h-0 grid grid-cols-1 gap-0 transition-all duration-200 overflow-hidden",
          isSidebarCollapsed ? "md:grid-cols-1" : "md:grid-cols-[2fr_1fr]",
        )}
      >
        <div className="min-w-0 border-b border-border/60 bg-background md:border-b-0 overflow-hidden">
          <div className="flex h-full flex-col overflow-hidden">
            <div className="flex-1 min-h-0 overflow-hidden p-3 sm:p-4">
              {contentNode}
            </div>
          </div>
        </div>
        {!isSidebarCollapsed && (
          <div className="min-w-0 border-t border-border/60 bg-muted/30 md:border-t-0">
            <FileSidebar
              files={files}
              onFileSelect={(file) => {
                if (viewMode === "document" && file.id === selectedFile?.id) {
                  closeViewer();
                  return;
                }
                selectFile(file);
              }}
              selectedFile={selectedFile}
              sessionId={sessionId}
            />
          </div>
        )}
      </div>
    </div>
  );
}
