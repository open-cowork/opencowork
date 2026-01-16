import { useState, useEffect, useCallback, useRef } from "react";
import { getExecutionSessionAction } from "@/features/chat/actions/query-actions";
import type { ExecutionSession } from "@/features/chat/types";

// Session polling interval (configurable via env, default 2500ms)
const POLLING_INTERVAL = parseInt(
  process.env.NEXT_PUBLIC_SESSION_POLLING_INTERVAL || "2500",
  10,
);

export function useChat(sessionId: string) {
  const [session, setSession] = useState<ExecutionSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const sessionRef = useRef<ExecutionSession | null>(null);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  const fetchSession = useCallback(async () => {
    if (!sessionId) return;

    try {
      const currentSession = sessionRef.current;
      const currentProgress = currentSession?.progress || 0;
      const updatedSession = await getExecutionSessionAction({
        sessionId,
        currentProgress,
      });

      // Handle user prompt persistence (logic from original hook)
      if (!currentSession) {
        const storedPrompt = localStorage.getItem(
          `session_prompt_${sessionId}`,
        );
        if (storedPrompt) {
          updatedSession.user_prompt = storedPrompt;
        }
      } else if (currentSession.user_prompt) {
        updatedSession.user_prompt = currentSession.user_prompt;
      }

      setSession(updatedSession);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch session:", err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  // Initial load
  useEffect(() => {
    fetchSession();
  }, [fetchSession]); // Run once on mount

  // Polling
  useEffect(() => {
    const shouldPoll =
      session?.status === "running" || session?.status === "accepted";
    if (!shouldPoll) return;

    const interval = setInterval(fetchSession, POLLING_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchSession, session?.status]);

  const updateSession = useCallback((newSession: Partial<ExecutionSession>) => {
    setSession((prev) => (prev ? { ...prev, ...newSession } : null));
  }, []);

  return {
    session,
    isLoading,
    error,
    refetch: fetchSession,
    updateSession,
  };
}
