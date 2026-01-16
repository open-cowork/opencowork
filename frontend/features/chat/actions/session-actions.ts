import { z } from "zod";
import { chatService } from "@/features/chat/services/chat-service";

const inputFileSchema = z.object({
  id: z.string().optional().nullable(),
  type: z.enum(["file", "url"]).optional(),
  name: z.string(),
  source: z.string(),
  size: z.number().optional().nullable(),
  content_type: z.string().optional().nullable(),
  path: z.string().optional().nullable(),
});

const configSchema = z.object({
  repo_url: z.string().optional(),
  git_branch: z.string().optional(),
  mcp_config: z.record(z.string(), z.unknown()).optional(),
  skill_files: z.record(z.string(), z.unknown()).optional(),
  input_files: z.array(inputFileSchema).optional(),
});

const createSessionSchema = z.object({
  prompt: z.string().trim().min(1, "请输入任务内容"),
  config: configSchema.optional(),
});

const sendMessageSchema = z
  .object({
    sessionId: z.string().trim().min(1, "缺少会话 ID"),
    content: z.string(),
    attachments: z.array(inputFileSchema).optional(),
  })
  .refine(
    (data) =>
      data.content.trim().length > 0 ||
      (data.attachments && data.attachments.length > 0),
    {
      message: "请输入消息内容",
      path: ["content"],
    },
  );

export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;

export async function createSessionAction(input: CreateSessionInput) {
  const { prompt, config } = createSessionSchema.parse(input);
  const result = await chatService.createSession(prompt, config);
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

const deleteSessionSchema = z.object({
  sessionId: z.string().trim().min(1, "缺少会话 ID"),
});

export type DeleteSessionInput = z.infer<typeof deleteSessionSchema>;

export async function deleteSessionAction(input: DeleteSessionInput) {
  const { sessionId } = deleteSessionSchema.parse(input);
  await chatService.deleteSession(sessionId);
}
