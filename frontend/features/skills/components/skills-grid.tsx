"use client";

import * as React from "react";
import { Package, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import type { Skill, UserSkillInstall } from "@/features/skills/types";
import { useT } from "@/lib/i18n/client";

interface SkillsGridProps {
  skills: Skill[];
  installs: UserSkillInstall[];
  loadingId?: number | null;
  isLoading?: boolean;
  onInstall?: (skillId: number) => void;
  onUninstall?: (installId: number) => void;
  onToggleEnabled?: (installId: number, enabled: boolean) => void;
}

export function SkillsGrid({
  skills,
  installs,
  loadingId,
  isLoading = false,
  onInstall,
  onUninstall,
  onToggleEnabled,
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
      <div className="rounded-xl bg-muted/50 px-5 py-3">
        <span className="text-sm text-muted-foreground">
          {t("library.skillsManager.stats.available", "可用技能")}:{" "}
          {skills.length} ·{" "}
          {t("library.skillsManager.stats.installed", "已安装")}:{" "}
          {installedCount} ·{" "}
          {t("library.skillsManager.stats.enabled", "已启用")}: {enabledCount}
        </span>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Package className="size-4" />
          <span>{t("library.skillsManager.section.title", "Skills")}</span>
        </div>

        <div className="space-y-2">
          {!isLoading && skills.length === 0 && (
            <div className="rounded-xl border border-border/50 bg-muted/10 px-4 py-6 text-sm text-muted-foreground text-center">
              {t("library.skillsManager.empty", "暂无技能")}
            </div>
          )}

          {skills.map((skill) => {
            const install = installBySkillId.get(skill.id);
            const isInstalled = Boolean(install);
            const isRowLoading =
              isLoading || loadingId === skill.id || loadingId === install?.id;

            return (
              <div
                key={skill.id}
                className={`flex items-center gap-4 rounded-xl border px-4 py-3 ${
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
                        ? t("library.skillsManager.scope.system", "系统")
                        : t("library.skillsManager.scope.user", "个人")}
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
                        "卸载",
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
                    {t("library.skillsManager.actions.install", "安装")}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
