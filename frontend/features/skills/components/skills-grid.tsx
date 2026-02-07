"use client";

import * as React from "react";
import { Trash2, PowerOff, AlertTriangle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SkeletonShimmer } from "@/components/ui/skeleton-shimmer";
import { StaggeredList } from "@/components/ui/staggered-entrance";
import type { Skill, UserSkillInstall } from "@/features/skills/types";
import { useT } from "@/lib/i18n/client";

const SKILL_LIMIT = 5;

interface SkillsGridProps {
  skills: Skill[];
  installs: UserSkillInstall[];
  loadingId?: number | null;
  isLoading?: boolean;
  onInstall?: (skillId: number) => void;
  onUninstall?: (installId: number) => void;
  onToggleEnabled?: (installId: number, enabled: boolean) => void;
  onBatchToggle?: (enabled: boolean) => void;
  totalCount?: number;
}

export function SkillsGrid({
  skills,
  installs,
  loadingId,
  isLoading = false,
  onInstall,
  onUninstall,
  onToggleEnabled,
  onBatchToggle,
  totalCount,
}: SkillsGridProps) {
  const { t } = useT("translation");

  const installBySkillId = React.useMemo(() => {
    const map = new Map<number, UserSkillInstall>();
    for (const install of installs) {
      map.set(install.skill_id, install);
    }
    return map;
  }, [installs]);

  const installedCount = installs.length;
  const enabledCount = installs.filter((i) => i.enabled).length;

  return (
    <div className="space-y-6">
      {/* Warning alert */}
      {enabledCount > SKILL_LIMIT && (
        <Alert className="border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-500 [&>svg]:text-amber-600 dark:[&>svg]:text-amber-500 *:data-[slot=alert-description]:text-amber-600/90 dark:*:data-[slot=alert-description]:text-amber-500/90">
          <AlertTriangle className="size-4" />
          <AlertDescription>
            {t("hero.warnings.tooManySkills", { count: enabledCount })}
          </AlertDescription>
        </Alert>
      )}

      {/* Stats bar with batch controls */}
      <div className="rounded-xl bg-muted/50 px-5 py-3 flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {t("library.skillsManager.stats.available", "Available skills")}:{" "}
          {totalCount ?? skills.length} ·{" "}
          {t("library.skillsManager.stats.installed", "Installed")}:{" "}
          {installedCount} ·{" "}
          {t("library.skillsManager.stats.enabled", "Enabled")}: {enabledCount}
        </span>
        {installs.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onBatchToggle?.(false)}
            className="h-7 px-2 text-xs"
          >
            <PowerOff className="size-3 mr-1" />
            Disable all
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {isLoading && skills.length === 0 ? (
          <SkeletonShimmer count={5} itemClassName="min-h-[64px]" gap="md" />
        ) : !isLoading && skills.length === 0 ? (
          <div className="rounded-xl border border-border/50 bg-muted/10 px-4 py-6 text-sm text-muted-foreground text-center">
            {t("library.skillsManager.empty", "No skills yet")}
          </div>
        ) : (
          <StaggeredList
            items={skills}
            show={!isLoading}
            keyExtractor={(skill) => skill.id}
            staggerDelay={50}
            duration={400}
            renderItem={(skill) => {
              const install = installBySkillId.get(skill.id);
              const isInstalled = Boolean(install);
              const isRowLoading =
                isLoading ||
                loadingId === skill.id ||
                loadingId === install?.id;

              return (
                <div
                  className={`flex items-center gap-4 rounded-xl border px-4 py-3 min-h-[64px] ${
                    isInstalled
                      ? "border-border/70 bg-card"
                      : "border-border/40 bg-muted/20"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium truncate">{skill.name}</span>
                      <Badge
                        variant="outline"
                        className="text-xs text-muted-foreground"
                      >
                        {skill.scope === "system"
                          ? t("library.skillsManager.scope.system", "System")
                          : t("library.skillsManager.scope.user", "Personal")}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t("library.skillsManager.fields.id", "id")}: {skill.id}
                    </p>
                  </div>

                  {isInstalled && install ? (
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={install.enabled}
                        disabled={isRowLoading}
                        onCheckedChange={(enabled) =>
                          onToggleEnabled?.(install.id, enabled)
                        }
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={isRowLoading}
                        onClick={() => onUninstall?.(install.id)}
                        className="rounded-lg"
                        title={t(
                          "library.skillsManager.actions.uninstall",
                          "Uninstall",
                        )}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      disabled={isRowLoading}
                      onClick={() => onInstall?.(skill.id)}
                    >
                      {t("library.skillsManager.actions.install", "Install")}
                    </Button>
                  )}
                </div>
              );
            }}
          />
        )}
      </div>
    </div>
  );
}
