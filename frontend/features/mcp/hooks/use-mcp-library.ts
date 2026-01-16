"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import type { McpPreset, UserMcpConfig } from "@/features/mcp/types";
import { mcpService } from "@/features/mcp/services/mcp-service";
import { useEnvVarsStore } from "@/features/env-vars/hooks/use-env-vars-store";
import { useT } from "@/lib/i18n/client";

export interface McpDisplayItem {
  preset: McpPreset;
  config?: UserMcpConfig;
}

export function useMcpLibrary() {
  const { t } = useT("translation");
  const [presets, setPresets] = useState<McpPreset[]>([]);
  const [configs, setConfigs] = useState<UserMcpConfig[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<McpPreset | null>(null);
  const [loadingPresetId, setLoadingPresetId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const envVarStore = useEnvVarsStore();

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [presetsData, configsData] = await Promise.all([
          mcpService.listPresets(),
          mcpService.listConfigs(),
        ]);
        setPresets(presetsData);
        setConfigs(configsData);
      } catch (error) {
        console.error("[MCP] Failed to fetch data:", error);
        toast.error("加载 MCP 列表失败");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const togglePreset = useCallback(
    async (presetId: number) => {
      const config = configs.find((entry) => entry.preset_id === presetId);
      setLoadingPresetId(presetId);
      try {
        if (config) {
          const updated = await mcpService.updateConfig(config.id, {
            enabled: !config.enabled,
          });
          setConfigs((prev) =>
            prev.map((item) => (item.id === config.id ? updated : item)),
          );
          toast.success(
            updated.enabled
              ? t("library.mcpLibrary.toasts.enabled")
              : t("library.mcpLibrary.toasts.disabled"),
          );
        } else {
          const created = await mcpService.createConfig({
            preset_id: presetId,
            enabled: true,
          });
          setConfigs((prev) => [...prev, created]);
          toast.success(t("library.mcpLibrary.toasts.enabled"));
        }
      } catch (error) {
        console.error("[MCP] toggle failed:", error);
        toast.error(t("library.mcpLibrary.toasts.error"));
      } finally {
        setLoadingPresetId(null);
      }
    },
    [configs, t],
  );

  const items: McpDisplayItem[] = useMemo(() => {
    return presets.map((preset) => ({
      preset,
      config: configs.find((config) => config.preset_id === preset.id),
    }));
  }, [presets, configs]);

  return {
    items,
    isLoading,
    envVars: envVarStore.envVars,
    selectedPreset,
    setSelectedPreset,
    togglePreset,
    loadingPresetId,
    savingEnvKey: envVarStore.savingEnvKey,
    refreshEnvVars: envVarStore.refreshEnvVars,
    upsertEnvVar: envVarStore.upsertEnvVar,
    removeEnvVar: envVarStore.removeEnvVar,
  };
}
