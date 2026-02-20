"use client";

import * as React from "react";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { useT } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

interface PageHeaderShellProps {
  left?: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
  sticky?: boolean;
  hideSidebarTrigger?: boolean;
  mobileLeading?: React.ReactNode;
}

export function PageHeaderShell({
  left,
  right,
  className,
  sticky = true,
  hideSidebarTrigger = false,
  mobileLeading,
}: PageHeaderShellProps) {
  const { t } = useT("translation");

  return (
    <header
      className={cn(
        "flex h-14 min-h-14 shrink-0 items-center justify-between border-b border-border/60 bg-background/90 px-4 sm:px-6 font-serif",
        sticky && "sticky top-0 z-20 backdrop-blur-sm",
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {mobileLeading ? (
          <div className="md:hidden">{mobileLeading}</div>
        ) : !hideSidebarTrigger ? (
          <SidebarTrigger
            className="md:hidden text-muted-foreground"
            aria-label={t("sidebar.openMain")}
          />
        ) : null}
        {left}
      </div>
      {right ? <div className="flex items-center gap-2">{right}</div> : null}
    </header>
  );
}
