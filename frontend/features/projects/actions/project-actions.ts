import { z } from "zod";
import {
  projectsService,
  tasksService,
} from "@/features/projects/services/projects-service";

const createProjectSchema = z.object({
  name: z.string().trim().min(1, "请输入项目名称"),
  repo_url: z.string().trim().optional().nullable(),
  git_branch: z.string().trim().optional().nullable(),
  git_token_env_key: z.string().trim().optional().nullable(),
});

const listProjectsSchema = z.object({
  revalidate: z.number().int().positive().optional(),
});

const listTasksSchema = z.object({
  revalidate: z.number().int().positive().optional(),
});

const updateProjectSchema = z.object({
  projectId: z.string().trim().min(1, "请选择项目"),
  name: z.string().trim().min(1, "请输入项目名称").optional(),
});

const deleteProjectSchema = z.object({
  projectId: z.string().trim().min(1, "请选择项目"),
});

const moveTaskToProjectSchema = z.object({
  sessionId: z.string().trim().min(1, "缺少任务 ID"),
  projectId: z.string().trim().min(1).nullable().optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type ListProjectsInput = z.infer<typeof listProjectsSchema>;
export type ListTasksInput = z.infer<typeof listTasksSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type DeleteProjectInput = z.infer<typeof deleteProjectSchema>;
export type MoveTaskToProjectInput = z.infer<typeof moveTaskToProjectSchema>;

export async function createProjectAction(input: CreateProjectInput) {
  const { name, repo_url, git_branch, git_token_env_key } =
    createProjectSchema.parse(input);
  return projectsService.createProject({
    name,
    repo_url: repo_url ?? undefined,
    git_branch: git_branch ?? undefined,
    git_token_env_key: git_token_env_key ?? undefined,
  });
}

export async function listProjectsAction(input?: ListProjectsInput) {
  const { revalidate } = listProjectsSchema.parse(input ?? {});
  return projectsService.listProjects({ revalidate });
}

export async function listTaskHistoryAction(input?: ListTasksInput) {
  const { revalidate } = listTasksSchema.parse(input ?? {});
  return tasksService.listHistory({ revalidate });
}

export async function updateProjectAction(input: UpdateProjectInput) {
  const { projectId, name } = updateProjectSchema.parse(input);
  return projectsService.updateProject(projectId, { name });
}

export async function deleteProjectAction(input: DeleteProjectInput) {
  const { projectId } = deleteProjectSchema.parse(input);
  await projectsService.deleteProject(projectId);
}

export async function moveTaskToProjectAction(input: MoveTaskToProjectInput) {
  const { sessionId, projectId } = moveTaskToProjectSchema.parse(input);
  await tasksService.updateTaskProject(sessionId, projectId ?? null);
}
