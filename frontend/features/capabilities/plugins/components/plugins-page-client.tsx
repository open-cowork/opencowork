"use client";

import { useState, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { Search } from "lucide-react";

import { PluginsGrid } from "@/features/capabilities/plugins/components/plugins-grid";
import { PluginImportDialog } from "@/features/capabilities/plugins/components/plugin-import-dialog";
import { usePluginCatalog } from "@/features/capabilities/plugins/hooks/use-plugin-catalog";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";
import { PaginatedGrid } from "@/components/ui/paginated-grid";
import { usePagination } from "@/hooks/use-pagination";
import { pluginsService } from "@/features/capabilities/plugins/services/plugins-service";
import { useT } from "@/lib/i18n/client";
import { CapabilityContentShell } from "@/features/capabilities/components/capability-content-shell";
import { HeaderSearchInput } from "@/components/shared/header-search-input";
import { Button } from "@/components/ui/button";
import { logger } from "@/lib/logger";

const PAGE_SIZE = 10;

export function PluginsPageClient() {
  const { t } = useT("translation");
  const {
    plugins,
    installs,
    loadingId,
    isLoading,
    installPlugin,
    deletePlugin,
    setEnabled,
    refresh,
  } = usePluginCatalog();
  const [importOpen, setImportOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPlugins = useMemo(() => {
    if (!searchQuery) return plugins;
    const lowerQuery = searchQuery.toLowerCase();
    return plugins.filter(
      (plugin) =>
        plugin.name.toLowerCase().includes(lowerQuery) ||
        String(plugin.id).includes(lowerQuery),
    );
  }, [plugins, searchQuery]);

  const pagination = usePagination(filteredPlugins, { pageSize: PAGE_SIZE });

  const handleBatchToggle = useCallback(
    async (enabled: boolean) => {
      try {
        await Promise.all(
          installs.map((install) =>
            pluginsService.updateInstall(install.id, { enabled }),
          ),
        );
        refresh();
      } catch (error) {
        logger.error("[PluginsPageClient] Failed to batch toggle:", error);
        toast.error(t("library.pluginsManager.toasts.actionFailed"));
      }
    },
    [installs, refresh, t],
  );

  const toolbarSlot = (
    <>
      <HeaderSearchInput
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder={t("library.pluginsPage.searchPlaceholder")}
        className="w-full md:w-64"
      />
      <Button
        variant="ghost"
        size="sm"
        className="gap-2 md:w-auto"
        onClick={() => setImportOpen(true)}
      >
        <Search className="size-4" />
        {t("library.pluginsImport.title")}
      </Button>
    </>
  );

  return (
    <>
      <div className="flex flex-1 flex-col overflow-hidden">
        <PullToRefresh onRefresh={refresh} isLoading={isLoading}>
          <CapabilityContentShell>
            <PaginatedGrid
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              pageSize={pagination.pageSize}
              onPageChange={pagination.goToPage}
              onPageSizeChange={pagination.setPageSize}
              totalItems={filteredPlugins.length}
            >
              <PluginsGrid
                plugins={pagination.paginatedData}
                installs={installs}
                loadingId={loadingId}
                isLoading={isLoading}
                onInstall={installPlugin}
                onDeletePlugin={deletePlugin}
                onToggleEnabled={setEnabled}
                onBatchToggle={handleBatchToggle}
                toolbarSlot={toolbarSlot}
              />
            </PaginatedGrid>
          </CapabilityContentShell>
        </PullToRefresh>
      </div>

      <PluginImportDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={refresh}
      />
    </>
  );
}
