import { uploadAttachment } from "@/features/attachments/services/attachment-service";
import type { InputFile } from "@/features/chat/types/api/session";
import {
  Loader2,
  ArrowUp,
  Mic,
  Plus,
  GitBranch,
  Chrome,
  ListTodo,
  SquareTerminal,
  Clock,
  AlarmClock,
} from "lucide-react";
import { toast } from "sonner";
import * as React from "react";
import { useT } from "@/lib/i18n/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { FileCard } from "@/components/shared/file-card";
import { playFileUploadSound } from "@/lib/utils/sound";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScheduledTaskSettingsDialog } from "@/features/scheduled-tasks/components/scheduled-task-settings-dialog";
import {
  formatScheduleSummary,
  inferScheduleFromCron,
} from "@/features/scheduled-tasks/utils/schedule";
import {
  RunScheduleDialog,
  type RunScheduleMode,
} from "@/features/home/components/run-schedule-dialog";
import { useSlashCommandAutocomplete } from "@/features/chat/hooks/use-slash-command-autocomplete";
import { useAppShell } from "@/components/shared/app-shell-context";

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export type ComposerMode = "plan" | "task" | "scheduled";

export type RepoUsageMode = "session" | "create_project";

export interface TaskSendOptions {
  attachments?: InputFile[];
  repo_url?: string | null;
  git_branch?: string | null;
  git_token_env_key?: string | null;
  repo_usage?: RepoUsageMode | null;
  project_name?: string | null;
  browser_enabled?: boolean | null;
  run_schedule?: {
    schedule_mode: RunScheduleMode;
    timezone: string;
    scheduled_at: string | null;
  } | null;
  scheduled_task?: {
    name: string;
    cron: string;
    timezone: string;
    enabled: boolean;
    reuse_session: boolean;
  } | null;
}

export function TaskComposer({
  textareaRef,
  value,
  onChange,
  mode,
  onModeChange,
  onSend,
  isSubmitting,
  allowProjectize = true,
  onFocus,
  onBlur,
}: {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  value: string;
  onChange: (value: string) => void;
  mode: ComposerMode;
  onModeChange: (mode: ComposerMode) => void;
  onSend: (options?: TaskSendOptions) => void | Promise<void>;
  isSubmitting?: boolean;
  allowProjectize?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
}) {
  const { t } = useT("translation");
  const { lng } = useAppShell();
  const isComposing = React.useRef(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const [attachments, setAttachments] = React.useState<InputFile[]>([]);
  const slashAutocomplete = useSlashCommandAutocomplete({
    value,
    onChange,
    textareaRef,
  });

  const [browserEnabled, setBrowserEnabled] = React.useState(false);

  const [repoDialogOpen, setRepoDialogOpen] = React.useState(false);
  const [repoUrl, setRepoUrl] = React.useState("");
  const [gitBranch, setGitBranch] = React.useState("main");
  const [gitTokenEnvKey, setGitTokenEnvKey] = React.useState("");
  const [repoUsage, setRepoUsage] = React.useState<RepoUsageMode>("session");
  const [projectName, setProjectName] = React.useState("");

  const [runScheduleOpen, setRunScheduleOpen] = React.useState(false);
  const [runScheduleMode, setRunScheduleMode] =
    React.useState<RunScheduleMode>("immediate");
  const [runScheduledAt, setRunScheduledAt] = React.useState<string | null>(
    null,
  );
  const [runTimezone, setRunTimezone] = React.useState("UTC");

  const [scheduledSettingsOpen, setScheduledSettingsOpen] =
    React.useState(false);
  const [scheduledName, setScheduledName] = React.useState("");
  const [scheduledCron, setScheduledCron] = React.useState("*/5 * * * *");
  const [scheduledTimezone, setScheduledTimezone] = React.useState("UTC");
  const [scheduledEnabled, setScheduledEnabled] = React.useState(true);
  const [scheduledReuseSession, setScheduledReuseSession] =
    React.useState(true);

  React.useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz) setScheduledTimezone(tz);
      if (tz) setRunTimezone(tz);
    } catch {
      // Ignore and keep UTC as fallback.
    }
  }, []);

  React.useEffect(() => {
    if (mode !== "scheduled") return;
    // Default a name when switching to scheduled mode.
    if (scheduledName.trim()) return;
    const derived = value.trim().slice(0, 32);
    if (derived) setScheduledName(derived);
  }, [mode, scheduledName, value]);

  const envVarsHref = React.useMemo(() => {
    const clean = (lng || "").trim();
    return clean ? `/${clean}/capabilities/env-vars` : "/capabilities/env-vars";
  }, [lng]);

  const derivedProjectName = React.useMemo(() => {
    const url = repoUrl.trim();
    if (!url) return "";
    try {
      const parsed = new URL(url);
      const host = parsed.hostname.toLowerCase();
      if (host !== "github.com" && host !== "www.github.com") return "";
      const parts = parsed.pathname.split("/").filter(Boolean);
      if (parts.length < 2) return "";
      const owner = parts[0];
      let repo = parts[1];
      if (repo.endsWith(".git")) repo = repo.slice(0, -4);
      if (!owner || !repo) return "";
      return `${owner}/${repo}`;
    } catch {
      return "";
    }
  }, [repoUrl]);

  // Best-effort default project name when the user chooses "create project".
  React.useEffect(() => {
    if (!allowProjectize) return;
    if (repoUsage !== "create_project") return;
    if (projectName.trim()) return;
    if (!derivedProjectName) return;
    setProjectName(derivedProjectName);
  }, [allowProjectize, derivedProjectName, projectName, repoUsage]);

  const scheduledSummary = React.useMemo(() => {
    const inferred = inferScheduleFromCron(scheduledCron);
    return formatScheduleSummary(inferred, t);
  }, [scheduledCron, t]);

  const runScheduleSummary = React.useMemo(() => {
    if (runScheduleMode === "nightly")
      return t("hero.runSchedule.badge.nightly");
    if (runScheduleMode === "scheduled") {
      const dt = (runScheduledAt || "").trim();
      return dt
        ? t("hero.runSchedule.badge.scheduled", {
            datetime: dt.replace("T", " "),
          })
        : t("hero.runSchedule.badge.scheduledEmpty");
    }
    return t("hero.runSchedule.badge.immediate");
  }, [runScheduleMode, runScheduledAt, t]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      toast.error(t("hero.toasts.fileTooLarge"));
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    try {
      setIsUploading(true);
      const uploadedFile = await uploadAttachment(file);
      const newAttachments = [...attachments, uploadedFile];
      setAttachments(newAttachments);
      toast.success(t("hero.toasts.uploadSuccess"));
      playFileUploadSound();
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error(t("hero.toasts.uploadFailed"));
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeAttachment = (index: number) => {
    const newAttachments = attachments.filter((_, i) => i !== index);
    setAttachments(newAttachments);
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    const file = Array.from(items)
      .find((item) => item.kind === "file")
      ?.getAsFile();

    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      toast.error(t("hero.toasts.fileTooLarge"));
      return;
    }

    try {
      setIsUploading(true);
      const uploadedFile = await uploadAttachment(file);
      const newAttachments = [...attachments, uploadedFile];
      setAttachments(newAttachments);
      toast.success(t("hero.toasts.uploadSuccess"));
      playFileUploadSound();
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error(t("hero.toasts.uploadFailed"));
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = React.useCallback(() => {
    if (isSubmitting || isUploading) return;
    if (mode === "scheduled") {
      if (!value.trim()) return;
      if (!scheduledCron.trim()) return;
      if (!scheduledTimezone.trim()) return;
      const name = scheduledName.trim() || value.trim().slice(0, 32);
      if (!name) return;
    } else {
      if (!value.trim() && attachments.length === 0) return;
      if (runScheduleMode === "scheduled" && !(runScheduledAt || "").trim()) {
        return;
      }
    }

    const payload: TaskSendOptions = {
      attachments,
      repo_url: repoUrl.trim() || null,
      git_branch: gitBranch.trim() || null,
      git_token_env_key: repoUrl.trim() ? gitTokenEnvKey.trim() || null : null,
      repo_usage: allowProjectize ? repoUsage : null,
      project_name:
        allowProjectize && repoUsage === "create_project"
          ? (projectName.trim() || derivedProjectName || "").trim() || null
          : null,
      browser_enabled: browserEnabled,
      run_schedule:
        mode === "scheduled"
          ? null
          : {
              schedule_mode: runScheduleMode,
              timezone: runTimezone.trim() || "UTC",
              scheduled_at:
                runScheduleMode === "scheduled"
                  ? (runScheduledAt || "").trim()
                  : null,
            },
      scheduled_task:
        mode === "scheduled"
          ? {
              name: (scheduledName.trim() || value.trim().slice(0, 32)).trim(),
              cron: scheduledCron.trim(),
              timezone: scheduledTimezone.trim() || "UTC",
              enabled: scheduledEnabled,
              reuse_session: scheduledReuseSession,
            }
          : null,
    };

    onSend(payload);
    setAttachments([]);
    setRunScheduleMode("immediate");
    setRunScheduledAt(null);
  }, [
    attachments,
    allowProjectize,
    browserEnabled,
    derivedProjectName,
    gitBranch,
    gitTokenEnvKey,
    isSubmitting,
    isUploading,
    mode,
    onSend,
    projectName,
    repoUsage,
    repoUrl,
    runScheduleMode,
    runScheduledAt,
    runTimezone,
    scheduledCron,
    scheduledEnabled,
    scheduledName,
    scheduledReuseSession,
    scheduledTimezone,
    value,
  ]);

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Attachments Display */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-3 px-4 pt-4">
          {attachments.map((file, i) => (
            <FileCard
              key={i}
              file={file}
              onRemove={() => removeAttachment(i)}
              className="w-48 bg-background border-dashed"
            />
          ))}
        </div>
      )}

      <Dialog open={repoDialogOpen} onOpenChange={setRepoDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{t("hero.repo.dialogTitle")}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-[7fr_3fr]">
            <div className="space-y-2">
              <Label htmlFor="repo-url">{t("hero.repo.urlLabel")}</Label>
              <Input
                id="repo-url"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder={t("hero.repo.urlPlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="repo-branch">{t("hero.repo.branchLabel")}</Label>
              <Input
                id="repo-branch"
                value={gitBranch}
                onChange={(e) => setGitBranch(e.target.value)}
                placeholder={t("hero.repo.branchPlaceholder")}
              />
            </div>

            {allowProjectize && mode !== "scheduled" ? (
              <div className="space-y-2 md:col-span-2">
                <Label>{t("hero.repo.usageLabel")}</Label>
                <RadioGroup
                  value={repoUsage}
                  onValueChange={(value) =>
                    setRepoUsage(value as RepoUsageMode)
                  }
                  className="gap-2"
                >
                  <label className="flex items-start gap-3 rounded-lg border border-border bg-background px-3 py-2.5">
                    <RadioGroupItem value="session" className="mt-0.5" />
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-foreground">
                        {t("hero.repo.usage.session.title")}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {t("hero.repo.usage.session.help")}
                      </div>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 rounded-lg border border-border bg-background px-3 py-2.5">
                    <RadioGroupItem value="create_project" className="mt-0.5" />
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-foreground">
                        {t("hero.repo.usage.createProject.title")}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {t("hero.repo.usage.createProject.help")}
                      </div>
                    </div>
                  </label>
                </RadioGroup>
              </div>
            ) : null}

            {allowProjectize &&
            mode !== "scheduled" &&
            repoUsage === "create_project" ? (
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="repo-project-name">
                  {t("hero.repo.projectNameLabel")}
                </Label>
                <Input
                  id="repo-project-name"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder={t("hero.repo.projectNamePlaceholder")}
                />
              </div>
            ) : null}

            {repoUrl.trim() ? (
              <div className="space-y-2 md:col-span-2">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="repo-token-env-key">
                    {t("hero.repo.tokenKeyLabel")}
                  </Label>
                  <a
                    href={envVarsHref}
                    className="text-xs text-primary hover:underline"
                  >
                    {t("hero.repo.goToEnvVars")}
                  </a>
                </div>
                <Input
                  id="repo-token-env-key"
                  value={gitTokenEnvKey}
                  onChange={(e) => setGitTokenEnvKey(e.target.value)}
                  placeholder={t("hero.repo.tokenKeyPlaceholder")}
                />
                <p className="text-xs text-muted-foreground">
                  {t("hero.repo.tokenKeyHelp")}
                </p>
              </div>
            ) : null}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setRepoDialogOpen(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button type="button" onClick={() => setRepoDialogOpen(false)}>
              {t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ScheduledTaskSettingsDialog
        open={scheduledSettingsOpen}
        onOpenChange={setScheduledSettingsOpen}
        value={{
          name: scheduledName,
          cron: scheduledCron,
          timezone: scheduledTimezone,
          enabled: scheduledEnabled,
          reuse_session: scheduledReuseSession,
        }}
        onSave={(next) => {
          setScheduledName(next.name);
          setScheduledCron(next.cron);
          setScheduledTimezone(next.timezone);
          setScheduledEnabled(next.enabled);
          setScheduledReuseSession(next.reuse_session);
        }}
      />

      <RunScheduleDialog
        open={runScheduleOpen}
        onOpenChange={setRunScheduleOpen}
        value={{
          schedule_mode: runScheduleMode,
          timezone: runTimezone,
          scheduled_at: runScheduledAt,
        }}
        onSave={(next) => {
          setRunScheduleMode(next.schedule_mode);
          setRunTimezone(next.timezone);
          setRunScheduledAt(next.scheduled_at);
        }}
      />

      {/* 输入区域 */}
      <div className="relative px-4 pb-3 pt-4">
        {slashAutocomplete.isOpen ? (
          <div className="absolute bottom-full left-0 mb-2 w-full overflow-hidden rounded-lg border border-border bg-popover shadow-md">
            <div className="max-h-64 overflow-auto py-1">
              {slashAutocomplete.suggestions.map((item, idx) => {
                const selected = idx === slashAutocomplete.activeIndex;
                return (
                  <button
                    key={item.command}
                    type="button"
                    onMouseEnter={() => slashAutocomplete.setActiveIndex(idx)}
                    onMouseDown={(ev) => {
                      // Prevent textarea from losing focus.
                      ev.preventDefault();
                      slashAutocomplete.applySelection(idx);
                    }}
                    className={cn(
                      "w-full px-3 py-2 text-left text-sm",
                      selected
                        ? "bg-accent text-accent-foreground"
                        : "hover:bg-accent/50",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono">{item.command}</span>
                      {item.argument_hint ? (
                        <span className="text-xs text-muted-foreground font-mono truncate">
                          {item.argument_hint}
                        </span>
                      ) : null}
                    </div>
                    {item.description ? (
                      <div className="text-xs text-muted-foreground truncate">
                        {item.description}
                      </div>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
        <Textarea
          ref={textareaRef}
          value={value}
          disabled={isSubmitting || isUploading}
          onChange={(e) => onChange(e.target.value)}
          onCompositionStart={() => (isComposing.current = true)}
          onCompositionEnd={() => {
            requestAnimationFrame(() => {
              isComposing.current = false;
            });
          }}
          onPaste={handlePaste}
          onFocus={onFocus}
          onBlur={onBlur}
          onKeyDown={(e) => {
            if (slashAutocomplete.handleKeyDown(e)) return;
            if (e.key === "Enter") {
              if (e.shiftKey) {
                // Allow default behavior (newline)
                return;
              }
              if (
                e.nativeEvent.isComposing ||
                isComposing.current ||
                e.keyCode === 229
              ) {
                return;
              }
              e.preventDefault();
              handleSubmit();
            }
          }}
          placeholder={
            mode === "scheduled"
              ? t("library.scheduledTasks.placeholders.prompt")
              : mode === "plan"
                ? t("hero.modes.planPlaceholder")
                : t("hero.placeholder")
          }
          className="min-h-[60px] max-h-[40vh] w-full resize-none border-0 bg-transparent dark:bg-transparent p-0 text-base shadow-none placeholder:text-muted-foreground/50 focus-visible:ring-0 disabled:opacity-50"
          rows={2}
        />
      </div>

      {mode !== "scheduled" && runScheduleMode !== "immediate" ? (
        <div className="px-4 pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="secondary"
              role="button"
              tabIndex={0}
              className="cursor-pointer select-none"
              onClick={() => setRunScheduleOpen(true)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setRunScheduleOpen(true);
                }
              }}
              aria-label={t("hero.runSchedule.toggle")}
              title={t("hero.runSchedule.toggle")}
            >
              <AlarmClock className="size-3" />
              {runScheduleSummary}
            </Badge>
          </div>
        </div>
      ) : null}

      <div className="px-4 pb-3 min-h-[32px] flex items-center">
        {mode === "scheduled" ? (
          <div className="flex flex-wrap items-center gap-2">
            {(scheduledName || "").trim().length > 0 ? (
              <Badge
                variant="outline"
                role="button"
                tabIndex={0}
                className="cursor-pointer select-none max-w-full"
                onClick={() => setScheduledSettingsOpen(true)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setScheduledSettingsOpen(true);
                  }
                }}
                title={(scheduledName || "").trim()}
                aria-label={t("library.scheduledTasks.fields.name")}
              >
                <span className="max-w-[260px] truncate">
                  {(scheduledName || "").trim()}
                </span>
              </Badge>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* 底部工具栏 */}
      <div className="flex items-center justify-between px-3 pb-3">
        {/* 左侧：模式选择（Icon + Hover Label） */}
        <div className="flex items-center gap-2 min-h-[32px]">
          <div className="flex items-center gap-1 rounded-2xl border border-border bg-muted/20 p-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={isSubmitting || isUploading}
                  className={`rounded-xl ${mode === "task" ? "bg-primary/20 text-primary hover:bg-primary/30" : ""}`}
                  aria-label={t("hero.modes.task")}
                  title={t("hero.modes.task")}
                  onClick={() => onModeChange("task")}
                >
                  <SquareTerminal className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" sideOffset={8}>
                <div className="font-medium">{t("hero.modes.task")}</div>
                <div className="opacity-80">{t("hero.modes.taskHelp")}</div>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={isSubmitting || isUploading}
                  className={`rounded-xl ${mode === "plan" ? "bg-primary/20 text-primary hover:bg-primary/30" : ""}`}
                  aria-label={t("hero.modes.plan")}
                  title={t("hero.modes.plan")}
                  onClick={() => onModeChange("plan")}
                >
                  <ListTodo className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" sideOffset={8}>
                <div className="font-medium">{t("hero.modes.plan")}</div>
                <div className="opacity-80">{t("hero.modes.planHelp")}</div>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={isSubmitting || isUploading}
                  className={`rounded-xl ${mode === "scheduled" ? "bg-primary/20 text-primary hover:bg-primary/30" : ""}`}
                  aria-label={t("hero.modes.scheduled")}
                  title={t("hero.modes.scheduled")}
                  onClick={() => {
                    onModeChange("scheduled");
                  }}
                >
                  <Clock className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" sideOffset={8}>
                <div className="font-medium">{t("hero.modes.scheduled")}</div>
                <div className="opacity-80">
                  {t("hero.modes.scheduledHelp")}
                </div>
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="h-8 flex items-center">
            {mode === "scheduled" ? (
              <Badge
                variant="secondary"
                role="button"
                tabIndex={0}
                className="h-8 rounded-xl cursor-pointer select-none px-3 py-0"
                onClick={() => setScheduledSettingsOpen(true)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setScheduledSettingsOpen(true);
                  }
                }}
                aria-label={t("hero.modes.scheduled")}
                title={t("hero.modes.scheduled")}
              >
                <Clock className="size-3" />
                {scheduledSummary}
              </Badge>
            ) : null}
          </div>
        </div>

        {/* 右侧操作按钮 */}
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant={
                  repoDialogOpen || repoUrl.trim() ? "secondary" : "ghost"
                }
                size="icon"
                disabled={isSubmitting || isUploading}
                className="size-9 rounded-xl hover:bg-accent"
                aria-label={t("hero.repo.toggle")}
                title={t("hero.repo.toggle")}
                onClick={() => setRepoDialogOpen(true)}
              >
                <GitBranch className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={8}>
              {t("hero.repo.toggle")}
            </TooltipContent>
          </Tooltip>

          {mode !== "scheduled" ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant={
                    runScheduleMode !== "immediate" ? "secondary" : "ghost"
                  }
                  size="icon"
                  disabled={isSubmitting || isUploading}
                  className="size-9 rounded-xl hover:bg-accent"
                  aria-label={t("hero.runSchedule.toggle")}
                  title={t("hero.runSchedule.toggle")}
                  onClick={() => setRunScheduleOpen(true)}
                >
                  <AlarmClock className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" sideOffset={8}>
                {t("hero.runSchedule.toggle")}
              </TooltipContent>
            </Tooltip>
          ) : null}

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant={browserEnabled ? "secondary" : "ghost"}
                size="icon"
                disabled={isSubmitting || isUploading}
                className="size-9 rounded-xl hover:bg-accent"
                aria-label={t("hero.browser.toggle")}
                title={t("hero.browser.toggle")}
                onClick={() => setBrowserEnabled((prev) => !prev)}
              >
                <Chrome className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={8}>
              {t("hero.browser.toggle")}
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={isSubmitting || isUploading}
                className="size-9 rounded-xl hover:bg-accent"
                aria-label={t("hero.importLocal")}
                onClick={() => fileInputRef.current?.click()}
              >
                {isUploading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Plus className="size-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={8}>
              {t("hero.importLocal")}
            </TooltipContent>
          </Tooltip>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={isSubmitting}
            className="size-9 rounded-xl hover:bg-accent"
            title={t("hero.voiceInput")}
          >
            <Mic className="size-4" />
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              (mode === "scheduled"
                ? !value.trim() || !scheduledCron.trim()
                : (!value.trim() && attachments.length === 0) ||
                  (runScheduleMode === "scheduled" &&
                    !(runScheduledAt || "").trim())) ||
              isSubmitting ||
              isUploading
            }
            size="icon"
            className="size-9 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground"
            title={t("hero.send")}
          >
            <ArrowUp className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
