"use client";

import { Library } from "lucide-react";

import { useT } from "@/lib/i18n/client";
import { Separator } from "@/components/ui/separator";

export function LibraryHeader() {
  const { t } = useT("translation");

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border/50 bg-background/50 px-6 backdrop-blur-sm sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center p-2 rounded-lg bg-muted text-foreground">
          <Library className="size-5" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold tracking-tight">
            {t("library.title")}
          </span>
          <Separator orientation="vertical" className="h-4" />
          <span className="text-sm text-muted-foreground">
            {t("library.subtitle")}
          </span>
        </div>
      </div>
    </header>
  );
}
