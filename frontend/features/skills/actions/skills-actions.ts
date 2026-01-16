import { skillsService } from "@/features/skills/services/skills-service";

export async function listSkillsAction(options?: { revalidate?: number }) {
  return skillsService.list(options);
}
