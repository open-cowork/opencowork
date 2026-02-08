import * as React from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useT } from "@/lib/i18n/client";

import type { McpDisplayItem } from "@/features/capabilities/mcp/hooks/use-mcp-catalog";
import { CapabilityDialogContent } from "@/features/capabilities/components/capability-dialog-content";

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
      <CapabilityDialogContent
        title={t("mcpSettings.configureServer")}
        size="md"
        bodyClassName="space-y-6 bg-background px-6 py-6"
        footer={
          <DialogFooter className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={onClose} className="w-full">
              {t("common.cancel")}
            </Button>
            <Button
              className="w-full"
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
              {t("common.save")}
            </Button>
          </DialogFooter>
        }
      >
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {t("mcpSettings.mcpName")}{" "}
                <span className="text-destructive">*</span>
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
              {t("mcpSettings.fullJsonConfig")}
            </Label>
            <Textarea
              value={jsonConfig}
              onChange={(e) => setJsonConfig(e.target.value)}
              className="font-mono text-sm bg-muted/50 resize-none p-4 h-[350px]"
              spellCheck={false}
            />
          </div>
        </div>
      </CapabilityDialogContent>
    </Dialog>
  );
}
