"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { useT } from "@/lib/i18n/client";
import { FileChangeCard } from "./file-change-card";
import type { FileChange } from "@/features/chat/types";

interface FileChangesListProps {
  fileChanges?: FileChange[];
  sessionStatus?:
    | "running"
    | "accepted"
    | "completed"
    | "failed"
    | "canceled"
    | "stopped";
  onFileClick?: (filePath: string) => void;
}

/**
 * Summary statistics for file changes
 */
interface FileChangesSummaryProps {
  fileChanges: FileChange[];
}

function FileChangesSummary({ fileChanges }: FileChangesSummaryProps) {
  const { t } = useT("translation");
  const summary = fileChanges.reduce(
    (acc, change) => {
      switch (change.status) {
        case "added":
          acc.added++;
          break;
        case "modified":
          acc.modified++;
          break;
        case "deleted":
          acc.deleted++;
          break;
        case "renamed":
          acc.renamed++;
          break;
      }
      acc.totalLines += (change.added_lines || 0) + (change.deleted_lines || 0);
      return acc;
    },
    { added: 0, modified: 0, deleted: 0, renamed: 0, totalLines: 0 },
  );

  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-3 bg-muted/30 border-b border-border text-sm">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-muted-foreground">
          {t("artifacts.summary.total")}
        </span>
        <span className="font-semibold">
          {fileChanges.length} {t("artifacts.summary.totalFiles", "files")}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {summary.added > 0 && (
          <div className="flex items-center gap-1.5 text-success">
            <div className="w-2 h-2 rounded-full bg-success" />
            <span>
              +{summary.added} {t("artifacts.summary.added")}
            </span>
          </div>
        )}

        {summary.modified > 0 && (
          <div className="flex items-center gap-1.5 text-info">
            <div className="w-2 h-2 rounded-full bg-info" />
            <span>
              {summary.modified} {t("artifacts.summary.modified")}
            </span>
          </div>
        )}

        {summary.deleted > 0 && (
          <div className="flex items-center gap-1.5 text-destructive">
            <div className="w-2 h-2 rounded-full bg-destructive" />
            <span>
              -{summary.deleted} {t("artifacts.summary.deleted")}
            </span>
          </div>
        )}

        {summary.renamed > 0 && (
          <div className="flex items-center gap-1.5 text-renamed">
            <div className="w-2 h-2 rounded-full bg-renamed" />
            <span>
              {summary.renamed} {t("artifacts.summary.renamed")}
            </span>
          </div>
        )}
      </div>

      {summary.totalLines > 0 && (
        <div className="ml-auto text-xs text-muted-foreground">
          {summary.totalLines.toLocaleString()}{" "}
          {t("artifacts.summary.lineChanges")}
        </div>
      )}
    </div>
  );
}

/**
 * Enhanced scrollable list of file changes with summary
 */
export function FileChangesList({
  fileChanges = [],
  sessionStatus,
  onFileClick,
}: FileChangesListProps) {
  const { t } = useT("translation");

  if (fileChanges.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-muted-foreground">
          <p className="text-sm">{t("artifacts.empty.noChanges")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <FileChangesSummary fileChanges={fileChanges} />
      <ScrollArea className="flex-1">
        <div className="px-4 py-4 space-y-3">
          {fileChanges.map((change, index) => (
            <FileChangeCard
              key={`${change.path}-${index}`}
              change={change}
              sessionStatus={sessionStatus}
              onFileClick={() => onFileClick?.(change.path)}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
