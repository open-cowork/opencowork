"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { useT } from "@/lib/i18n/client";
import { envVarsService } from "@/features/env-vars/services/env-vars-service";
import type { EnvVar } from "@/features/env-vars/types";

export interface EnvVarUpsertInput {
  key: string;
  value: string;
  isSecret?: boolean;
  description?: string | null;
  scope?: string | null;
}

export function useEnvVarsStore() {
  const { t } = useT("translation");
  const [envVars, setEnvVars] = useState<EnvVar[]>([]);
  const [savingEnvKey, setSavingEnvKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const data = await envVarsService.list({ includeSecrets: true });
        setEnvVars(data);
      } catch (error) {
        console.error("[EnvVars] Failed to fetch:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const upsertEnvVar = useCallback(
    async ({ key, value, isSecret, description, scope }: EnvVarUpsertInput) => {
      const normalizedKey = key.trim();
      if (!normalizedKey) {
        toast.error(t("library.envVars.toasts.keyRequired"));
        return;
      }

      setSavingEnvKey(normalizedKey);

      try {
        const existing = envVars.find((item) => item.key === normalizedKey);
        if (existing) {
          const updated = await envVarsService.update(existing.id, {
            value,
            is_secret: isSecret ?? existing.is_secret,
            description: description ?? existing.description,
            scope: scope ?? existing.scope,
          });
          setEnvVars((prev) =>
            prev.map((item) => (item.id === existing.id ? updated : item)),
          );
          toast.success(t("library.envVars.toasts.updated"));
        } else {
          const created = await envVarsService.create({
            key: normalizedKey,
            value,
            is_secret: isSecret ?? true,
            description: description ?? undefined,
            scope: scope ?? undefined,
          });
          setEnvVars((prev) => [...prev, created]);
          toast.success(t("library.envVars.toasts.created"));
        }
      } catch (error) {
        console.error("[EnvVars] upsert failed", error);
        toast.error(t("library.envVars.toasts.error"));
      } finally {
        setSavingEnvKey(null);
      }
    },
    [envVars, t],
  );

  const removeEnvVar = useCallback(
    async (envVarId: number) => {
      try {
        await envVarsService.remove(envVarId);
        setEnvVars((prev) => prev.filter((item) => item.id !== envVarId));
        toast.success(t("library.envVars.toasts.deleted"));
      } catch (error) {
        console.error("[EnvVars] remove failed", error);
        toast.error(t("library.envVars.toasts.error"));
      }
    },
    [t],
  );

  const refreshEnvVars = useCallback(async () => {
    try {
      const latest = await envVarsService.list({ includeSecrets: true });
      setEnvVars(latest);
      toast.success(t("library.envVars.toasts.refreshed"));
    } catch (error) {
      console.error("[EnvVars] refresh failed", error);
      toast.error(t("library.envVars.toasts.error"));
    }
  }, [t]);

  return {
    envVars,
    isLoading,
    upsertEnvVar,
    removeEnvVar,
    savingEnvKey,
    refreshEnvVars,
  };
}
