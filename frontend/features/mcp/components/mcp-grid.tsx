"use client";

import * as React from "react";
import { Settings, PowerOff, AlertTriangle, Trash2 } from "lucide-react";

import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SkeletonShimmer } from "@/components/ui/skeleton-shimmer";
import { StaggeredList } from "@/components/ui/staggered-entrance";
import type { McpServer, UserMcpInstall } from "@/features/mcp/types";
import { useT } from "@/lib/i18n/client";

const MCP_LIMIT = 3;

interface McpGridProps {
  servers: McpServer[];
  installs: UserMcpInstall[];
  loadingId?: number | null;
  isLoading?: boolean;
  onToggleInstall?: (serverId: number) => void;
  onUninstall?: (serverId: number, installId: number) => void;
  onEditServer?: (server: McpServer) => void;
  onBatchToggle?: (enabled: boolean) => void;
  totalCount?: number;
}

export function McpGrid({
  servers,
  installs,
  loadingId,
  isLoading = false,
  onToggleInstall,
  onUninstall,
  onEditServer,
  onBatchToggle,
  totalCount,
}: McpGridProps) {
  const { t } = useT("translation");
  const installByServerId = React.useMemo(() => {
    const map = new Map<number, UserMcpInstall>();
    for (const install of installs) {
      map.set(install.server_id, install);
    }
    return map;
  }, [installs]);

  const enabledCount = installs.filter((c) => c.enabled).length;

  return (
    <div className="space-y-6">
      {/* Warning alert */}
      {enabledCount > MCP_LIMIT && (
        <Alert className="border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-500 [&>svg]:text-amber-600 dark:[&>svg]:text-amber-500 *:data-[slot=alert-description]:text-amber-600/90 dark:*:data-[slot=alert-description]:text-amber-500/90">
          <AlertTriangle className="size-4" />
          <AlertDescription>
            {t("hero.warnings.tooManyMcps", { count: enabledCount })}
          </AlertDescription>
        </Alert>
      )}

      {/* Stats bar with batch controls */}
      <div className="rounded-xl bg-muted/50 px-5 py-3 flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          Available servers: {totalCount ?? servers.length} · Enabled:{" "}
          {enabledCount}
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
        {isLoading && servers.length === 0 ? (
          <SkeletonShimmer count={5} itemClassName="min-h-[64px]" gap="md" />
        ) : servers.length === 0 ? (
          <div className="rounded-xl border border-border/50 bg-muted/10 px-4 py-6 text-sm text-muted-foreground text-center">
            No MCP servers yet
          </div>
        ) : (
          <StaggeredList
            items={servers}
            show={!isLoading}
            keyExtractor={(server) => server.id}
            staggerDelay={50}
            duration={400}
            renderItem={(server) => {
              const install = installByServerId.get(server.id);
              const isEnabled = install?.enabled ?? false;
              const isRowLoading = loadingId === server.id;
              const isInstalled = Boolean(install);

              return (
                <div
                  className={`flex items-center gap-4 rounded-xl border px-4 py-3 min-h-[64px] ${
                    install
                      ? "border-border/70 bg-card"
                      : "border-border/40 bg-muted/20"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{server.name}</span>
                      <Badge
                        variant="outline"
                        className="text-xs text-muted-foreground"
                      >
                        {server.scope === "system" ? "System" : "Personal"}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Switch
                      checked={isEnabled}
                      onCheckedChange={() => onToggleInstall?.(server.id)}
                      disabled={isRowLoading}
                    />
                    {isInstalled && install && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => onUninstall?.(server.id, install.id)}
                        disabled={isRowLoading}
                        title={t(
                          "library.mcpLibrary.actions.uninstall",
                          "Uninstall",
                        )}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      onClick={() => onEditServer?.(server)}
                      title="Settings"
                    >
                      <Settings className="size-4" />
                    </Button>
                  </div>
                </div>
              );
            }}
          />
        )}
      </div>
    </div>
  );
}
