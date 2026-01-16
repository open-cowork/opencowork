"use client";

import * as React from "react";

import { useT } from "@/lib/i18n/client";

export function KeyboardHints() {
  const { t } = useT("translation");

  return (
    <div className="mt-4 text-center text-xs text-muted-foreground/60">
      <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]">
        Enter
      </kbd>
      {" " + t("hints.send") + t("hints.separator") + " "}
      <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]">
        Shift + Enter
      </kbd>
      {" " + t("hints.newLine")}
    </div>
  );
}
