"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { useT } from "@/lib/i18n/client";

import { useAutosizeTextarea } from "@/features/home/hooks/use-autosize-textarea";
import { createSessionAction } from "@/features/chat/actions/session-actions";
import type { ProjectItem, TaskHistoryItem } from "@/features/projects/types";
import type { ComposerMode } from "@/features/home/components/task-composer";

import { ProjectHeader } from "@/features/projects/components/project-header";
import { KeyboardHints } from "@/features/home/components/keyboard-hints";
import { QuickActions } from "@/features/home/components/quick-actions";
import {
  TaskComposer,
  type TaskSendOptions,
} from "@/features/home/components/task-composer";
import { useAppShell } from "@/components/shared/app-shell-context";
import { scheduledTasksService } from "@/features/scheduled-tasks/services/scheduled-tasks-service";
import { toast } from "sonner";
import type { TaskConfig } from "@/features/chat/types/api/session";

interface ProjectPageClientProps {
  projectId: string;
}

export function ProjectPageClient({ projectId }: ProjectPageClientProps) {
  const { t } = useT("translation");
  const router = useRouter();

  const { lng, projects, taskHistory, addTask, updateProject, deleteProject } =
    useAppShell();
  const currentProject = React.useMemo(
    () => projects.find((p: ProjectItem) => p.id === projectId) || projects[0],
    [projects, projectId],
  );

  const [inputValue, setInputValue] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [mode, setMode] = React.useState<ComposerMode>("task");
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  useAutosizeTextarea(textareaRef, inputValue);

  const focusComposer = React.useCallback(() => {
    requestAnimationFrame(() => textareaRef.current?.focus());
  }, []);

  const handleSendTask = React.useCallback(
    async (options?: TaskSendOptions) => {
      const inputFiles = options?.attachments ?? [];
      const repoUrl = (options?.repo_url || "").trim();
      const gitBranch = (options?.git_branch || "").trim() || "main";
      const gitTokenEnvKey = (options?.git_token_env_key || "").trim();
      const runSchedule = options?.run_schedule ?? null;
      const scheduledTask = options?.scheduled_task ?? null;
      if (
        (mode === "scheduled"
          ? inputValue.trim() === ""
          : inputValue.trim() === "" && inputFiles.length === 0) ||
        isSubmitting
      ) {
        return;
      }

      setIsSubmitting(true);
      console.log("[Project] Sending task:", inputValue, { mode });

      try {
        const config: TaskConfig & Record<string, unknown> = {};
        if (inputFiles.length > 0) {
          config.input_files = inputFiles;
        }
        if (repoUrl) {
          config.repo_url = repoUrl;
          config.git_branch = gitBranch;
          if (gitTokenEnvKey) {
            config.git_token_env_key = gitTokenEnvKey;
          }
        }

        if (mode === "scheduled") {
          const name =
            (scheduledTask?.name || "").trim() ||
            inputValue.trim().slice(0, 32);
          const cron = (scheduledTask?.cron || "").trim() || "*/5 * * * *";
          const timezone = (scheduledTask?.timezone || "").trim() || "UTC";
          const enabled = Boolean(scheduledTask?.enabled ?? true);
          const reuseSession = Boolean(scheduledTask?.reuse_session ?? true);

          await scheduledTasksService.create({
            name,
            cron,
            timezone,
            prompt: inputValue,
            enabled,
            reuse_session: reuseSession,
            project_id: projectId,
            config: Object.keys(config).length > 0 ? config : undefined,
          });
          toast.success(t("library.scheduledTasks.toasts.created"));
          setInputValue("");
          router.push(`/${lng}/capabilities/scheduled-tasks`);
          return;
        }

        const session = await createSessionAction({
          prompt: inputValue,
          projectId,
          config: Object.keys(config).length > 0 ? config : undefined,
          permission_mode: mode === "plan" ? "plan" : "default",
          schedule_mode: runSchedule?.schedule_mode,
          timezone: runSchedule?.timezone,
          scheduled_at: runSchedule?.scheduled_at,
        });
        console.log("session", session);

        localStorage.setItem(`session_prompt_${session.sessionId}`, inputValue);

        addTask(inputValue, {
          id: session.sessionId,
          timestamp: new Date().toISOString(),
          status: "running",
          projectId,
        });

        setInputValue("");

        router.push(`/${lng}/chat/${session.sessionId}`);
      } catch (error) {
        console.error("[Project] Failed to create session", error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [addTask, inputValue, isSubmitting, lng, mode, projectId, router, t],
  );

  const handleQuickActionPick = React.useCallback(
    (prompt: string) => {
      setInputValue(prompt);
      focusComposer();
    },
    [focusComposer],
  );

  const handleRenameProject = React.useCallback(
    (targetProjectId: string, newName: string) => {
      updateProject(targetProjectId, { name: newName });
    },
    [updateProject],
  );

  const handleDeleteProject = React.useCallback(
    async (targetProjectId: string) => {
      await deleteProject(targetProjectId);
      if (targetProjectId === projectId) {
        router.push(`/${lng}/home`);
      }
    },
    [deleteProject, projectId, lng, router],
  );

  return (
    <>
      <ProjectHeader
        project={currentProject}
        onRenameProject={handleRenameProject}
        onDeleteProject={handleDeleteProject}
      />

      <div className="flex flex-1 flex-col items-center justify-center px-6 py-10">
        <div className="w-full max-w-2xl">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-medium tracking-tight text-foreground">
              {currentProject?.name || t("hero.title")}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("project.subtitle", {
                count: taskHistory.filter(
                  (task: TaskHistoryItem) => task.projectId === projectId,
                ).length,
              })}
            </p>
          </div>

          <TaskComposer
            textareaRef={textareaRef}
            value={inputValue}
            onChange={setInputValue}
            mode={mode}
            onModeChange={setMode}
            onSend={handleSendTask}
            isSubmitting={isSubmitting}
            allowProjectize={false}
          />

          <QuickActions onPick={handleQuickActionPick} />
          <KeyboardHints />
        </div>
      </div>
    </>
  );
}
