"use client";

import * as React from "react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ModelSelector } from "./model-selector";
import { UsageTooltip } from "./usage-tooltip";
import type { ModelInfo, UsageStats } from "@/types";

// Default usage stats for now
const DEFAULT_USAGE_STATS: UsageStats = {
  credits: 0,
  tokensUsed: 0,
  duration: 0,
  todayUsage: 0,
  weekUsage: 0,
  monthUsage: 0,
};

interface ChatHeaderProps {
  model: ModelInfo;
  onModelChange: (model: ModelInfo) => void;
  title?: string;
}

export function ChatHeader({ model, onModelChange, title }: ChatHeaderProps) {
  const usageStats = React.useMemo(() => DEFAULT_USAGE_STATS, []);

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
      {/* Left side - Model selector and title */}
      <div className="flex items-center gap-4">
        <ModelSelector model={model} onChange={onModelChange} />
        {title && (
          <>
            <div className="h-4 w-px bg-border" />
            <h1 className="text-lg font-medium truncate max-w-md">{title}</h1>
          </>
        )}
      </div>

      {/* Right side - Usage and avatar */}
      <div className="flex items-center gap-4">
        <UsageTooltip stats={usageStats} />
        <Avatar className="size-8">
          <AvatarFallback className="bg-muted text-muted-foreground text-xs font-medium">
            U
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
