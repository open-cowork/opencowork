"use client";

import * as React from "react";

import { DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type BaseDialogContentProps = Omit<
  React.ComponentPropsWithoutRef<typeof DialogContent>,
  "title"
>;

type DialogContentCSSVars = React.CSSProperties & {
  "--dialog-mobile-max-h"?: string;
  "--dialog-desktop-max-h"?: string;
  "--dialog-mobile-max"?: string;
  "--dialog-max-w"?: string;
};

interface CapabilityDialogContentProps extends BaseDialogContentProps {
  title: React.ReactNode;
  size?: "sm" | "md" | "lg";
  description?: React.ReactNode;
  bodyClassName?: string;
  headerClassName?: string;
  footer?: React.ReactNode;
  maxHeight?: string;
  desktopMaxHeight?: string;
  maxWidth?: string;
}

export function CapabilityDialogContent({
  title,
  description,
  size = "md",
  className,
  bodyClassName,
  headerClassName,
  footer,
  maxHeight,
  desktopMaxHeight,
  maxWidth,
  style,
  children,
  ...props
}: CapabilityDialogContentProps) {
  const resolvedMobileMaxHeight = maxHeight ?? "60dvh";
  const resolvedDesktopMaxHeight = desktopMaxHeight ?? resolvedMobileMaxHeight;
  const resolvedMaxWidth =
    maxWidth ?? (size === "sm" ? "32rem" : size === "lg" ? "64rem" : "56rem");

  const contentClassName = cn(
    "capability-dialog flex w-auto min-w-0 flex-col overflow-hidden rounded-2xl border bg-background p-0 shadow-xl",
    !(resolvedMobileMaxHeight === "none" && resolvedDesktopMaxHeight === "none")
      ? "max-h-[var(--dialog-mobile-max-h)] sm:max-h-[var(--dialog-desktop-max-h)]"
      : undefined,
    className,
  );

  const styleVars: DialogContentCSSVars = {
    ...(style as DialogContentCSSVars),
    "--dialog-mobile-max-h": resolvedMobileMaxHeight,
    "--dialog-desktop-max-h": resolvedDesktopMaxHeight,
    "--dialog-mobile-max": "80dvw",
    "--dialog-max-w": resolvedMaxWidth,
    width: "auto",
    maxWidth: "min(80dvw, var(--dialog-max-w))",
  };

  return (
    <DialogContent
      showCloseButton={false}
      className={contentClassName}
      style={styleVars}
      {...props}
    >
      <div
        className={cn(
          "sticky top-0 z-10 flex items-center justify-center border-b border-border/60 bg-background/95 px-4 py-3",
          headerClassName,
        )}
      >
        <DialogTitle className="text-base font-semibold leading-tight text-center">
          {title}
          {description ? (
            <span className="mt-1 block text-xs font-normal text-muted-foreground">
              {description}
            </span>
          ) : null}
        </DialogTitle>
      </div>

      <div className={cn("flex-1 overflow-y-auto px-4 py-4", bodyClassName)}>
        {children}
      </div>

      {footer ? (
        <div className="border-t border-border/60 bg-background/95 px-4 py-3 sm:px-6">
          {footer}
        </div>
      ) : null}
    </DialogContent>
  );
}
