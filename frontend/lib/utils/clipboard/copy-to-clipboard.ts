/**
 * Copy text to clipboard with error handling and fallback
 */
import { logger } from "@/lib/logger";

export async function copyToClipboard(
  text: string,
  options?: {
    onSuccess?: () => void;
    onError?: (error: Error) => void;
  },
): Promise<boolean> {
  if (typeof window === "undefined") return false;

  try {
    // Try modern Clipboard API first
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      options?.onSuccess?.();
      return true;
    }

    // Fallback for older browsers or non-secure contexts
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    const successful = document.execCommand("copy");
    document.body.removeChild(textArea);

    if (successful) {
      options?.onSuccess?.();
      return true;
    }

    throw new Error("execCommand failed");
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    options?.onError?.(err);
    logger.error("[Clipboard] Failed to copy text:", err);
    return false;
  }
}

/**
 * Read text from clipboard
 */
export async function readFromClipboard(): Promise<string | null> {
  if (typeof window === "undefined") return null;

  try {
    if (navigator.clipboard && window.isSecureContext) {
      return await navigator.clipboard.readText();
    }
    return null;
  } catch (error) {
    logger.error("[Clipboard] Failed to read text:", error);
    return null;
  }
}
