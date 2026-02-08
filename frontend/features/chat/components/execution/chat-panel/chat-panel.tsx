"use client";

import * as React from "react";
import { MessageSquare, Loader2, Pencil } from "lucide-react";
import { ChatMessageList } from "../../chat/chat-message-list";
import { TodoList } from "./todo-list";
import { StatusBar } from "./status-bar";
import { PendingMessageList } from "./pending-message-list";
import { ChatInput, type ChatInputRef } from "./chat-input";
import { UserInputRequestCard } from "./user-input-request-card";
import { PlanApprovalCard } from "./plan-approval-card";
import {
  PanelHeader,
  PanelHeaderAction,
} from "@/components/shared/panel-header";
import { useChatMessages } from "./hooks/use-chat-messages";
import { usePendingMessages } from "./hooks/use-pending-messages";
import { useUserInputRequests } from "./hooks/use-user-input-requests";
import {
  cancelSessionAction,
  renameSessionTitleAction,
} from "@/features/chat/actions/session-actions";
import { RenameTaskDialog } from "@/features/projects/components/rename-task-dialog";
import type {
  ExecutionSession,
  StatePatch,
  InputFile,
} from "@/features/chat/types";
import { useT } from "@/lib/i18n/client";
import { toast } from "sonner";
import { useTaskHistoryContext } from "@/features/projects/contexts/task-history-context";

interface ChatPanelProps {
  session: ExecutionSession | null;
  statePatch?: StatePatch;
  progress?: number;
  currentStep?: string;
  updateSession: (newSession: Partial<ExecutionSession>) => void;
  onIconClick?: () => void;
  hideHeader?: boolean;
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
  hideHeader = false,
}: ChatPanelProps) {
  const { t } = useT("translation");
  const { refreshTasks } = useTaskHistoryContext();
  const [isCancelling, setIsCancelling] = React.useState(false);
  const [isRenameDialogOpen, setIsRenameDialogOpen] = React.useState(false);
  const inputRef = React.useRef<ChatInputRef>(null);

  // Message management hook
  const {
    displayMessages,
    isLoadingHistory,
    showTypingIndicator,
    sendMessage,
    internalContextsByUserMessageId,
    runUsageByUserMessageId,
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

  const isSessionCancelable =
    session?.status === "running" || session?.status === "accepted";

  const handleCancel = React.useCallback(async () => {
    if (!session?.session_id) return;
    if (!isSessionCancelable) return;
    if (isCancelling) return;

    const prevStatus = session.status;
    setIsCancelling(true);
    // Optimistically mark as terminal so polling/streaming stops immediately.
    updateSession({ status: "canceled" });

    try {
      await cancelSessionAction({ sessionId: session.session_id });
    } catch (error) {
      console.error("[ChatPanel] Failed to cancel session:", error);
      // Best-effort revert so the UI doesn't get stuck in a wrong terminal state.
      updateSession({ status: prevStatus });
    } finally {
      setIsCancelling(false);
    }
  }, [
    isCancelling,
    isSessionCancelable,
    session?.session_id,
    session?.status,
    updateSession,
  ]);

  const handleRename = React.useCallback(
    async (newTitle: string) => {
      if (!session?.session_id) return;
      try {
        await renameSessionTitleAction({
          sessionId: session.session_id,
          title: newTitle,
        });
        updateSession({ title: newTitle });
        toast.success(t("task.toasts.renamed"));
        await refreshTasks();
      } catch (error) {
        console.error("[ChatPanel] Failed to rename session title:", error);
        toast.error(t("task.toasts.renameFailed"));
      }
    },
    [refreshTasks, session?.session_id, t, updateSession],
  );

  // Handle edit message - load content into input
  const handleEditMessage = React.useCallback((content: string) => {
    inputRef.current?.setValueAndFocus(content);
  }, []);

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
  // Check for config snapshot or runtime data
  const hasConfigSnapshot =
    session?.config_snapshot &&
    ((session.config_snapshot.mcp_server_ids &&
      session.config_snapshot.mcp_server_ids.length > 0) ||
      session.config_snapshot.browser_enabled === true ||
      (session.config_snapshot.skill_ids &&
        session.config_snapshot.skill_ids.length > 0));
  const hasSkills =
    statePatch?.skills_used && statePatch.skills_used.length > 0;
  const hasMcp = statePatch?.mcp_status && statePatch.mcp_status.length > 0;
  const hasBrowser = Boolean(
    session?.config_snapshot?.browser_enabled || statePatch?.browser?.enabled,
  );

  return (
    <div className="flex flex-col h-full bg-background min-w-0">
      {/* Header */}
      {!hideHeader ? (
        <PanelHeader
          icon={MessageSquare}
          title={
            session?.task_name ||
            session?.new_message?.title ||
            t("chat.executionTitle")
          }
          description={session?.title || t("chat.emptyStateDesc")}
          onIconClick={onIconClick}
          action={
            session?.session_id ? (
              <PanelHeaderAction
                onClick={() => setIsRenameDialogOpen(true)}
                title={t("sidebar.rename")}
              >
                <Pencil className="size-4" />
              </PanelHeaderAction>
            ) : null
          }
        />
      ) : null}

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
      <div className="flex-1 min-h-0 min-w-0 overflow-hidden px-4">
        {isLoadingHistory ? (
          <div className="flex h-full w-full items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/20" />
          </div>
        ) : (
          <ChatMessageList
            messages={displayMessages}
            isTyping={showTypingIndicator}
            internalContextsByUserMessageId={internalContextsByUserMessageId}
            runUsageByUserMessageId={runUsageByUserMessageId}
            onEditMessage={handleEditMessage}
          />
        )}
      </div>

      {/* Status Bar - Skills and MCP */}
      {(hasConfigSnapshot || hasSkills || hasMcp || hasBrowser) && (
        <StatusBar
          configSnapshot={session?.config_snapshot}
          skills={statePatch?.skills_used}
          mcpStatuses={statePatch?.mcp_status}
          browser={statePatch?.browser}
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
          {activeUserInput.tool_name === "ExitPlanMode" ? (
            <PlanApprovalCard
              request={activeUserInput}
              isSubmitting={isSubmittingUserInput}
              onApprove={() =>
                submitUserInputAnswer(activeUserInput.id, { approved: "true" })
              }
              onReject={() =>
                submitUserInputAnswer(activeUserInput.id, { approved: "false" })
              }
            />
          ) : (
            <UserInputRequestCard
              request={activeUserInput}
              isSubmitting={isSubmittingUserInput}
              onSubmit={(answers) =>
                submitUserInputAnswer(activeUserInput.id, answers)
              }
            />
          )}
        </div>
      )}

      {/* Input */}
      <ChatInput
        ref={inputRef}
        onSend={handleSend}
        onCancel={handleCancel}
        canCancel={isSessionCancelable || isCancelling}
        isCancelling={isCancelling}
        disabled={!session?.session_id || !!activeUserInput || isCancelling}
      />

      <RenameTaskDialog
        open={isRenameDialogOpen}
        onOpenChange={setIsRenameDialogOpen}
        taskName={session?.title || ""}
        onRename={handleRename}
      />
    </div>
  );
}
