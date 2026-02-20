"use client";

import * as React from "react";
import {
  Monitor,
  CheckCircle2,
  XCircle,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  Play,
  Pause,
  Layers,
  Globe,
  SquareTerminal,
} from "lucide-react";
import { PanelHeader } from "@/components/shared/panel-header";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SkeletonCircle, SkeletonItem } from "@/components/ui/skeleton-shimmer";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/client";
import { getBrowserScreenshotAction } from "@/features/chat/actions/query-actions";
import type { ToolExecutionResponse } from "@/features/chat/types";
import { useToolExecutions } from "./hooks/use-tool-executions";
import { ApiError } from "@/lib/errors";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { motion } from "motion/react";
import { BrowserViewer } from "./browser-viewer";
import { TerminalViewer } from "./terminal-viewer";

const POCO_PLAYWRIGHT_MCP_PREFIX = "mcp____poco_playwright__";

interface ComputerPanelProps {
  sessionId: string;
  sessionStatus?: "pending" | "running" | "completed" | "failed" | "canceled";
  browserEnabled?: boolean;
  headerAction?: React.ReactNode;
  hideHeader?: boolean;
}

type ReplayFilter = "all" | "browser" | "terminal";
type ReplayKind = "browser" | "terminal";

interface ReplayFrame {
  kind: ReplayKind;
  execution: ToolExecutionResponse;
  label: string;
}

function truncateMiddle(value: string, maxLen: number): string {
  const text = value.trim();
  if (text.length <= maxLen) return text;
  if (maxLen <= 8) return text.slice(0, maxLen);
  const head = Math.ceil((maxLen - 3) / 2);
  const tail = Math.floor((maxLen - 3) / 2);
  return `${text.slice(0, head)}...${text.slice(text.length - tail)}`;
}

function pickFirstString(
  input: Record<string, unknown> | null | undefined,
  keys: string[],
): string | null {
  if (!input) return null;
  for (const key of keys) {
    const value = input[key];
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed) return trimmed;
    }
  }
  return null;
}

function getBrowserStepLabel(execution: ToolExecutionResponse): string {
  const name = execution.tool_name || "";
  if (!name.startsWith(POCO_PLAYWRIGHT_MCP_PREFIX)) return name;
  const rawTool = name.slice(POCO_PLAYWRIGHT_MCP_PREFIX.length).trim();
  const action = rawTool.startsWith("browser_")
    ? rawTool.slice("browser_".length)
    : rawTool;

  const input = execution.tool_input || {};
  const summary = (() => {
    if (action === "navigate") {
      return pickFirstString(input, ["url", "href"]);
    }
    if (action === "click" || action === "hover") {
      return pickFirstString(input, ["selector", "text", "role", "name"]);
    }
    if (action === "type" || action === "fill" || action === "press") {
      return (
        pickFirstString(input, ["selector", "role", "name", "text"]) ||
        pickFirstString(input, ["key", "value"])
      );
    }
    return pickFirstString(input, [
      "url",
      "selector",
      "text",
      "role",
      "name",
      "value",
      "query",
      "path",
    ]);
  })();

  const meta = summary ? ` - ${truncateMiddle(summary, 80)}` : "";
  return `${action}${meta}`;
}

function clampIndex(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

export function ComputerPanel({
  sessionId,
  sessionStatus,
  headerAction,
  hideHeader = false,
}: ComputerPanelProps) {
  const { t } = useT("translation");
  const isActive = sessionStatus === "running" || sessionStatus === "pending";

  const { executions, isLoading, isLoadingMore, hasMore, loadMore } =
    useToolExecutions({
      sessionId,
      isActive,
      pollingIntervalMs: 2000,
      limit: 100,
    });

  // --- Screenshot caching (persists across tab switches) ---
  const screenshotCacheRef = React.useRef(new Map<string, string | null>());
  const [browserScreenshotUrls, setBrowserScreenshotUrls] = React.useState<
    Record<string, string | null>
  >({});
  const inflightRef = React.useRef(new Set<string>());

  const fetchBrowserScreenshot = React.useCallback(
    async (toolUseId: string, retryOn404: boolean): Promise<void> => {
      const id = toolUseId.trim();
      if (
        !id ||
        screenshotCacheRef.current.has(id) ||
        inflightRef.current.has(id)
      ) {
        return;
      }

      inflightRef.current.add(id);

      const fetchWithRetry = async (attempts = 0): Promise<void> => {
        try {
          const res = await getBrowserScreenshotAction({
            sessionId,
            toolUseId: id,
          });
          screenshotCacheRef.current.set(id, res.url);
          setBrowserScreenshotUrls((prev) => ({ ...prev, [id]: res.url }));
        } catch (err) {
          const statusCode =
            err instanceof ApiError
              ? err.statusCode
              : (err as { statusCode?: number })?.statusCode;

          if (statusCode === 404 && retryOn404 && attempts < 10) {
            setTimeout(() => fetchWithRetry(attempts + 1), 800);
            return;
          }

          screenshotCacheRef.current.set(id, null);
          setBrowserScreenshotUrls((prev) => ({ ...prev, [id]: null }));
        } finally {
          inflightRef.current.delete(id);
        }
      };

      await fetchWithRetry();
    },
    [sessionId],
  );

  const replayFramesAll: ReplayFrame[] = React.useMemo(() => {
    const frames: ReplayFrame[] = [];
    for (const e of executions) {
      const toolName = e.tool_name || "";
      if (toolName === "Bash") {
        const cmd =
          typeof e.tool_input?.["command"] === "string"
            ? (e.tool_input?.["command"] as string)
            : "";
        frames.push({
          kind: "terminal",
          execution: e,
          label: cmd
            ? truncateMiddle(cmd, 80)
            : t("computer.terminal.unknownCommand"),
        });
        continue;
      }
      if (toolName.startsWith(POCO_PLAYWRIGHT_MCP_PREFIX)) {
        frames.push({
          kind: "browser",
          execution: e,
          label: getBrowserStepLabel(e),
        });
      }
    }
    return frames;
  }, [executions, t]);

  const browserCount = React.useMemo(
    () => replayFramesAll.filter((f) => f.kind === "browser").length,
    [replayFramesAll],
  );
  const terminalCount = React.useMemo(
    () => replayFramesAll.filter((f) => f.kind === "terminal").length,
    [replayFramesAll],
  );

  const [replayFilter, setReplayFilter] = React.useState<ReplayFilter>("all");
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [followLatest, setFollowLatest] = React.useState(true);
  const [selectedFrameId, setSelectedFrameId] = React.useState<string | null>(
    null,
  );

  const replayFrames: ReplayFrame[] = React.useMemo(() => {
    if (replayFilter === "browser") {
      return replayFramesAll.filter((f) => f.kind === "browser");
    }
    if (replayFilter === "terminal") {
      return replayFramesAll.filter((f) => f.kind === "terminal");
    }
    return replayFramesAll;
  }, [replayFilter, replayFramesAll]);

  const selectedIndex = React.useMemo(() => {
    if (!selectedFrameId) return -1;
    return replayFrames.findIndex((f) => f.execution.id === selectedFrameId);
  }, [replayFrames, selectedFrameId]);

  const selectedFrame = selectedIndex >= 0 ? replayFrames[selectedIndex] : null;

  // Stop playback when filter changes (avoid surprising jumps).
  React.useEffect(() => {
    setIsPlaying(false);
  }, [replayFilter]);

  // Keep selection valid; default to the latest completed step (or latest any step).
  React.useEffect(() => {
    if (replayFrames.length === 0) {
      if (selectedFrameId !== null) setSelectedFrameId(null);
      setIsPlaying(false);
      return;
    }

    const exists =
      selectedFrameId &&
      replayFrames.some((f) => f.execution.id === selectedFrameId);

    if (exists) {
      if (followLatest && !isPlaying) {
        const lastId = replayFrames[replayFrames.length - 1]?.execution.id;
        if (lastId && selectedFrameId !== lastId) {
          setSelectedFrameId(lastId);
        }
      }
      return;
    }

    const latestCompleted = [...replayFrames]
      .reverse()
      .find((f) => Boolean(f.execution.tool_output));
    const pick =
      latestCompleted?.execution.id ||
      replayFrames[replayFrames.length - 1]!.execution.id;
    setSelectedFrameId(pick);
    setFollowLatest(true);
    setIsPlaying(false);
  }, [followLatest, isPlaying, replayFrames, selectedFrameId]);

  // Playback: advance to the next step using a step-based cadence (video-like, but not real video).
  React.useEffect(() => {
    if (!isPlaying) return;
    if (!selectedFrame) return;
    if (selectedIndex < 0) return;
    if (selectedIndex >= replayFrames.length - 1) {
      setIsPlaying(false);
      return;
    }

    const baseMs = selectedFrame.kind === "browser" ? 1200 : 1800;
    const delayMs = Math.max(80, baseMs);
    const id = window.setTimeout(() => {
      const next = replayFrames[selectedIndex + 1];
      if (next) {
        setSelectedFrameId(next.execution.id);
      }
    }, delayMs);
    return () => window.clearTimeout(id);
  }, [isPlaying, replayFrames, selectedFrame, selectedIndex]);

  const selectedBrowserToolUseId =
    selectedFrame?.kind === "browser" &&
    typeof selectedFrame.execution.tool_use_id === "string"
      ? selectedFrame.execution.tool_use_id
      : null;
  const selectedBrowserIsDone = Boolean(
    selectedFrame?.kind === "browser" && selectedFrame.execution.tool_output,
  );

  // Fetch screenshot URL on demand for the selected browser step (cache per tool_use_id).
  React.useEffect(() => {
    if (!selectedBrowserToolUseId) return;
    if (!selectedBrowserIsDone) return;
    if (selectedBrowserToolUseId in browserScreenshotUrls) return;
    void fetchBrowserScreenshot(selectedBrowserToolUseId, isActive);
  }, [
    browserScreenshotUrls,
    fetchBrowserScreenshot,
    isActive,
    selectedBrowserIsDone,
    selectedBrowserToolUseId,
  ]);

  // Prefetch screenshots for the next 1-2 browser steps to keep playback smooth.
  React.useEffect(() => {
    if (!selectedFrame) return;
    if (selectedIndex < 0) return;

    const candidates = replayFrames
      .slice(selectedIndex + 1, selectedIndex + 3)
      .filter((f) => f.kind === "browser")
      .map((f) => f.execution)
      .filter(
        (e) =>
          Boolean(e.tool_output) &&
          typeof e.tool_use_id === "string" &&
          Boolean(e.tool_use_id),
      )
      .map((e) => e.tool_use_id as string);

    for (const toolUseId of candidates) {
      if (toolUseId in browserScreenshotUrls) continue;
      void fetchBrowserScreenshot(toolUseId, isActive);
    }
  }, [
    browserScreenshotUrls,
    fetchBrowserScreenshot,
    isActive,
    replayFrames,
    selectedFrame,
    selectedIndex,
  ]);

  const selectedBrowserUrl =
    selectedBrowserToolUseId &&
    selectedBrowserToolUseId in browserScreenshotUrls
      ? browserScreenshotUrls[selectedBrowserToolUseId]
      : undefined;

  const viewer = (() => {
    if (!selectedFrame) {
      return (
        <div className="h-full w-full bg-muted/30 flex items-center justify-center">
          <div className="text-sm text-muted-foreground">
            {t("computer.replay.empty")}
          </div>
        </div>
      );
    }

    if (selectedFrame.kind === "browser") {
      return (
        <BrowserViewer
          isDone={selectedBrowserIsDone}
          toolUseId={selectedBrowserToolUseId}
          screenshotUrl={selectedBrowserUrl}
        />
      );
    }
    return <TerminalViewer execution={selectedFrame.execution} />;
  })();

  const canGoPrev = replayFrames.length > 0 && selectedIndex > 0;
  const canGoNext =
    replayFrames.length > 0 &&
    selectedIndex >= 0 &&
    selectedIndex < replayFrames.length - 1;

  const goToIndex = (index: number) => {
    if (replayFrames.length === 0) return;
    const safe = clampIndex(index, 0, replayFrames.length - 1);
    const frame = replayFrames[safe];
    if (!frame) return;
    setIsPlaying(false);
    setSelectedFrameId(frame.execution.id);
    setFollowLatest(safe === replayFrames.length - 1);
  };

  const controls = (
    <div className="min-w-0 space-y-1">
      <div className="flex min-w-0 items-center gap-2 overflow-hidden">
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          onClick={() => goToIndex(0)}
          disabled={replayFrames.length === 0 || selectedIndex <= 0}
          title={t("computer.replay.controls.first")}
          aria-label={t("computer.replay.controls.first")}
          className="shrink-0"
        >
          <ChevronsLeft className="size-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          onClick={() => goToIndex(selectedIndex - 1)}
          disabled={!canGoPrev}
          title={t("computer.replay.controls.prev")}
          aria-label={t("computer.replay.controls.prev")}
          className="shrink-0"
        >
          <ChevronLeft className="size-4" />
        </Button>

        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          onClick={() => {
            if (replayFrames.length === 0) return;
            setIsPlaying(!isPlaying);
          }}
          disabled={replayFrames.length === 0}
          title={
            isPlaying
              ? t("computer.replay.controls.pause")
              : t("computer.replay.controls.play")
          }
          aria-label={
            isPlaying
              ? t("computer.replay.controls.pause")
              : t("computer.replay.controls.play")
          }
          className="shrink-0"
        >
          {isPlaying ? (
            <Pause className="size-4" />
          ) : (
            <Play className="size-4" />
          )}
        </Button>

        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          onClick={() => goToIndex(selectedIndex + 1)}
          disabled={!canGoNext}
          title={t("computer.replay.controls.next")}
          aria-label={t("computer.replay.controls.next")}
          className="shrink-0"
        >
          <ChevronRight className="size-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          onClick={() => {
            if (replayFrames.length === 0) return;
            setIsPlaying(false);
            setFollowLatest(true);
            const last = replayFrames[replayFrames.length - 1];
            if (last) setSelectedFrameId(last.execution.id);
          }}
          disabled={
            replayFrames.length === 0 ||
            selectedIndex >= replayFrames.length - 1
          }
          title={t("computer.replay.controls.latest")}
          aria-label={t("computer.replay.controls.latest")}
          className="shrink-0"
        >
          <ChevronsRight className="size-4" />
        </Button>

        <div className="min-w-0 flex-1 pl-1">
          <Slider
            min={0}
            max={Math.max(0, replayFrames.length - 1)}
            value={[Math.max(0, selectedIndex)]}
            onValueChange={(value) => {
              const nextIndex = value[0] ?? 0;
              goToIndex(nextIndex);
            }}
            disabled={replayFrames.length <= 1}
            className="w-full min-w-0"
          />
        </div>
      </div>

      {executions.length >= 2000 ? (
        <div className="truncate text-[11px] text-muted-foreground">
          {t("computer.replay.limitHint", { limit: "2000" })}
        </div>
      ) : null}
    </div>
  );

  const hasMultipleTypes = browserCount > 0 && terminalCount > 0;

  const filterToggleGroup = hasMultipleTypes ? (
    <div className="flex h-full flex-col items-center gap-1 p-1">
      {(
        [
          {
            value: "all" as const,
            label: t("computer.replay.filter.all"),
            Icon: Layers,
          },
          {
            value: "browser" as const,
            label: t("computer.replay.filter.browser"),
            Icon: Globe,
          },
          {
            value: "terminal" as const,
            label: t("computer.replay.filter.terminal"),
            Icon: SquareTerminal,
          },
        ] satisfies Array<{
          value: ReplayFilter;
          label: string;
          Icon: React.ComponentType<{ className?: string }>;
        }>
      ).map(({ value, label, Icon }) => (
        <Tooltip key={value}>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => setReplayFilter(value)}
              aria-label={label}
              className={cn(
                "flex size-11 items-center justify-center rounded-md transition-colors",
                replayFilter === value
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-muted/50 text-muted-foreground",
              )}
            >
              <Icon className="size-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={8}>
            {label}
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  ) : null;

  // Infinite scroll sentinel ref and auto-scroll ref
  const sentinelRef = React.useRef<HTMLDivElement>(null);
  const selectedFrameRef = React.useRef<HTMLButtonElement>(null);
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);

  // Setup infinite scroll
  React.useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !isLoadingMore) {
          loadMore();
        }
      },
      { threshold: 0.1, rootMargin: "100px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, loadMore]);

  // Auto-scroll to selected frame
  React.useEffect(() => {
    if (!selectedFrameId) return;
    // Small delay to ensure DOM is updated
    setTimeout(() => {
      selectedFrameRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }, 50);
  }, [selectedFrameId]);

  // Render skeleton placeholders
  const renderSkeletons = (count: number) => (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonItem
          key={`skeleton-${i}`}
          className="h-10 min-h-0 w-full"
          style={{ animationDelay: `${i * 0.08}s` }}
        />
      ))}
    </>
  );

  const timelineList = (
    <ScrollArea className="h-full" ref={scrollAreaRef}>
      <div className="flex h-full flex-col space-y-1 p-2">
        {isLoading && replayFrames.length === 0 ? (
          <>{renderSkeletons(5)}</>
        ) : replayFrames.length === 0 ? (
          <div className="flex flex-1 items-center justify-center rounded-lg bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
            {t("computer.replay.empty")}
          </div>
        ) : (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: {
                transition: {
                  staggerChildren: 0.05,
                },
              },
            }}
          >
            {replayFrames.map((frame, idx) => {
              const isSelected = frame.execution.id === selectedFrameId;
              const isDone = Boolean(frame.execution.tool_output);
              const isError = frame.execution.is_error;
              const kindIcon =
                frame.kind === "browser" ? (
                  <Globe className="size-4 text-muted-foreground" />
                ) : (
                  <SquareTerminal className="size-4 text-muted-foreground" />
                );
              const statusIcon = !isDone ? (
                <SkeletonCircle className="size-4" />
              ) : isError ? (
                <XCircle className="size-4 text-destructive" />
              ) : (
                <CheckCircle2 className="size-4 text-primary" />
              );
              const durationSec = frame.execution.duration_ms
                ? (frame.execution.duration_ms / 1000).toFixed(1)
                : null;
              return (
                <motion.button
                  key={frame.execution.id}
                  ref={isSelected ? selectedFrameRef : undefined}
                  type="button"
                  variants={{
                    hidden: { opacity: 0, y: 10 },
                    visible: { opacity: 1, y: 0 },
                  }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className={cn(
                    "h-10 w-full min-w-0 max-w-full overflow-hidden rounded-md px-2 py-2 text-left transition-colors flex items-center gap-2",
                    isSelected
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-muted/50",
                  )}
                  onClick={() => {
                    setIsPlaying(false);
                    setSelectedFrameId(frame.execution.id);
                    setFollowLatest(idx === replayFrames.length - 1);
                  }}
                >
                  <div className="shrink-0 flex items-center gap-2">
                    {statusIcon}
                    {kindIcon}
                  </div>
                  <div className="w-0 flex-1 min-w-0 overflow-hidden">
                    <div className="text-xs font-mono truncate leading-tight">
                      {frame.label}
                    </div>
                  </div>
                  {durationSec && (
                    <div className="shrink-0 whitespace-nowrap text-xs text-muted-foreground tabular-nums">
                      {durationSec}s
                    </div>
                  )}
                </motion.button>
              );
            })}
            {hasMore && <div ref={sentinelRef} className="h-1" />}
          </motion.div>
        )}
      </div>
    </ScrollArea>
  );

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden">
      {!hideHeader ? (
        <PanelHeader
          icon={Monitor}
          title={t("computer.title")}
          description={t("computer.description")}
          content={
            headerAction ? (
              <div className="flex min-w-0 items-center overflow-hidden">
                {headerAction}
              </div>
            ) : undefined
          }
        />
      ) : null}
      <div className="flex-1 min-h-0 overflow-hidden p-3 sm:p-4">
        <div className="h-full min-h-0 flex flex-col gap-3">
          <div className="flex-1 min-h-0 overflow-hidden rounded-xl border bg-card">
            {viewer}
          </div>

          {controls}

          {hasMultipleTypes ? (
            <div className="h-[220px] min-w-0 overflow-hidden rounded-xl border bg-card flex">
              <div className="shrink-0 border-r p-1">{filterToggleGroup}</div>
              <div className="flex-1 min-w-0">{timelineList}</div>
            </div>
          ) : (
            <div className="h-[220px] min-w-0 overflow-hidden rounded-xl border bg-card">
              {timelineList}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
