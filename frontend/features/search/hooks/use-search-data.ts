"use client";

import * as React from "react";
import type {
  SearchResultTask,
  SearchResultProject,
  SearchResultMessage,
} from "@/features/search/types";
// import { listSessionsAction } from "@/features/chat/actions/query-actions";

/**
 * Hook for fetching and aggregating search data
 * TODO: Search API temporarily disabled
 */
export function useSearchData() {
  const [tasks] = React.useState<SearchResultTask[]>([]);
  const [isLoading] = React.useState(false);
  const [error] = React.useState<Error | null>(null);

  // TODO: Search API temporarily disabled
  const fetchData = React.useCallback(async () => {
    // API fetch disabled - return empty data
    return;
  }, []);

  const projects = React.useMemo<SearchResultProject[]>(() => [], []);
  const messages = React.useMemo<SearchResultMessage[]>(() => [], []);

  return {
    tasks,
    projects,
    messages,
    isLoading,
    error,
    refetch: fetchData,
    disabled: true, // Flag to indicate search is disabled
  };
}
