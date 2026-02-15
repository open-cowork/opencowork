"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type RefObject,
} from "react";

import { slashCommandsService } from "@/features/capabilities/slash-commands/services/slash-commands-service";
import type { SlashCommand } from "@/features/capabilities/slash-commands/types";
import { logger } from "@/lib/logger";

export type SlashCommandSuggestionSource = "builtin" | "custom";

export interface SlashCommandSuggestion {
  command: string;
  name: string;
  description?: string | null;
  argument_hint?: string | null;
  source: SlashCommandSuggestionSource;
}

const BUILTIN_COMMANDS: SlashCommandSuggestion[] = [
  { command: "/compact", name: "compact", source: "builtin" },
  { command: "/clear", name: "clear", source: "builtin" },
  { command: "/help", name: "help", source: "builtin" },
];

type TokenInfo = {
  token: string;
  start: number;
  end: number;
  hasArgs: boolean;
};

function extractToken(value: string): TokenInfo | null {
  const leading = value.match(/^\s*/)?.[0].length ?? 0;
  if (value.slice(leading, leading + 1) !== "/") return null;

  let end = leading;
  while (end < value.length && !/\s/.test(value[end] || "")) {
    end += 1;
  }
  const token = value.slice(leading, end);
  if (!token.startsWith("/")) return null;

  const hasArgs = end < value.length && /\s/.test(value[end] || "");
  return { token, start: leading, end, hasArgs };
}

type UseSlashCommandAutocompleteParams = {
  value: string;
  onChange: (next: string) => void;
  textareaRef?: RefObject<HTMLTextAreaElement | null>;
};

export function useSlashCommandAutocomplete({
  value,
  onChange,
  textareaRef,
}: UseSlashCommandAutocompleteParams) {
  const [customCommands, setCustomCommands] = useState<SlashCommand[]>([]);
  const [dismissedToken, setDismissedToken] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const list = await slashCommandsService.list({ revalidate: 0 });
        if (cancelled) return;
        setCustomCommands(list);
      } catch (error) {
        // Autocomplete should be best-effort and never break chat input showing/sending.
        logger.warn("[SlashCommands] autocomplete list failed", error);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const tokenInfo = useMemo(() => extractToken(value), [value]);

  const suggestions: SlashCommandSuggestion[] = useMemo(() => {
    const enabledCustom: SlashCommandSuggestion[] = customCommands
      .filter((c) => c.enabled)
      .map((c) => ({
        command: `/${c.name}`,
        name: c.name,
        description: c.description,
        argument_hint: c.argument_hint,
        source: "custom" as const,
      }));

    const merged = [...BUILTIN_COMMANDS, ...enabledCustom];
    const unique = new Map<string, SlashCommandSuggestion>();
    for (const item of merged) {
      unique.set(item.command, item);
    }
    return Array.from(unique.values()).sort((a, b) =>
      a.command.localeCompare(b.command),
    );
  }, [customCommands]);

  const filtered = useMemo(() => {
    if (!tokenInfo) return [];
    if (tokenInfo.hasArgs) return [];
    const prefix = tokenInfo.token.toLowerCase();
    return suggestions.filter((s) =>
      s.command.toLowerCase().startsWith(prefix),
    );
  }, [suggestions, tokenInfo]);

  const normalizedActiveIndex = useMemo(() => {
    if (filtered.length <= 0) return 0;
    return (
      ((activeIndex % filtered.length) + filtered.length) % filtered.length
    );
  }, [activeIndex, filtered.length]);

  const isExactSingleMatch = useMemo(() => {
    if (!tokenInfo) return false;
    const trimmed = value.trim();
    return filtered.length === 1 && filtered[0]?.command === trimmed;
  }, [filtered, tokenInfo, value]);

  const isOpen = Boolean(
    tokenInfo &&
    !tokenInfo.hasArgs &&
    tokenInfo.token.length >= 1 &&
    filtered.length > 0 &&
    dismissedToken !== tokenInfo.token &&
    !isExactSingleMatch,
  );

  const applySelection = useCallback(
    (index: number) => {
      if (!tokenInfo) return;
      const item = filtered[index];
      if (!item) return;

      const before = value.slice(0, tokenInfo.start);
      const after = value.slice(tokenInfo.end);
      const insertSpace = tokenInfo.end === value.length ? " " : "";
      const next = `${before}${item.command}${insertSpace}${after}`;
      onChange(next);
      setDismissedToken(item.command);

      if (textareaRef?.current) {
        const cursorPos = (before + item.command + insertSpace).length;
        requestAnimationFrame(() => {
          textareaRef.current?.focus();
          textareaRef.current?.setSelectionRange(cursorPos, cursorPos);
        });
      }
    },
    [filtered, onChange, textareaRef, tokenInfo, value],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>): boolean => {
      if (!isOpen) return false;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((prev) => (prev + 1) % filtered.length);
        return true;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex(
          (prev) => (prev - 1 + filtered.length) % filtered.length,
        );
        return true;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        if (tokenInfo) setDismissedToken(tokenInfo.token);
        return true;
      }
      if (e.key === "Tab") {
        e.preventDefault();
        applySelection(normalizedActiveIndex);
        return true;
      }
      if (e.key === "Enter" && !e.shiftKey) {
        // Only autocomplete on Enter when the current token isn't already an exact match.
        const trimmed = value.trim();
        const isExact = filtered.some((s) => s.command === trimmed);
        if (!isExact) {
          e.preventDefault();
          applySelection(normalizedActiveIndex);
          return true;
        }
      }

      return false;
    },
    [applySelection, filtered, isOpen, normalizedActiveIndex, tokenInfo, value],
  );

  return {
    isOpen,
    tokenInfo,
    suggestions: filtered,
    activeIndex: normalizedActiveIndex,
    setActiveIndex,
    applySelection,
    handleKeyDown,
    dismiss: () => {
      if (tokenInfo) setDismissedToken(tokenInfo.token);
    },
  };
}
