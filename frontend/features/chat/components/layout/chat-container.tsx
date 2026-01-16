"use client";

import * as React from "react";

import { useChatCreation } from "@/features/chat/hooks/use-chat-creation";
import { AVAILABLE_MODELS } from "@/features/home/model/constants";
import type { ModelInfo } from "@/types";

import { ChatHeader } from "../chat/chat-header";
import { ChatMessageList } from "../chat/chat-message-list";
import { ChatInput } from "../chat/chat-input";

export interface ChatContainerProps {
  taskId?: string;
  isNewChat?: boolean;
}

export function ChatContainer({ taskId, isNewChat }: ChatContainerProps) {
  const { session, isLoading, addMessage, updateModel } = useChatCreation({
    taskId: taskId || "",
    isNewChat: isNewChat || false,
  });
  const [inputValue, setInputValue] = React.useState("");
  const [selectedModel, setSelectedModel] = React.useState<ModelInfo>(
    AVAILABLE_MODELS[0],
  );
  const [isSending, setIsSending] = React.useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    );
  }

  const handleSend = async () => {
    if (!inputValue.trim()) return;
    setIsSending(true);
    await addMessage(inputValue, "user");
    setInputValue("");
    // We don't set isSending(false) because we expect a redirect or the hook handles it
  };

  const handleModelChange = (model: ModelInfo) => {
    setSelectedModel(model);
    updateModel(model.id);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <ChatHeader
        model={selectedModel}
        onModelChange={handleModelChange}
        title={session?.title}
      />
      <ChatMessageList
        messages={session?.messages || []}
        isTyping={isSending}
      />
      <ChatInput
        value={inputValue}
        onChange={setInputValue}
        onSend={handleSend}
        disabled={false}
      />
    </div>
  );
}
