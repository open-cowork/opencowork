"use client";

import { useEffect, useMemo, useState } from "react";

import { useT } from "@/lib/i18n/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
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
import type { ScheduledTaskCreateInput } from "@/features/scheduled-tasks/types";

interface CreateScheduledTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (input: ScheduledTaskCreateInput) => Promise<void> | void;
  isSaving?: boolean;
}

export function CreateScheduledTaskDialog({
  open,
  onOpenChange,
  onCreate,
  isSaving,
}: CreateScheduledTaskDialogProps) {
  const { t } = useT("translation");
  const [name, setName] = useState("");
  const [cron, setCron] = useState("*/5 * * * *");
  const defaultTimezone = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    } catch {
      return "UTC";
    }
  }, []);
  const [timezone, setTimezone] = useState(defaultTimezone);
  const [prompt, setPrompt] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [reuseSession, setReuseSession] = useState(false);
  const [workspaceScope, setWorkspaceScope] = useState<
    "session" | "scheduled_task" | "project"
  >("scheduled_task");

  useEffect(() => {
    // Keep timezone aligned with the current environment without exposing it in the UI.
    setTimezone(defaultTimezone);
  }, [defaultTimezone]);

  const canSubmit = useMemo(() => {
    return (
      name.trim().length > 0 &&
      cron.trim().length > 0 &&
      prompt.trim().length > 0
    );
  }, [name, cron, prompt]);

  const reset = () => {
    setName("");
    setCron("*/5 * * * *");
    setTimezone(defaultTimezone);
    setPrompt("");
    setEnabled(true);
    setReuseSession(false);
    setWorkspaceScope("scheduled_task");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) reset();
      }}
    >
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {t("library.scheduledTasks.page.createTitle")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="st-name">
              {t("library.scheduledTasks.fields.name")}
            </Label>
            <Input
              id="st-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("library.scheduledTasks.placeholders.name")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="st-cron">
              {t("library.scheduledTasks.fields.cron")}
            </Label>
            <Input
              id="st-cron"
              value={cron}
              onChange={(e) => setCron(e.target.value)}
              placeholder={"*/5 * * * *"}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="st-prompt">
              {t("library.scheduledTasks.fields.prompt")}
            </Label>
            <Textarea
              id="st-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={t("library.scheduledTasks.placeholders.prompt")}
              rows={6}
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
                  setWorkspaceScope("scheduled_task");
                }
              }}
            />
          </div>

          {!reuseSession ? (
            <div className="space-y-2">
              <Label>{t("library.scheduledTasks.fields.workspaceScope")}</Label>
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
                  <SelectItem value="project" disabled>
                    {t("library.scheduledTasks.fields.workspaceScopeProject")}
                  </SelectItem>
                </SelectContent>
              </Select>
              <div className="text-xs text-muted-foreground">
                {t(
                  "library.scheduledTasks.fields.workspaceScopeProjectDisabledHelp",
                )}
              </div>
            </div>
          ) : null}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              disabled={!canSubmit || !!isSaving}
              onClick={async () => {
                await onCreate({
                  name: name.trim(),
                  cron: cron.trim(),
                  timezone: timezone.trim() || "UTC",
                  prompt: prompt.trim(),
                  enabled,
                  reuse_session: reuseSession,
                  workspace_scope: reuseSession ? "session" : workspaceScope,
                });
                onOpenChange(false);
              }}
            >
              {t("common.create")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
