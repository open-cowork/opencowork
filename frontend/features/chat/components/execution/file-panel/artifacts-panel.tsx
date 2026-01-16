"use client";
import { FileSidebar } from "./file-sidebar";
import { DocumentViewer } from "./document-viewer";
import { ArtifactsHeader } from "./artifacts-header";
import { FileChangesList } from "./file-changes-list";
import { ArtifactsEmpty } from "./artifacts-empty";
import { useArtifacts } from "./hooks/use-artifacts";
import type { FileChange, FileNode } from "@/features/chat/types";

interface ArtifactsPanelProps {
  fileChanges?: FileChange[];
  sessionId?: string;
  sessionStatus?: "running" | "accepted" | "completed" | "failed" | "cancelled";
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
}: ArtifactsPanelProps) {
  const {
    files,
    selectedFile,
    viewMode,
    isSidebarOpen,
    selectFile,
    toggleSidebar,
  } = useArtifacts({ sessionId, sessionStatus });

  // Document viewer mode
  if (viewMode === "document") {
    return (
      <div className="flex flex-col h-full">
        <ArtifactsHeader
          selectedFile={selectedFile}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={toggleSidebar}
          sessionStatus={sessionStatus}
        />
        <div className="flex-1 min-h-0 flex overflow-hidden">
          <div className="flex-1 min-w-0 p-4">
            <DocumentViewer file={selectedFile} />
          </div>
          {isSidebarOpen && (
            <div className="shrink-0 relative z-10 animate-in slide-in-from-right duration-300 shadow-lg">
              <FileSidebar
                files={files}
                onFileSelect={selectFile}
                selectedFile={selectedFile}
                isOpen={isSidebarOpen}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  // Empty state
  if (fileChanges.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <ArtifactsHeader
          title="文件变更"
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={toggleSidebar}
          sessionStatus={sessionStatus}
        />
        <div className="flex-1 min-h-0 flex overflow-hidden">
          <div className="flex-1 min-w-0">
            <ArtifactsEmpty sessionStatus={sessionStatus} />
          </div>
          {isSidebarOpen && (
            <div className="shrink-0 relative z-10 animate-in slide-in-from-right duration-300 shadow-lg">
              <FileSidebar
                files={files}
                onFileSelect={selectFile}
                selectedFile={selectedFile}
                isOpen={isSidebarOpen}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  // File changes list view
  return (
    <div className="flex flex-col h-full">
      <ArtifactsHeader
        title="文件变更"
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={toggleSidebar}
        sessionStatus={sessionStatus}
      />
      <div className="flex-1 min-h-0 flex overflow-hidden">
        <div className="flex-1 min-w-0">
          <FileChangesList
            fileChanges={fileChanges}
            sessionStatus={sessionStatus}
            onFileClick={(filePath) => {
              // Find the file node from the file list
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

              // If file not found in tree (e.g. list not refreshed yet), construct from path
              if (!file && sessionId) {
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
                // Force open sidebar when previewing file
                toggleSidebar(true);
              }
            }}
          />
        </div>
        {isSidebarOpen && (
          <div className="shrink-0 relative z-10 animate-in slide-in-from-right duration-300 shadow-lg">
            <FileSidebar
              files={files}
              onFileSelect={selectFile}
              selectedFile={selectedFile}
              isOpen={isSidebarOpen}
            />
          </div>
        )}
      </div>
    </div>
  );
}
