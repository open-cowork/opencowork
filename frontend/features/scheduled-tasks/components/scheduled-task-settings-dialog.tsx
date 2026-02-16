"use client";

import * as React from "react";

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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  buildCronFromPreset,
  formatScheduleSummary,
  inferScheduleFromCron,
  type IntervalUnit,
  type SchedulePreset,
} from "@/features/scheduled-tasks/utils/schedule";

type FriendlyPreset = Exclude<SchedulePreset, "cron">;

export interface ScheduledTaskSettingsValue {
  name: string;
  cron: string;
  timezone: string;
  enabled: boolean;
  reuse_session: boolean;
  workspace_scope: "session" | "scheduled_task" | "project";
}

export function ScheduledTaskSettingsDialog({
  open,
  onOpenChange,
  value,
  onSave,
  allowProjectWorkspace = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: ScheduledTaskSettingsValue;
  onSave: (next: ScheduledTaskSettingsValue) => void;
  allowProjectWorkspace?: boolean;
}) {
  const { t } = useT("translation");

  const [draftName, setDraftName] = React.useState(value.name);
  const [draftTimezone, setDraftTimezone] = React.useState(value.timezone);
  const [draftEnabled, setDraftEnabled] = React.useState(value.enabled);
  const [draftReuseSession, setDraftReuseSession] = React.useState(
    value.reuse_session,
  );
  const [draftWorkspaceScope, setDraftWorkspaceScope] = React.useState<
    "session" | "scheduled_task" | "project"
  >(value.workspace_scope);

  const [preset, setPreset] = React.useState<FriendlyPreset>("interval");
  const [intervalValue, setIntervalValue] = React.useState(5);
  const [intervalUnit, setIntervalUnit] =
    React.useState<IntervalUnit>("minute");
  const [time, setTime] = React.useState("09:00");
  const [weekDays, setWeekDays] = React.useState<string[]>(["1"]);
  const [monthDay, setMonthDay] = React.useState(1);

  const [useCron, setUseCron] = React.useState(false);
  const [cronExpr, setCronExpr] = React.useState(value.cron);

  React.useEffect(() => {
    if (!open) return;

    setDraftName(value.name);
    setDraftTimezone(value.timezone);
    setDraftEnabled(value.enabled);
    setDraftReuseSession(value.reuse_session);
    setDraftWorkspaceScope(value.workspace_scope);

    const inferred = inferScheduleFromCron(value.cron);
    if (inferred.preset === "cron") {
      setPreset("interval");
      setIntervalValue(5);
      setIntervalUnit("minute");
      setTime("09:00");
      setWeekDays(["1"]);
      setMonthDay(1);
      setUseCron(true);
      setCronExpr((value.cron || "").trim());
      return;
    }

    setUseCron(false);
    setCronExpr((value.cron || "").trim());

    setPreset(inferred.preset);
    if (inferred.preset === "interval") {
      setIntervalValue(inferred.interval?.value ?? 5);
      setIntervalUnit(inferred.interval?.unit ?? "minute");
      return;
    }

    const hh = String(inferred.time?.hour ?? 9).padStart(2, "0");
    const mm = String(inferred.time?.minute ?? 0).padStart(2, "0");
    setTime(`${hh}:${mm}`);

    if (inferred.preset === "weekly") {
      const days = inferred.weekDays?.length
        ? inferred.weekDays
        : [1 /* Mon */];
      setWeekDays(days.map(String));
    }

    if (inferred.preset === "monthly") {
      setMonthDay(inferred.dayOfMonth ?? 1);
    }
  }, [open, value]);

  React.useEffect(() => {
    if (useCron) return;

    const [hourStr, minuteStr] = time.split(":");
    const hour = Number.parseInt(hourStr || "0", 10);
    const minute = Number.parseInt(minuteStr || "0", 10);

    const cron = buildCronFromPreset({
      preset,
      interval: { value: intervalValue, unit: intervalUnit },
      time: { hour, minute },
      weekDays: weekDays
        .map((d) => Number.parseInt(d, 10))
        .filter(Number.isFinite),
      dayOfMonth: monthDay,
    });

    setCronExpr(cron);
  }, [intervalUnit, intervalValue, monthDay, preset, time, useCron, weekDays]);

  const summary = React.useMemo(() => {
    const inferred = inferScheduleFromCron(cronExpr);
    return formatScheduleSummary(inferred, t);
  }, [cronExpr, t]);

  const canSave = (cronExpr || "").trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {t("library.scheduledTasks.schedule.dialogTitle")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="st-settings-name">
              {t("library.scheduledTasks.fields.name")}
            </Label>
            <Input
              id="st-settings-name"
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              placeholder={t("library.scheduledTasks.placeholders.name")}
            />
          </div>

          <div className="space-y-2">
            <Label>{t("library.scheduledTasks.schedule.repeat")}</Label>
            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={preset}
                onValueChange={(v) => setPreset(v as FriendlyPreset)}
                disabled={useCron}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="interval">
                    {t(
                      "library.scheduledTasks.schedule.repeatOptions.interval",
                    )}
                  </SelectItem>
                  <SelectItem value="daily">
                    {t("library.scheduledTasks.schedule.repeatOptions.daily")}
                  </SelectItem>
                  <SelectItem value="weekly">
                    {t("library.scheduledTasks.schedule.repeatOptions.weekly")}
                  </SelectItem>
                  <SelectItem value="monthly">
                    {t("library.scheduledTasks.schedule.repeatOptions.monthly")}
                  </SelectItem>
                </SelectContent>
              </Select>

              {preset === "interval" ? (
                <>
                  <Input
                    type="number"
                    min={1}
                    value={intervalValue}
                    disabled={useCron}
                    onChange={(e) =>
                      setIntervalValue(
                        Math.max(1, Number.parseInt(e.target.value || "1", 10)),
                      )
                    }
                    className="w-24"
                    aria-label={t(
                      "library.scheduledTasks.schedule.interval.every",
                    )}
                  />
                  <Select
                    value={intervalUnit}
                    onValueChange={(v) => setIntervalUnit(v as IntervalUnit)}
                    disabled={useCron}
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minute">
                        {t(
                          "library.scheduledTasks.schedule.interval.unitMinute",
                        )}
                      </SelectItem>
                      <SelectItem value="hour">
                        {t("library.scheduledTasks.schedule.interval.unitHour")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </>
              ) : null}

              {preset === "daily" ? (
                <Input
                  type="time"
                  value={time}
                  disabled={useCron}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-[140px]"
                  aria-label={t("library.scheduledTasks.schedule.time")}
                />
              ) : null}

              {preset === "weekly" ? (
                <div className="flex flex-wrap items-center gap-2">
                  <ToggleGroup
                    type="multiple"
                    value={weekDays}
                    onValueChange={setWeekDays}
                    disabled={useCron}
                    variant="outline"
                    size="sm"
                    spacing={0}
                    aria-label={t(
                      "library.scheduledTasks.schedule.weekdays.label",
                    )}
                  >
                    <ToggleGroupItem value="1">
                      {t("library.scheduledTasks.schedule.weekdays.short.1")}
                    </ToggleGroupItem>
                    <ToggleGroupItem value="2">
                      {t("library.scheduledTasks.schedule.weekdays.short.2")}
                    </ToggleGroupItem>
                    <ToggleGroupItem value="3">
                      {t("library.scheduledTasks.schedule.weekdays.short.3")}
                    </ToggleGroupItem>
                    <ToggleGroupItem value="4">
                      {t("library.scheduledTasks.schedule.weekdays.short.4")}
                    </ToggleGroupItem>
                    <ToggleGroupItem value="5">
                      {t("library.scheduledTasks.schedule.weekdays.short.5")}
                    </ToggleGroupItem>
                    <ToggleGroupItem value="6">
                      {t("library.scheduledTasks.schedule.weekdays.short.6")}
                    </ToggleGroupItem>
                    <ToggleGroupItem value="0">
                      {t("library.scheduledTasks.schedule.weekdays.short.0")}
                    </ToggleGroupItem>
                  </ToggleGroup>

                  <Input
                    type="time"
                    value={time}
                    disabled={useCron}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-[140px]"
                    aria-label={t("library.scheduledTasks.schedule.time")}
                  />
                </div>
              ) : null}

              {preset === "monthly" ? (
                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    max={31}
                    value={monthDay}
                    disabled={useCron}
                    onChange={(e) =>
                      setMonthDay(
                        Math.min(
                          31,
                          Math.max(
                            1,
                            Number.parseInt(e.target.value || "1", 10),
                          ),
                        ),
                      )
                    }
                    className="w-24"
                    aria-label={t("library.scheduledTasks.schedule.monthDay")}
                  />
                  <Input
                    type="time"
                    value={time}
                    disabled={useCron}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-[140px]"
                    aria-label={t("library.scheduledTasks.schedule.time")}
                  />
                </div>
              ) : null}
            </div>

            <div className="text-xs text-muted-foreground">
              {t("library.scheduledTasks.schedule.preview", { summary })}
            </div>
          </div>

          <Accordion type="single" collapsible>
            <AccordionItem value="advanced">
              <AccordionTrigger>
                {t("library.scheduledTasks.schedule.advanced")}
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-md border border-border p-3">
                    <div className="space-y-1">
                      <div className="text-sm font-medium">
                        {t("library.scheduledTasks.schedule.useCron")}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {t("library.scheduledTasks.schedule.useCronHelp")}
                      </div>
                    </div>
                    <Switch
                      checked={useCron}
                      onCheckedChange={(checked) => {
                        setUseCron(checked);
                        if (!checked) {
                          // When leaving cron mode, regenerate based on current preset.
                          const inferred = inferScheduleFromCron(cronExpr);
                          if (inferred.preset === "cron") return;
                          setPreset(inferred.preset);
                        }
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="st-settings-cron">
                      {t("library.scheduledTasks.fields.cron")}
                    </Label>
                    <Input
                      id="st-settings-cron"
                      value={cronExpr}
                      onChange={(e) => setCronExpr(e.target.value)}
                      disabled={!useCron}
                      placeholder={t(
                        "library.scheduledTasks.schedule.cronPlaceholder",
                      )}
                    />
                    <div className="text-xs text-muted-foreground">
                      {t("library.scheduledTasks.schedule.cronHelp")}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="st-settings-timezone">
                      {t("library.scheduledTasks.fields.timezone")}
                    </Label>
                    <Input
                      id="st-settings-timezone"
                      value={draftTimezone}
                      onChange={(e) => setDraftTimezone(e.target.value)}
                      placeholder="UTC"
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
                    <Switch
                      checked={draftEnabled}
                      onCheckedChange={setDraftEnabled}
                    />
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
                      checked={draftReuseSession}
                      onCheckedChange={(next) => {
                        setDraftReuseSession(next);
                        if (next) {
                          setDraftWorkspaceScope("session");
                          return;
                        }
                        if (draftWorkspaceScope === "session") {
                          setDraftWorkspaceScope(
                            allowProjectWorkspace
                              ? "project"
                              : "scheduled_task",
                          );
                        }
                      }}
                    />
                  </div>

                  {!draftReuseSession ? (
                    <div className="space-y-2">
                      <Label>
                        {t("library.scheduledTasks.fields.workspaceScope")}
                      </Label>
                      <Select
                        value={draftWorkspaceScope}
                        onValueChange={(v) =>
                          setDraftWorkspaceScope(
                            v as "session" | "scheduled_task" | "project",
                          )
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="session">
                            {t(
                              "library.scheduledTasks.fields.workspaceScopeSession",
                            )}
                          </SelectItem>
                          <SelectItem value="scheduled_task">
                            {t(
                              "library.scheduledTasks.fields.workspaceScopeScheduledTask",
                            )}
                          </SelectItem>
                          <SelectItem
                            value="project"
                            disabled={!allowProjectWorkspace}
                          >
                            {t(
                              "library.scheduledTasks.fields.workspaceScopeProject",
                            )}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="text-xs text-muted-foreground">
                        {allowProjectWorkspace
                          ? t(
                              "library.scheduledTasks.fields.workspaceScopeHelp",
                            )
                          : t(
                              "library.scheduledTasks.fields.workspaceScopeProjectDisabledHelp",
                            )}
                      </div>
                    </div>
                  ) : null}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

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
            disabled={!canSave}
            onClick={() => {
              onSave({
                name: draftName,
                cron: (cronExpr || "").trim(),
                timezone: (draftTimezone || "").trim() || "UTC",
                enabled: draftEnabled,
                reuse_session: draftReuseSession,
                workspace_scope: draftReuseSession
                  ? "session"
                  : draftWorkspaceScope,
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
