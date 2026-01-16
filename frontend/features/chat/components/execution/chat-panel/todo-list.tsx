"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import type { TodoItem as TodoItemType } from "@/features/chat/types";

interface TodoListProps {
  todos: TodoItemType[];
  progress?: number;
  currentStep?: string;
}

export function TodoList({ todos, progress = 0, currentStep }: TodoListProps) {
  const { t } = useT("translation");

  const completedCount = todos.filter(
    (todo) => todo.status === "completed",
  ).length;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="py-2.5 px-4">
        <div className="space-y-1.5">
          {/* Title with icon and count */}
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <CheckCircle2 className="size-4 text-foreground" />
            <span className="flex-1">
              {t("todo.title")}
              {currentStep && (
                <span className="ml-2 text-xs font-normal text-muted-foreground/70">
                  - {currentStep}
                </span>
              )}
            </span>
            <span className="text-xs text-muted-foreground font-normal">
              {completedCount}/{todos.length} {progress}%
            </span>
          </CardTitle>

          {/* Progress bar */}
          <Progress value={progress} className="h-1" />
        </div>
      </CardHeader>

      {/* Todo items - auto height */}
      <CardContent className="px-4 pb-3 pt-0">
        <div className="grid grid-cols-3 gap-x-4 gap-y-1.5">
          {todos.map((todo, index) => {
            const isCompleted = todo.status === "completed";
            return (
              <div
                key={index}
                className="flex items-center gap-1.5 text-xs text-foreground/80"
              >
                {isCompleted ? (
                  <CheckCircle2 className="size-3.5 text-foreground shrink-0" />
                ) : (
                  <Circle className="size-3.5 text-muted-foreground shrink-0" />
                )}
                <span className="truncate">{todo.content}</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
