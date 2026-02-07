"use client";

import { ArrowLeft, RefreshCw, Save, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { useT } from "@/lib/i18n/client";
import { Button } from "@/components/ui/button";
import { useAppShell } from "@/components/shared/app-shell-context";

interface PersonalizationHeaderProps {
  onSave?: () => void;
  onRefresh?: () => void;
  onClear?: () => void;
  isSaving?: boolean;
  isLoading?: boolean;
}

export function PersonalizationHeader({
  onSave,
  onRefresh,
  onClear,
  isSaving,
  isLoading,
}: PersonalizationHeaderProps) {
  const { t } = useT("translation");
  const router = useRouter();
  const { lng } = useAppShell();

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border/50 bg-background/50 px-6 backdrop-blur-sm sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push(`/${lng}/capabilities`)}
          className="mr-2"
        >
          <ArrowLeft className="size-5" />
        </Button>
        <span className="text-lg font-bold tracking-tight">
          {t("library.personalization.header.title", "Personalization")}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          onClick={onRefresh}
          disabled={isLoading || isSaving}
        >
          <RefreshCw className="size-4" />
          {t("library.personalization.header.refresh", "Refresh")}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          onClick={onClear}
          disabled={isLoading || isSaving}
        >
          <Trash2 className="size-4" />
          {t("library.personalization.header.clear", "Clear")}
        </Button>
        <Button
          size="sm"
          className="gap-2"
          onClick={onSave}
          disabled={isLoading || isSaving}
        >
          <Save className="size-4" />
          {isSaving
            ? t("library.personalization.header.saving", "Saving...")
            : t("library.personalization.header.save", "Save")}
        </Button>
      </div>
    </header>
  );
}
