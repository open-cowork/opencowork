import {
  FilePlus,
  FileEdit,
  FileX,
  GitCompare,
  ArrowRight,
  Plus,
  Minus,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FileChange } from "@/features/chat/types";

interface FileChangeCardProps {
  change: FileChange;
  sessionStatus?:
    | "running"
    | "accepted"
    | "completed"
    | "failed"
    | "cancelled"
    | "stopped";
  onFileClick?: () => void;
}

/**
 * Get icon and color for file change status
 */
function getStatusConfig(status: FileChange["status"]) {
  switch (status) {
    case "added":
      return {
        icon: FilePlus,
        color: "text-green-600 dark:text-green-400",
      };
    case "modified":
      return {
        icon: FileEdit,
        color: "text-blue-600 dark:text-blue-400",
      };
    case "deleted":
      return {
        icon: FileX,
        color: "text-red-600 dark:text-red-400",
      };
    case "renamed":
      return {
        icon: GitCompare,
        color: "text-purple-600 dark:text-purple-400",
      };
    default:
      return {
        icon: FileEdit,
        color: "text-gray-600 dark:text-gray-400",
      };
  }
}

/**
 * Truncate file path intelligently
 * Shows filename and truncates middle of long paths
 */
function truncatePath(path: string, maxLength: number = 50): string {
  if (path.length <= maxLength) return path;

  // If path is very long, show start...end
  const startLength = Math.floor(maxLength / 2) - 2;
  const endLength = Math.ceil(maxLength / 2) - 2;

  return `${path.slice(0, startLength)}...${path.slice(-endLength)}`;
}

/**
 * Individual file change card
 */
export function FileChangeCard({
  change,
  sessionStatus,
  onFileClick,
}: FileChangeCardProps) {
  const statusConfig = getStatusConfig(change.status);
  const StatusIcon = statusConfig.icon;

  const addedLines = change.added_lines ?? 0;
  const deletedLines = change.deleted_lines ?? 0;
  const hasLineChanges = addedLines > 0 || deletedLines > 0;
  const totalChanges = addedLines + deletedLines;

  // Determine if session is running (execution state)
  const isSessionRunning =
    sessionStatus === "running" || sessionStatus === "accepted";

  const handlePreviewClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isSessionRunning && onFileClick) {
      onFileClick();
    }
  };

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden w-full max-w-full">
      {/* Header with path and status */}
      <div className="flex items-center gap-3 px-4 py-3 min-w-0 overflow-hidden w-full max-w-full">
        <StatusIcon className={`size-5 shrink-0 ${statusConfig.color}`} />

        <div className="flex-1 min-w-0 overflow-hidden w-full max-w-full">
          {change.status === "renamed" && change.old_path ? (
            <div className="flex items-center gap-2 min-w-0 overflow-hidden w-full max-w-full">
              <span
                className="text-sm font-medium flex-1 min-w-0 max-w-full truncate text-muted-foreground line-through"
                title={change.old_path}
              >
                {truncatePath(change.old_path)}
              </span>
              <ArrowRight className="size-3.5 text-muted-foreground shrink-0" />
              <span
                className="text-sm font-medium flex-1 min-w-0 max-w-full truncate"
                title={change.path}
              >
                {truncatePath(change.path)}
              </span>
            </div>
          ) : (
            <p
              className="text-sm font-medium min-w-0 max-w-full truncate"
              title={change.path}
            >
              {truncatePath(change.path)}
            </p>
          )}
        </div>

        {/* Preview button */}
        <Button
          variant="ghost"
          size="icon"
          className={`shrink-0 size-8 ${
            isSessionRunning
              ? "opacity-50 cursor-not-allowed"
              : "hover:bg-muted"
          }`}
          onClick={handlePreviewClick}
          disabled={isSessionRunning}
          title={isSessionRunning ? "执行中，暂不可预览" : "预览文件"}
        >
          {isSessionRunning ? (
            <EyeOff className="size-4" />
          ) : (
            <Eye className="size-4" />
          )}
        </Button>
      </div>

      {/* Line changes statistics */}
      {hasLineChanges && (
        <div className="flex items-center gap-4 px-4 py-2 bg-muted/30 text-xs min-w-0 overflow-hidden w-full max-w-full">
          {addedLines > 0 && (
            <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400 shrink-0">
              <Plus className="size-3 shrink-0" />
              <span className="font-medium shrink-0">{addedLines}</span>
              <span className="text-muted-foreground shrink-0">行新增</span>
            </div>
          )}
          {deletedLines > 0 && (
            <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400 shrink-0">
              <Minus className="size-3 shrink-0" />
              <span className="font-medium shrink-0">{deletedLines}</span>
              <span className="text-muted-foreground shrink-0">行删除</span>
            </div>
          )}
          <div className="ml-auto text-muted-foreground shrink-0">
            共 {totalChanges} 行变更
          </div>
        </div>
      )}

      {/* Diff preview (if available) */}
      {change.diff && (
        <div className="px-4 py-3 border-t border-border min-w-0 overflow-hidden w-full max-w-full">
          <details className="group min-w-0 overflow-hidden w-full max-w-full">
            <summary className="cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground transition-colors truncate">
              查看差异
            </summary>
            <pre className="mt-2 text-xs font-mono bg-muted/50 rounded p-2 overflow-x-auto whitespace-pre max-h-40 overflow-y-auto min-w-0 w-full max-w-full">
              <code className="block min-w-0 overflow-hidden">
                {change.diff}
              </code>
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}
