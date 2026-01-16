import * as React from "react";
import { STREAMING_CHAR_DELAY } from "@/features/home/model/constants";
import { createSessionAction } from "@/features/chat/actions/session-actions";
import type {
  ChatMessage,
  ChatSession,
  MessageRole,
} from "@/features/chat/types";

/**
 * Create a new empty chat session
 */
function createNewChatSession(): ChatSession {
  return {
    id: `session-${Date.now()}`,
    taskId: `task-${Date.now()}`,
    title: "新对话",
    status: "pending",
    model: "claude-sonnet-4.5",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messages: [],
  };
}

interface UseChatCreationOptions {
  /**
   * Task ID for the chat
   */
  taskId: string;
  /**
   * Whether this is a new chat
   */
  isNewChat?: boolean;
}

interface UseChatCreationReturn {
  /**
   * Current chat session
   */
  session: ChatSession | null;
  /**
   * Whether session is loading
   */
  isLoading: boolean;
  /**
   * Add a message to the session
   */
  addMessage: (content: string, role: MessageRole) => Promise<void>;
  /**
   * Update the model for the session
   */
  updateModel: (modelId: string) => void;
}

/**
 * Hook for managing chat creation and local session state
 *
 * Used on the chat creation/list page to:
 * - Create new chat sessions
 * - Manage local chat state
 * - Handle user messages and redirect to execution
 *
 * @example
 * ```tsx
 * const { session, addMessage } = useChatCreation({
 *   taskId: "task-123",
 *   isNewChat: true,
 * });
 * ```
 */
export function useChatCreation({
  taskId,
  isNewChat = false,
}: UseChatCreationOptions): UseChatCreationReturn {
  const [session, setSession] = React.useState<ChatSession | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  // Load session data on mount
  React.useEffect(() => {
    setIsLoading(true);
    // Simulate API delay
    const timer = setTimeout(() => {
      if (isNewChat) {
        setSession(createNewChatSession());
      } else if (taskId) {
        // TODO: Load existing session from API
        setSession(createNewChatSession());
      }
      setIsLoading(false);
    }, 100);

    return () => clearTimeout(timer);
  }, [taskId, isNewChat]);

  // Simulate AI streaming response
  const simulateAIResponse = React.useCallback(
    (userMessage: string) => {
      const aiMessageId = `msg-${Date.now()}`;
      const responseContent = `我理解你的���求了。让我分析一下"${userMessage}"这个问题。

## 分析结果

基于你提供的信息，我建议：

1. **第一步**: 仔细分析需求
2. **第二步**: 制定详细方案
3. **第三步**: 逐步实施

需要我详细展开某个部分吗？`;

      // Add empty AI message first
      const emptyMessage: ChatMessage = {
        id: aiMessageId,
        role: "assistant",
        content: "",
        status: "streaming",
        timestamp: new Date().toISOString(),
        metadata: {
          model: session?.model || "claude-sonnet-4.5",
          tokensUsed: 0,
          duration: 0,
        },
      };

      setSession((prev) => ({
        ...prev!,
        messages: [...prev!.messages, emptyMessage],
      }));

      // Simulate streaming
      let currentContent = "";
      const chunks = responseContent.split("");

      chunks.forEach((char, index) => {
        setTimeout(() => {
          currentContent += char;
          setSession((prev) => ({
            ...prev!,
            messages: prev!.messages.map((msg) =>
              msg.id === aiMessageId
                ? {
                    ...msg,
                    content: currentContent,
                    metadata: {
                      ...msg.metadata,
                      tokensUsed: currentContent.length,
                      duration: index * STREAMING_CHAR_DELAY,
                    },
                  }
                : msg,
            ),
          }));

          // Mark as completed on last character
          if (index === chunks.length - 1) {
            setSession((prev) => ({
              ...prev!,
              messages: prev!.messages.map((msg) =>
                msg.id === aiMessageId
                  ? { ...msg, status: "completed" as const }
                  : msg,
              ),
              updatedAt: new Date().toISOString(),
            }));
          }
        }, index * STREAMING_CHAR_DELAY);
      });
    },
    [session],
  );

  // Add a new message to the session
  const addMessage = React.useCallback(
    async (content: string, role: MessageRole) => {
      if (!session) return;

      // Add user message to local state
      const newMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        role,
        content,
        status: role === "user" ? "sent" : "streaming",
        timestamp: new Date().toISOString(),
      };

      setSession((prev) => ({
        ...prev!,
        messages: [...prev!.messages, newMessage],
        updatedAt: new Date().toISOString(),
        title:
          prev!.messages.length === 0
            ? content.slice(0, 50) + (content.length > 50 ? "..." : "")
            : prev!.title,
      }));

      // If user message, create execution session and redirect
      if (role === "user") {
        try {
          const response = await createSessionAction({ prompt: content });
          // Save user prompt to localStorage for execution page
          localStorage.setItem(`session_prompt_${response.sessionId}`, content);
          // Redirect to execution page
          window.location.href = `/chat/${response.sessionId}`;
        } catch (error) {
          console.error("[Chat] Failed to create session:", error);
        }
      } else {
        // If assistant message, simulate streaming response
        simulateAIResponse(content);
      }
    },
    [session, simulateAIResponse],
  );

  // Update session model
  const updateModel = React.useCallback((modelId: string) => {
    setSession((prev) => (prev ? { ...prev, model: modelId } : null));
  }, []);

  return {
    session,
    isLoading,
    addMessage,
    updateModel,
  };
}
