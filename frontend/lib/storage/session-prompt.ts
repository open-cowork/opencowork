import { getItem, removeItem, setItem } from "@/lib/storage/core";
import { legacySessionPromptKey, sessionPromptKey } from "@/lib/storage/keys";

export function getSessionPrompt(sessionId: string): string | null {
  const key = sessionPromptKey(sessionId);
  const current = getItem("local", key);
  if (current) return current;

  // Backward compatibility: try legacy key and migrate.
  const legacyKey = legacySessionPromptKey(sessionId);
  const legacy = getItem("local", legacyKey);
  if (!legacy) return null;

  setSessionPrompt(sessionId, legacy);
  removeItem("local", legacyKey);
  return legacy;
}

export function setSessionPrompt(sessionId: string, prompt: string): void {
  setItem("local", sessionPromptKey(sessionId), prompt);
}

export function removeSessionPrompt(sessionId: string): void {
  removeItem("local", sessionPromptKey(sessionId));
  // Best-effort: also remove legacy key.
  removeItem("local", legacySessionPromptKey(sessionId));
}
