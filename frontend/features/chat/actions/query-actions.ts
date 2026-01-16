import { z } from "zod";
import { chatService } from "@/features/chat/services/chat-service";

const listSessionsSchema = z.object({
  userId: z.string().optional(),
  limit: z.number().int().positive().optional(),
  offset: z.number().int().min(0).optional(),
});

const sessionIdSchema = z.object({
  sessionId: z.string().trim().min(1, "缺少会话 ID"),
});

const executionSessionSchema = sessionIdSchema.extend({
  currentProgress: z.number().min(0).optional(),
});

export type ListSessionsInput = z.infer<typeof listSessionsSchema>;
export type GetExecutionSessionInput = z.infer<typeof executionSessionSchema>;
export type GetMessagesInput = z.infer<typeof sessionIdSchema>;
export type GetFilesInput = z.infer<typeof sessionIdSchema>;

export async function listSessionsAction(input?: ListSessionsInput) {
  const { userId, limit, offset } = listSessionsSchema.parse(input ?? {});
  return chatService.listSessions({ user_id: userId, limit, offset });
}

export async function getExecutionSessionAction(
  input: GetExecutionSessionInput,
) {
  const { sessionId, currentProgress } = executionSessionSchema.parse(input);
  return chatService.getExecutionSession(sessionId, currentProgress);
}

export async function getMessagesAction(input: GetMessagesInput) {
  const { sessionId } = sessionIdSchema.parse(input);
  return chatService.getMessages(sessionId);
}

export async function getFilesAction(input: GetFilesInput) {
  const { sessionId } = sessionIdSchema.parse(input);
  return chatService.getFiles(sessionId);
}
