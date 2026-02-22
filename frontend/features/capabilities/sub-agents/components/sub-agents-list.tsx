"use client";

import * as React from "react";
import { Settings, Trash2 } from "lucide-react";

import { useT } from "@/lib/i18n/client";
import type { SubAgent } from "@/features/capabilities/sub-agents/types";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SkeletonShimmer } from "@/components/ui/skeleton-shimmer";
import { StaggeredList } from "@/components/ui/staggered-entrance";
import { CapabilityCreateCard } from "@/features/capabilities/components/capability-create-card";
import { CapabilitySourceAvatar } from "@/features/capabilities/components/capability-source-avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface SubAgentsListProps {
  subAgents: SubAgent[];
  savingId?: number | null;
  isLoading?: boolean;
  onToggleEnabled?: (subAgentId: number, enabled: boolean) => void;
  onEdit?: (subAgent: SubAgent) => void;
  onDelete?: (subAgent: SubAgent) => void;
  createCardLabel?: string;
  onCreate?: () => void;
  toolbarSlot?: React.ReactNode;
}

export function SubAgentsList({
  subAgents,
  savingId,
  isLoading = false,
  onToggleEnabled,
  onEdit,
  onDelete,
  createCardLabel,
  onCreate,
  toolbarSlot,
}: SubAgentsListProps) {
  const { t } = useT("translation");
  const hoverActionsClass =
    "flex items-center gap-2 transition-opacity md:opacity-0 md:pointer-events-none md:group-hover:opacity-100 md:group-hover:pointer-events-auto";
  const enabledCount = subAgents.filter((a) => a.enabled).length;
  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-muted/50 px-5 py-3 flex flex-wrap items-center gap-3 md:flex-nowrap md:justify-between">
        <span className="text-sm text-muted-foreground">
          {t("library.subAgents.enabled")}: {enabledCount}
        </span>
        {toolbarSlot ? (
          <div className="flex flex-1 flex-nowrap items-center justify-end gap-2 overflow-x-auto">
            {toolbarSlot}
          </div>
        ) : null}
      </div>

      <div className="space-y-3">
        {createCardLabel ? (
          <CapabilityCreateCard label={createCardLabel} onClick={onCreate} />
        ) : null}

        {isLoading && subAgents.length === 0 ? (
          <SkeletonShimmer count={5} itemClassName="min-h-[64px]" gap="md" />
        ) : subAgents.length === 0 ? (
          <div className="rounded-xl border border-border/50 bg-muted/10 px-4 py-6 text-sm text-muted-foreground text-center">
            {t("library.subAgents.empty")}
          </div>
        ) : (
          <StaggeredList
            items={subAgents}
            show={!isLoading}
            keyExtractor={(a) => a.id}
            staggerDelay={50}
            duration={400}
            renderItem={(agent) => {
              const busy = savingId === agent.id;
              const modeLabel =
                agent.mode === "structured"
                  ? t("library.subAgents.mode.structured")
                  : t("library.subAgents.mode.raw");
              const toolsLabel =
                Array.isArray(agent.tools) && agent.tools.length > 0
                  ? agent.tools.join(", ")
                  : "";

              return (
                <div className="group flex items-center gap-4 rounded-xl border border-border/70 bg-card px-4 py-3 min-h-[64px]">
                  <CapabilitySourceAvatar
                    name={agent.name}
                    source={agent.source}
                    status={agent.enabled ? "active" : "inactive"}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium font-mono">
                        {agent.name}
                      </span>
                      <Badge
                        variant="outline"
                        className="text-xs text-muted-foreground"
                      >
                        {modeLabel}
                      </Badge>
                    </div>
                    {agent.description ? (
                      <p className="text-sm text-muted-foreground truncate">
                        {agent.description}
                      </p>
                    ) : null}
                    {toolsLabel ? (
                      <p className="text-xs text-muted-foreground font-mono mt-1 truncate">
                        {toolsLabel}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className={hoverActionsClass}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => onEdit?.(agent)}
                        disabled={busy}
                        title={t("common.edit")}
                      >
                        <Settings className="size-4" />
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            disabled={busy}
                            title={t("common.delete")}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              {t("library.subAgents.delete.title")}
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              {t("library.subAgents.delete.description")}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>
                              {t("common.cancel")}
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => onDelete?.(agent)}
                            >
                              {t("common.delete")}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                    <Switch
                      checked={agent.enabled}
                      onCheckedChange={(checked) =>
                        onToggleEnabled?.(agent.id, checked)
                      }
                      disabled={busy}
                    />
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
