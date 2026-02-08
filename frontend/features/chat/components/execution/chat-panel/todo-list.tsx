"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, ChevronDown, ChevronUp, Circle } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import { useIsMobile } from "@/hooks/use-mobile";
import type { TodoItem as TodoItemType } from "@/features/chat/types";

interface TodoListProps {
  todos: TodoItemType[];
  progress?: number;
  currentStep?: string;
}

export function TodoList({ todos, progress = 0, currentStep }: TodoListProps) {
  const { t } = useT("translation");
  const isMobile = useIsMobile();
  const [isExpanded, setIsExpanded] = React.useState(true);
  const todoListRef = React.useRef<HTMLDivElement | null>(null);

  const completedCount = todos.filter(
    (todo) => todo.status === "completed",
  ).length;
  const derivedProgress =
    progress > 0
      ? progress
      : todos.length > 0
        ? Math.round((completedCount / todos.length) * 100)
        : 0;

  React.useEffect(() => {
    if (!isExpanded || !isMobile) return;

    const listElement = todoListRef.current;
    if (!listElement) return;

    // Mobile defaults to the latest three todos by scrolling to the bottom.
    listElement.scrollTop = listElement.scrollHeight;
  }, [isExpanded, isMobile, todos.length]);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="py-2.5 px-4">
        <div className="space-y-1.5">
          {/* Title with icon, toggle and count */}
          <CardTitle className="flex min-w-0 items-center gap-2 text-sm font-semibold">
            <CheckCircle2 className="size-4 shrink-0 text-foreground" />
            <span className="min-w-0 flex-1 truncate">
              {t("todo.title")}
              {currentStep && (
                <span className="ml-2 truncate text-xs font-normal text-muted-foreground/70">
                  - {currentStep}
                </span>
              )}
            </span>
            <button
              type="button"
              onClick={() => setIsExpanded((prev) => !prev)}
              aria-label={isExpanded ? t("chat.collapse") : t("chat.expand")}
              title={isExpanded ? t("chat.collapse") : t("chat.expand")}
              className="inline-flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {isExpanded ? (
                <ChevronUp className="size-4" />
              ) : (
                <ChevronDown className="size-4" />
              )}
            </button>
            <span className="shrink-0 text-xs font-normal text-muted-foreground">
              {completedCount}/{todos.length} {derivedProgress}%
            </span>
          </CardTitle>

          {/* Progress bar */}
          <Progress value={derivedProgress} className="h-1" />
        </div>
      </CardHeader>

      {isExpanded ? (
        <CardContent className="px-4 pb-3 pt-0">
          {/* Todo items - mobile: max 3 visible rows with internal scroll */}
          <div
            ref={todoListRef}
            className="grid min-w-0 grid-cols-1 gap-x-4 gap-y-1.5 max-h-[72px] overflow-y-auto overscroll-contain pr-1 md:max-h-none md:overflow-visible md:pr-0 md:grid-cols-2 lg:grid-cols-3"
          >
            {todos.map((todo, index) => {
              const isCompleted = todo.status === "completed";
              return (
                <div
                  key={index}
                  className="flex min-h-5 items-center gap-1.5 text-xs text-foreground/80"
                >
                  {isCompleted ? (
                    <CheckCircle2 className="size-3.5 shrink-0 text-foreground" />
                  ) : (
                    <Circle className="size-3.5 shrink-0 text-muted-foreground" />
                  )}
                  <span className="truncate">{todo.content}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      ) : null}
    </Card>
  );
}
