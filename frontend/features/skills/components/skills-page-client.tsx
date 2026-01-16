"use client";

import { useState } from "react";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/shared/sidebar/app-sidebar";

import { SkillsHeader } from "@/features/skills/components/skills-header";
import { SkillsGrid } from "@/features/skills/components/skills-grid";

import { useProjects } from "@/features/projects/hooks/use-projects";
import { useTaskHistory } from "@/features/projects/hooks/use-task-history";
import type { ProjectItem, TaskHistoryItem } from "@/features/projects/types";
import type { SkillPreset, UserSkillInstall } from "@/features/skills/types";
import { SettingsDialog } from "@/features/settings/components/settings-dialog";

interface SkillsPageClientProps {
  initialProjects?: ProjectItem[];
  initialTaskHistory?: TaskHistoryItem[];
  initialPresets?: SkillPreset[];
  initialInstalls?: UserSkillInstall[];
}

export function SkillsPageClient({
  initialProjects,
  initialTaskHistory,
  initialPresets = [],
  initialInstalls = [],
}: SkillsPageClientProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [loadingId, setLoadingId] = useState<number | null>(null);

  // State for presets and installs
  const [presets] = useState<SkillPreset[]>(initialPresets);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [installs, _setInstalls] =
    useState<UserSkillInstall[]>(initialInstalls);

  const { projects, addProject } = useProjects({
    initialProjects,
  });
  const { taskHistory, removeTask } = useTaskHistory({
    initialTasks: initialTaskHistory,
  });

  // TODO: Connect to real API
  const handleInstall = async (presetId: number) => {
    setLoadingId(presetId);
    // Simulate API call
    await new Promise((r) => setTimeout(r, 1000));
    console.log("Install preset:", presetId);
    setLoadingId(null);
  };

  const handleUninstall = async (installId: number) => {
    setLoadingId(installId);
    // Simulate API call
    await new Promise((r) => setTimeout(r, 1000));
    console.log("Uninstall:", installId);
    setLoadingId(null);
  };

  const handleUpdate = async (installId: number) => {
    setLoadingId(installId);
    // Simulate API call
    await new Promise((r) => setTimeout(r, 1000));
    console.log("Update install:", installId);
    setLoadingId(null);
  };

  const handleUploadToPreset = async (installId: number) => {
    setLoadingId(installId);
    // Simulate API call
    await new Promise((r) => setTimeout(r, 1000));
    console.log("Upload to preset:", installId);
    setLoadingId(null);
  };

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
          <SkillsHeader />

          <div className="flex flex-1 flex-col px-6 py-6 overflow-auto">
            <div className="w-full max-w-4xl mx-auto">
              <SkillsGrid
                presets={presets}
                installs={installs}
                loadingId={loadingId}
                onInstall={handleInstall}
                onUninstall={handleUninstall}
                onUpdate={handleUpdate}
                onUploadToPreset={handleUploadToPreset}
              />
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
