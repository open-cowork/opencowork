import { z } from "zod";
import {
  projectsService,
  tasksService,
} from "@/features/projects/services/projects-service";

const createProjectSchema = z.object({
  name: z.string().trim().min(1, "请输入项目名称"),
});

const listProjectsSchema = z.object({
  revalidate: z.number().int().positive().optional(),
});

const listTasksSchema = z.object({
  revalidate: z.number().int().positive().optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type ListProjectsInput = z.infer<typeof listProjectsSchema>;
export type ListTasksInput = z.infer<typeof listTasksSchema>;

export async function createProjectAction(input: CreateProjectInput) {
  const { name } = createProjectSchema.parse(input);
  return projectsService.createProject(name);
}

export async function listProjectsAction(input?: ListProjectsInput) {
  const { revalidate } = listProjectsSchema.parse(input ?? {});
  return projectsService.listProjects({ revalidate });
}

export async function listTaskHistoryAction(input?: ListTasksInput) {
  const { revalidate } = listTasksSchema.parse(input ?? {});
  return tasksService.listHistory({ revalidate });
}
