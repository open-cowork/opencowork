import { logger } from "@/lib/logger";

export type StorageKind = "local" | "session";

function resolveStorage(kind: StorageKind): Storage | null {
  if (typeof window === "undefined") return null;

  try {
    return kind === "local" ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

export function getItem(kind: StorageKind, key: string): string | null {
  const storage = resolveStorage(kind);
  if (!storage) return null;

  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

export function setItem(kind: StorageKind, key: string, value: string): void {
  const storage = resolveStorage(kind);
  if (!storage) return;

  try {
    storage.setItem(key, value);
  } catch (error) {
    logger.warn(`[Storage] Failed to set item (${kind})`, { key, error });
  }
}

export function removeItem(kind: StorageKind, key: string): void {
  const storage = resolveStorage(kind);
  if (!storage) return;

  try {
    storage.removeItem(key);
  } catch (error) {
    logger.warn(`[Storage] Failed to remove item (${kind})`, { key, error });
  }
}
