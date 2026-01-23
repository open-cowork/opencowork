"use client";

import { useState } from "react";

import { SkillsHeader } from "@/features/skills/components/skills-header";
import { SkillsGrid } from "@/features/skills/components/skills-grid";
import { SkillImportDialog } from "@/features/skills/components/skill-import-dialog";
import { useSkillCatalog } from "@/features/skills/hooks/use-skill-catalog";

export function SkillsPageClient() {
  const {
    skills,
    installs,
    loadingId,
    isLoading,
    installSkill,
    uninstallSkill,
    setEnabled,
    refresh,
  } = useSkillCatalog();
  const [importOpen, setImportOpen] = useState(false);

  return (
    <>
      <SkillsHeader onImport={() => setImportOpen(true)} />

      <div className="flex flex-1 flex-col px-6 py-6 overflow-auto">
        <div className="w-full max-w-4xl mx-auto">
          <SkillsGrid
            skills={skills}
            installs={installs}
            loadingId={loadingId}
            isLoading={isLoading}
            onInstall={installSkill}
            onUninstall={uninstallSkill}
            onToggleEnabled={setEnabled}
          />
        </div>
      </div>

      <SkillImportDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={refresh}
      />
    </>
  );
}
