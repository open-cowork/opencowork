"use client";

import * as React from "react";
import { Loader2, Plus, Save } from "lucide-react";

import { useT } from "@/lib/i18n/client";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type {
  SubAgent,
  SubAgentCreateInput,
  SubAgentMode,
  SubAgentUpdateInput,
} from "@/features/sub-agents/types";

export type SubAgentDialogMode = "create" | "edit";

interface SubAgentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: SubAgentDialogMode;
  initialAgent?: SubAgent | null;
  isSaving?: boolean;
  onCreate: (input: SubAgentCreateInput) => Promise<SubAgent | null>;
  onUpdate: (
    subAgentId: number,
    input: SubAgentUpdateInput,
  ) => Promise<SubAgent | null>;
}

function parseTools(raw: string): string[] | null {
  const list = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return list.length > 0 ? list : null;
}

export function SubAgentDialog({
  open,
  onOpenChange,
  mode,
  initialAgent,
  isSaving = false,
  onCreate,
  onUpdate,
}: SubAgentDialogProps) {
  const { t } = useT("translation");

  const [name, setName] = React.useState("");
  const [enabled, setEnabled] = React.useState(true);
  const [agentMode, setAgentMode] = React.useState<SubAgentMode>("structured");

  const [description, setDescription] = React.useState("");
  const [tools, setTools] = React.useState("");
  const [prompt, setPrompt] = React.useState("");
  const [rawMarkdown, setRawMarkdown] = React.useState("");

  React.useEffect(() => {
    if (!open) return;

    if (mode === "edit" && initialAgent) {
      setName(initialAgent.name || "");
      setEnabled(Boolean(initialAgent.enabled));
      setAgentMode(initialAgent.mode || "structured");
      setDescription(initialAgent.description || "");
      setTools(
        Array.isArray(initialAgent.tools) ? initialAgent.tools.join(", ") : "",
      );
      setPrompt(initialAgent.prompt || "");
      setRawMarkdown(initialAgent.raw_markdown || "");
      return;
    }

    setName("");
    setEnabled(true);
    setAgentMode("structured");
    setDescription("");
    setTools("");
    setPrompt("");
    setRawMarkdown("");
  }, [open, mode, initialAgent]);

  const title =
    mode === "create"
      ? t("library.subAgents.dialog.createTitle", "New Sub-agent")
      : t("library.subAgents.dialog.editTitle", "Edit Sub-agent");

  const isValid =
    Boolean(name.trim()) &&
    (agentMode === "raw"
      ? Boolean(rawMarkdown.trim())
      : Boolean(description.trim()) && Boolean(prompt.trim()));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) return;

    const toolsValue = parseTools(tools);

    if (mode === "create") {
      const created = await onCreate({
        name: trimmedName,
        enabled,
        mode: agentMode,
        ...(agentMode === "raw"
          ? {
              description: description.trim() ? description.trim() : null,
              raw_markdown: rawMarkdown,
            }
          : {
              description: description,
              prompt,
              tools: toolsValue,
            }),
      });
      if (created) onOpenChange(false);
      return;
    }

    if (!initialAgent) return;
    const updated = await onUpdate(initialAgent.id, {
      name: trimmedName,
      enabled,
      mode: agentMode,
      ...(agentMode === "raw"
        ? {
            description: description.trim() ? description.trim() : null,
            raw_markdown: rawMarkdown,
          }
        : {
            description,
            prompt,
            tools: toolsValue,
          }),
    });
    if (updated) onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="subagent-name">
                  {t("library.subAgents.fields.name", "Name")}
                </Label>
                <Input
                  id="subagent-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t(
                    "library.subAgents.fields.namePlaceholder",
                    "code-reviewer",
                  )}
                  disabled={isSaving}
                  className="font-mono"
                />
              </div>

              <div className="space-y-2">
                <Label>{t("library.subAgents.fields.enabled", "Enabled")}</Label>
                <div className="flex items-center gap-3 rounded-md border border-border px-3 py-2">
                  <Switch
                    checked={enabled}
                    onCheckedChange={setEnabled}
                    disabled={isSaving}
                  />
                  <span className="text-sm text-muted-foreground">
                    {enabled
                      ? t("common.enabled", "Enabled")
                      : t("common.disabled", "Disabled")}
                  </span>
                </div>
              </div>
            </div>

            <Tabs
              value={agentMode}
              onValueChange={(v) => setAgentMode(v as SubAgentMode)}
            >
              <TabsList>
                <TabsTrigger value="structured">
                  {t("library.subAgents.mode.structured", "Structured")}
                </TabsTrigger>
                <TabsTrigger value="raw">
                  {t("library.subAgents.mode.raw", "Markdown")}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="structured">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="subagent-description">
                      {t("library.subAgents.fields.description", "Description")}
                    </Label>
                    <Input
                      id="subagent-description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder={t(
                        "library.subAgents.fields.descriptionPlaceholder",
                        "For quality, safety, and maintainability reviews.",
                      )}
                      disabled={isSaving}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subagent-tools">
                      {t("library.subAgents.fields.tools", "Tool Restrictions")}
                    </Label>
                    <Input
                      id="subagent-tools"
                      value={tools}
                      onChange={(e) => setTools(e.target.value)}
                      placeholder={t(
                        "library.subAgents.fields.toolsPlaceholder",
                        "Read, Grep, Glob",
                      )}
                      disabled={isSaving}
                      className="font-mono"
                    />
                    <p className="text-xs text-muted-foreground">
                      {t(
                        "library.subAgents.fields.toolsHint",
                        "Leave blank to inherit all available tools.",
                      )}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subagent-prompt">
                      {t("library.subAgents.fields.prompt", "System Prompt")}
                    </Label>
                    <Textarea
                      id="subagent-prompt"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder={t(
                        "library.subAgents.fields.promptPlaceholder",
                        "You are a code review expert...",
                      )}
                      disabled={isSaving}
                      className="min-h-[220px]"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="raw">
                <div className="space-y-2">
                  <Label htmlFor="subagent-raw">
                    {t("library.subAgents.fields.rawMarkdown", "Markdown Content")}
                  </Label>
                  <Textarea
                    id="subagent-raw"
                    value={rawMarkdown}
                    onChange={(e) => setRawMarkdown(e.target.value)}
                    placeholder={t(
                      "library.subAgents.fields.rawMarkdownPlaceholder",
                      "Paste the full .md here (must include YAML front matter and match the name above)",
                    )}
                    disabled={isSaving}
                    className="min-h-[260px] font-mono"
                  />
                  <p className="text-xs text-muted-foreground">
                    {t(
                      "library.subAgents.fields.rawMarkdownHint",
                      "Tip: raw mode writes a file to ~/.claude/agents and the SDK auto-loads it.",
                    )}
                  </p>

                  <div className="space-y-2 pt-2">
                    <Label htmlFor="subagent-raw-description">
                      {t(
                        "library.subAgents.fields.descriptionOptional",
                        "Description (optional)",
                      )}
                    </Label>
                    <Input
                      id="subagent-raw-description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder={t(
                        "library.subAgents.fields.descriptionPlaceholder",
                        "For quality, safety, and maintainability reviews.",
                      )}
                      disabled={isSaving}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={!isValid || isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  {t("common.saving", "Saving")}
                </>
              ) : (
                <>
                  {mode === "create" ? (
                    <Plus className="mr-2 size-4" />
                  ) : (
                    <Save className="mr-2 size-4" />
                  )}
                  {mode === "create"
                    ? t("common.create", "Create")
                    : t("common.save", "Save")}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
