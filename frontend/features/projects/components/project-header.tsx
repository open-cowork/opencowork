"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, MoreHorizontal, Settings, Share2 } from "lucide-react";

import { useT } from "@/lib/i18n/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import type { ProjectItem } from "@/features/projects/types";

interface ProjectHeaderProps {
  project: ProjectItem;
}

export function ProjectHeader({ project }: ProjectHeaderProps) {
  const { t } = useT("translation");
  const router = useRouter();

  const handleGoBack = React.useCallback(() => {
    router.push("/home");
  }, [router]);

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b border-sidebar-border px-4 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
      <div className="flex w-full items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleGoBack}
          className="size-8 text-muted-foreground hover:bg-sidebar-accent"
        >
          <ArrowLeft className="size-4" />
        </Button>

        <Separator orientation="vertical" className="mx-2 h-4" />

        <div className="flex flex-1 items-center gap-2">
          <span className="text-base">{project?.icon || "📁"}</span>
          <span className="text-sm font-medium">{project?.name}</span>
        </div>

        <div className="flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-muted-foreground hover:bg-sidebar-accent"
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="right">
              <DropdownMenuItem>
                <Share2 className="size-4" />
                <span>{t("project.share")}</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="size-4" />
                <span>{t("project.settings")}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
