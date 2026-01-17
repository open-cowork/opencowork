"use client";

import * as React from "react";
import {
  ChevronDown,
  ChevronRight,
  Folder,
  MoreHorizontal,
  PenSquare,
  Trash2,
} from "lucide-react";
import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import type { ProjectItem, TaskHistoryItem } from "@/features/projects/types";
import { TaskHistoryList } from "./task-history-list";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useT } from "@/lib/i18n/client";
import { RenameProjectDialog } from "@/features/projects/components/rename-project-dialog";
import { Checkbox } from "@/components/ui/checkbox";
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

interface CollapsibleProjectItemProps {
  project: ProjectItem;
  tasks: TaskHistoryItem[];
  isExpanded: boolean;
  onToggle: () => void;
  onProjectClick: () => void;
  onDeleteTask: (taskId: string) => Promise<void> | void;
  onRenameTask?: (taskId: string, newName: string) => void;
  onMoveTaskToProject?: (taskId: string, projectId: string | null) => void;
  allProjects: ProjectItem[];
  onRenameProject?: (projectId: string, newName: string) => void;
  onDeleteProject?: (projectId: string) => Promise<void> | void;
  isSelectionMode?: boolean;
  selectedTaskIds?: Set<string>;
  selectedProjectIds?: Set<string>;
  onToggleTaskSelection?: (taskId: string) => void;
  onEnableSelectionMode?: (taskId: string) => void;
  onToggleProjectSelection?: (projectId: string) => void;
  onEnableProjectSelectionMode?: (projectId: string) => void;
}

/**
 * 可折叠的项目项，包含项目及其任务列表
 */
export function CollapsibleProjectItem({
  project,
  tasks,
  isExpanded,
  onToggle,
  onProjectClick,
  onDeleteTask,
  onRenameTask,
  onMoveTaskToProject,
  allProjects,
  onRenameProject,
  onDeleteProject,
  isSelectionMode,
  selectedTaskIds,
  selectedProjectIds,
  onToggleTaskSelection,
  onEnableSelectionMode,
  onToggleProjectSelection,
  onEnableProjectSelectionMode,
}: CollapsibleProjectItemProps) {
  const { t } = useT("translation");
  const { setNodeRef, isOver } = useDroppable({
    id: project.id,
    data: {
      type: "project",
      projectId: project.id,
    },
  });
  const [isRenameDialogOpen, setIsRenameDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const longPressTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  const longPressTriggeredRef = React.useRef(false);

  const isSelected = selectedProjectIds?.has(project.id);

  const handleRename = (newName: string) => {
    onRenameProject?.(project.id, newName);
  };

  const handleDelete = async () => {
    if (!onDeleteProject) return;
    try {
      setIsDeleting(true);
      await onDeleteProject(project.id);
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isSelectionMode) return;
    if (e.button !== 0) return;

    longPressTriggeredRef.current = false;

    longPressTimerRef.current = setTimeout(() => {
      longPressTriggeredRef.current = true;
      onEnableProjectSelectionMode?.(project.id);
    }, 500);
  };

  const clearPointerTimer = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  return (
    <SidebarMenuItem>
      <div
        ref={setNodeRef}
        className={cn(
          "relative w-full group/project-item",
          isOver && "bg-primary/10",
        )}
      >
        {/* 项目标题行 */}
        <SidebarMenuButton
          className={cn(
            "h-8 justify-start gap-3 text-sm hover:bg-sidebar-accent pr-8",
            isOver && "bg-primary/20",
          )}
          tooltip={project.name}
          onPointerDown={handlePointerDown}
          onPointerUp={clearPointerTimer}
          onPointerLeave={clearPointerTimer}
        >
          {isSelectionMode && (
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => onToggleProjectSelection?.(project.id)}
              className="size-4"
              onClick={(e) => e.stopPropagation()}
            />
          )}
          {/* 折叠按钮 */}
          <span
            role="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            className="size-4 shrink-0 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            {isExpanded ? (
              <ChevronDown className="size-3 transition-transform" />
            ) : (
              <ChevronRight className="size-3 transition-transform" />
            )}
          </span>

          {/* 项目图标和名称 */}
          <div
            className="flex flex-1 items-center gap-3 min-w-0"
            onClick={(e) => {
              if (longPressTriggeredRef.current) {
                e.preventDefault();
                e.stopPropagation();
                longPressTriggeredRef.current = false;
                return;
              }
              e.stopPropagation();
              if (isSelectionMode) {
                onToggleProjectSelection?.(project.id);
              } else {
                onProjectClick();
              }
            }}
          >
            <Folder
              className={cn(
                "size-4 text-muted-foreground group-data-[collapsible=icon]:hidden",
                isOver && "text-primary",
              )}
            />
            <span className={cn("flex-1 truncate", isOver && "text-primary")}>
              {project.name}
            </span>
          </div>

          {isOver && (
            <span className="ml-auto text-xs text-primary shrink-0">
              移动到这里
            </span>
          )}
        </SidebarMenuButton>

        {/* 任务数量 - 默认显示，悬浮或下拉菜单打开时隐藏 */}
        {!isDropdownOpen && (
          <div className="absolute top-1/2 right-2 -translate-y-1/2 flex items-center justify-center opacity-100 transition-opacity group-hover/project-item:opacity-0 pointer-events-none group-data-[collapsible=icon]:hidden">
            <span className="text-xs text-muted-foreground">
              {tasks.length}
            </span>
          </div>
        )}

        {/* 更多按钮 - 默认隐藏，悬浮时显示 */}
        {onRenameProject && !isSelectionMode && (
          <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                onClick={(e) => e.stopPropagation()}
                className="absolute top-1/2 right-2 -translate-y-1/2 flex size-6 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring group-hover/project-item:opacity-100 group-data-[collapsible=icon]:hidden"
              >
                <MoreHorizontal className="size-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="right">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  setIsRenameDialogOpen(true);
                }}
              >
                <PenSquare className="size-4" />
                <span>{t("project.rename")}</span>
              </DropdownMenuItem>
              {onDeleteProject && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive focus:bg-destructive/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="size-4" />
                    <span>{t("project.delete")}</span>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* 任务列表（可折叠） */}
        {isExpanded && (
          <div className="ml-4 mt-0.5">
            <TaskHistoryList
              tasks={tasks}
              onDeleteTask={onDeleteTask}
              onRenameTask={onRenameTask}
              onMoveTaskToProject={onMoveTaskToProject}
              projects={allProjects}
              isSelectionMode={isSelectionMode}
              selectedTaskIds={selectedTaskIds}
              onToggleTaskSelection={onToggleTaskSelection}
              onEnableSelectionMode={onEnableSelectionMode}
            />
          </div>
        )}

        <RenameProjectDialog
          open={isRenameDialogOpen}
          onOpenChange={setIsRenameDialogOpen}
          projectName={project.name}
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
      </div>
    </SidebarMenuItem>
  );
}
