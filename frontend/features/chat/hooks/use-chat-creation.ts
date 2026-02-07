import * as React from "react";
import { STREAMING_CHAR_DELAY } from "@/features/home/model/constants";
import { createSessionAction } from "@/features/chat/actions/session-actions";
import { fallbackLng, languages } from "@/lib/i18n/settings";
import type {
  ChatMessage,
  ChatSession,
  MessageRole,
  InputFile,
} from "@/features/chat/types";

/**
 * Create a new empty chat session
 */
function createNewChatSession(): ChatSession {
  return {
    id: `session-${Date.now()}`,
    taskId: `task-${Date.now()}`,
    title: "New Conversation",
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
  addMessage: (
    content: string,
    role: MessageRole,
    attachments?: InputFile[],
  ) => Promise<void>;
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
      const responseContent = `I understand your request. Let me analyze "${userMessage}".

## Analysis

Based on the information you provided, I suggest:

1. **Step 1**: Analyze the requirements carefully
2. **Step 2**: Create a detailed plan
3. **Step 3**: Implement gradually

Would you like me to expand on any part?`;

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
    async (content: string, role: MessageRole, attachments?: InputFile[]) => {
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
          const config =
            attachments && attachments.length > 0
              ? { input_files: attachments }
              : undefined;
          const response = await createSessionAction({
            prompt: content,
            config,
          });
          // Save user prompt to localStorage for execution page
          localStorage.setItem(`session_prompt_${response.sessionId}`, content);
          // Redirect to execution page
          const firstSegment = window.location.pathname.split("/")[1] || "";
          const lng = languages.includes(firstSegment)
            ? firstSegment
            : fallbackLng;
          window.location.href = `/${lng}/chat/${response.sessionId}`;
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
