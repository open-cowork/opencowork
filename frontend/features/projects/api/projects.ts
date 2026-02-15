import { z } from "zod";
import {
  projectsService,
  tasksService,
} from "@/features/projects/services/projects-service";

const VALIDATION_ERRORS = {
  projectNameRequired: "validation.projectNameRequired",
  selectProject: "validation.selectProject",
  missingTaskId: "validation.missingTaskId",
} as const;

const createProjectSchema = z.object({
  name: z.string().trim().min(1, VALIDATION_ERRORS.projectNameRequired),
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
  projectId: z.string().trim().min(1, VALIDATION_ERRORS.selectProject),
  name: z
    .string()
    .trim()
    .min(1, VALIDATION_ERRORS.projectNameRequired)
    .optional(),
  repo_url: z.string().trim().optional().nullable(),
  git_branch: z.string().trim().optional().nullable(),
  git_token_env_key: z.string().trim().optional().nullable(),
});

const deleteProjectSchema = z.object({
  projectId: z.string().trim().min(1, VALIDATION_ERRORS.selectProject),
});

const moveTaskToProjectSchema = z.object({
  sessionId: z.string().trim().min(1, VALIDATION_ERRORS.missingTaskId),
  projectId: z.string().trim().min(1).nullable().optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type ListProjectsInput = z.infer<typeof listProjectsSchema>;
export type ListTasksInput = z.infer<typeof listTasksSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type DeleteProjectInput = z.infer<typeof deleteProjectSchema>;
export type MoveTaskToProjectInput = z.infer<typeof moveTaskToProjectSchema>;

export async function createProject(input: CreateProjectInput) {
  const { name, repo_url, git_branch, git_token_env_key } =
    createProjectSchema.parse(input);
  return projectsService.createProject({
    name,
    repo_url: repo_url ?? undefined,
    git_branch: git_branch ?? undefined,
    git_token_env_key: git_token_env_key ?? undefined,
  });
}

export async function listProjects(input?: ListProjectsInput) {
  const { revalidate } = listProjectsSchema.parse(input ?? {});
  return projectsService.listProjects({ revalidate });
}

export async function listTaskHistory(input?: ListTasksInput) {
  const { revalidate } = listTasksSchema.parse(input ?? {});
  return tasksService.listHistory({ revalidate });
}

export async function updateProject(input: UpdateProjectInput) {
  const { projectId, name, repo_url, git_branch, git_token_env_key } =
    updateProjectSchema.parse(input);
  return projectsService.updateProject(projectId, {
    name,
    repo_url,
    git_branch,
    git_token_env_key,
  });
}

export async function deleteProject(input: DeleteProjectInput) {
  const { projectId } = deleteProjectSchema.parse(input);
  await projectsService.deleteProject(projectId);
}

export async function moveTaskToProject(input: MoveTaskToProjectInput) {
  const { sessionId, projectId } = moveTaskToProjectSchema.parse(input);
  await tasksService.updateTaskProject(sessionId, projectId ?? null);
}
