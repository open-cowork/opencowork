"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getToolExecutionsAction } from "@/features/chat/actions/query-actions";
import type { ToolExecutionResponse } from "@/features/chat/types";

interface UseToolExecutionsOptions {
  sessionId?: string;
  isActive?: boolean;
  pollingIntervalMs?: number;
  limit?: number;
}

export function useToolExecutions({
  sessionId,
  isActive = false,
  pollingIntervalMs = 2000,
  limit = 500,
}: UseToolExecutionsOptions) {
  const [executions, setExecutions] = useState<ToolExecutionResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const lastSessionIdRef = useRef<string | null>(null);
  const hasLoadedOnceRef = useRef(false);
  const requestSeqRef = useRef(0);

  const fetchOnce = useCallback(
    async (replace = false) => {
      if (!sessionId) return;
      const seq = (requestSeqRef.current += 1);
      const shouldShowLoading = !hasLoadedOnceRef.current && replace;
      if (shouldShowLoading) {
        setIsLoading(true);
      }

      const offset = replace ? 0 : executions.length;

      try {
        const data = await getToolExecutionsAction({
          sessionId,
          limit,
          offset,
        });
        if (seq !== requestSeqRef.current) return;

        if (replace) {
          setExecutions(data);
        } else {
          setExecutions((prev) => [...prev, ...data]);
        }

        setHasMore(data.length === limit);
        setError(null);
      } catch (err) {
        if (seq !== requestSeqRef.current) return;
        setError(err as Error);
      } finally {
        if (seq !== requestSeqRef.current) return;
        setIsLoading(false);
        setIsLoadingMore(false);
        hasLoadedOnceRef.current = true;
      }
    },
    [limit, sessionId, executions.length],
  );

  const loadMore = useCallback(() => {
    if (isLoadingMore || !hasMore || !sessionId) return;
    setIsLoadingMore(true);
    void fetchOnce(false);
  }, [fetchOnce, hasMore, isLoadingMore, sessionId]);

  // Reset state when session changes.
  useEffect(() => {
    if (!sessionId) return;
    if (lastSessionIdRef.current === sessionId) return;
    lastSessionIdRef.current = sessionId;
    hasLoadedOnceRef.current = false;
    requestSeqRef.current += 1;
    setExecutions([]);
    setError(null);
    setIsLoading(false);
    setIsLoadingMore(false);
    setHasMore(true);
    void fetchOnce(true);
  }, [fetchOnce, sessionId]);

  // Poll while active.
  useEffect(() => {
    if (!sessionId) return;
    if (!isActive) return;
    const id = setInterval(() => {
      void fetchOnce(true);
    }, pollingIntervalMs);
    return () => clearInterval(id);
  }, [fetchOnce, isActive, pollingIntervalMs, sessionId]);

  return {
    executions,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    refetch: () => fetchOnce(true),
    loadMore,
  };
}
