/**
 * SessionStorage封装，带类型安全和错误处理
 */
const PREFIX = "poco_";

export type SessionStorageKey =
  | "temp_state"
  | "navigation_state"
  | "filter_state";

/**
 * 从sessionStorage读取数据
 */
export function getSessionStorage<T>(key: SessionStorageKey): T | null {
  if (typeof window === "undefined") return null;

  try {
    const item = sessionStorage.getItem(`${PREFIX}${key}`);
    return item ? (JSON.parse(item) as T) : null;
  } catch {
    return null;
  }
}

/**
 * 写入数据到sessionStorage
 */
export function setSessionStorage<T>(key: SessionStorageKey, value: T): void {
  if (typeof window === "undefined") return;

  try {
    sessionStorage.setItem(`${PREFIX}${key}`, JSON.stringify(value));
  } catch (error) {
    console.error(
      `[Storage] Failed to save to sessionStorage (${key}):`,
      error,
    );
  }
}

/**
 * 从sessionStorage删除数据
 */
export function removeSessionStorage(key: SessionStorageKey): void {
  if (typeof window === "undefined") return;

  try {
    sessionStorage.removeItem(`${PREFIX}${key}`);
  } catch (error) {
    console.error(
      `[Storage] Failed to remove from sessionStorage (${key}):`,
      error,
    );
  }
}
