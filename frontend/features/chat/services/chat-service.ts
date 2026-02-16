/**
 * Chat Service - Session execution and messaging
 */

import { apiClient, API_ENDPOINTS } from "@/lib/api-client";
import type {
  ExecutionSession,
  FileNode,
  ChatMessage,
  MessageBlock,
  SessionCancelRequest,
  SessionCancelResponse,
  SessionResponse,
  SessionUpdateRequest,
  ToolExecutionResponse,
  ComputerBrowserScreenshotResponse,
  TaskEnqueueRequest,
  TaskEnqueueResponse,
  TaskConfig,
  InputFile,
  ConfigSnapshot,
  RunResponse,
} from "@/features/chat/types";

interface MessageContentBlock {
  _type: string;
  // ToolUseBlock fields
  id?: string;
  name?: string;
  input?: Record<string, unknown>;
  // ToolResultBlock fields
  tool_use_id?: string;
  content?: string;
  is_error?: boolean;
  // TextBlock fields
  text?: string;
  // ThinkingBlock fields
  thinking?: string;
  signature?: string;
}

interface MessageContentShape {
  _type?: string;
  subtype?: string;
  content?: MessageContentBlock[];
  text?: string;
  parent_tool_use_id?: string | null;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function typeIncludes(typeValue: unknown, needle: string): boolean {
  if (!isNonEmptyString(typeValue)) return false;
  // Be tolerant to namespaced types like "claude_agent_sdk.ToolUseBlock".
  return typeValue === needle || typeValue.includes(needle);
}

/**
 * Removes the Unicode replacement character ( / \uFFFD) from text.
 */
function cleanText(text: string): string {
  if (!text) return text;
  return text.replace(/\uFFFD/g, "");
}

/**
 * Parse config_snapshot from API response to ConfigSnapshot type
 */
function parseConfigSnapshot(
  configSnapshot: Record<string, unknown> | null,
): ConfigSnapshot | null {
  if (!configSnapshot) return null;

  return {
    mcp_server_ids: Array.isArray(configSnapshot.mcp_server_ids)
      ? (configSnapshot.mcp_server_ids as number[]).filter(
          (id): id is number => typeof id === "number",
        )
      : undefined,
    skill_ids: Array.isArray(configSnapshot.skill_ids)
      ? (configSnapshot.skill_ids as number[]).filter(
          (id): id is number => typeof id === "number",
        )
      : undefined,
    plugin_ids: Array.isArray(configSnapshot.plugin_ids)
      ? (configSnapshot.plugin_ids as number[]).filter(
          (id): id is number => typeof id === "number",
        )
      : undefined,
    browser_enabled:
      typeof configSnapshot.browser_enabled === "boolean"
        ? configSnapshot.browser_enabled
        : undefined,
    repo_url: isNonEmptyString(configSnapshot.repo_url)
      ? configSnapshot.repo_url.trim()
      : undefined,
    git_branch: isNonEmptyString(configSnapshot.git_branch)
      ? configSnapshot.git_branch.trim()
      : undefined,
    git_token_env_key: isNonEmptyString(configSnapshot.git_token_env_key)
      ? configSnapshot.git_token_env_key.trim()
      : undefined,
  };
}

function toExecutionSession(
  session: SessionResponse,
  progress: number = 0,
): ExecutionSession {
  return {
    session_id: session.session_id,
    time: session.updated_at,
    status:
      session.status === "completed"
        ? "completed"
        : session.status === "failed"
          ? "failed"
          : session.status === "canceled" || session.status === "cancelled"
            ? "canceled"
            : session.status === "running"
              ? "running"
              : "accepted",
    progress,
    state_patch: session.state_patch ?? {},
    config_snapshot: parseConfigSnapshot(session.config_snapshot),
    task_name: undefined,
    user_prompt: undefined,
    title: session.title,
  };
}

function createDefaultSession(sessionId: string): ExecutionSession {
  return {
    session_id: sessionId,
    time: new Date().toISOString(),
    status: "accepted",
    progress: 0,
    state_patch: {},
    task_name: undefined,
    user_prompt: undefined,
    title: null,
  };
}

function buildQuery(params?: Record<string, string | number | undefined>) {
  if (!params) return "";
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) searchParams.append(key, String(value));
  });
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export const chatService = {
  listSessions: async (params?: {
    user_id?: string;
    limit?: number;
    offset?: number;
  }) => {
    const query = buildQuery(params);
    return apiClient.get<SessionResponse[]>(
      `${API_ENDPOINTS.sessions}${query}`,
    );
  },

  getSessionRaw: async (sessionId: string) => {
    return apiClient.get<SessionResponse>(API_ENDPOINTS.session(sessionId));
  },

  getExecutionSession: async (
    sessionId: string,
    currentProgress: number = 0,
  ): Promise<ExecutionSession> => {
    try {
      const session = await chatService.getSessionRaw(sessionId);
      return toExecutionSession(session, currentProgress);
    } catch (error) {
      console.error("[Chat Service] Failed to get session:", error);
      return createDefaultSession(sessionId);
    }
  },

  enqueueTask: async (
    request: TaskEnqueueRequest,
  ): Promise<TaskEnqueueResponse> => {
    console.log("[enqueueTask] request:", JSON.stringify(request));
    try {
      const result = await apiClient.post<TaskEnqueueResponse>(
        API_ENDPOINTS.tasks,
        request,
      );
      console.log("[enqueueTask] result:", JSON.stringify(result));
      return result;
    } catch (error) {
      console.error("[enqueueTask] error:", error);
      throw error;
    }
  },

  createSession: async (
    prompt: string,
    config?: TaskConfig | null,
    projectId?: string | null,
    schedule?: {
      schedule_mode?: string;
      timezone?: string;
      scheduled_at?: string;
    },
    permission_mode?: string,
    workspace_scope?: "session" | "project",
  ): Promise<TaskEnqueueResponse> => {
    return chatService.enqueueTask({
      prompt,
      config,
      permission_mode,
      schedule_mode: schedule?.schedule_mode || "immediate",
      timezone: schedule?.timezone,
      scheduled_at: schedule?.scheduled_at,
      project_id: projectId,
      workspace_scope,
    });
  },

  sendMessage: async (
    sessionId: string,
    content: string,
    attachments?: InputFile[],
  ): Promise<TaskEnqueueResponse> => {
    return chatService.enqueueTask({
      prompt: content,
      session_id: sessionId,
      schedule_mode: "immediate",
      config: attachments?.length ? { input_files: attachments } : undefined,
    });
  },

  deleteSession: async (sessionId: string): Promise<void> => {
    return apiClient.delete(API_ENDPOINTS.session(sessionId));
  },

  updateSession: async (
    sessionId: string,
    payload: SessionUpdateRequest,
  ): Promise<SessionResponse> => {
    return apiClient.patch<SessionResponse>(
      API_ENDPOINTS.session(sessionId),
      payload,
    );
  },

  cancelSession: async (
    sessionId: string,
    payload?: SessionCancelRequest,
  ): Promise<SessionCancelResponse> => {
    return apiClient.post<SessionCancelResponse>(
      API_ENDPOINTS.sessionCancel(sessionId),
      payload ?? {},
    );
  },

  getRunsBySession: async (
    sessionId: string,
    params?: { limit?: number; offset?: number },
  ): Promise<RunResponse[]> => {
    const query = buildQuery({
      limit: params?.limit,
      offset: params?.offset,
    });
    return apiClient.get<RunResponse[]>(
      `${API_ENDPOINTS.runsBySession(sessionId)}${query}`,
    );
  },

  getToolExecutions: async (
    sessionId: string,
    params?: { limit?: number; offset?: number },
  ): Promise<ToolExecutionResponse[]> => {
    const query = buildQuery({
      limit: params?.limit,
      offset: params?.offset,
    });
    return apiClient.get<ToolExecutionResponse[]>(
      `${API_ENDPOINTS.sessionToolExecutions(sessionId)}${query}`,
    );
  },

  getBrowserScreenshot: async (
    sessionId: string,
    toolUseId: string,
  ): Promise<ComputerBrowserScreenshotResponse> => {
    return apiClient.get<ComputerBrowserScreenshotResponse>(
      API_ENDPOINTS.sessionBrowserScreenshot(sessionId, toolUseId),
    );
  },

  getMessages: async (
    sessionId: string,
    options?: { realUserMessageIds?: number[] },
  ): Promise<{
    messages: ChatMessage[];
    internalContextsByUserMessageId: Record<string, string[]>;
  }> => {
    try {
      const realUserMessageIdSet = new Set(options?.realUserMessageIds ?? []);
      // If we can't reliably identify "real user inputs" (runs not available),
      // fall back to showing all user messages and do not build internal contexts.
      const canClassifyUserMessages = realUserMessageIdSet.size > 0;

      const messages = await apiClient.get<
        {
          id: number;
          role: string;
          content: Record<string, unknown>;
          attachments?: InputFile[];
          created_at: string;
          updated_at: string;
        }[]
      >(API_ENDPOINTS.sessionMessagesWithFiles(sessionId));

      const processedMessages: ChatMessage[] = [];
      const internalContextsByUserMessageId: Record<string, string[]> = {};
      const subagentTranscriptByToolUseId: Record<string, string[]> = {};
      let currentAssistantMessage: ChatMessage | null = null;
      let currentTurnUserMessageId: string | null = null;

      for (const msg of messages) {
        const contentObj = msg.content as MessageContentShape;
        if (
          typeIncludes(contentObj._type, "SystemMessage") &&
          contentObj.subtype === "init"
        ) {
          continue;
        }

        const parentToolUseId = isNonEmptyString(contentObj.parent_tool_use_id)
          ? contentObj.parent_tool_use_id.trim()
          : null;

        // Subagent messages are nested under a parent tool call (e.g., Task).
        // We keep them out of the main timeline and attach a flattened transcript to the parent ToolUseBlock.
        if (parentToolUseId) {
          const nestedTexts: string[] = [];
          if (isNonEmptyString(contentObj.text)) {
            nestedTexts.push(cleanText(contentObj.text));
          }
          if (Array.isArray(contentObj.content)) {
            for (const block of contentObj.content) {
              if (!typeIncludes(block?._type, "TextBlock")) continue;
              if (isNonEmptyString(block.text)) {
                nestedTexts.push(cleanText(block.text));
              }
            }
          }
          const cleaned = nestedTexts
            .map((t) => t.trim())
            .filter(Boolean)
            .join("\n\n");
          if (cleaned) {
            subagentTranscriptByToolUseId[parentToolUseId] = [
              ...(subagentTranscriptByToolUseId[parentToolUseId] || []),
              cleaned,
            ];
          }
          continue;
        }

        if (msg.role === "assistant" && Array.isArray(contentObj.content)) {
          const blocks = contentObj.content;

          const toolUseBlocks = blocks.filter((b) =>
            typeIncludes(b?._type, "ToolUseBlock"),
          );

          if (toolUseBlocks.length > 0) {
            if (!currentAssistantMessage) {
              currentAssistantMessage = {
                id: msg.id.toString(),
                role: "assistant",
                content: [],
                status: "completed",
                timestamp: msg.created_at,
              };
              processedMessages.push(currentAssistantMessage);
            }

            const existingBlocks =
              currentAssistantMessage.content as MessageBlock[];

            const uiToolBlocks = toolUseBlocks.map((b) => ({
              _type: "ToolUseBlock" as const,
              id: typeof b.id === "string" ? b.id : String(b.id ?? ""),
              name: typeof b.name === "string" ? b.name : String(b.name ?? ""),
              input:
                b.input && typeof b.input === "object"
                  ? (b.input as Record<string, unknown>)
                  : {},
            }));

            currentAssistantMessage.content = [
              ...existingBlocks,
              ...uiToolBlocks,
            ];
          }
        }

        // ToolResultBlock is typically a user-role message (Anthropic style), but some providers
        // may emit it under assistant-role. Don't rely on msg.role to attach results.
        if (Array.isArray(contentObj.content)) {
          const blocks = contentObj.content;
          const toolResultBlocks = blocks.filter((b) =>
            typeIncludes(b?._type, "ToolResultBlock"),
          );

          if (toolResultBlocks.length > 0) {
            if (!currentAssistantMessage) {
              currentAssistantMessage = {
                id: msg.id.toString(),
                role: "assistant",
                content: [],
                status: "completed",
                timestamp: msg.created_at,
              };
              processedMessages.push(currentAssistantMessage);
            }

            const uiResultBlocks = toolResultBlocks.map((b) => ({
              _type: "ToolResultBlock" as const,
              tool_use_id:
                typeof b.tool_use_id === "string"
                  ? b.tool_use_id
                  : String(b.tool_use_id ?? ""),
              content: cleanText(
                typeof b.content === "string"
                  ? b.content
                  : (JSON.stringify(b.content) ?? ""),
              ),
              is_error: !!b.is_error,
            }));
            const existingBlocks =
              currentAssistantMessage.content as MessageBlock[];
            currentAssistantMessage.content = [
              ...existingBlocks,
              ...uiResultBlocks,
            ];

            // Keep ToolResultBlock out of the user timeline.
            if (msg.role === "user") continue;
          }
        }

        if (msg.role === "assistant" && Array.isArray(contentObj.content)) {
          const blocks = contentObj.content;
          const thinkingBlocks = blocks.filter((b) =>
            typeIncludes(b?._type, "ThinkingBlock"),
          );

          const uiThinkingBlocks = thinkingBlocks
            .map((b) => ({
              _type: "ThinkingBlock" as const,
              thinking: cleanText(b.thinking || ""),
              signature: b.signature,
            }))
            .filter((b) => b.thinking.trim().length > 0);

          if (uiThinkingBlocks.length > 0) {
            if (!currentAssistantMessage) {
              currentAssistantMessage = {
                id: msg.id.toString(),
                role: "assistant",
                content: [],
                status: "completed",
                timestamp: msg.created_at,
              };
              processedMessages.push(currentAssistantMessage);
            }

            const existingBlocks =
              currentAssistantMessage.content as MessageBlock[];

            currentAssistantMessage.content = [
              ...existingBlocks,
              ...uiThinkingBlocks,
            ];
          }
        }

        let textContent = "";
        if (isNonEmptyString(contentObj.text)) {
          textContent = cleanText(contentObj.text);
        } else if (Array.isArray(contentObj.content)) {
          const textBlocks = contentObj.content
            .filter((b) => typeIncludes(b?._type, "TextBlock"))
            .map((b) => (isNonEmptyString(b.text) ? cleanText(b.text) : ""))
            .filter((t) => t.trim().length > 0);
          if (textBlocks.length > 0) textContent = textBlocks.join("\n\n");
        }

        if (textContent) {
          if (msg.role === "user") {
            // A user-role message from the SDK is not always a real user input.
            // Real user inputs are identified by AgentRun.user_message_id (per turn).
            const isRealUserMessage = canClassifyUserMessages
              ? realUserMessageIdSet.has(msg.id)
              : true;

            if (!isRealUserMessage) {
              // Keep internal user-role text for optional inline display (debug/UX),
              // but do not render it as a user bubble.
              if (currentTurnUserMessageId) {
                internalContextsByUserMessageId[currentTurnUserMessageId] = [
                  ...(internalContextsByUserMessageId[
                    currentTurnUserMessageId
                  ] || []),
                  textContent,
                ];
              }
              continue;
            }

            currentAssistantMessage = null;
            currentTurnUserMessageId = msg.id.toString();
            processedMessages.push({
              id: msg.id.toString(),
              role: "user",
              content: textContent,
              status: "completed",
              timestamp: msg.created_at,
              attachments: msg.attachments,
            });
          } else {
            if (currentAssistantMessage) {
              const existingBlocks =
                currentAssistantMessage.content as MessageBlock[];
              existingBlocks.push({
                _type: "TextBlock",
                text: textContent,
              });
            } else {
              processedMessages.push({
                id: msg.id.toString(),
                role: "assistant",
                content: textContent,
                status: "completed",
                timestamp: msg.created_at,
              });
            }
          }
        }
      }

      // Attach subagent transcript to tool blocks (main timeline only).
      for (const message of processedMessages) {
        if (message.role !== "assistant") continue;
        if (!Array.isArray(message.content)) continue;
        message.content = (message.content as MessageBlock[]).map((block) => {
          if (block._type !== "ToolUseBlock") return block;
          const transcript = subagentTranscriptByToolUseId[block.id];
          if (!transcript || transcript.length === 0) return block;
          return { ...block, subagent_transcript: transcript };
        });
      }

      return {
        messages: processedMessages,
        internalContextsByUserMessageId,
      };
    } catch (error) {
      console.error("[Chat Service] Failed to get messages:", error);
      return { messages: [], internalContextsByUserMessageId: {} };
    }
  },

  getFiles: async (sessionId?: string): Promise<FileNode[]> => {
    if (!sessionId) return [];

    try {
      let rawFiles: FileNode[] = [];
      try {
        rawFiles = await apiClient.get<FileNode[]>(
          API_ENDPOINTS.sessionWorkspaceFiles(sessionId),
        );
      } catch (err) {
        console.warn("[Chat Service] Failed to get workspace files:", err);
      }

      // Fallback to file changes from session state if workspace is empty
      if (!rawFiles || rawFiles.length === 0) {
        try {
          const session = await chatService.getSessionRaw(sessionId);
          const fileChanges =
            session.state_patch?.workspace_state?.file_changes || [];
          rawFiles = fileChanges.map((change) => ({
            id: change.path,
            name: change.path.split("/").pop() || change.path,
            path: change.path,
            type: "file",
          }));
        } catch (err) {
          console.error(
            "[Chat Service] Fallback to session state failed:",
            err,
          );
        }
      }

      const buildFileTree = (nodes: FileNode[]): FileNode[] => {
        const nodeMap = new Map<string, FileNode>();
        const rootNodes: FileNode[] = [];

        const flatten = (list: FileNode[]): FileNode[] => {
          let result: FileNode[] = [];
          for (const item of list) {
            result.push(item);
            if (item.children) {
              result = result.concat(flatten(item.children));
            }
          }
          return result;
        };

        const allNodes = flatten(nodes);

        allNodes.forEach((node) => {
          nodeMap.set(node.path, { ...node, children: [] });
        });

        const processedPaths = new Set<string>();
        const sortedPaths = Array.from(nodeMap.keys()).sort();

        sortedPaths.forEach((path) => {
          if (processedPaths.has(path)) return;

          const parts = path.split("/");
          let currentPath = "";

          parts.forEach((part, index) => {
            const parentPath = currentPath;
            currentPath = currentPath ? `${currentPath}/${part}` : part;

            if (processedPaths.has(currentPath)) return;

            let node = nodeMap.get(currentPath);

            if (!node) {
              const isLastPart = index === parts.length - 1;
              const originalNode = nodeMap.get(path);

              node = {
                id: currentPath,
                name: part,
                path: currentPath,
                type: isLastPart && originalNode ? originalNode.type : "folder",
                children: [],
                ...(isLastPart && originalNode
                  ? {
                      url: originalNode.url,
                      mimeType: originalNode.mimeType,
                      oss_status: originalNode.oss_status,
                      oss_meta: originalNode.oss_meta,
                    }
                  : {}),
              };
              nodeMap.set(currentPath, node);
            }

            if (parentPath) {
              const parent = nodeMap.get(parentPath);
              if (parent) {
                if (!parent.children) parent.children = [];
                if (!parent.children.find((c) => c.path === node!.path)) {
                  parent.children.push(node);
                }
              }
            } else {
              if (!rootNodes.find((n) => n.path === node!.path)) {
                rootNodes.push(node);
              }
            }

            processedPaths.add(currentPath);
          });
        });

        const sortTree = (list: FileNode[]) => {
          list.sort((a, b) => {
            if (a.type !== b.type) {
              return a.type === "folder" ? -1 : 1;
            }
            return a.name.localeCompare(b.name);
          });
          list.forEach((node) => {
            if (node.children) sortTree(node.children);
          });
        };

        sortTree(rootNodes);
        return rootNodes;
      };

      const removeEmptyFolders = (nodes: FileNode[]): FileNode[] => {
        return nodes
          .map((node) => {
            if (node.type === "folder" && node.children) {
              node.children = removeEmptyFolders(node.children);
              if (node.children.length === 0) {
                return null;
              }
            }
            return node;
          })
          .filter((node): node is FileNode => node !== null);
      };

      let tree = buildFileTree(rawFiles);
      tree = removeEmptyFolders(tree);

      return tree;
    } catch (error) {
      console.error("[Chat Service] Failed to get files:", error);
      return [];
    }
  },
};
