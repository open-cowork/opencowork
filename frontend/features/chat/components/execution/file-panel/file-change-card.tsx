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
    | "canceled"
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
        color: "text-success",
      };
    case "modified":
      return {
        icon: FileEdit,
        color: "text-info",
      };
    case "deleted":
      return {
        icon: FileX,
        color: "text-destructive",
      };
    case "renamed":
      return {
        icon: GitCompare,
        color: "text-renamed",
      };
    default:
      return {
        icon: FileEdit,
        color: "text-muted-foreground",
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
    <div className="rounded-lg border border-border bg-card overflow-hidden w-full">
      {/* Header with path and status */}
      <div className="flex items-center gap-3 px-4 py-3 min-w-0">
        <StatusIcon className={`size-5 shrink-0 ${statusConfig.color}`} />

        <div className="flex-1 min-w-0">
          {change.status === "renamed" && change.old_path ? (
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="text-sm font-medium flex-1 min-w-0 truncate text-muted-foreground line-through"
                title={change.old_path}
              >
                {truncatePath(change.old_path)}
              </span>
              <ArrowRight className="size-3.5 text-muted-foreground shrink-0" />
              <span
                className="text-sm font-medium flex-1 min-w-0 truncate"
                title={change.path}
              >
                {truncatePath(change.path)}
              </span>
            </div>
          ) : (
            <p
              className="text-sm font-medium min-w-0 truncate"
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
          title={isSessionRunning ? "Running; preview unavailable" : "Preview file"}
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
        <div className="flex items-center gap-4 px-4 py-2 bg-muted/30 text-xs">
          {addedLines > 0 && (
            <div className="flex items-center gap-1.5 text-success shrink-0">
              <Plus className="size-3 shrink-0" />
              <span className="font-medium shrink-0">{addedLines}</span>
              <span className="text-muted-foreground shrink-0">Lines added</span>
            </div>
          )}
          {deletedLines > 0 && (
            <div className="flex items-center gap-1.5 text-destructive shrink-0">
              <Minus className="size-3 shrink-0" />
              <span className="font-medium shrink-0">{deletedLines}</span>
              <span className="text-muted-foreground shrink-0">Lines removed</span>
            </div>
          )}
          <div className="ml-auto text-muted-foreground shrink-0">
            Total {totalChanges} line changes
          </div>
        </div>
      )}

      {/* Diff preview (if available) */}
      {change.diff && (
        <div className="px-4 py-3 border-t border-border">
          <details className="group">
            <summary className="cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground transition-colors truncate">
              View diff
            </summary>
            <pre className="mt-2 text-xs font-mono bg-muted/50 rounded p-2 overflow-x-auto whitespace-pre max-h-40 overflow-y-auto">
              <code className="block">{change.diff}</code>
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}
