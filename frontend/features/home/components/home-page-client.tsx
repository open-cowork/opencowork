"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { useT } from "@/lib/i18n/client";

import { useAutosizeTextarea } from "../hooks/use-autosize-textarea";

import { HomeHeader } from "./home-header";
import { TaskComposer } from "./task-composer";
import { ConnectorsBar } from "./connectors-bar";
import { createSessionAction } from "@/features/chat/actions/session-actions";
import type { ComposerMode, TaskSendOptions } from "./task-composer";

import { useAppShell } from "@/components/shared/app-shell-context";
import { scheduledTasksService } from "@/features/scheduled-tasks/services/scheduled-tasks-service";
import { toast } from "sonner";
import type { TaskConfig } from "@/features/chat/types/api/session";

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

  // Determine if connectors bar should be expanded
  const shouldExpandConnectors = isInputFocused || inputValue.trim().length > 0;

  const handleSendTask = React.useCallback(
    async (options?: TaskSendOptions) => {
      const inputFiles = options?.attachments ?? [];
      const repoUrl = (options?.repo_url || "").trim();
      const gitBranch = (options?.git_branch || "").trim() || "main";
      const repoUsage = options?.repo_usage ?? null;
      const projectName = (options?.project_name || "").trim();
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
      console.log("[Home] Sending task:", inputValue, { mode });

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
            (scheduledTask?.name || "").trim() ||
            inputValue.trim().slice(0, 32);
          const cron = (scheduledTask?.cron || "").trim() || "*/5 * * * *";
          const timezone = (scheduledTask?.timezone || "").trim() || "UTC";
          const enabled = Boolean(scheduledTask?.enabled ?? true);
          const reuseSession = Boolean(scheduledTask?.reuse_session ?? true);

          const created = await scheduledTasksService.create({
            name,
            cron,
            timezone,
            prompt: inputValue,
            enabled,
            reuse_session: reuseSession,
            config: Object.keys(config).length > 0 ? config : undefined,
          });

          toast.success(t("library.scheduledTasks.toasts.created"));
          setInputValue("");
          router.push(
            `/${lng}/capabilities/scheduled-tasks/${created.scheduled_task_id}`,
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
        const session = await createSessionAction({
          prompt: inputValue,
          config: Object.keys(config).length > 0 ? config : undefined,
          projectId: finalProjectId,
          permission_mode: mode === "plan" ? "plan" : "default",
          schedule_mode: runSchedule?.schedule_mode,
          timezone: runSchedule?.timezone,
          scheduled_at: runSchedule?.scheduled_at,
        });
        console.log("session", session);
        const sessionId = session.sessionId;
        console.log("sessionId", sessionId);

        // 2. Save prompt to localStorage for compatibility/fallback
        localStorage.setItem(`session_prompt_${sessionId}`, inputValue);

        // 3. Add to local history (persisted via localStorage in hook)
        addTask(inputValue, {
          id: sessionId,
          timestamp: new Date().toISOString(),
          status: "running",
          projectId: finalProjectId,
        });

        console.log("[Home] Navigating to chat session:", sessionId);
        setInputValue("");

        // 4. Navigate to the chat page
        router.push(`/${lng}/chat/${sessionId}`);
      } catch (error) {
        console.error("[Home] Failed to create session:", error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [addProject, addTask, inputValue, isSubmitting, lng, mode, router, t],
  );

  return (
    <div className="flex flex-1 flex-col min-h-0">
      <HomeHeader onOpenSettings={openSettings} />

      <div className="flex flex-1 flex-col items-center justify-start px-6 pt-[20vh] min-h-0 overflow-auto">
        <div className="w-full max-w-2xl">
          {/* 欢迎语 */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-medium tracking-tight text-foreground">
              {t("hero.title")}
            </h1>
          </div>

          <TaskComposer
            textareaRef={textareaRef}
            value={inputValue}
            onChange={setInputValue}
            mode={mode}
            onModeChange={setMode}
            onSend={handleSendTask}
            isSubmitting={isSubmitting}
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => setIsInputFocused(false)}
          />

          <ConnectorsBar forceExpanded={shouldExpandConnectors} />
        </div>
      </div>
    </div>
  );
}
