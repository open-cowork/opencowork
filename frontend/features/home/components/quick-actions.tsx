"use client";

import * as React from "react";

import { useT } from "@/lib/i18n/client";
import { Button } from "@/components/ui/button";

import { QUICK_ACTIONS } from "../model/constants";

export function QuickActions({ onPick }: { onPick: (prompt: string) => void }) {
  const { t } = useT("translation");

  return (
    <div className="mt-5 flex flex-wrap justify-center gap-2">
      {QUICK_ACTIONS.map(({ id, labelKey, icon: Icon }) => (
        <Button
          key={id}
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 rounded-full border border-border bg-card px-3 text-sm text-muted-foreground shadow-sm transition-all hover:bg-accent hover:text-foreground hover:shadow"
          onClick={() => onPick(t(labelKey))}
        >
          <Icon className="mr-1.5 size-3.5" />
          {t(labelKey)}
        </Button>
      ))}
    </div>
  );
}
