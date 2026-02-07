"use client";

import { useMemo, useState, useCallback } from "react";
import { toast } from "sonner";

import { McpHeader } from "@/features/mcp/components/mcp-header";
import { McpGrid } from "@/features/mcp/components/mcp-grid";
import { McpSettingsDialog } from "@/features/mcp/components/mcp-settings-dialog";
import { useMcpCatalog } from "@/features/mcp/hooks/use-mcp-catalog";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";
import { PaginatedGrid } from "@/components/ui/paginated-grid";
import { usePagination } from "@/hooks/use-pagination";
import { mcpService } from "@/features/mcp/services/mcp-service";

const PAGE_SIZE = 10;

export function McpPageClient() {
  const {
    items,
    servers,
    installs,
    selectedServer,
    setSelectedServer,
    toggleInstall,
    updateServer,
    createServer,
    uninstallServer,
    refresh,
    isLoading,
    loadingId,
  } = useMcpCatalog();
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredServers = useMemo(() => {
    if (!searchQuery) return servers;
    const lowerQuery = searchQuery.toLowerCase();
    return servers.filter(
      (server) =>
        server.name.toLowerCase().includes(lowerQuery) ||
        String(server.id).includes(lowerQuery),
    );
  }, [servers, searchQuery]);

  const pagination = usePagination(filteredServers, { pageSize: PAGE_SIZE });

  // Batch toggle all MCPs
  const handleBatchToggle = useCallback(
    async (enabled: boolean) => {
      try {
        await Promise.all(
          installs.map((install) =>
            mcpService.updateInstall(install.id, { enabled }),
          ),
        );
        // Refresh the installs list
        refresh();
      } catch (error) {
        console.error("[McpPageClient] Failed to batch toggle:", error);
        toast.error("Operation failed. Please try again.");
      }
    },
    [installs, refresh],
  );

  const activeItem = useMemo(() => {
    if (!selectedServer) return null;
    return items.find((entry) => entry.server.id === selectedServer.id) || null;
  }, [items, selectedServer]);

  return (
    <>
      <McpHeader
        onAddMcp={() => setIsCreating(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        <PullToRefresh onRefresh={refresh} isLoading={isLoading}>
          <div className="flex flex-1 flex-col px-6 py-6 overflow-auto">
            <div className="w-full max-w-4xl mx-auto">
              <PaginatedGrid
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                pageSize={pagination.pageSize}
                onPageChange={pagination.goToPage}
                onPageSizeChange={pagination.setPageSize}
                totalItems={filteredServers.length}
              >
                <McpGrid
                  servers={pagination.paginatedData}
                  installs={installs}
                  loadingId={loadingId}
                  isLoading={isLoading}
                  onToggleInstall={toggleInstall}
                  onUninstall={uninstallServer}
                  onEditServer={(server) => setSelectedServer(server)}
                  onBatchToggle={handleBatchToggle}
                  totalCount={filteredServers.length}
                />
              </PaginatedGrid>
            </div>
          </div>
        </PullToRefresh>
      </div>

      {(activeItem || isCreating) && (
        <McpSettingsDialog
          item={activeItem}
          open={Boolean(activeItem || isCreating)}
          isNew={isCreating}
          onClose={() => {
            setSelectedServer(null);
            setIsCreating(false);
          }}
          onSave={async ({ serverId, name, serverConfig }) => {
            if (isCreating) {
              if (!name) return;
              const created = await createServer(name, serverConfig);
              if (created) {
                await toggleInstall(created.id);
              }
            } else if (serverId) {
              await updateServer(serverId, serverConfig);
            }
          }}
        />
      )}
    </>
  );
}
