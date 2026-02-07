"use client";

import { ArrowLeft, Plus } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

import { useT } from "@/lib/i18n/client";
import { Button } from "@/components/ui/button";
import { useAppShell } from "@/components/shared/app-shell-context";
import { HeaderSearchInput } from "@/components/shared/header-search-input";

interface McpHeaderProps {
  onOpenSettings?: () => void;
  onAddMcp?: () => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

export function McpHeader({
  onAddMcp,
  searchQuery,
  onSearchChange,
}: McpHeaderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useT("translation");
  const { lng } = useAppShell();

  const fromHome = searchParams.get("from") === "home";
  const backPath = fromHome ? `/${lng}/home` : `/${lng}/capabilities`;

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border/50 bg-background/50 px-6 backdrop-blur-sm sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push(backPath)}
          className="mr-2"
        >
          <ArrowLeft className="size-5" />
        </Button>
        <span className="text-lg font-bold tracking-tight">
          {t("library.mcpLibrary.header.title", "MCP Server Management")}
        </span>
      </div>

      {/* Right: Action Buttons */}
      <div className="flex items-center gap-2">
        <HeaderSearchInput
          value={searchQuery}
          onChange={onSearchChange}
          placeholder={t(
            "library.mcpLibrary.searchPlaceholder",
            "Search servers...",
          )}
        />
        <Button variant="ghost" size="sm" className="gap-2" onClick={onAddMcp}>
          <Plus className="size-4" />
          {t("library.mcpLibrary.header.add", "Add MCP")}
        </Button>
      </div>
    </header>
  );
}
