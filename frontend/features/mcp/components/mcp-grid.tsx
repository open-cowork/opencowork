"use client";

import * as React from "react";
import { Trash2, Loader2, Settings, Plus } from "lucide-react";

import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { McpPreset, UserMcpConfig } from "@/features/mcp/types";

// Mock data for presets
const MOCK_PRESETS: McpPreset[] = [
  {
    id: 1,
    name: "playwright",
    display_name: "Playwright",
    description: "浏览器自动化和网页测试",
    category: "自动化",
    transport: "stdio",
    default_config: { headless: true },
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
    name: "context7",
    display_name: "Context7",
    description: "文档搜索和上下文管理，支持多种文档格式",
    category: "文档",
    transport: "stdio",
    default_config: null,
    config_schema: null,
    source: "official",
    owner_user_id: null,
    version: "2.0.0",
    is_active: true,
    created_at: "2024-01-01",
    updated_at: "2024-01-15",
  },
  {
    id: 3,
    name: "exa",
    display_name: "Exa Search",
    description: "AI 驱动的网络搜索工具",
    category: "搜索",
    transport: "stdio",
    default_config: { max_results: 10 },
    config_schema: null,
    source: "official",
    owner_user_id: null,
    version: "1.5.0",
    is_active: true,
    created_at: "2024-01-01",
    updated_at: "2024-01-10",
  },
  {
    id: 4,
    name: "filesystem",
    display_name: "File System",
    description: "本地文件系统访问和管理",
    category: "系统",
    transport: "stdio",
    default_config: { root_path: "/workspace" },
    config_schema: null,
    source: "official",
    owner_user_id: null,
    version: "1.0.0",
    is_active: true,
    created_at: "2024-01-01",
    updated_at: "2024-01-01",
  },
  {
    id: 5,
    name: "github",
    display_name: "GitHub",
    description: "GitHub API 集成，支持仓库、Issue 和 PR 操作",
    category: "开发",
    transport: "stdio",
    default_config: null,
    config_schema: null,
    source: "community",
    owner_user_id: "user456",
    version: "1.2.0",
    is_active: true,
    created_at: "2024-01-01",
    updated_at: "2024-01-01",
  },
];

// Mock data for configs
const MOCK_CONFIGS: UserMcpConfig[] = [
  {
    id: 1,
    user_id: "user1",
    preset_id: 1,
    enabled: true,
    overrides: { headless: false },
    created_at: "2024-01-02",
    updated_at: "2024-01-02",
  },
  {
    id: 2,
    user_id: "user1",
    preset_id: 2,
    enabled: true,
    overrides: null,
    created_at: "2024-01-03",
    updated_at: "2024-01-16",
  },
  {
    id: 3,
    user_id: "user1",
    preset_id: 3,
    enabled: false,
    overrides: { max_results: 20 },
    created_at: "2024-01-05",
    updated_at: "2024-01-05",
  },
];

interface McpGridProps {
  presets?: McpPreset[];
  configs?: UserMcpConfig[];
  loadingId?: number | null;
  onAddConfig?: (presetId: number) => void;
  onToggleConfig?: (configId: number, enabled: boolean) => void;
  onEditConfig?: (configId: number, preset: McpPreset) => void;
  onDeleteConfig?: (configId: number) => void;
}

export function McpGrid({
  presets: propPresets,
  configs: propConfigs,
  loadingId,
  onAddConfig,
  onToggleConfig,
  onEditConfig,
  onDeleteConfig,
}: McpGridProps) {
  const presets = propPresets?.length ? propPresets : MOCK_PRESETS;
  const configs = propConfigs?.length ? propConfigs : MOCK_CONFIGS;

  const configByPresetId = React.useMemo(() => {
    const map = new Map<number, UserMcpConfig>();
    for (const config of configs) {
      map.set(config.preset_id, config);
    }
    return map;
  }, [configs]);

  const configuredCount = configs.length;
  const enabledCount = configs.filter((c) => c.enabled).length;

  return (
    <div className="space-y-6">
      {/* Statistics Bar */}
      <div className="rounded-xl bg-muted/50 px-5 py-3">
        <span className="text-sm text-muted-foreground">
          可用预设: {presets.length} · 已配置: {configuredCount} · 已启用:{" "}
          {enabledCount}
        </span>
      </div>

      {/* MCP Servers Section */}
      <div className="space-y-3">
        <div className="space-y-2">
          {presets.map((preset) => {
            const config = configByPresetId.get(preset.id);
            const isConfigured = Boolean(config);
            const isEnabled = config?.enabled ?? false;
            const isLoading =
              loadingId === preset.id || loadingId === config?.id;

            return (
              <div
                key={preset.id}
                className={`flex items-center gap-4 rounded-xl border px-4 py-3 ${
                  isConfigured
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
                  </div>
                  {/* Row 3: Description */}
                  {preset.description && (
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {preset.description}
                    </p>
                  )}
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {isLoading ? (
                    <Loader2 className="size-4 animate-spin text-muted-foreground" />
                  ) : isConfigured ? (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => onEditConfig?.(config!.id, preset)}
                        title="设置"
                      >
                        <Settings className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => onDeleteConfig?.(config!.id)}
                        title="删除"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                      <Switch
                        checked={isEnabled}
                        onCheckedChange={(checked) =>
                          onToggleConfig?.(config!.id, checked)
                        }
                      />
                    </>
                  ) : (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      onClick={() => onAddConfig?.(preset.id)}
                      title="添加配置"
                    >
                      <Plus className="size-4" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
