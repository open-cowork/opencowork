"use client";

import { ArrowLeft, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

import { useT } from "@/lib/i18n/client";
import { Button } from "@/components/ui/button";

interface McpHeaderProps {
  onOpenSettings?: () => void;
  onAddMcp?: () => void;
}

export function McpHeader({ onAddMcp }: McpHeaderProps) {
  const router = useRouter();
  const { t } = useT("translation");

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border/50 bg-background/50 px-6 backdrop-blur-sm sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/library")}
          className="mr-2"
        >
          <ArrowLeft className="size-5" />
        </Button>
        <span className="text-lg font-bold tracking-tight">
          {t("library.mcpLibrary.header.title", "MCP 服务器管理")}
        </span>
      </div>

      {/* Right: Action Buttons */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" className="gap-2" onClick={onAddMcp}>
          <Plus className="size-4" />
          {t("library.mcpLibrary.header.add", "添加MCP")}
        </Button>
      </div>
    </header>
  );
}
