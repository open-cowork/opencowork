"use client";

import * as React from "react";
import { ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AssistantMessage } from "./messages/assistant-message";
import { UserMessage } from "./messages/user-message";
import type { ChatMessage } from "@/features/chat/types";

export interface ChatMessageListProps {
  messages: ChatMessage[];
  isTyping?: boolean;
}

export function ChatMessageList({ messages, isTyping }: ChatMessageListProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = React.useState(false);
  const [isUserScrolling, setIsUserScrolling] = React.useState(false);
  const lastMessageCountRef = React.useRef(messages.length);

  // Check if user has scrolled up
  const checkScrollPosition = React.useCallback(() => {
    if (!scrollAreaRef.current) return;

    const viewport = scrollAreaRef.current.querySelector(
      "[data-radix-scroll-area-viewport]",
    );
    if (!viewport) return;

    const { scrollTop, scrollHeight, clientHeight } = viewport;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

    // If user is more than 100px from bottom, consider them as scrolling up
    const isNearBottom = distanceFromBottom < 100;
    setIsUserScrolling(!isNearBottom);

    // Show scroll button if not near bottom
    setShowScrollButton(!isNearBottom);
  }, []);

  // Handle scroll events
  React.useEffect(() => {
    const scrollArea = scrollAreaRef.current;
    if (!scrollArea) return;

    const viewport = scrollArea.querySelector(
      "[data-radix-scroll-area-viewport]",
    );
    if (!viewport) return;

    let scrollTimeout: NodeJS.Timeout;
    const handleScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        checkScrollPosition();
      }, 100);
    };

    viewport.addEventListener("scroll", handleScroll);
    return () => {
      viewport.removeEventListener("scroll", handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [checkScrollPosition]);

  const prevIsTypingRef = React.useRef(isTyping);

  // Auto-scroll to bottom when new messages arrive (only if user is not scrolling)
  React.useEffect(() => {
    const hasNewMessages = messages.length > lastMessageCountRef.current;
    const isTypingStarted = isTyping && !prevIsTypingRef.current;

    lastMessageCountRef.current = messages.length;
    prevIsTypingRef.current = isTyping;

    if (
      scrollRef.current &&
      !isUserScrolling &&
      (hasNewMessages || isTypingStarted)
    ) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }

    // Show scroll button when new messages arrive while user is scrolling
    if (hasNewMessages && isUserScrolling) {
      setShowScrollButton(true);
    }
  }, [messages, isTyping, isUserScrolling]);

  // Scroll to bottom handler
  const scrollToBottom = React.useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
      setIsUserScrolling(false);
      setShowScrollButton(false);
    }
  }, []);

  if (messages.length === 0 && !isTyping) {
    return null;
  }

  return (
    <div className="h-full overflow-hidden relative">
      <ScrollArea ref={scrollAreaRef} className="h-full">
        <div className="px-6 py-6 space-y-4 w-full min-w-0 max-w-full">
          {messages.map((message) =>
            message.role === "user" ? (
              <UserMessage
                key={message.id}
                content={message.content}
                attachments={message.attachments}
              />
            ) : (
              <AssistantMessage key={message.id} message={message} />
            ),
          )}
          {isTyping && (
            <AssistantMessage
              message={{
                id: "typing",
                role: "assistant",
                content: "",
                status: "streaming",
                timestamp: new Date().toISOString(),
              }}
            />
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Scroll to bottom button */}
      {showScrollButton && (
        <div className="absolute bottom-6 right-6 z-10 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <Button
            variant="outline"
            size="icon"
            onClick={scrollToBottom}
            className="h-10 w-10 rounded-full shadow-lg hover:shadow-xl transition-shadow bg-background"
            title="跳转到最新消息"
          >
            <ArrowDown className="h-5 w-5" />
          </Button>
        </div>
      )}
    </div>
  );
}
