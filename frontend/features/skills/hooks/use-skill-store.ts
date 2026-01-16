"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { skillsService } from "@/features/skills/services/skills-service";
import type { SkillPreset, UserSkillInstall } from "@/features/skills/types";

export interface SkillListItem extends SkillPreset {
  isInstalled: boolean;
  installId?: number;
  isUserPreset: boolean;
}

export function useSkillStore() {
  const [skills, setSkills] = useState<SkillPreset[]>([]);
  const [installs, setInstalls] = useState<UserSkillInstall[]>([]);
  const [loadingSkillId, setLoadingSkillId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [presetsData, installsData] = await Promise.all([
          skillsService.listPresets(),
          skillsService.listInstalls(),
        ]);
        setSkills(presetsData);
        setInstalls(installsData);
      } catch (error) {
        console.error("[SkillStore] Failed to fetch skills:", error);
        toast.error("加载技能列表失败");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const toggleInstall = useCallback(
    async (skillId: number) => {
      const current = installs.find((install) => install.preset_id === skillId);
      setLoadingSkillId(skillId);

      try {
        if (current) {
          await skillsService.deleteInstall(current.id);
          setInstalls((prev) =>
            prev.filter((install) => install.id !== current.id),
          );
          toast.success("技能已卸载");
        } else {
          const created = await skillsService.createInstall({
            preset_id: skillId,
            enabled: true,
          });
          setInstalls((prev) => [...prev, created]);
          toast.success("技能已安装");
        }
      } catch (error) {
        console.error("[SkillStore] toggle failed:", error);
        toast.error("操作失败，请稍后再试");
      } finally {
        setLoadingSkillId(null);
      }
    },
    [installs],
  );

  const items: SkillListItem[] = useMemo(() => {
    return skills.map((skill) => {
      const install = installs.find((entry) => entry.preset_id === skill.id);
      return {
        ...skill,
        isInstalled: !!install?.enabled,
        installId: install?.id,
        isUserPreset: Boolean(skill.owner_user_id),
      };
    });
  }, [skills, installs]);

  return {
    skills: items,
    toggleInstall,
    loadingSkillId,
    isLoading,
  };
}
