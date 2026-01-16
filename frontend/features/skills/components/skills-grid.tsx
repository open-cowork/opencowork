"use client";

import * as React from "react";
import {
  Trash2,
  Loader2,
  Upload,
  Package,
  User,
  RefreshCw,
  Download,
} from "lucide-react";

import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { SkillPreset, UserSkillInstall } from "@/features/skills/types";

// Mock data for presets
const MOCK_PRESETS: SkillPreset[] = [
  {
    id: 1,
    name: "planning-with-files",
    display_name: "Planning with Files",
    description: "帮助 AI 使用文件进行规划和任务管理",
    category: "productivity",
    entry: null,
    default_config: null,
    config_schema: null,
    source: "official",
    owner_user_id: null,
    version: "1.0.0",
    is_active: true,
    created_at: "2024-01-01",
    updated_at: "2024-01-01",
  },
  {
    id: 2,
    name: "code-review",
    display_name: "代码审查助手",
    description: "自动审查和改进代码质量，支持多种编程语言",
    category: "development",
    entry: null,
    default_config: null,
    config_schema: null,
    source: "official",
    owner_user_id: null,
    version: "2.1.0",
    is_active: true,
    created_at: "2024-01-01",
    updated_at: "2024-01-15",
  },
  {
    id: 3,
    name: "document-generator",
    display_name: "文档生成器",
    description: "自动生成项目文档和 API 说明",
    category: "documentation",
    entry: null,
    default_config: null,
    config_schema: null,
    source: "community",
    owner_user_id: "user123",
    version: "1.2.0",
    is_active: true,
    created_at: "2024-01-01",
    updated_at: "2024-01-10",
  },
  {
    id: 4,
    name: "test-generator",
    display_name: "测试用例生成",
    description: "基于代码自动生成单元测试和集成测试",
    category: "testing",
    entry: null,
    default_config: null,
    config_schema: null,
    source: "official",
    owner_user_id: null,
    version: "1.0.0",
    is_active: true,
    created_at: "2024-01-01",
    updated_at: "2024-01-01",
  },
];

// Mock data for installs
// Mock data for installs
const MOCK_INSTALLS: UserSkillInstall[] = [
  {
    id: 1,
    user_id: "user1",
    preset_id: 1,
    enabled: true,
    overrides: null,
    created_at: "2024-01-02",
    updated_at: "2024-01-02",
  },
  {
    id: 2,
    user_id: "user1",
    preset_id: 2,
    enabled: true,
    overrides: { autoFix: true },
    created_at: "2024-01-03",
    updated_at: "2024-01-16",
  },
  // Custom install (mocking preset_id as 0 for now since it's required in type)
  {
    id: 3,
    user_id: "user1",
    preset_id: 0,
    enabled: true,
    overrides: {
      name: "my-custom-skill",
      display_name: "我的自定义技能",
      description: "用户自己创建的技能",
    },
    created_at: "2024-01-05",
    updated_at: "2024-01-05",
  },
];

interface SkillsGridProps {
  presets?: SkillPreset[];
  installs?: UserSkillInstall[];
  loadingId?: number | null;
  onInstall?: (presetId: number) => void;
  onUninstall?: (installId: number) => void;
  onUpdate?: (installId: number) => void;
  onUploadToPreset?: (installId: number) => void;
}

export function SkillsGrid({
  presets: propPresets,
  installs: propInstalls,
  loadingId,
  onInstall,
  onUninstall,
  onUpdate,
  onUploadToPreset,
}: SkillsGridProps) {
  const presets = propPresets?.length ? propPresets : MOCK_PRESETS;
  const installs = propInstalls?.length ? propInstalls : MOCK_INSTALLS;

  const installByPresetId = React.useMemo(() => {
    const map = new Map<number, UserSkillInstall>();
    for (const install of installs) {
      if (install.preset_id) {
        map.set(install.preset_id, install);
      }
    }
    return map;
  }, [installs]);

  const customInstalls = React.useMemo(() => {
    return installs.filter((i) => !i.preset_id);
  }, [installs]);

  const installedCount = installs.length;
  const enabledCount = installs.filter((i) => i.enabled).length;

  return (
    <div className="space-y-6">
      {/* Statistics Bar */}
      <div className="rounded-xl bg-muted/50 px-5 py-3">
        <span className="text-sm text-muted-foreground">
          可用预设: {presets.length} · 已安装: {installedCount} · 已启用:{" "}
          {enabledCount}
        </span>
      </div>

      {/* Presets Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Package className="size-4" />
          <span>预设技能</span>
        </div>

        <div className="space-y-2">
          {presets.map((preset) => {
            const install = installByPresetId.get(preset.id);
            const isInstalled = Boolean(install);
            const isLoading = loadingId === preset.id;

            return (
              <div
                key={preset.id}
                className={`flex items-center gap-4 rounded-xl border px-4 py-3 ${
                  isInstalled
                    ? "border-border/70 bg-card"
                    : "border-border/40 bg-muted/20"
                }`}
              >
                {/* Left: Info */}
                <div className="flex-1 min-w-0">
                  {/* Row 1: Name only */}
                  <div className="font-medium">
                    {preset.display_name || preset.name}
                  </div>
                  {/* Row 2: Badges */}
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    <Badge
                      variant="outline"
                      className="text-xs text-muted-foreground"
                    >
                      {preset.source === "official" ? "官方" : "社区"}
                    </Badge>
                    {preset.category && (
                      <Badge
                        variant="outline"
                        className="text-xs text-muted-foreground"
                      >
                        {preset.category}
                      </Badge>
                    )}
                    {preset.version && (
                      <Badge
                        variant="outline"
                        className="text-xs text-muted-foreground"
                      >
                        v{preset.version}
                      </Badge>
                    )}
                  </div>
                  {/* Row 3: Description */}
                  {preset.description && (
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {preset.description}
                    </p>
                  )}
                </div>

                {/* Right: Actions + Switch */}
                <div className="flex items-center gap-4 flex-shrink-0">
                  {isLoading ? (
                    <Loader2 className="size-4 animate-spin text-muted-foreground" />
                  ) : (
                    <>
                      {isInstalled ? (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            onClick={() => onUpdate?.(install!.id)}
                            title="更新"
                          >
                            <RefreshCw className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            onClick={() => onUninstall?.(install!.id)}
                            title="卸载"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          onClick={() => onInstall?.(preset.id)}
                          title="安装"
                        >
                          <Download className="size-4" />
                        </Button>
                      )}

                      {/* Switch always on the far right for installed items */}
                      {isInstalled && (
                        <Switch
                          checked={install?.enabled ?? false}
                          onCheckedChange={() => {
                            // Update install enabled status
                            // Note: currently treating switch as enabled/disabled toggle for installed skills
                            // If not installed, switch shouldn't be visible or should trigger install?
                            // Based on previous code: if installed, toggle; else install.
                            // But here we separate "Install" button from "Enable" switch.
                            // Let's assume switch is only for enabling/disabling AFTER install.
                            // So if not installed, we don't show switch.
                          }}
                          // Actually previous logic was: switch toggles install/uninstall.
                          // But user asked for "Enable" switch.
                          // Let's stick to the previous pattern:
                          // If installed, Switch controls specific enabled state? Or install state?
                          // The `UserSkillInstall` has an `enabled` field.
                          // So Switch should control `install.enabled`.
                          // But we need an `onToggleEnabled` prop.
                          // The existing props are `onInstall`, `onUninstall`.
                          // Let's assume for now we use a new prop or just onUpdate.
                          onClick={(e) => {
                            e.stopPropagation();
                            // TODO: Implement toggle enabled
                          }}
                        />
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Custom Installs Section */}
      {customInstalls.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <User className="size-4" />
            <span>自定义技能</span>
          </div>

          <div className="space-y-2">
            {customInstalls.map((install) => {
              const isLoading = loadingId === install.id;
              const config = install.overrides as Record<
                string,
                unknown
              > | null;

              return (
                <div
                  key={install.id}
                  className="flex items-center gap-4 rounded-xl border border-dashed border-border/60 bg-card px-4 py-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">
                      {(config?.display_name as string) ||
                        (config?.name as string) ||
                        `自定义 #${install.id}`}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Badge
                        variant="outline"
                        className="text-xs text-muted-foreground"
                      >
                        用户自定义
                      </Badge>
                      {install.enabled && (
                        <Badge
                          variant="outline"
                          className="text-xs text-muted-foreground"
                        >
                          已启用
                        </Badge>
                      )}
                    </div>
                    {typeof config?.description === "string" && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {config.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isLoading ? (
                      <Loader2 className="size-4 animate-spin text-muted-foreground" />
                    ) : (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          onClick={() => onUploadToPreset?.(install.id)}
                          title="上传为预设"
                        >
                          <Upload className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          onClick={() => onUninstall?.(install.id)}
                          title="删除"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                        <Switch
                          checked={install.enabled}
                          // Mock functionality for custom install switch
                          onCheckedChange={() => {}}
                        />
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
