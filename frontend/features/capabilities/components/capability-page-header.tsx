"use client";

import type * as React from "react";
import { ChevronLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCapabilitiesLayoutContext } from "@/features/capabilities/components/capabilities-layout-context";
import { cn } from "@/lib/utils";

interface CapabilityPageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function CapabilityPageHeader({
  title,
  actions,
  className,
}: CapabilityPageHeaderProps) {
  const { isMobileDetail, onMobileBack, mobileBackLabel } =
    useCapabilitiesLayoutContext();

  return (
    <header
      className={cn(
        "sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border/50 bg-background/80 px-4 backdrop-blur-sm sm:px-6 font-serif",
        className,
      )}
    >
      <div className="flex flex-1 items-center gap-2">
        {isMobileDetail && onMobileBack ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="-ml-2 text-muted-foreground"
            onClick={onMobileBack}
            aria-label={mobileBackLabel}
            title={mobileBackLabel}
          >
            <ChevronLeft className="size-4" />
          </Button>
        ) : null}
        <h1 className="truncate text-lg font-semibold tracking-tight">
          {title}
        </h1>
      </div>
      {actions ? (
        <div className="flex min-w-0 items-center justify-end gap-2">
          {actions}
        </div>
      ) : null}
    </header>
  );
}
