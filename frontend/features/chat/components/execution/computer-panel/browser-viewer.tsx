"use client";

import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/client";

type BrowserViewerProps = {
  isDone: boolean;
  toolUseId: string | null;
  screenshotUrl?: string | null;
};

function ViewerSkeleton({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex h-full w-full items-center justify-center p-4",
        className,
      )}
    >
      <div className="h-full w-full max-w-[960px] rounded-lg skeleton-shimmer" />
      <span className="sr-only">{label}</span>
    </div>
  );
}

export function BrowserViewer({
  isDone,
  toolUseId,
  screenshotUrl,
}: BrowserViewerProps) {
  const { t } = useT("translation");

  if (!isDone) {
    return (
      <ViewerSkeleton
        label={t("computer.terminal.running")}
        className="bg-muted/30"
      />
    );
  }

  if (!toolUseId) {
    return (
      <div className="h-full w-full bg-muted/30 flex items-center justify-center">
        <div className="text-sm text-muted-foreground">
          {t("computer.browser.screenshotUnavailable")}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full min-h-0 min-w-0 items-center justify-center overflow-hidden bg-muted/30">
      {screenshotUrl ? (
        <div className="flex h-full w-full min-h-0 min-w-0 items-center justify-center p-2 sm:p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={screenshotUrl}
            alt={t("computer.browser.screenshotAlt")}
            className="block max-h-full max-w-full min-h-0 min-w-0 object-contain"
          />
        </div>
      ) : screenshotUrl === null ? (
        <div className="text-sm text-muted-foreground">
          {t("computer.browser.screenshotUnavailable")}
        </div>
      ) : (
        <ViewerSkeleton label={t("computer.browser.screenshotLoading")} />
      )}
    </div>
  );
}
