"use client";

import { useMemo, useState } from "react";

import { useT } from "@/lib/i18n/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  ScheduledTask,
  ScheduledTaskUpdateInput,
} from "@/features/scheduled-tasks/types";
import {
  formatScheduleSummary,
  inferScheduleFromCron,
} from "@/features/scheduled-tasks/utils/schedule";

export function ScheduledTaskEditDialog({
  open,
  onOpenChange,
  task,
  isSaving,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: ScheduledTask | null;
  isSaving?: boolean;
  onSave: (payload: ScheduledTaskUpdateInput) => Promise<void> | void;
}) {
  const { t } = useT("translation");

  const [name, setName] = useState("");
  const [cron, setCron] = useState("*/5 * * * *");
  const [timezone, setTimezone] = useState("UTC");
  const [prompt, setPrompt] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [reuseSession, setReuseSession] = useState(false);
  const [workspaceScope, setWorkspaceScope] = useState<
    "session" | "scheduled_task" | "project"
  >("scheduled_task");

  const resetFromTask = () => {
    if (!task) return;
    setName(task.name);
    setCron(task.cron);
    setTimezone(task.timezone);
    setPrompt(task.prompt);
    setEnabled(task.enabled);
    setReuseSession(task.reuse_session);
    setWorkspaceScope(task.reuse_session ? "session" : task.workspace_scope);
  };

  const scheduleSummary = useMemo(() => {
    const inferred = inferScheduleFromCron(cron);
    return formatScheduleSummary(inferred, t);
  }, [cron, t]);

  const canSave = useMemo(() => {
    return (
      (name || "").trim().length > 0 &&
      (cron || "").trim().length > 0 &&
      (prompt || "").trim().length > 0
    );
  }, [cron, name, prompt]);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) resetFromTask();
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {t("library.scheduledTasks.detail.editTitle")}
          </DialogTitle>
        </DialogHeader>

        {!task ? (
          <div className="text-sm text-muted-foreground">
            {t("library.scheduledTasks.detail.notFound")}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="st-edit-name">
                {t("library.scheduledTasks.fields.name")}
              </Label>
              <Input
                id="st-edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("library.scheduledTasks.placeholders.name")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="st-edit-cron">
                {t("library.scheduledTasks.fields.cron")}
              </Label>
              <Input
                id="st-edit-cron"
                value={cron}
                onChange={(e) => setCron(e.target.value)}
                placeholder={"*/5 * * * *"}
              />
              <div className="text-xs text-muted-foreground">
                {t("library.scheduledTasks.schedule.preview", {
                  summary: scheduleSummary,
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="st-edit-timezone">
                {t("library.scheduledTasks.fields.timezone")}
              </Label>
              <Input
                id="st-edit-timezone"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                placeholder="UTC"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="st-edit-prompt">
                {t("library.scheduledTasks.fields.prompt")}
              </Label>
              <Textarea
                id="st-edit-prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={t("library.scheduledTasks.placeholders.prompt")}
                rows={8}
              />
            </div>

            <div className="flex items-center justify-between rounded-md border border-border p-3">
              <div className="space-y-1">
                <div className="text-sm font-medium">
                  {t("library.scheduledTasks.fields.enabled")}
                </div>
                <div className="text-xs text-muted-foreground">
                  {t("library.scheduledTasks.fields.enabledHelp")}
                </div>
              </div>
              <Switch checked={enabled} onCheckedChange={setEnabled} />
            </div>

            <div className="flex items-center justify-between rounded-md border border-border p-3">
              <div className="space-y-1">
                <div className="text-sm font-medium">
                  {t("library.scheduledTasks.fields.reuseSession")}
                </div>
                <div className="text-xs text-muted-foreground">
                  {t("library.scheduledTasks.fields.reuseSessionHelp")}
                </div>
              </div>
              <Switch
                checked={reuseSession}
                onCheckedChange={(next) => {
                  setReuseSession(next);
                  if (next) {
                    setWorkspaceScope("session");
                    return;
                  }
                  if (workspaceScope === "session") {
                    setWorkspaceScope(
                      task?.project_id ? "project" : "scheduled_task",
                    );
                  }
                }}
              />
            </div>

            {!reuseSession ? (
              <div className="space-y-2">
                <Label>
                  {t("library.scheduledTasks.fields.workspaceScope")}
                </Label>
                <Select
                  value={workspaceScope}
                  onValueChange={(v) =>
                    setWorkspaceScope(
                      v as "session" | "scheduled_task" | "project",
                    )
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="session">
                      {t("library.scheduledTasks.fields.workspaceScopeSession")}
                    </SelectItem>
                    <SelectItem value="scheduled_task">
                      {t(
                        "library.scheduledTasks.fields.workspaceScopeScheduledTask",
                      )}
                    </SelectItem>
                    <SelectItem value="project" disabled={!task.project_id}>
                      {t("library.scheduledTasks.fields.workspaceScopeProject")}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <div className="text-xs text-muted-foreground">
                  {task.project_id
                    ? t("library.scheduledTasks.fields.workspaceScopeHelp")
                    : t(
                        "library.scheduledTasks.fields.workspaceScopeProjectDisabledHelp",
                      )}
                </div>
              </div>
            ) : null}
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t("common.cancel")}
          </Button>
          <Button
            type="button"
            disabled={!task || !canSave || !!isSaving}
            onClick={async () => {
              await onSave({
                name: (name || "").trim(),
                cron: (cron || "").trim(),
                timezone: (timezone || "").trim() || "UTC",
                prompt: (prompt || "").trim(),
                enabled,
                reuse_session: reuseSession,
                workspace_scope: reuseSession ? "session" : workspaceScope,
              });
              onOpenChange(false);
            }}
          >
            {t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
