"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/shared/sidebar/app-sidebar";
import { SettingsDialog } from "@/features/settings/components/settings-dialog";
import { useProjects } from "@/features/projects/hooks/use-projects";
import { useTaskHistory } from "@/features/projects/hooks/use-task-history";

interface ChatLayoutClientProps {
  children: React.ReactNode;
}

export function ChatLayoutClient({ children }: ChatLayoutClientProps) {
  const router = useRouter();
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  const { projects, addProject } = useProjects({});
  const { taskHistory, removeTask, moveTask } = useTaskHistory({});

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-svh w-full overflow-hidden bg-background">
        <AppSidebar
          projects={projects}
          taskHistory={taskHistory}
          onNewTask={() => router.push("/")}
          onDeleteTask={removeTask}
          onCreateProject={addProject}
          onMoveTaskToProject={moveTask}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
        <SidebarInset className="flex flex-col bg-muted/30">
          {children}
        </SidebarInset>
        <SettingsDialog
          open={isSettingsOpen}
          onOpenChange={setIsSettingsOpen}
        />
      </div>
    </SidebarProvider>
  );
}
