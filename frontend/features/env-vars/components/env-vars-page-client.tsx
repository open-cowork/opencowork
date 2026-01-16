"use client";

import { useState } from "react";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/shared/sidebar/app-sidebar";

import { EnvVarsHeader } from "@/features/env-vars/components/env-vars-header";
import { EnvVarsGrid } from "@/features/env-vars/components/env-vars-grid";

import { useProjects } from "@/features/projects/hooks/use-projects";
import { useTaskHistory } from "@/features/projects/hooks/use-task-history";
import { useEnvVarsStore } from "@/features/env-vars/hooks/use-env-vars-store";
import { SettingsDialog } from "@/features/settings/components/settings-dialog";

export function EnvVarsPageClient() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { projects, addProject } = useProjects({});
  const { taskHistory, removeTask } = useTaskHistory({});
  const envVarStore = useEnvVarsStore();

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-svh w-full overflow-hidden bg-background">
        <AppSidebar
          projects={projects}
          taskHistory={taskHistory}
          onNewTask={() => {}}
          onDeleteTask={removeTask}
          onCreateProject={addProject}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />

        <SidebarInset className="flex flex-col bg-muted/30">
          <EnvVarsHeader />

          <div className="flex flex-1 flex-col px-6 py-6">
            <div className="w-full max-w-6xl mx-auto">
              {envVarStore.isLoading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : (
                <EnvVarsGrid
                  envVars={envVarStore.envVars}
                  savingKey={envVarStore.savingEnvKey}
                  onDelete={(id) => {
                    envVarStore.removeEnvVar(id);
                  }}
                  onSave={async (envVar) => {
                    await envVarStore.upsertEnvVar({
                      key: envVar.key,
                      value: envVar.value || "",
                      isSecret: envVar.is_secret,
                      description: envVar.description || "",
                      scope: envVar.scope,
                    });
                  }}
                />
              )}
            </div>
          </div>
        </SidebarInset>

        <SettingsDialog
          open={isSettingsOpen}
          onOpenChange={setIsSettingsOpen}
        />
      </div>
    </SidebarProvider>
  );
}
