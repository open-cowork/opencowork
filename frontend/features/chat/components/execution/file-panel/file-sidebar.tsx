"use client";

import * as React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Folder,
  FileText,
  FileCode,
  FileImage,
  File as FileIcon,
  ChevronRight,
  ChevronDown,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { FileNode } from "@/features/chat/types";
import { apiClient, API_ENDPOINTS } from "@/lib/api-client";
import { toast } from "sonner";
import { PanelHeaderAction } from "@/components/shared/panel-header";

interface FileSidebarProps {
  files: FileNode[];
  onFileSelect: (file: FileNode) => void;
  selectedFile?: FileNode;
  sessionId?: string;
}

function FileTreeItem({
  node,
  onSelect,
  selectedId,
  level = 0,
}: {
  node: FileNode;
  onSelect: (file: FileNode) => void;
  selectedId?: string;
  level?: number;
}) {
  const [isExpanded, setIsExpanded] = React.useState(level === 0);

  // Check if this node or any of its children is the selected one
  const containsSelected = React.useMemo(() => {
    if (!selectedId) return false;
    const check = (n: FileNode): boolean => {
      if (n.id === selectedId) return true;
      if (n.children) {
        return n.children.some((child) => check(child));
      }
      return false;
    };
    return check(node);
  }, [node, selectedId]);

  // Auto-expand if selection is found within subtree
  React.useEffect(() => {
    if (containsSelected && node.type === "folder") {
      setIsExpanded(true);
    }
  }, [containsSelected, node.type]);

  const getFileIcon = (name: string, type: string, className?: string) => {
    if (type === "folder") {
      return <Folder className={cn("size-4", className)} />;
    }

    const ext = name.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "md":
      case "txt":
      case "pdf":
      case "docx":
      case "doc":
        return <FileText className={cn("size-4", className)} />;
      case "xlsx":
      case "xls":
      case "csv":
        return <FileText className={cn("size-4", className)} />;
      case "html":
      case "css":
      case "ts":
      case "tsx":
      case "js":
      case "jsx":
      case "json":
      case "py":
        return <FileCode className={cn("size-4", className)} />;
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
      case "svg":
        return <FileImage className={cn("size-4", className)} />;
      default:
        return <FileIcon className={cn("size-4", className)} />;
    }
  };

  const handleClick = () => {
    if (node.type === "folder") {
      setIsExpanded(!isExpanded);
    } else {
      onSelect(node);
    }
  };

  const INDENT_CLASSES = [
    "pl-2",
    "pl-5",
    "pl-8",
    "pl-12",
    "pl-14",
    "pl-16",
    "pl-20",
  ];
  const indentClass =
    INDENT_CLASSES[Math.min(level, INDENT_CLASSES.length - 1)];

  return (
    <div className="w-full min-w-0">
      <div
        className={cn(
          "flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors min-w-0 group/item",
          indentClass,
          selectedId === node.id
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
        )}
        onClick={handleClick}
      >
        <div className="shrink-0 w-3 flex items-center justify-center">
          {node.type === "folder" &&
            (isExpanded ? (
              <ChevronDown className="size-3 text-sidebar-foreground/70" />
            ) : (
              <ChevronRight className="size-3 text-sidebar-foreground/70" />
            ))}
        </div>
        <span className="shrink-0">
          {getFileIcon(
            node.name,
            node.type,
            selectedId === node.id
              ? "text-sidebar-accent-foreground"
              : "text-sidebar-foreground/70",
          )}
        </span>
        <span className="text-sm flex-1 min-w-0 truncate" title={node.name}>
          {node.name}
        </span>
      </div>
      {node.type === "folder" && isExpanded && node.children && (
        <div className="w-full min-w-0">
          {node.children.map((child) => (
            <FileTreeItem
              key={child.id}
              node={child}
              onSelect={onSelect}
              selectedId={selectedId}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function FileSidebar({
  files,
  onFileSelect,
  selectedFile,
  sessionId,
}: FileSidebarProps) {
  const handleDownload = async () => {
    if (!sessionId) return;
    try {
      const response = await apiClient.get<{
        url?: string | null;
        filename?: string | null;
      }>(API_ENDPOINTS.sessionWorkspaceArchive(sessionId));

      if (response.url) {
        const filename = response.filename || `workspace-${sessionId}.zip`;
        const link = document.createElement("a");
        link.href = response.url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("开始下载工作区归档");
      } else {
        toast.error("归档文件暂不可用");
      }
    } catch (error) {
      console.error("[Artifacts] Failed to download workspace archive", error);
      toast.error("下载失败");
    }
  };

  return (
    <aside className="flex h-full min-h-0 min-w-0 flex-col border-l border-border/60 bg-sidebar/60 text-sidebar-foreground">
      <div className="flex items-center justify-between px-3 py-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-sidebar-foreground/70">
          文件列表
        </span>
        {sessionId && (
          <PanelHeaderAction onClick={handleDownload} aria-label="下载全部">
            <Download className="size-4" />
          </PanelHeaderAction>
        )}
      </div>
      <ScrollArea className="flex-1 min-h-0">
        <div className="px-2 py-2 space-y-1 min-w-0 overflow-hidden">
          {files.length === 0 ? (
            <p className="text-xs text-sidebar-foreground/60 px-2 py-1">
              暂无文件
            </p>
          ) : (
            files.map((file) => (
              <FileTreeItem
                key={file.id}
                node={file}
                onSelect={onFileSelect}
                selectedId={selectedFile?.id}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </aside>
  );
}
