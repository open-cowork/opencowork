import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useT } from "@/lib/i18n/client";

import type { McpDisplayItem } from "@/features/mcp/hooks/use-mcp-catalog";

interface McpSettingsDialogProps {
  item: McpDisplayItem | null;
  open: boolean;
  isNew?: boolean;
  onClose: () => void;
  onSave: (payload: {
    serverId?: number;
    name?: string;
    serverConfig: Record<string, unknown>;
  }) => Promise<void> | void;
}

export function McpSettingsDialog({
  item,
  open,
  isNew = false,
  onClose,
  onSave,
}: McpSettingsDialogProps) {
  const { t } = useT("translation");
  const [jsonConfig, setJsonConfig] = React.useState("{}");
  const [name, setName] = React.useState("");

  React.useEffect(() => {
    if (item) {
      const configObj = item.server.server_config || {};
      setJsonConfig(JSON.stringify(configObj, null, 2));
      setName(item.server.name || "");
    } else if (isNew) {
      setJsonConfig("{}");
      setName("");
    }
  }, [item, isNew]);

  if (!item && !isNew) {
    return (
      <Dialog open={false} onOpenChange={onClose}>
        <DialogContent />
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b bg-muted/5">
          <DialogTitle className="text-lg font-semibold">
            {t("library.mcpLibrary.actions.configure", "Configure MCP Server")}
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 bg-background space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                MCP Name <span className="text-destructive">*</span>
              </Label>
              <Input
                value={name}
                disabled={!isNew}
                onChange={(e) => setName(e.target.value)}
                className="bg-muted/50 font-mono text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Full JSON Configuration
            </Label>
            <Textarea
              value={jsonConfig}
              onChange={(e) => setJsonConfig(e.target.value)}
              className="font-mono text-sm bg-muted/50 resize-none p-4 h-[350px]"
              spellCheck={false}
            />
          </div>
        </div>
        <DialogFooter className="px-6 py-4 border-t">
          <Button variant="outline" onClick={onClose}>
            {t("common.cancel", "Cancel")}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              try {
                const parsed = JSON.parse(jsonConfig);
                const trimmedName = name.trim();
                if (isNew && !trimmedName) {
                  throw new Error("Name required");
                }
                onSave({
                  serverId: item?.server.id,
                  name: trimmedName,
                  serverConfig: parsed,
                });
                onClose();
              } catch {
                console.error("Invalid JSON or name");
              }
            }}
          >
            {t("common.save", "Save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
