"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Loader2, XCircle, Clock, Zap } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import type { SkillUse } from "@/features/chat/types";

interface SkillUsageCardProps {
  skills: SkillUse[];
}

export function SkillUsageCard({ skills }: SkillUsageCardProps) {
  const { t } = useT("translation");

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="size-3 text-success" />;
      case "failed":
        return <XCircle className="size-3 text-destructive" />;
      case "running":
        return (
          <Loader2 className="size-3 text-muted-foreground animate-spin" />
        );
      default:
        return <Clock className="size-3 text-muted-foreground" />;
    }
  };

  const getStatusVariant = (
    status: string,
  ): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "completed":
        return "outline";
      case "failed":
        return "destructive";
      case "running":
        return "default";
      default:
        return "secondary";
    }
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return "-";
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <Card className="overflow-hidden flex flex-col h-full">
      <CardHeader className="py-3 px-4 shrink-0">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Zap className="size-4 text-foreground" />
          <span className="flex-1">Skill Usage</span>
          <Badge variant="outline" className="text-xs">
            {skills.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0">
        <ScrollArea className="max-h-[180px]">
          <div className="space-y-2 pr-2">
            {skills.map((skill) => (
              <div
                key={skill.id}
                className="flex items-center gap-2 text-xs p-2 rounded-md bg-muted/50 shrink-0"
              >
                <div className="flex-shrink-0">
                  {getStatusIcon(skill.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{skill.name}</p>
                  <p className="text-muted-foreground truncate text-xs">
                    {skill.description}
                  </p>
                </div>
                <div className="flex-shrink-0 text-right">
                  <Badge
                    variant={getStatusVariant(skill.status)}
                    className="text-xs block mb-1"
                  >
                    {t(`status.${skill.status}`)}
                  </Badge>
                  <p className="text-xs text-muted-foreground">
                    {formatDuration(skill.duration)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
