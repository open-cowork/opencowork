"use client";

import * as React from "react";
import { getItem, setItem } from "@/lib/storage/core";

export type BackendOption = "claude-code";

const BACKEND_STORAGE_KEY = "poco.settings.backend";

function readStoredBackend(): BackendOption {
  const stored = getItem("local", BACKEND_STORAGE_KEY);
  return stored === "claude-code" ? "claude-code" : "claude-code";
}

export function useBackendPreference() {
  const [backend, setBackendState] =
    React.useState<BackendOption>("claude-code");

  React.useEffect(() => {
    setBackendState(readStoredBackend());
  }, []);

  const setBackend = React.useCallback((nextBackend: BackendOption) => {
    setBackendState(nextBackend);
    setItem("local", BACKEND_STORAGE_KEY, nextBackend);
  }, []);

  return {
    backend,
    setBackend,
  };
}
