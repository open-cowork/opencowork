"use client";

import * as React from "react";
import { MessageSquare, Loader2 } from "lucide-react";
import { ChatMessageList } from "../../chat/chat-message-list";
import { TodoList } from "./todo-list";
import { StatusBar } from "./status-bar";
import { PendingMessageList } from "./pending-message-list";
import { ChatInput } from "./chat-input";
import { UserInputRequestCard } from "./user-input-request-card";
import { PanelHeader } from "@/components/shared/panel-header";
import { useChatMessages } from "./hooks/use-chat-messages";
import { usePendingMessages } from "./hooks/use-pending-messages";
import { useUserInputRequests } from "./hooks/use-user-input-requests";
import type {
  ExecutionSession,
  StatePatch,
  InputFile,
} from "@/features/chat/types";
import { useT } from "@/lib/i18n/client";

interface ChatPanelProps {
  session: ExecutionSession | null;
  statePatch?: StatePatch;
  progress?: number;
  currentStep?: string;
  updateSession: (newSession: Partial<ExecutionSession>) => void;
  onIconClick?: () => void;
}

/**
 * Chat Panel Container Component
 *
 * Responsibilities:
 * - Compose message and pending message hooks
 * - Coordinate between active/idle session states
 * - Render UI layout
 *
 * Delegates to:
 * - useChatMessages: Message loading, polling, display
 * - usePendingMessages: Queue management, auto-send
 * - ChatInput: Input handling
 * - ChatMessageList: Message rendering
 * - TodoList/StatusBar: State display
 */
export function ChatPanel({
  session,
  statePatch,
  progress = 0,
  currentStep,
  updateSession,
  onIconClick,
}: ChatPanelProps) {
  const { t } = useT("translation");

  // Message management hook
  const {
    displayMessages,
    isLoadingHistory,
    showTypingIndicator,
    sendMessage,
  } = useChatMessages({ session });

  // Pending message queue hook
  const {
    pendingMessages,
    addPendingMessage,
    sendPendingMessage,
    modifyPendingMessage,
    deletePendingMessage,
  } = usePendingMessages({ session, sendMessage });

  // Determine if session is running/active
  const isSessionActive =
    session?.status === "running" || session?.status === "accepted";

  const {
    requests: userInputRequests,
    isLoading: isSubmittingUserInput,
    submitAnswer: submitUserInputAnswer,
  } = useUserInputRequests(session?.session_id, isSessionActive);

  const activeUserInput = userInputRequests[0];

  // Handle send from input
  const handleSend = async (content: string, attachments?: InputFile[]) => {
    if (!session?.session_id) return;

    if (activeUserInput) {
      return;
    }

    if (isSessionActive) {
      // Session is running, add to pending queue
      addPendingMessage(content, attachments);
    } else {
      // Session is idle, send immediately and mark as active
      if (session.status !== "running" && session.status !== "accepted") {
        updateSession({ status: "accepted" });
      }
      await sendMessage(content, attachments);
    }
  };

  // Condition checks for UI sections
  const hasTodos = statePatch?.todos && statePatch.todos.length > 0;
  const hasSkills =
    statePatch?.skills_used && statePatch.skills_used.length > 0;
  const hasMcp = statePatch?.mcp_status && statePatch.mcp_status.length > 0;

  return (
    <div className="flex flex-col h-full bg-background min-w-0">
      {/* Header */}
      <PanelHeader
        icon={MessageSquare}
        title={
          session?.task_name ||
          session?.new_message?.title ||
          t("chat.executionTitle")
        }
        description={t("chat.emptyStateDesc")}
        onIconClick={onIconClick}
      />

      {/* Top Section: Todo List (full width) */}
      {hasTodos && (
        <div className="px-4 pt-4 pb-2 shrink-0">
          <TodoList
            todos={statePatch.todos!}
            progress={progress}
            currentStep={currentStep}
          />
        </div>
      )}

      {/* Message list */}
      <div className="flex-1 min-h-0 px-4">
        {isLoadingHistory ? (
          <div className="flex h-full w-full items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/20" />
          </div>
        ) : (
          <ChatMessageList
            messages={displayMessages}
            isTyping={showTypingIndicator}
          />
        )}
      </div>

      {/* Status Bar - Skills and MCP */}
      {(hasSkills || hasMcp) && (
        <StatusBar
          skills={statePatch?.skills_used}
          mcpStatuses={statePatch?.mcp_status}
        />
      )}

      {/* Pending Messages Queue */}
      {pendingMessages.length > 0 && (
        <PendingMessageList
          messages={pendingMessages}
          onSend={sendPendingMessage}
          onModify={modifyPendingMessage}
          onDelete={deletePendingMessage}
        />
      )}

      {activeUserInput && (
        <div className="px-4 pb-3">
          <UserInputRequestCard
            request={activeUserInput}
            isSubmitting={isSubmittingUserInput}
            onSubmit={(answers) =>
              submitUserInputAnswer(activeUserInput.id, answers)
            }
          />
        </div>
      )}

      {/* Input */}
      <ChatInput
        onSend={handleSend}
        disabled={!session?.session_id || !!activeUserInput}
      />
    </div>
  );
}
