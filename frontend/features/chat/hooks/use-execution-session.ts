import { useState, useCallback, useEffect, useRef } from "react";
import { getExecutionSessionAction } from "@/features/chat/actions/query-actions";
import { useAdaptivePolling } from "./use-adaptive-polling";
import type { ExecutionSession } from "@/features/chat/types";

interface UseExecutionSessionOptions {
  /**
   * Session ID to poll
   */
  sessionId: string;
  /**
   * Initial polling interval in milliseconds
   * @default NEXT_PUBLIC_SESSION_POLLING_INTERVAL from env (5000ms)
   */
  pollingInterval?: number;
  /**
   * Whether to enable adaptive backoff on errors
   * @default true
   */
  enableBackoff?: boolean;
}

interface UseExecutionSessionReturn {
  /**
   * Current session data
   */
  session: ExecutionSession | null;
  /**
   * Whether initial data is loading
   */
  isLoading: boolean;
  /**
   * Error from last fetch attempt
   */
  error: Error | null;
  /**
   * Current polling interval (may be adjusted by backoff)
   */
  pollingInterval: number;
  /**
   * Number of consecutive polling errors
   */
  errorCount: number;
  /**
   * Manually refetch session data
   */
  refetch: () => Promise<void>;
  /**
   * Update local session state
   */
  updateSession: (updates: Partial<ExecutionSession>) => void;
}

/**
 * Hook for managing execution session with adaptive polling
 *
 * Features:
 * - Fetches session data from API
 * - Automatically polls while session is active
 * - Adaptive polling with exponential backoff on errors
 * - Persists user_prompt across session updates
 * - Polling interval controlled by NEXT_PUBLIC_SESSION_POLLING_INTERVAL env variable
 *
 * @example
 * ```tsx
 * const { session, isLoading, refetch, updateSession } = useExecutionSession({
 *   sessionId: "abc-123",
 *   pollingInterval: 5000, // Optional: override default from env
 *   enableBackoff: true,
 * });
 * ```
 */
export function useExecutionSession({
  sessionId,
  pollingInterval = Number(process.env.NEXT_PUBLIC_SESSION_POLLING_INTERVAL) ||
    6000,
  enableBackoff = true,
}: UseExecutionSessionOptions): UseExecutionSessionReturn {
  const [session, setSession] = useState<ExecutionSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Track previous progress for efficient API calls
  const progressRef = useRef<number>(0);

  // Fetch session data
  const fetchSession = useCallback(async () => {
    if (!sessionId) return;

    try {
      const currentProgress = progressRef.current;
      const updatedSession = await getExecutionSessionAction({
        sessionId,
        currentProgress,
      });

      // Update ref for next poll
      progressRef.current = updatedSession.progress || 0;

      setSession((prevSession) => {
        // Handle user_prompt persistence inside the state update
        if (!prevSession) {
          const storedPrompt = localStorage.getItem(
            `session_prompt_${sessionId}`,
          );
          if (storedPrompt) {
            updatedSession.user_prompt = storedPrompt;
          }
        } else if (prevSession.user_prompt) {
          updatedSession.user_prompt = prevSession.user_prompt;
        }
        return updatedSession;
      });
      setError(null);
    } catch (err) {
      console.error("[useExecutionSession] Failed to fetch session:", err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  // Initial fetch on mount
  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  // Adaptive polling while session is active
  // Poll only when session is active (or initial load)
  const isSessionActive =
    !!sessionId &&
    (!session || ["accepted", "running"].includes(session.status));

  // Log when polling stops
  useEffect(() => {
    if (
      session &&
      ["completed", "failed", "stopped"].includes(session.status)
    ) {
      console.log(
        `%c[Polling] Stopped for session ${sessionId} (Status: ${session.status})`,
        "color: #f59e0b; font-weight: bold;",
      );
    }
  }, [session, sessionId]);

  const { currentInterval, errorCount, trigger } = useAdaptivePolling({
    callback: fetchSession,
    isActive: isSessionActive,
    interval: pollingInterval,
    enableBackoff,
  });

  // Update local session state
  const updateSession = useCallback((updates: Partial<ExecutionSession>) => {
    setSession((prev) => (prev ? { ...prev, ...updates } : null));
  }, []);

  return {
    session,
    isLoading,
    error,
    pollingInterval: currentInterval,
    errorCount,
    refetch: trigger,
    updateSession,
  };
}
