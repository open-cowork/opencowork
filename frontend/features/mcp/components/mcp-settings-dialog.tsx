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

import type { McpDisplayItem } from "@/features/mcp/hooks/use-mcp-library";
import type { EnvVar } from "@/features/env-vars/types";
import type { EnvVarUpsertInput } from "@/features/env-vars/hooks/use-env-vars-store";

interface McpSettingsDialogProps {
  item: McpDisplayItem | null;
  open: boolean;
  onClose: () => void;
  onTogglePreset: (presetId: number) => void;
  envVars: EnvVar[];
  savingEnvKey?: string | null;
  onSaveEnvVar: (input: EnvVarUpsertInput) => Promise<void> | void;
  loadingPresetId?: number | null;
}

export function McpSettingsDialog({
  item,
  open,
  onClose,
}: McpSettingsDialogProps) {
  const { t } = useT("translation");
  const [jsonConfig, setJsonConfig] = React.useState("");

  React.useEffect(() => {
    if (item) {
      // Construct a representative config object
      const configObj = {
        type: item.preset.transport || "stdio",
        command: item.preset.name || "",
        args: [],
        env: item.config?.overrides || item.preset.default_config || {},
      };
      setJsonConfig(JSON.stringify(configObj, null, 2));
    }
  }, [item]);

  if (!item) {
    return (
      <Dialog open={false} onOpenChange={onClose}>
        <DialogContent />
      </Dialog>
    );
  }

  const { preset } = item;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden h-[600px] flex flex-col">
        <DialogHeader className="px-6 py-4 border-b flex-shrink-0 bg-muted/5">
          <DialogTitle className="text-lg font-semibold">
            {t("library.mcpLibrary.actions.configure", "配置 MCP 服务器")}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 bg-background space-y-6">
          {/* Name Fields Section */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                MCP 标题 (唯一) <span className="text-destructive">*</span>
              </Label>
              <Input
                value={preset.name}
                disabled
                className="bg-muted/50 font-mono text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                显示名称
              </Label>
              <Input
                defaultValue={preset.display_name || preset.name}
                // TODO: Implement display name editing
                readOnly
                className="bg-muted/50"
              />
            </div>
          </div>

          {/* JSON Config Section */}
          <div className="space-y-2 flex-1 flex flex-col min-h-[300px]">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              完整的 JSON 配置
            </Label>
            <Textarea
              value={jsonConfig}
              onChange={(e) => setJsonConfig(e.target.value)}
              className="font-mono text-sm flex-1 bg-muted/50 resize-none p-4"
              spellCheck={false}
            />
          </div>
        </div>
        <DialogFooter className="px-6 py-4 border-t flex-shrink-0">
          <Button variant="outline" onClick={onClose}>
            {t("common.cancel", "取消")}
          </Button>
          <Button
            onClick={() => {
              try {
                const parsed = JSON.parse(jsonConfig);
                console.log("Saving config:", parsed);
                // TODO: Implement save logic
                onClose();
              } catch {
                // TODO: Show error
                console.error("Invalid JSON");
              }
            }}
          >
            {t("common.save", "保存")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
