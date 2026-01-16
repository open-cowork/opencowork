"use client";

import * as React from "react";
import { ChevronDown, Coins } from "lucide-react";

import { useT } from "@/lib/i18n/client";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { CreditsPopover } from "./credits-popover";
import { UserMenu } from "@/features/user/components/user-menu";

import { useUserAccount } from "@/features/user/hooks/use-user-account";

interface HomeHeaderProps {
  onOpenSettings?: () => void;
}

export function HomeHeader({ onOpenSettings }: HomeHeaderProps) {
  const { t } = useT("translation");
  const { credits, isLoading } = useUserAccount();

  return (
    <header className="flex h-12 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="md:hidden" />
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1 px-2 text-sm font-medium"
          title={t("header.switchWorkspace")}
        >
          {t("header.workspace")}
          <ChevronDown className="size-3.5 text-muted-foreground" />
        </Button>
      </div>
      <div className="flex items-center gap-1">
        <CreditsPopover
          trigger={
            <Button
              variant="ghost"
              size="sm"
              className="mx-1 h-8 gap-1.5 rounded-full border border-primary/10 bg-primary/5 px-3 text-sm font-medium text-primary hover:bg-primary/10 hover:text-primary"
            >
              <Coins className="size-3.5" />
              <span>
                {isLoading ? "..." : credits?.total?.toLocaleString()}
              </span>
            </Button>
          }
        />
        <UserMenu
          onOpenSettings={() => {
            if (onOpenSettings) onOpenSettings();
          }}
        />
      </div>
    </header>
  );
}
