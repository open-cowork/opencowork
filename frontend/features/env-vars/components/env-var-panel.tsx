"use client";

import * as React from "react";
import { Copy, Check, Loader2, Plus, RefreshCw, Shield } from "lucide-react";
import { toast } from "sonner";

import { useT } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { EnvVar } from "@/features/env-vars/types";
import type { EnvVarUpsertInput } from "@/features/env-vars/hooks/use-env-vars-store";

export interface EnvVarRequirement {
  key: string;
  label?: string;
  description?: string | null;
  isSecret?: boolean;
  required?: boolean;
}

export interface EnvVarPanelProps {
  envVars: EnvVar[];
  savingKey?: string | null;
  onSave: (payload: EnvVarUpsertInput) => Promise<void> | void;
  requirements?: EnvVarRequirement[];
  allowCustomKeys?: boolean;
  showExistingList?: boolean;
  layout?: "card" | "plain";
  title?: string;
  description?: string;
  className?: string;
  onRefresh?: () => void;
}

interface EnvVarRowProps {
  envKey: string;
  label?: string;
  description?: string | null;
  value?: string | null;
  isSecret?: boolean;
  scope?: string;
  required?: boolean;
  isSaving?: boolean;
  savingKey?: string | null;
  onSave: (value: string) => Promise<void> | void;
}

function inferSecretFromKey(key: string): boolean {
  return /(key|token|secret|password|api)/i.test(key);
}

function EnvVarRow({
  envKey,
  label,
  description,
  value: initialValue,
  isSecret,
  scope,
  required,
  isSaving,
  savingKey,
  onSave,
}: EnvVarRowProps) {
  const { t } = useT("translation");
  const [value, setValue] = React.useState(initialValue ?? "");
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    setValue(initialValue ?? "");
  }, [initialValue, envKey]);

  React.useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(timer);
  }, [copied]);

  const handleCopy = React.useCallback(async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success(t("library.envVars.copied"));
    } catch (error) {
      console.error("[EnvVars] copy failed", error);
      toast.error(t("library.envVars.copyError"));
    }
  }, [t, value]);

  const handleSave = React.useCallback(async () => {
    if (!value?.trim()) return;
    await onSave(value.trim());
  }, [onSave, value]);

  const isBusy = Boolean(isSaving && savingKey === envKey);
  const hasChanged =
    (initialValue ?? "") !== value && Boolean(value.trim().length);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground/90">
        <span>{label || envKey}</span>
        {required && (
          <Badge
            variant="secondary"
            className="text-xs uppercase tracking-wide"
          >
            {t("library.envVars.required")}
          </Badge>
        )}
        {scope && (
          <Badge variant="outline" className="text-xs">
            {scope === "system"
              ? t("library.envVars.scope.system")
              : t("library.envVars.scope.user")}
          </Badge>
        )}
        {(isSecret || inferSecretFromKey(envKey)) && (
          <Badge variant="outline" className="text-xs flex items-center gap-1">
            <Shield className="size-3" />
            {t("library.envVars.secretLabel")}
          </Badge>
        )}
      </div>
      {description && (
        <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">
          {description}
        </p>
      )}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative group flex-1">
          <Input
            type={isSecret ? "password" : "text"}
            autoComplete="off"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            className={cn("pr-10", isSecret ? "tracking-[0.2em]" : undefined)}
            placeholder={t("library.envVars.valuePlaceholder")}
          />
          {value && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 size-8 opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={handleCopy}
                  disabled={isBusy}
                >
                  {copied ? (
                    <Check className="size-4" />
                  ) : (
                    <Copy className="size-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t("library.envVars.copy")}</TooltipContent>
            </Tooltip>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          className="shrink-0"
          disabled={isBusy || !hasChanged}
          onClick={handleSave}
        >
          {isBusy ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              {t("library.envVars.saving")}
            </>
          ) : (
            t("library.envVars.save")
          )}
        </Button>
      </div>
    </div>
  );
}

export function EnvVarPanel({
  envVars,
  savingKey,
  onSave,
  requirements = [],
  allowCustomKeys = true,
  showExistingList = true,
  layout = "card",
  title,
  description,
  className,
  onRefresh,
}: EnvVarPanelProps) {
  const { t } = useT("translation");
  const [newKey, setNewKey] = React.useState("");
  const [newValue, setNewValue] = React.useState("");
  const [newDesc, setNewDesc] = React.useState("");
  const [newSecret, setNewSecret] = React.useState(true);
  const secretSwitchId = React.useId();

  const envMap = React.useMemo(() => {
    return new Map(envVars.map((item) => [item.key, item]));
  }, [envVars]);

  const definedRows = React.useMemo(() => {
    return requirements.map((req) => {
      const existing = envMap.get(req.key);
      return {
        key: req.key,
        label: req.label ?? req.key,
        description: req.description ?? existing?.description ?? null,
        isSecret:
          req.isSecret ?? existing?.is_secret ?? inferSecretFromKey(req.key),
        required: req.required ?? false,
        scope: existing?.scope,
        value: existing?.value ?? "",
      };
    });
  }, [envMap, requirements]);

  const otherRows = React.useMemo(() => {
    if (!showExistingList) return [] as EnvVar[];
    if (!requirements.length) return envVars;
    const definedKeys = new Set(requirements.map((req) => req.key));
    return envVars.filter((item) => !definedKeys.has(item.key));
  }, [envVars, requirements, showExistingList]);

  const hasContent = definedRows.length > 0 || otherRows.length > 0;

  const content = (
    <div className="space-y-6">
      {definedRows.length > 0 && (
        <div className="space-y-4">
          {definedRows.map((row) => (
            <EnvVarRow
              key={row.key}
              envKey={row.key}
              label={row.label}
              description={row.description}
              value={row.value}
              isSecret={row.isSecret}
              required={row.required}
              scope={row.scope}
              isSaving={savingKey === row.key}
              savingKey={savingKey}
              onSave={(nextValue) =>
                onSave({
                  key: row.key,
                  value: nextValue,
                  isSecret: row.isSecret,
                  description: row.description ?? undefined,
                })
              }
            />
          ))}
        </div>
      )}

      {otherRows.length > 0 && (
        <div className="space-y-4">
          {requirements.length > 0 && (
            <div className="text-xs uppercase tracking-wide text-muted-foreground/80">
              {t("library.envVars.otherTitle")}
            </div>
          )}
          {otherRows.map((envVar) => (
            <EnvVarRow
              key={envVar.key}
              envKey={envVar.key}
              label={envVar.key}
              description={envVar.description}
              value={envVar.value}
              isSecret={envVar.is_secret}
              scope={envVar.scope}
              isSaving={savingKey === envVar.key}
              savingKey={savingKey}
              onSave={(nextValue) =>
                onSave({
                  key: envVar.key,
                  value: nextValue,
                  isSecret: envVar.is_secret,
                  description: envVar.description ?? undefined,
                  scope: envVar.scope,
                })
              }
            />
          ))}
        </div>
      )}

      {!hasContent && (
        <div className="text-sm text-muted-foreground border border-dashed border-border/50 rounded-lg p-4 text-center">
          {t("library.envVars.empty")}
        </div>
      )}

      {allowCustomKeys && (
        <div className="border-t border-border/40 pt-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-semibold">
                {t("library.envVars.addTitle")}
              </h4>
              <p className="text-xs text-muted-foreground">
                {t("library.envVars.addDescription")}
              </p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>{t("library.envVars.keyLabel")}</Label>
              <Input
                value={newKey}
                onChange={(event) => setNewKey(event.target.value)}
                placeholder="OPENAI_API_KEY"
                autoCapitalize="characters"
              />
            </div>
            <div className="space-y-2">
              <Label>{t("library.envVars.valueLabel")}</Label>
              <Input
                type={newSecret ? "password" : "text"}
                value={newValue}
                onChange={(event) => setNewValue(event.target.value)}
                placeholder={t("library.envVars.valuePlaceholder")}
              />
            </div>
          </div>
          <div className="mt-4 space-y-3">
            <div className="space-y-2">
              <Label>{t("library.envVars.descriptionLabel")}</Label>
              <Input
                value={newDesc}
                onChange={(event) => setNewDesc(event.target.value)}
                placeholder={t("library.envVars.descriptionPlaceholder")}
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={newSecret}
                onCheckedChange={setNewSecret}
                id={secretSwitchId}
              />
              <Label htmlFor={secretSwitchId}>
                {t("library.envVars.secretToggle")}
              </Label>
            </div>
            <Button
              type="button"
              className="w-full sm:w-auto"
              onClick={async () => {
                const trimmedKey = newKey.trim();
                if (!trimmedKey || !newValue.trim()) return;
                await Promise.resolve(
                  onSave({
                    key: newKey.trim(),
                    value: newValue.trim(),
                    isSecret: newSecret,
                    description: newDesc.trim() || undefined,
                  }),
                );
                setNewKey("");
                setNewValue("");
                setNewDesc("");
                setNewSecret(true);
              }}
              disabled={
                !newKey.trim() ||
                !newValue.trim() ||
                savingKey === newKey.trim()
              }
            >
              {savingKey === newKey.trim() ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  {t("library.envVars.saving")}
                </>
              ) : (
                <>
                  <Plus className="mr-2 size-4" />
                  {t("library.envVars.addButton")}
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  const headerTitle = title ?? t("library.envVars.title");
  const headerDescription = description ?? t("library.envVars.description");

  const headerActions = onRefresh ? (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={onRefresh}
          aria-label={t("library.envVars.refresh")}
        >
          <RefreshCw className="size-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{t("library.envVars.refresh")}</TooltipContent>
    </Tooltip>
  ) : null;

  if (layout === "card") {
    return (
      <Card className={className}>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>{headerTitle}</CardTitle>
            <CardDescription>{headerDescription}</CardDescription>
          </div>
          {headerActions}
        </CardHeader>
        <CardContent className="space-y-6">{content}</CardContent>
      </Card>
    );
  }

  return (
    <section
      className={cn(
        "rounded-2xl border border-border/50 bg-card/40 p-6",
        className,
      )}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold">{headerTitle}</h3>
          <p className="text-sm text-muted-foreground">{headerDescription}</p>
        </div>
        {headerActions}
      </div>
      <div className="mt-6">{content}</div>
    </section>
  );
}
