"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { useT } from "@/lib/i18n/client";

import { useAutosizeTextarea } from "../hooks/use-autosize-textarea";

import { HomeHeader } from "./home-header";
import { createSession } from "@/features/chat/api/session";
import type { ComposerMode, TaskSendOptions } from "./task-composer";

import { useAppShell } from "@/components/shared/app-shell-context";
import { scheduledTasksService } from "@/features/scheduled-tasks/services/scheduled-tasks-service";
import { toast } from "sonner";
import type { TaskConfig } from "@/features/chat/types/api/session";
import { TaskEntrySection } from "@/features/home/components/task-entry-section";
import { useComposerModeHotkeys } from "@/features/home/hooks/use-composer-mode-hotkeys";
import { setSessionPrompt } from "@/lib/storage/session-prompt";
import { routes } from "@/lib/routes";
import { logger } from "@/lib/logger";

export function HomePageClient() {
  const { t } = useT("translation");
  const router = useRouter();
  const { lng, addTask, addProject, openSettings } = useAppShell();

  const [inputValue, setInputValue] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isInputFocused, setIsInputFocused] = React.useState(false);
  const [mode, setMode] = React.useState<ComposerMode>("task");
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  useAutosizeTextarea(textareaRef, inputValue);
  useComposerModeHotkeys({ textareaRef, setMode });

  // Determine if connectors bar should be expanded
  const shouldExpandConnectors = isInputFocused || inputValue.trim().length > 0;

  const handleSendTask = React.useCallback(
    async (options?: TaskSendOptions) => {
      const inputFiles = options?.attachments ?? [];
      const normalizedPrompt = inputValue.trim();
      const prompt =
        normalizedPrompt ||
        (inputFiles.length > 0 ? t("common.uploadedFiles") : normalizedPrompt);
      const repoUrl = (options?.repo_url || "").trim();
      const gitBranch = (options?.git_branch || "").trim() || "main";
      const repoUsage = options?.repo_usage ?? null;
      const projectName = (options?.project_name || "").trim();
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
        // Build config object (shared by plan/task, and also used to pin scheduled task config)
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
        if (options?.browser_enabled) {
          config.browser_enabled = true;
        }

        if (mode === "scheduled") {
          const name =
            (scheduledTask?.name || "").trim() || normalizedPrompt.slice(0, 32);
          const cron = (scheduledTask?.cron || "").trim() || "*/5 * * * *";
          const timezone = (scheduledTask?.timezone || "").trim() || "UTC";
          const enabled = Boolean(scheduledTask?.enabled ?? true);
          const reuseSession = Boolean(scheduledTask?.reuse_session ?? true);

          const created = await scheduledTasksService.create({
            name,
            cron,
            timezone,
            prompt,
            enabled,
            reuse_session: reuseSession,
            config: Object.keys(config).length > 0 ? config : undefined,
          });

          toast.success(t("library.scheduledTasks.toasts.created"));
          setInputValue("");
          router.push(
            routes.scheduledTaskDetail(lng, created.scheduled_task_id),
          );
          return;
        }

        let finalProjectId: string | undefined;
        if (repoUsage === "create_project") {
          if (!repoUrl) {
            toast.error(t("hero.repo.toasts.missingGithubUrl"));
            return;
          }

          const derived =
            (() => {
              try {
                const parsed = new URL(repoUrl);
                const host = parsed.hostname.toLowerCase();
                if (host !== "github.com" && host !== "www.github.com")
                  return "";
                const parts = parsed.pathname.split("/").filter(Boolean);
                if (parts.length < 2) return "";
                const owner = parts[0];
                let repo = parts[1];
                if (repo.endsWith(".git")) repo = repo.slice(0, -4);
                return owner && repo ? `${owner}/${repo}` : "";
              } catch {
                return "";
              }
            })() || repoUrl;

          const created = await addProject(projectName || derived, {
            repo_url: repoUrl,
            git_branch: gitBranch,
            git_token_env_key: gitTokenEnvKey || null,
          });
          if (!created) {
            toast.error(t("hero.repo.toasts.createProjectFailed"));
            return;
          }
          finalProjectId = created.id;
          toast.success(
            t("hero.repo.toasts.projectCreated", { name: created.name }),
          );
        }

        // 1. Call create session API
        const session = await createSession({
          prompt,
          config: Object.keys(config).length > 0 ? config : undefined,
          projectId: finalProjectId,
          permission_mode: mode === "plan" ? "plan" : "default",
          schedule_mode: runSchedule?.schedule_mode,
          timezone: runSchedule?.timezone,
          scheduled_at: runSchedule?.scheduled_at,
        });
        const sessionId = session.sessionId;

        // 2. Save prompt locally for compatibility/fallback
        setSessionPrompt(sessionId, prompt);

        // 3. Add to local history (persisted via localStorage in hook)
        addTask(prompt, {
          id: sessionId,
          timestamp: new Date().toISOString(),
          status: "running",
          projectId: finalProjectId,
        });

        setInputValue("");

        // 4. Navigate to the chat page
        router.push(routes.chat(lng, sessionId));
      } catch (error) {
        logger.error("[Home] Failed to create session:", error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [addProject, addTask, inputValue, isSubmitting, lng, mode, router, t],
  );

  return (
    <div className="flex flex-1 flex-col min-h-0">
      <HomeHeader onOpenSettings={openSettings} />

      <TaskEntrySection
        title={t("hero.title")}
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
        }}
      />
    </div>
  );
}
