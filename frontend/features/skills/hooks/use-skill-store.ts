"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { skillsService } from "@/features/skills/services/skills-service";
import type { Skill, UserSkillInstall } from "@/features/skills/types";

export interface SkillListItem extends Skill {
  isInstalled: boolean;
  installId?: number;
  isUserSkill: boolean;
}

export function useSkillStore() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [installs, setInstalls] = useState<UserSkillInstall[]>([]);
  const [loadingSkillId, setLoadingSkillId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [skillsData, installsData] = await Promise.all([
          skillsService.listSkills(),
          skillsService.listInstalls(),
        ]);
        setSkills(skillsData);
        setInstalls(installsData);
      } catch (error) {
        console.error("[SkillStore] Failed to fetch skills:", error);
        toast.error("Failed to load skills");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const toggleInstall = useCallback(
    async (skillId: number) => {
      const current = installs.find((install) => install.skill_id === skillId);
      setLoadingSkillId(skillId);

      try {
        if (current) {
          await skillsService.deleteInstall(current.id);
          setInstalls((prev) =>
            prev.filter((install) => install.id !== current.id),
          );
          setSkills((prev) => prev.filter((skill) => skill.id !== skillId));
          toast.success("Skill uninstalled");
        } else {
          const created = await skillsService.createInstall({
            skill_id: skillId,
            enabled: true,
          });
          setInstalls((prev) => [...prev, created]);
          toast.success("Skill installed");
        }
      } catch (error) {
        console.error("[SkillStore] toggle failed:", error);
        toast.error("Operation failed. Please try again later");
      } finally {
        setLoadingSkillId(null);
      }
    },
    [installs],
  );

  const items: SkillListItem[] = useMemo(() => {
    return skills.map((skill) => {
      const install = installs.find((entry) => entry.skill_id === skill.id);
      return {
        ...skill,
        isInstalled: !!install?.enabled,
        installId: install?.id,
        isUserSkill: skill.scope === "user",
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
