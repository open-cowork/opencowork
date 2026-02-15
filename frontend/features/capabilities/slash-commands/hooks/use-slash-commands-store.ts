"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { useT } from "@/lib/i18n/client";
import { slashCommandsService } from "@/features/capabilities/slash-commands/services/slash-commands-service";
import type {
  SlashCommand,
  SlashCommandCreateInput,
  SlashCommandUpdateInput,
} from "@/features/capabilities/slash-commands/types";
import { logger } from "@/lib/logger";

export function useSlashCommandsStore() {
  const { t } = useT("translation");
  const [commands, setCommands] = useState<SlashCommand[]>([]);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await slashCommandsService.list({ revalidate: 0 });
      setCommands(data);
    } catch (error) {
      logger.error("[SlashCommands] Failed to fetch:", error);
      toast.error(t("library.slashCommands.toasts.loadError"));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createCommand = useCallback(
    async (input: SlashCommandCreateInput) => {
      setSavingId(-1);
      try {
        const created = await slashCommandsService.create(input);
        setCommands((prev) => [created, ...prev]);
        toast.success(t("library.slashCommands.toasts.created"));
        return created;
      } catch (error) {
        logger.error("[SlashCommands] create failed:", error);
        toast.error(t("library.slashCommands.toasts.error"));
        return null;
      } finally {
        setSavingId(null);
      }
    },
    [t],
  );

  const updateCommand = useCallback(
    async (commandId: number, input: SlashCommandUpdateInput) => {
      setSavingId(commandId);
      try {
        const updated = await slashCommandsService.update(commandId, input);
        setCommands((prev) =>
          prev.map((c) => (c.id === commandId ? updated : c)),
        );
        toast.success(t("library.slashCommands.toasts.updated"));
        return updated;
      } catch (error) {
        logger.error("[SlashCommands] update failed:", error);
        toast.error(t("library.slashCommands.toasts.error"));
        return null;
      } finally {
        setSavingId(null);
      }
    },
    [t],
  );

  const deleteCommand = useCallback(
    async (commandId: number) => {
      setSavingId(commandId);
      try {
        await slashCommandsService.remove(commandId);
        setCommands((prev) => prev.filter((c) => c.id !== commandId));
        toast.success(t("library.slashCommands.toasts.deleted"));
      } catch (error) {
        logger.error("[SlashCommands] delete failed:", error);
        toast.error(t("library.slashCommands.toasts.error"));
      } finally {
        setSavingId(null);
      }
    },
    [t],
  );

  const setEnabled = useCallback(
    async (commandId: number, enabled: boolean) => {
      // Optimistic update
      setCommands((prev) =>
        prev.map((c) => (c.id === commandId ? { ...c, enabled } : c)),
      );
      const updated = await updateCommand(commandId, { enabled });
      if (!updated) {
        // Rollback
        setCommands((prev) =>
          prev.map((c) =>
            c.id === commandId ? { ...c, enabled: !enabled } : c,
          ),
        );
      }
    },
    [updateCommand],
  );

  return {
    commands,
    isLoading,
    savingId,
    refresh,
    createCommand,
    updateCommand,
    deleteCommand,
    setEnabled,
  };
}
