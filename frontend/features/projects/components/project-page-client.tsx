"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { useT } from "@/lib/i18n/client";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

import { useAutosizeTextarea } from "@/features/home/hooks/use-autosize-textarea";
import { useTaskHistory } from "@/features/projects/hooks/use-task-history";
import { useProjects } from "@/features/projects/hooks/use-projects";

import { AppSidebar } from "@/components/shared/sidebar/app-sidebar";
import { ProjectHeader } from "@/features/projects/components/project-header";
import { KeyboardHints } from "@/features/home/components/keyboard-hints";
import { QuickActions } from "@/features/home/components/quick-actions";
import { TaskComposer } from "@/features/home/components/task-composer";

interface ProjectPageClientProps {
  projectId: string;
}

export function ProjectPageClient({ projectId }: ProjectPageClientProps) {
  const { t } = useT("translation");
  const router = useRouter();

  const { projects, addProject } = useProjects({});
  const currentProject = React.useMemo(
    () => projects.find((p) => p.id === projectId) || projects[0],
    [projects, projectId],
  );

  const { taskHistory, addTask, removeTask, moveTask } = useTaskHistory({});

  const [inputValue, setInputValue] = React.useState("");
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  useAutosizeTextarea(textareaRef, inputValue);

  const focusComposer = React.useCallback(() => {
    requestAnimationFrame(() => textareaRef.current?.focus());
  }, []);

  const handleNewTask = React.useCallback(() => {
    router.push(`/chat/new?projectId=${projectId}`);
  }, [router, projectId]);

  const handleSendTask = React.useCallback(() => {
    const created = addTask(inputValue, {
      timestamp: t("mocks.timestamps.justNow"),
      projectId,
    });
    if (!created) return;

    setInputValue("");
  }, [addTask, inputValue, t, projectId]);

  const handleQuickActionPick = React.useCallback(
    (prompt: string) => {
      setInputValue(prompt);
      focusComposer();
    },
    [focusComposer],
  );

  const handleRenameTask = React.useCallback(
    (taskId: string, newName: string) => {
      console.log("Rename task:", taskId, "to:", newName);
    },
    [],
  );

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-svh w-full overflow-hidden bg-background">
        <AppSidebar
          projects={projects}
          taskHistory={taskHistory}
          onNewTask={handleNewTask}
          onDeleteTask={removeTask}
          onRenameTask={handleRenameTask}
          onMoveTaskToProject={moveTask}
          onCreateProject={addProject}
        />

        <SidebarInset className="flex flex-col bg-muted/30">
          <ProjectHeader project={currentProject} />

          <div className="flex flex-1 flex-col items-center justify-center px-6 py-10">
            <div className="w-full max-w-2xl">
              <div className="mb-8 text-center">
                <h1 className="text-3xl font-medium tracking-tight text-foreground">
                  {currentProject?.name || t("hero.title")}
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  {t("project.subtitle", {
                    count: taskHistory.filter(
                      (task) => task.projectId === projectId,
                    ).length,
                  })}
                </p>
              </div>

              <TaskComposer
                textareaRef={textareaRef}
                value={inputValue}
                onChange={setInputValue}
                onSend={handleSendTask}
              />

              <QuickActions onPick={handleQuickActionPick} />
              <KeyboardHints />
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
