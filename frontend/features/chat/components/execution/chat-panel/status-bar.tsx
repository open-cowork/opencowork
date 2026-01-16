"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Zap, Server, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { SkillUse, McpStatusItem } from "@/features/chat/types";

interface StatusBarProps {
  skills?: SkillUse[];
  mcpStatuses?: McpStatusItem[];
}

export function StatusBar({ skills = [], mcpStatuses = [] }: StatusBarProps) {
  const hasSkills = skills.length > 0;
  const hasMcp = mcpStatuses.length > 0;

  if (!hasSkills && !hasMcp) {
    return null;
  }

  const getSkillStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="size-3 text-foreground" />;
      case "failed":
        return <XCircle className="size-3 text-muted-foreground/60" />;
      default:
        return <AlertCircle className="size-3 text-muted-foreground/80" />;
    }
  };

  const getMcpStatusIcon = (status: string) => {
    switch (status) {
      case "connected":
        return <CheckCircle2 className="size-3 text-foreground" />;
      case "disconnected":
        return <XCircle className="size-3 text-muted-foreground/60" />;
      default:
        return <AlertCircle className="size-3 text-muted-foreground/80" />;
    }
  };

  return (
    <div className="flex items-center gap-2 px-4 py-2.5 border-t border-border bg-muted/20">
      <TooltipProvider delayDuration={200}>
        {/* Skills Card */}
        {hasSkills && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border/60 hover:border-border hover:shadow-sm transition-all cursor-pointer group">
                <Zap className="size-3.5 text-foreground group-hover:text-foreground/80 transition-colors" />
                <span className="text-xs font-medium text-foreground">
                  技能使用
                </span>
                <Badge
                  variant="secondary"
                  className="text-xs h-5 px-1.5 bg-muted text-foreground"
                >
                  {skills.length}
                </Badge>
              </div>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              className="p-2 bg-card border-border shadow-lg"
              sideOffset={8}
            >
              <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                {skills.map((skill) => (
                  <div
                    key={skill.id}
                    className="flex items-center gap-2 text-sm px-1"
                  >
                    {getSkillStatusIcon(skill.status)}
                    <span className="text-foreground">{skill.name}</span>
                  </div>
                ))}
              </div>
            </TooltipContent>
          </Tooltip>
        )}

        {/* MCP Card */}
        {hasMcp && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border/60 hover:border-border hover:shadow-sm transition-all cursor-pointer group">
                <Server className="size-3.5 text-foreground group-hover:text-foreground/80 transition-colors" />
                <span className="text-xs font-medium text-foreground">
                  MCP 服务器
                </span>
                <Badge
                  variant="secondary"
                  className="text-xs h-5 px-1.5 bg-muted text-foreground"
                >
                  {mcpStatuses.length}
                </Badge>
              </div>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              className="p-2 bg-card border-border shadow-lg"
              sideOffset={8}
            >
              <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                {mcpStatuses.map((mcp, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 text-sm px-1"
                  >
                    {getMcpStatusIcon(mcp.status)}
                    <span className="text-foreground font-mono">
                      {mcp.server_name}
                    </span>
                  </div>
                ))}
              </div>
            </TooltipContent>
          </Tooltip>
        )}
      </TooltipProvider>
    </div>
  );
}
