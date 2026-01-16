"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { History, MessageSquare } from "lucide-react";
import { listSessionsAction } from "@/features/chat/actions/query-actions";
import type { SessionResponse } from "@/features/chat/types";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface ConversationHistoryProps {
  // Props reserved for future use
}

export function ConversationHistory({}: ConversationHistoryProps) {
  const [history, setHistory] = React.useState<SessionResponse[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function fetchHistory() {
      try {
        const sessions = await listSessionsAction({ limit: 20 });
        setHistory(sessions);
      } catch (error) {
        console.error("Failed to fetch history:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, []);

  return (
    <Card className="overflow-hidden h-full">
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <History className="size-4 text-foreground" />
          <span>对话历史</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0">
        <ScrollArea className="h-[100px]">
          <div className="space-y-2 pr-2">
            {loading ? (
              <p className="text-xs text-muted-foreground p-2">加载中...</p>
            ) : history.length === 0 ? (
              <p className="text-xs text-muted-foreground p-2">暂无历史记录</p>
            ) : (
              history.map((item) => (
                <div
                  key={item.session_id}
                  className="flex items-start gap-2 p-2 rounded-md bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-center size-6 rounded bg-muted shrink-0 mt-0.5">
                    <MessageSquare className="size-3 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-medium truncate">
                        {/* Fallback title using ID since backend doesn't provide title yet */}
                        会话 {item.session_id.substring(0, 6)}
                      </p>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {formatDistanceToNow(new Date(item.updated_at), {
                          addSuffix: true,
                          locale: zhCN,
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      状态: {item.status}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
