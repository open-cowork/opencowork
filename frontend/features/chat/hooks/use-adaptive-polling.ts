import { useEffect, useRef, useCallback, useState } from "react";

export interface AdaptivePollingOptions {
  /**
   * Callback function to execute on each poll
   */
  callback: () => Promise<void> | void;
  /**
   * Whether polling is currently active
   */
  isActive: boolean;
  /**
   * Initial polling interval in milliseconds
   * @default 3000
   */
  interval?: number;
  /**
   * Minimum interval after backoff
   * @default 1000
   */
  minInterval?: number;
  /**
   * Maximum interval after backoff
   * @default 30000
   */
  maxInterval?: number;
  /**
   * Multiplier for exponential backoff
   * @default 2
   */
  backoffMultiplier?: number;
  /**
   * Whether to enable adaptive backoff on errors
   * @default true
   */
  enableBackoff?: boolean;
  /**
   * Maximum consecutive errors before giving up
   * @default Infinity
   */
  maxErrors?: number;
}

export interface AdaptivePollingReturn {
  /**
   * Current polling interval in milliseconds
   */
  currentInterval: number;
  /**
   * Number of consecutive errors
   */
  errorCount: number;
  /**
   * Whether currently polling
   */
  isPolling: boolean;
  /**
   * Manually trigger a poll
   */
  trigger: () => Promise<void>;
  /**
   * Reset the polling interval to initial value
   */
  resetInterval: () => void;
}

/**
 * Adaptive polling hook with exponential backoff
 *
 * Features:
 * - Configurable polling interval
 * - Exponential backoff on errors
 * - Automatic interval reset on success
 * - Manual trigger support
 * - Error counting with max error threshold
 *
 * @example
 * ```tsx
 * const { currentInterval, errorCount, trigger } = useAdaptivePolling({
 *   callback: async () => {
 *     await fetchMessages();
 *   },
 *   isActive: isSessionActive,
 *   interval: 3000,
 *   enableBackoff: true,
 * });
 * ```
 */
export function useAdaptivePolling({
  callback,
  isActive,
  interval = 3000,
  minInterval = 1000,
  maxInterval = 30000,
  backoffMultiplier = 2,
  enableBackoff = true,
  maxErrors = Infinity,
}: AdaptivePollingOptions): AdaptivePollingReturn {
  const [currentInterval, setCurrentInterval] = useState(interval);
  const [errorCount, setErrorCount] = useState(0);
  const [isPolling, setIsPolling] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // Reset interval to initial value
  const resetInterval = useCallback(() => {
    setCurrentInterval(interval);
    setErrorCount(0);
  }, [interval]);

  // Manual trigger
  const trigger = useCallback(async () => {
    if (!isMountedRef.current) return;

    setIsPolling(true);
    try {
      await callback();

      // Success: reset error count and interval
      if (enableBackoff && errorCount > 0) {
        setErrorCount(0);
        setCurrentInterval(interval);
      }
    } catch (error) {
      console.error("[AdaptivePolling] Poll error:", error);

      if (enableBackoff) {
        setErrorCount((prev) => {
          const newCount = prev + 1;

          // Apply exponential backoff
          if (newCount <= maxErrors) {
            setCurrentInterval((prevInterval) =>
              Math.min(
                Math.max(prevInterval * backoffMultiplier, minInterval),
                maxInterval,
              ),
            );
          }

          return newCount;
        });
      }
    } finally {
      if (isMountedRef.current) {
        setIsPolling(false);
      }
    }
  }, [
    callback,
    enableBackoff,
    errorCount,
    interval,
    backoffMultiplier,
    minInterval,
    maxInterval,
    maxErrors,
  ]);

  // Setup polling
  useEffect(() => {
    isMountedRef.current = true;

    if (!isActive) {
      // Clear any existing interval when inactive
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Clear previous interval before setting new one
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Set up new interval with current (possibly backed-off) interval
    intervalRef.current = setInterval(() => {
      trigger();
    }, currentInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      isMountedRef.current = false;
    };
  }, [isActive, currentInterval, trigger]);

  return {
    currentInterval,
    errorCount,
    isPolling,
    trigger,
    resetInterval,
  };
}
