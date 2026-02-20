"use client";

import * as React from "react";
import { MoreHorizontal, PenSquare, Share2, Trash2 } from "lucide-react";

import { useT } from "@/lib/i18n/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ProjectItem } from "@/features/projects/types";
import { RenameProjectDialog } from "@/features/projects/components/rename-project-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PageHeaderShell } from "@/components/shared/page-header-shell";

interface ProjectHeaderProps {
  project?: ProjectItem;
  onRenameProject?: (projectId: string, name: string) => void;
  onDeleteProject?: (projectId: string) => Promise<void> | void;
}

export function ProjectHeader({
  project,
  onRenameProject,
  onDeleteProject,
}: ProjectHeaderProps) {
  const { t } = useT("translation");
  const [isRenameDialogOpen, setIsRenameDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleRename = React.useCallback(
    (newName: string) => {
      if (!project) return;
      onRenameProject?.(project.id, newName);
    },
    [onRenameProject, project],
  );

  const handleDelete = React.useCallback(async () => {
    if (!project || !onDeleteProject) return;
    try {
      setIsDeleting(true);
      await onDeleteProject(project.id);
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  }, [onDeleteProject, project]);

  return (
    <>
      <PageHeaderShell
        left={
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <div className="flex flex-col min-w-0">
              <p className="truncate text-base font-semibold text-foreground">
                {project?.name ?? t("project.untitled", "Untitled Project")}
              </p>
              {project?.description ? (
                <p className="truncate text-xs text-muted-foreground">
                  {project.description}
                </p>
              ) : null}
            </div>
          </div>
        }
        right={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-muted-foreground hover:bg-muted"
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="right">
              <DropdownMenuItem onClick={() => setIsRenameDialogOpen(true)}>
                <PenSquare className="size-4" />
                <span>{t("project.rename")}</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Share2 className="size-4" />
                <span>{t("project.share")}</span>
              </DropdownMenuItem>
              {onDeleteProject && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                    onClick={() => setIsDeleteDialogOpen(true)}
                  >
                    <Trash2 className="size-4 text-destructive" />
                    <span>{t("project.delete")}</span>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />

      <RenameProjectDialog
        open={isRenameDialogOpen}
        onOpenChange={setIsRenameDialogOpen}
        projectName={project?.name ?? ""}
        onRename={handleRename}
      />
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("project.delete")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("project.deleteDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              {t("common.cancel", "Cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("project.deleteConfirm", "Delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
