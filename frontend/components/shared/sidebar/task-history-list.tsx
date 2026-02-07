"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import {
  MoreHorizontal,
  FolderPlus,
  Pencil,
  Trash2,
  GripVertical,
  Loader2,
} from "lucide-react";
import { useDraggable } from "@dnd-kit/core";

import { useT } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { RenameTaskDialog } from "@/features/projects/components/rename-task-dialog";
import { MoveTaskToProjectDialog } from "@/features/projects/components/move-task-to-project-dialog";

import { TASK_STATUS_META } from "@/features/home/model/constants";
import type { TaskHistoryItem } from "@/features/projects/types";

interface Project {
  id: string;
  name: string;
}

interface DraggableTaskProps {
  task: TaskHistoryItem;
  lng?: string;
  onDeleteTask: (taskId: string) => Promise<void> | void;
  onRenameClick?: (task: TaskHistoryItem) => void;
  onMoveClick: (task: TaskHistoryItem) => void;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelection?: (taskId: string) => void;
  onEnableSelectionMode?: (taskId: string) => void;
}

/**
 * Individual draggable task item
 */
function DraggableTask({
  task,
  lng,
  onDeleteTask,
  onRenameClick,
  onMoveClick,
  isSelectionMode,
  isSelected,
  onToggleSelection,
  onEnableSelectionMode,
}: DraggableTaskProps) {
  const { t } = useT("translation");
  const router = useRouter();
  const longPressTimerRef = React.useRef<NodeJS.Timeout>(null);

  const { listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
    data: {
      type: "task",
      taskId: task.id,
    },
    disabled: isSelectionMode, // Disable drag in selection mode
  });

  const statusMeta = TASK_STATUS_META[task.status];

  const longPressTriggeredRef = React.useRef(false);

  // Handle long press interactions
  const handlePointerDown = (e: React.PointerEvent) => {
    if (isSelectionMode) return;

    // Only left click
    if (e.button !== 0) return;

    longPressTriggeredRef.current = false;

    longPressTimerRef.current = setTimeout(() => {
      longPressTriggeredRef.current = true;
      onEnableSelectionMode?.(task.id);
    }, 500); // 500ms threshold
  };

  const handlePointerUp = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
  };

  const handlePointerLeave = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (longPressTriggeredRef.current) {
      e.preventDefault();
      e.stopPropagation();
      longPressTriggeredRef.current = false;
      return;
    }

    if (isSelectionMode) {
      e.preventDefault();
      onToggleSelection?.(task.id);
    } else {
      router.push(lng ? `/${lng}/chat/${task.id}` : `/chat/${task.id}`);
    }
  };

  return (
    <SidebarMenuItem
      ref={setNodeRef}
      className={cn(
        "relative group/menu-item transition-opacity",
        isDragging && "opacity-50",
      )}
      data-task-id={task.id}
    >
      <SidebarMenuButton
        className={cn(
          "h-[36px] min-w-0 max-w-[calc(var(--sidebar-width)-32px)] w-full justify-start gap-3 rounded-[10px] px-3 py-[7.5px] text-left transition-colors hover:bg-sidebar-accent overflow-hidden group-data-[collapsible=icon]:w-[var(--sidebar-width-icon)] group-data-[collapsible=icon]:max-w-[var(--sidebar-width-icon)] group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:pr-0",
          !isSelectionMode && "pr-8", // Padding only when not in selection mode (for 'more' button space)
        )}
        tooltip={task.title}
        onClick={handleClick}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        asChild={isSelectionMode}
      >
        {isSelectionMode ? (
          <div className="flex items-center gap-3 min-w-0 w-full">
            <div className="shrink-0 flex items-center justify-center">
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => onToggleSelection?.(task.id)}
                className="size-4"
                onClick={(e) => e.stopPropagation()} // Prevent double toggle
              />
            </div>
            <span
              className={cn(
                "flex-1 min-w-0 truncate text-sm group-data-[collapsible=icon]:hidden",
                isSelectionMode && "ml-1",
              )}
            >
              {task.title || t("chat.newChat")}
            </span>
          </div>
        ) : (
          <>
            {/* Drag handle */}
            <div
              className="size-4 shrink-0 flex items-center justify-center cursor-grab active:cursor-grabbing text-muted-foreground transition-opacity group-data-[collapsible=icon]:hidden"
              {...listeners}
              onClick={(e) => e.stopPropagation()}
            >
              <GripVertical className="size-3" />
            </div>

            {/* Column 1: status indicator */}
            {task.status === "running" ? (
              <Loader2 className="size-3 shrink-0 animate-spin text-info" />
            ) : (
              <span
                className={cn(
                  "size-2 shrink-0 rounded-full",
                  statusMeta.dotClassName,
                )}
                aria-hidden="true"
              />
            )}
            <span className="sr-only">{t(statusMeta.labelKey)}</span>

            {/* Column 2: text */}
            <span
              className={cn(
                "flex-1 min-w-0 truncate text-sm group-data-[collapsible=icon]:hidden",
              )}
            >
              {task.title || t("chat.newChat")}
            </span>
          </>
        )}
      </SidebarMenuButton>

      {/* Column 3: more button - only in non-selection mode */}
      {!isSelectionMode && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  e.stopPropagation();
                  (e.currentTarget as HTMLElement).click();
                }
              }}
              className="absolute top-1/2 right-2 -translate-y-1/2 shrink-0 size-5 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground opacity-0 transition-opacity group-hover/menu-item:opacity-100 data-[state=open]:opacity-100 group-data-[collapsible=icon]:hidden cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring z-10"
            >
              <MoreHorizontal className="size-3.5" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="right">
            {onRenameClick && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onRenameClick(task);
                }}
              >
                <Pencil className="size-4" />
                <span>{t("sidebar.rename")}</span>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onMoveClick(task);
              }}
            >
              <FolderPlus className="size-4" />
              <span>{t("sidebar.moveToProject")}</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onDeleteTask(task.id);
              }}
            >
              <Trash2 className="size-4" />
              <span>{t("sidebar.delete")}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </SidebarMenuItem>
  );
}

export function TaskHistoryList({
  tasks,
  onDeleteTask,
  onRenameTask,
  onMoveTaskToProject,
  projects,
  isSelectionMode = false,
  selectedTaskIds = new Set(),
  onToggleTaskSelection,
  onEnableSelectionMode,
}: {
  tasks: TaskHistoryItem[];
  onDeleteTask: (taskId: string) => Promise<void> | void;
  onRenameTask?: (taskId: string, newName: string) => Promise<void> | void;
  onMoveTaskToProject?: (taskId: string, projectId: string | null) => void;
  projects?: Project[];
  isSelectionMode?: boolean;
  selectedTaskIds?: Set<string>;
  onToggleTaskSelection?: (taskId: string) => void;
  onEnableSelectionMode?: (taskId: string) => void;
}) {
  const params = useParams();
  const lng = React.useMemo(() => {
    const value = params?.lng;
    if (!value) return undefined;
    return Array.isArray(value) ? value[0] : value;
  }, [params]);

  // Dialog states
  const [renameDialogOpen, setRenameDialogOpen] = React.useState(false);
  const [moveDialogOpen, setMoveDialogOpen] = React.useState(false);
  const [selectedTask, setSelectedTask] =
    React.useState<TaskHistoryItem | null>(null);

  const handleRenameClick = (task: TaskHistoryItem) => {
    setSelectedTask(task);
    setRenameDialogOpen(true);
  };

  const handleRename = (newName: string) => {
    if (selectedTask) {
      onRenameTask?.(selectedTask.id, newName);
    }
  };

  const handleMoveClick = (task: TaskHistoryItem) => {
    setSelectedTask(task);
    setMoveDialogOpen(true);
  };

  const handleMove = (projectId: string | null) => {
    if (selectedTask) {
      onMoveTaskToProject?.(selectedTask.id, projectId);
    }
  };

  return (
    <>
      <SidebarMenu className="gap-0.5 overflow-hidden">
        {tasks.map((task) => (
          <DraggableTask
            key={task.id}
            task={task}
            lng={lng}
            onDeleteTask={onDeleteTask}
            onRenameClick={onRenameTask ? handleRenameClick : undefined}
            onMoveClick={handleMoveClick}
            isSelectionMode={isSelectionMode}
            isSelected={selectedTaskIds.has(task.id)}
            onToggleSelection={onToggleTaskSelection}
            onEnableSelectionMode={onEnableSelectionMode}
          />
        ))}
      </SidebarMenu>

      {/* Rename Dialog */}
      <RenameTaskDialog
        open={renameDialogOpen}
        onOpenChange={setRenameDialogOpen}
        taskName={selectedTask?.title || ""}
        onRename={handleRename}
      />

      {/* Move to Project Dialog */}
      <MoveTaskToProjectDialog
        open={moveDialogOpen}
        onOpenChange={setMoveDialogOpen}
        projects={projects || []}
        onMove={handleMove}
      />
    </>
  );
}
