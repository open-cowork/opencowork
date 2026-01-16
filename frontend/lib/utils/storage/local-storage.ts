/**
 * LocalStorage封装，带类型安全和错误处理
 */
const PREFIX = "poco_";

export type StorageKey =
  | "session_prompt"
  | "user_preferences"
  | "draft_message"
  | "chat_history"
  | "connector_state";

/**
 * 从localStorage读取数据
 */
export function getLocalStorage<T>(key: StorageKey): T | null {
  if (typeof window === "undefined") return null;

  try {
    const item = localStorage.getItem(`${PREFIX}${key}`);
    return item ? (JSON.parse(item) as T) : null;
  } catch {
    return null;
  }
}

/**
 * 写入数据到localStorage
 */
export function setLocalStorage<T>(key: StorageKey, value: T): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(`${PREFIX}${key}`, JSON.stringify(value));
  } catch (error) {
    console.error(`[Storage] Failed to save to localStorage (${key}):`, error);
  }
}

/**
 * 从localStorage删除数据
 */
export function removeLocalStorage(key: StorageKey): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(`${PREFIX}${key}`);
  } catch (error) {
    console.error(
      `[Storage] Failed to remove from localStorage (${key}):`,
      error,
    );
  }
}

/**
 * 清空所有Poco相关的localStorage数据
 */
export function clearLocalStorage(): void {
  if (typeof window === "undefined") return;

  try {
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith(PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error("[Storage] Failed to clear localStorage:", error);
  }
}
