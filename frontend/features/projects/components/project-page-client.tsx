"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { useT } from "@/lib/i18n/client";

import { useAutosizeTextarea } from "@/features/home/hooks/use-autosize-textarea";
import { createSession } from "@/features/chat/api/session";
import type { ProjectItem, TaskHistoryItem } from "@/features/projects/types";
import type {
  ComposerMode,
  TaskSendOptions,
} from "@/features/home/components/task-composer";

import { ProjectHeader } from "@/features/projects/components/project-header";
import { QUICK_ACTIONS } from "@/features/home/model/constants";
import { useAppShell } from "@/components/shared/app-shell-context";
import { scheduledTasksService } from "@/features/scheduled-tasks/services/scheduled-tasks-service";
import { toast } from "sonner";
import type { TaskConfig } from "@/features/chat/types/api/session";
import { TaskEntrySection } from "@/features/home/components/task-entry-section";
import { useComposerModeHotkeys } from "@/features/home/hooks/use-composer-mode-hotkeys";
import { setSessionPrompt } from "@/lib/storage/session-prompt";
import { routes } from "@/lib/routes";
import { logger } from "@/lib/logger";

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
  const [isInputFocused, setIsInputFocused] = React.useState(false);
  const [mode, setMode] = React.useState<ComposerMode>("task");
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  useAutosizeTextarea(textareaRef, inputValue);
  useComposerModeHotkeys({ textareaRef, setMode });

  const shouldExpandConnectors = isInputFocused || inputValue.trim().length > 0;

  const projectTaskCount = React.useMemo(
    () =>
      taskHistory.filter(
        (task: TaskHistoryItem) => task.projectId === projectId,
      ).length,
    [projectId, taskHistory],
  );

  const projectTitle = React.useMemo(() => {
    const baseName = currentProject?.name || t("project.untitled");
    return t("project.titleWithCount", {
      name: baseName,
      count: projectTaskCount,
    });
  }, [currentProject?.name, projectTaskCount, t]);

  const promptHints = React.useMemo(
    () =>
      QUICK_ACTIONS.map((action) => t(action.labelKey)).filter(
        (hint) => hint && hint.trim().length > 0,
      ),
    [t],
  );
  const [placeholderIndex, setPlaceholderIndex] = React.useState(0);

  React.useEffect(() => {
    if (promptHints.length <= 1) return;
    const id = window.setInterval(() => {
      setPlaceholderIndex((prev) =>
        promptHints.length === 0 ? 0 : (prev + 1) % promptHints.length,
      );
    }, 4000);
    return () => window.clearInterval(id);
  }, [promptHints.length]);

  React.useEffect(() => {
    if (promptHints.length === 0) {
      setPlaceholderIndex(0);
      return;
    }
    if (placeholderIndex >= promptHints.length) {
      setPlaceholderIndex(0);
    }
  }, [placeholderIndex, promptHints.length]);

  const rotatingPlaceholder =
    promptHints.length > 0
      ? promptHints[placeholderIndex % promptHints.length]
      : undefined;

  const handleSendTask = React.useCallback(
    async (options?: TaskSendOptions) => {
      const inputFiles = options?.attachments ?? [];
      const normalizedPrompt = inputValue.trim();
      const prompt =
        normalizedPrompt ||
        (inputFiles.length > 0 ? t("common.uploadedFiles") : normalizedPrompt);
      const repoUrl = (options?.repo_url || "").trim();
      const gitBranch = (options?.git_branch || "").trim() || "main";
      const gitTokenEnvKey = (options?.git_token_env_key || "").trim();
      const runSchedule = options?.run_schedule ?? null;
      const scheduledTask = options?.scheduled_task ?? null;
      if (
        (mode === "scheduled"
          ? normalizedPrompt === ""
          : normalizedPrompt === "" && inputFiles.length === 0) ||
        isSubmitting
      ) {
        return;
      }

      setIsSubmitting(true);

      try {
        // Best-effort: persist repo defaults on the project for future runs.
        if (repoUrl) {
          await updateProject(projectId, {
            repo_url: repoUrl,
            git_branch: gitBranch,
            ...(gitTokenEnvKey ? { git_token_env_key: gitTokenEnvKey } : {}),
          });
        }

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
            (scheduledTask?.name || "").trim() || normalizedPrompt.slice(0, 32);
          const cron = (scheduledTask?.cron || "").trim() || "*/5 * * * *";
          const timezone = (scheduledTask?.timezone || "").trim() || "UTC";
          const enabled = Boolean(scheduledTask?.enabled ?? true);
          const reuseSession = Boolean(scheduledTask?.reuse_session ?? true);

          await scheduledTasksService.create({
            name,
            cron,
            timezone,
            prompt,
            enabled,
            reuse_session: reuseSession,
            project_id: projectId,
            config: Object.keys(config).length > 0 ? config : undefined,
          });
          toast.success(t("library.scheduledTasks.toasts.created"));
          setInputValue("");
          router.push(routes.scheduledTasks(lng));
          return;
        }

        const session = await createSession({
          prompt,
          projectId,
          config: Object.keys(config).length > 0 ? config : undefined,
          permission_mode: mode === "plan" ? "plan" : "default",
          schedule_mode: runSchedule?.schedule_mode,
          timezone: runSchedule?.timezone,
          scheduled_at: runSchedule?.scheduled_at,
        });
        setSessionPrompt(session.sessionId, prompt);

        addTask(prompt, {
          id: session.sessionId,
          timestamp: new Date().toISOString(),
          status: "running",
          projectId,
        });

        setInputValue("");

        router.push(routes.chat(lng, session.sessionId));
      } catch (error) {
        logger.error("[Project] Failed to create session", error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      addTask,
      inputValue,
      isSubmitting,
      lng,
      mode,
      projectId,
      router,
      t,
      updateProject,
    ],
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
        router.push(routes.home(lng));
      }
    },
    [deleteProject, projectId, lng, router],
  );

  return (
    <div className="flex flex-1 flex-col min-h-0">
      <ProjectHeader
        project={currentProject}
        onRenameProject={handleRenameProject}
        onDeleteProject={handleDeleteProject}
      />

      <TaskEntrySection
        title={projectTitle}
        mode={mode}
        onModeChange={setMode}
        toggleDisabled={isSubmitting}
        connectorsExpanded={shouldExpandConnectors}
        composerProps={{
          textareaRef,
          value: inputValue,
          onChange: setInputValue,
          onSend: handleSendTask,
          isSubmitting,
          onFocus: () => setIsInputFocused(true),
          onBlur: () => setIsInputFocused(false),
          allowProjectize: false,
          onRepoDefaultsSave: async (payload) => {
            await updateProject(projectId, payload);
          },
          placeholderOverride:
            mode === "task" ? rotatingPlaceholder : undefined,
          inlineKeyboardHint: true,
        }}
      />
    </div>
  );
}
