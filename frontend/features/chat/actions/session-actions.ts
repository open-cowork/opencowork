import { z } from "zod";
import { chatService } from "@/features/chat/services/chat-service";

const inputFileSchema = z
  .object({
    id: z.string().optional().nullable(),
    type: z.string().optional(),
    name: z.string(),
    source: z.string(),
    size: z.number().optional().nullable(),
    content_type: z.string().optional().nullable(),
    path: z.string().optional().nullable(),
  })
  .passthrough();

const configSchema = z
  .object({
    repo_url: z.string().optional().nullable(),
    git_branch: z.string().optional(),
    git_token_env_key: z.string().optional().nullable(),
    browser_enabled: z.boolean().optional(),
    mcp_config: z.record(z.string(), z.boolean()).optional(),
    skill_files: z.record(z.string(), z.unknown()).optional(),
    input_files: z.array(inputFileSchema).optional(),
  })
  .passthrough();

const createSessionSchema = z
  .object({
    prompt: z.string(),
    config: configSchema.optional(),
    projectId: z.string().uuid().optional(),
    permission_mode: z
      .enum(["default", "acceptEdits", "plan", "bypassPermissions"])
      .optional(),
    schedule_mode: z.enum(["immediate", "scheduled", "nightly"]).optional(),
    timezone: z.string().optional().nullable(),
    scheduled_at: z.string().optional().nullable(),
  })
  .refine(
    (data) => {
      const hasPrompt = data.prompt.trim().length > 0;
      const hasFiles = Boolean(data.config?.input_files?.length);
      return hasPrompt || hasFiles;
    },
    {
      message: "Please enter task content",
      path: ["prompt"],
    },
  )
  .refine(
    (data) => {
      if (data.schedule_mode !== "scheduled") return true;
      return Boolean((data.scheduled_at || "").trim());
    },
    {
      message: "Please select an execution time",
      path: ["scheduled_at"],
    },
  )
  .refine(
    (data) => {
      if (data.schedule_mode !== "nightly") return true;
      return !data.scheduled_at;
    },
    {
      message: "Night execution does not support setting a time",
      path: ["scheduled_at"],
    },
  );

const sendMessageSchema = z
  .object({
    sessionId: z.string().trim().min(1, "Missing session ID"),
    content: z.string(),
    attachments: z.array(inputFileSchema).optional(),
  })
  .refine(
    (data) =>
      data.content.trim().length > 0 ||
      (data.attachments && data.attachments.length > 0),
    {
      message: "Please enter message content",
      path: ["content"],
    },
  );

export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;

export async function createSessionAction(input: CreateSessionInput) {
  const {
    prompt,
    config,
    projectId,
    permission_mode,
    schedule_mode,
    timezone,
    scheduled_at,
  } = createSessionSchema.parse(input);
  const hasInputFiles = Boolean(config?.input_files?.length);
  const finalPrompt =
    prompt.trim() || (hasInputFiles ? "Uploaded files" : prompt);
  const result = await chatService.createSession(
    finalPrompt,
    config,
    projectId,
    {
      schedule_mode,
      timezone: timezone || undefined,
      scheduled_at: scheduled_at || undefined,
    },
    permission_mode,
  );
  return {
    sessionId: result.session_id,
    runId: result.run_id,
    status: result.status,
  };
}

export async function sendMessageAction(input: SendMessageInput) {
  const { sessionId, content, attachments } = sendMessageSchema.parse(input);
  // Ensure we have a prompt if content is empty but attachments exist
  const finalContent =
    content.trim() || (attachments?.length ? "Uploaded files" : content);
  const result = await chatService.sendMessage(
    sessionId,
    finalContent,
    attachments,
  );
  return {
    sessionId: result.session_id,
    runId: result.run_id,
    status: result.status,
  };
}

const cancelSessionSchema = z.object({
  sessionId: z.string().trim().min(1, "Missing session ID"),
  reason: z.string().optional().nullable(),
});

export type CancelSessionInput = z.infer<typeof cancelSessionSchema>;

export async function cancelSessionAction(input: CancelSessionInput) {
  const { sessionId, reason } = cancelSessionSchema.parse(input);
  return chatService.cancelSession(sessionId, {
    reason: reason ?? undefined,
  });
}

const deleteSessionSchema = z.object({
  sessionId: z.string().trim().min(1, "Missing session ID"),
});

export type DeleteSessionInput = z.infer<typeof deleteSessionSchema>;

export async function deleteSessionAction(input: DeleteSessionInput) {
  const { sessionId } = deleteSessionSchema.parse(input);
  await chatService.deleteSession(sessionId);
}

const renameSessionTitleSchema = z.object({
  sessionId: z.string().trim().min(1, "Missing session ID"),
  title: z
    .string()
    .trim()
    .min(1, "Please enter a session name")
    .max(255, "Session name is too long"),
});

export type RenameSessionTitleInput = z.infer<typeof renameSessionTitleSchema>;

export async function renameSessionTitleAction(input: RenameSessionTitleInput) {
  const { sessionId, title } = renameSessionTitleSchema.parse(input);
  return chatService.updateSession(sessionId, { title });
}
