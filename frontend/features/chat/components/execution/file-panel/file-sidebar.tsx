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
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { FileNode } from "@/features/chat/types";

interface FileSidebarProps {
  files: FileNode[];
  onFileSelect: (file: FileNode) => void;
  selectedFile?: FileNode;
  isOpen: boolean;
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

  const getFileIcon = (name: string, type: string) => {
    if (type === "folder") {
      return <Folder className="size-4 text-muted-foreground" />;
    }

    const ext = name.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "md":
      case "txt":
      case "pdf":
      case "docx":
      case "doc":
        return <FileText className="size-4 text-muted-foreground" />;
      case "xlsx":
      case "xls":
      case "csv":
        return <FileText className="size-4 text-muted-foreground" />;
      case "html":
      case "css":
      case "ts":
      case "tsx":
      case "js":
      case "jsx":
      case "json":
      case "py":
        return <FileCode className="size-4 text-muted-foreground" />;
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
      case "svg":
        return <FileImage className="size-4 text-muted-foreground" />;
      default:
        return <FileIcon className="size-4 text-muted-foreground" />;
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
    <div className="w-full min-w-0 max-w-full">
      <div
        className={cn(
          "flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-muted/50 transition-colors overflow-hidden min-w-0 w-full max-w-full",
          indentClass,
          selectedId === node.id && "bg-muted",
        )}
        onClick={handleClick}
      >
        {node.type === "folder" && (
          <span className="shrink-0">
            {isExpanded ? (
              <ChevronDown className="size-3 text-muted-foreground" />
            ) : (
              <ChevronRight className="size-3 text-muted-foreground" />
            )}
          </span>
        )}
        <span className="shrink-0">{getFileIcon(node.name, node.type)}</span>
        <span className="text-sm truncate flex-1 min-w-0 max-w-full overflow-hidden">
          {node.name}
        </span>
      </div>
      {node.type === "folder" && isExpanded && node.children && (
        <div className="w-full min-w-0 max-w-full">
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
  isOpen,
}: FileSidebarProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="w-64 border-l border-border bg-muted/30 flex flex-col">
      <ScrollArea className="flex-1">
        <div className="px-2 py-2">
          {files.map((file) => (
            <FileTreeItem
              key={file.id}
              node={file}
              onSelect={onFileSelect}
              selectedId={selectedFile?.id}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
