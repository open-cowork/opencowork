"use client";

import { ArrowLeft, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

import { useT } from "@/lib/i18n/client";
import { Button } from "@/components/ui/button";
import { useAppShell } from "@/components/shared/app-shell-context";

interface EnvVarsHeaderProps {
  onAddClick?: () => void;
}

export function EnvVarsHeader({ onAddClick }: EnvVarsHeaderProps) {
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
          {t("library.envVars.header.title", "Environment Variables")}
        </span>
      </div>

      {/* Right: Action Buttons */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          onClick={onAddClick}
        >
          <Plus className="size-4" />
          {t("library.envVars.header.add", "Add Variable")}
        </Button>
      </div>
    </header>
  );
}
