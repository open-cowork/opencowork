"use client";

import * as React from "react";
import { HardDrive, Database, Zap } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { mcpService } from "@/features/mcp/services/mcp-service";
import type { McpDisplayItem } from "@/features/mcp/hooks/use-mcp-catalog";

interface McpSelectorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Current MCP toggle state: { server_name: boolean } */
  mcpConfig: Record<string, boolean>;
  onMcpConfigChange: (config: Record<string, boolean>) => void;
}

/** Default icons for MCP servers without custom icons */
const DEFAULT_ICONS: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  filesystem: HardDrive,
  postgres: Database,
  sentry: Zap,
};

function McpIcon({
  serverName,
  className,
}: {
  serverName: string;
  className?: string;
}) {
  const Icon = DEFAULT_ICONS[serverName] || Database;
  return <Icon className={className} />;
}

export function McpSelectorDialog({
  open,
  onOpenChange,
  mcpConfig,
  onMcpConfigChange,
}: McpSelectorDialogProps) {
  const { t } = useT("translation");
  const [items, setItems] = React.useState<McpDisplayItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [localConfig, setLocalConfig] = React.useState<Record<string, boolean>>(
    {},
  );

  // Load MCP servers when dialog opens
  React.useEffect(() => {
    if (!open) return;

    const loadServers = async () => {
      setIsLoading(true);
      try {
        const [serversData, installsData] = await Promise.all([
          mcpService.listServers(),
          mcpService.listInstalls(),
        ]);

        const displayItems: McpDisplayItem[] = serversData.map((server) => ({
          server,
          install: installsData.find((entry) => entry.server_id === server.id),
        }));

        setItems(displayItems);

        // Initialize local config based on user's installed servers
        const initialConfig: Record<string, boolean> = { ...mcpConfig };
        for (const item of displayItems) {
          // Only show installed servers
          if (item.install) {
            // If not explicitly set, default to the install's enabled state
            if (!(item.server.name in initialConfig)) {
              initialConfig[item.server.name] = item.install.enabled;
            }
          }
        }
        setLocalConfig(initialConfig);
      } catch (error) {
        console.error("Failed to load MCP servers:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadServers();
  }, [open, mcpConfig]);

  const handleToggle = (serverName: string, checked: boolean) => {
    setLocalConfig((prev) => ({ ...prev, [serverName]: checked }));
  };

  const handleSave = () => {
    onMcpConfigChange(localConfig);
    onOpenChange(false);
  };

  // Filter to only show installed servers
  const installedItems = items.filter((item) => item.install);

  // Calculate stats
  const enabledCount = Object.values(localConfig).filter(Boolean).length;
  const totalCount = installedItems.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("hero.mcpSelector.title")}</DialogTitle>
          <DialogDescription>
            {t("hero.mcpSelector.description")}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-muted-foreground">
              {t("hero.mcpSelector.loading")}
            </div>
          </div>
        ) : installedItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Database className="mb-2 size-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              {t("hero.mcpSelector.noServers")}
            </p>
          </div>
        ) : (
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-1 p-1">
              {installedItems.map(({ server, install }) => {
                const isEnabled =
                  localConfig[server.name] ?? install?.enabled ?? false;
                // Use display_name (user's custom name) for showing, server.name for logic
                const displayName = server.display_name || server.name;

                return (
                  <div
                    key={server.id}
                    className="flex items-center justify-between rounded-lg border border-border bg-card p-3 transition-colors hover:bg-accent/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
                        <McpIcon
                          serverName={server.name}
                          className="size-5 text-primary"
                        />
                      </div>
                      <div>
                        <div className="text-sm font-medium">{displayName}</div>
                        <div className="text-xs text-muted-foreground">MCP</div>
                      </div>
                    </div>
                    <Switch
                      checked={isEnabled}
                      onCheckedChange={(checked) =>
                        handleToggle(server.name, checked)
                      }
                      aria-label={`Toggle ${displayName}`}
                    />
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}

        <div className="flex items-center justify-between border-t border-border pt-4">
          <div className="text-sm text-muted-foreground">
            {t("hero.mcpSelector.selected", {
              count: enabledCount,
              total: totalCount,
            })}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t("hero.mcpSelector.cancel")}
            </Button>
            <Button
              onClick={handleSave}
              disabled={isLoading || installedItems.length === 0}
            >
              {t("hero.mcpSelector.confirm")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
