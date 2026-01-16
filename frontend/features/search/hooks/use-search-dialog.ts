"use client";

import * as React from "react";

/**
 * Hook for managing global search dialog state and keyboard shortcuts
 * Supports Cmd+K (Mac) and Ctrl+K (Windows/Linux)
 */
export function useSearchDialog() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchKey, setSearchKey] = React.useState("⌘K"); // Default to Mac

  // Set platform-specific keyboard shortcut on mount (client-side only)
  React.useEffect(() => {
    const isMac = navigator.userAgent.includes("Mac");
    setSearchKey(isMac ? "⌘K" : "⌃K");
  }, []);

  // Keyboard shortcut listener
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K (Mac) or Ctrl+K (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return {
    isSearchOpen: isOpen,
    setIsSearchOpen: setIsOpen,
    searchKey,
  };
}
