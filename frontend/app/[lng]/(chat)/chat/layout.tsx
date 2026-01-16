import { ChatLayoutClient } from "@/features/chat/components/layout/chat-layout-client";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ChatLayoutClient>{children}</ChatLayoutClient>;
}
