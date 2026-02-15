export const STORAGE_PREFIX = "poco.";

export const CAPABILITIES_LAST_VIEW_KEY = `${STORAGE_PREFIX}capabilities.last_view`;
export const CAPABILITIES_PENDING_VIEW_KEY = `${STORAGE_PREFIX}capabilities.pending_view`;

export function sessionPromptKey(sessionId: string): string {
  return `${STORAGE_PREFIX}sessions.prompt.${sessionId}`;
}

// Backward compatibility with older builds.
export function legacySessionPromptKey(sessionId: string): string {
  return `session_prompt_${sessionId}`;
}
