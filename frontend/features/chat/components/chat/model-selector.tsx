"use client";

import * as React from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { AVAILABLE_MODELS } from "@/features/home/model/constants";
import type { ModelInfo } from "@/types";

interface ModelSelectorProps {
  model: ModelInfo;
  onChange: (model: ModelInfo) => void;
}

export function ModelSelector({ model, onChange }: ModelSelectorProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="gap-2">
          <span className="text-base">{model.icon}</span>
          <span className="font-medium">{model.name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72">
        {AVAILABLE_MODELS.map((m) => (
          <DropdownMenuItem
            key={m.id}
            onClick={() => onChange(m)}
            className="flex items-start gap-3 p-3"
          >
            <span className="text-xl mt-0.5">{m.icon}</span>
            <div className="flex-1">
              <div className="font-medium">{m.name}</div>
              <div className="text-xs text-muted-foreground">
                {m.description}
              </div>
            </div>
            {m.id === model.id && <div className="text-primary text-sm">✓</div>}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
