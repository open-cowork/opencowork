"use client";

import * as React from "react";

import { Coins } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import type { UsageStats } from "@/types";

interface UsageTooltipProps {
  stats: UsageStats;
}

export function UsageTooltip({ stats }: UsageTooltipProps) {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}分${secs}秒`;
  };

  return (
    <Tooltip>
      <TooltipTrigger>
        <div className="flex items-center gap-2 cursor-help">
          <Coins className="size-4 text-amber-500" />
          <span className="font-medium">{stats.credits.toLocaleString()}</span>
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="w-72">
        <div className="space-y-3">
          <div className="font-medium text-sm">
            Credits: {stats.credits.toLocaleString()}
          </div>
          <Separator />
          <div>
            <div className="text-sm font-medium mb-2">本次会话:</div>
            <div className="text-xs space-y-1 text-muted-foreground">
              <div className="flex justify-between">
                <span>Tokens:</span>
                <span className="font-medium text-foreground">
                  {stats.tokensUsed.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span>耗时:</span>
                <span className="font-medium text-foreground">
                  {formatDuration(stats.duration)}
                </span>
              </div>
            </div>
          </div>
          <Separator />
          <div>
            <div className="text-sm font-medium mb-2">使用统计:</div>
            <div className="text-xs space-y-1 text-muted-foreground">
              <div className="flex justify-between">
                <span>今日:</span>
                <span className="font-medium text-foreground">
                  {stats.todayUsage.toLocaleString()} tokens
                </span>
              </div>
              <div className="flex justify-between">
                <span>本周:</span>
                <span className="font-medium text-foreground">
                  {stats.weekUsage.toLocaleString()} tokens
                </span>
              </div>
              <div className="flex justify-between">
                <span>本月:</span>
                <span className="font-medium text-foreground">
                  {stats.monthUsage.toLocaleString()} tokens
                </span>
              </div>
            </div>
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
