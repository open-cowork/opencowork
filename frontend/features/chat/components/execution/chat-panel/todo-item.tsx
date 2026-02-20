"use client";

import * as React from "react";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";
import type { TodoItem as TodoItemType } from "@/features/chat/types";

interface TodoItemProps {
  todo: TodoItemType;
  index: number;
}

export function TodoItem({ todo, index }: TodoItemProps) {
  const getStatusIcon = () => {
    switch (todo.status) {
      case "completed":
        return <CheckCircle2 className="size-4 text-primary flex-shrink-0" />;
      case "in_progress":
        return (
          <Loader2 className="size-4 text-primary flex-shrink-0 animate-spin" />
        );
      default:
        return (
          <Circle className="size-4 text-muted-foreground flex-shrink-0" />
        );
    }
  };

  return (
    <div className="flex items-start gap-2 text-sm">
      <div className="flex-shrink-0 mt-0.5">{getStatusIcon()}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-mono text-muted-foreground mb-0.5">
          {index + 1}.
        </p>
        <p
          className={`text-xs ${
            todo.status === "completed"
              ? "text-muted-foreground line-through"
              : "text-foreground"
          }`}
        >
          {todo.content}
        </p>
        {todo.active_form && todo.status === "in_progress" && (
          <p className="text-xs text-primary mt-0.5 italic">
            {todo.active_form}
          </p>
        )}
      </div>
    </div>
  );
}
