"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import type {
  Plugin,
  UserPluginInstall,
} from "@/features/capabilities/plugins/types";
import { pluginsService } from "@/features/capabilities/plugins/services/plugins-service";
import { useT } from "@/lib/i18n/client";
import { playInstallSound } from "@/lib/utils/sound";

export interface PluginDisplayItem {
  plugin: Plugin;
  install?: UserPluginInstall;
}

export function usePluginCatalog() {
  const { t } = useT("translation");
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [installs, setInstalls] = useState<UserPluginInstall[]>([]);
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const [pluginsData, installsData] = await Promise.all([
        pluginsService.listPlugins(),
        pluginsService.listInstalls(),
      ]);
      setPlugins(pluginsData);
      setInstalls(installsData);
    } catch (error) {
      console.error("[Plugins] Failed to fetch data:", error);
      toast.error(t("library.pluginsManager.toasts.loadError"));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const installPlugin = useCallback(
    async (pluginId: number) => {
      setLoadingId(pluginId);
      try {
        const created = await pluginsService.createInstall({
          plugin_id: pluginId,
          enabled: true,
        });
        setInstalls((prev) => [created, ...prev]);
        toast.success(t("library.pluginsManager.toasts.installed"));
        playInstallSound();
      } catch (error) {
        console.error("[Plugins] install failed:", error);
        toast.error(t("library.pluginsManager.toasts.actionError"));
      } finally {
        setLoadingId(null);
      }
    },
    [t],
  );

  const deletePlugin = useCallback(
    async (pluginId: number) => {
      setLoadingId(pluginId);
      try {
        await pluginsService.deletePlugin(pluginId);
        setPlugins((prev) => prev.filter((plugin) => plugin.id !== pluginId));
        setInstalls((prev) =>
          prev.filter((install) => install.plugin_id !== pluginId),
        );
        toast.success(t("common.deleted"));
      } catch (error) {
        console.error("[Plugins] delete failed:", error);
        toast.error(t("library.pluginsManager.toasts.actionError"));
      } finally {
        setLoadingId(null);
      }
    },
    [t],
  );

  const setEnabled = useCallback(
    async (installId: number, enabled: boolean) => {
      setLoadingId(installId);
      const install = installs.find((i) => i.id === installId);
      const plugin = install
        ? plugins.find((p) => p.id === install.plugin_id)
        : null;
      const pluginName =
        plugin?.name || t("library.pluginsManager.unknownPlugin");

      setInstalls((prev) =>
        prev.map((i) => (i.id === installId ? { ...i, enabled } : i)),
      );
      try {
        const updated = await pluginsService.updateInstall(installId, {
          enabled,
        });
        setInstalls((prev) =>
          prev.map((i) => (i.id === installId ? updated : i)),
        );
        toast.success(
          enabled
            ? `${pluginName} ${t("library.pluginsManager.toasts.enabled")}`
            : `${pluginName} ${t("library.pluginsManager.toasts.disabled")}`,
        );
        if (enabled) {
          playInstallSound();
        }
      } catch (error) {
        console.error("[Plugins] setEnabled failed:", error);
        setInstalls((prev) =>
          prev.map((i) =>
            i.id === installId ? { ...i, enabled: !enabled } : i,
          ),
        );
        toast.error(t("library.pluginsManager.toasts.actionError"));
      } finally {
        setLoadingId(null);
      }
    },
    [t, installs, plugins],
  );

  const items: PluginDisplayItem[] = useMemo(() => {
    return plugins.map((plugin) => ({
      plugin,
      install: installs.find((i) => i.plugin_id === plugin.id),
    }));
  }, [plugins, installs]);

  return {
    plugins,
    installs,
    items,
    isLoading,
    loadingId,
    refresh,
    installPlugin,
    deletePlugin,
    setEnabled,
  };
}
