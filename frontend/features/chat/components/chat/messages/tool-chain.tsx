"use client";

import * as React from "react";
import {
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ToolUseBlock, ToolResultBlock } from "@/features/chat/types";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";

interface ToolChainProps {
  blocks: (ToolUseBlock | ToolResultBlock)[];
}

interface ToolStepProps {
  toolUse: ToolUseBlock;
  toolResult?: ToolResultBlock;
  isOpen: boolean;
  onToggle: () => void;
}

function ToolStep({ toolUse, toolResult, isOpen, onToggle }: ToolStepProps) {
  const isCompleted = !!toolResult;
  const isError = toolResult?.is_error;
  const isLoading = !isCompleted;

  return (
    <div className="border border-border/50 rounded-md bg-muted/30 overflow-hidden mb-2 last:mb-0">
      <Collapsible open={isOpen} onOpenChange={onToggle}>
        <CollapsibleTrigger className="flex items-center w-full p-2 hover:bg-muted/50 transition-colors gap-2 text-left">
          <div className="shrink-0">
            {isLoading ? (
              <Loader2 className="size-4 animate-spin text-primary" />
            ) : isError ? (
              <XCircle className="size-4 text-destructive" />
            ) : (
              <CheckCircle2 className="size-4 text-green-500" />
            )}
          </div>

          <div className="flex-1 min-w-0 flex items-center gap-2">
            <span className="text-xs font-mono font-medium text-foreground truncate">
              {toolUse.name}
            </span>
            {/* Optional: Show short input summary for specific tools if needed */}
          </div>

          <div className="shrink-0 flex items-center gap-2">
            {isLoading ? (
              <Badge
                variant="outline"
                className="h-4 px-1 text-[10px] bg-background text-muted-foreground rounded-sm border-transparent animate-pulse"
              >
                Running
              </Badge>
            ) : null}
            {isOpen ? (
              <ChevronDown className="size-3.5 text-muted-foreground" />
            ) : (
              <ChevronRight className="size-3.5 text-muted-foreground" />
            )}
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="p-2 pt-0 space-y-2 text-xs font-mono border-t border-border/50 bg-background/50">
            {/* Input */}
            <div className="mt-2">
              <div className="text-[10px] uppercase text-muted-foreground mb-1 select-none">
                Input
              </div>
              <div className="bg-muted/50 p-2 rounded overflow-x-auto text-foreground/90">
                <pre className="whitespace-pre-wrap break-all">
                  {JSON.stringify(toolUse.input, null, 2)}
                </pre>
              </div>
            </div>

            {/* Output */}
            {isCompleted && (
              <div>
                <div className="text-[10px] uppercase text-muted-foreground mb-1 select-none flex items-center gap-1">
                  Output
                </div>
                <div
                  className={cn(
                    "p-2 rounded overflow-x-auto text-foreground/90",
                    isError
                      ? "bg-destructive/10 text-destructive-foreground border border-destructive/20"
                      : "bg-muted/50",
                  )}
                >
                  <pre className="whitespace-pre-wrap break-all">
                    {toolResult.content}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

export function ToolChain({ blocks }: ToolChainProps) {
  const [openStepId, setOpenStepId] = React.useState<string | null>(null);

  // Group blocks into steps (Use + Result pair)
  const steps = React.useMemo(() => {
    const result: { use: ToolUseBlock; result?: ToolResultBlock }[] = [];
    const useMap = new Map<string, ToolUseBlock>();

    // First pass: find all uses
    for (const block of blocks) {
      if (block._type === "ToolUseBlock") {
        useMap.set(block.id, block);
        result.push({ use: block });
      }
    }

    // Second pass: attach results
    for (const block of blocks) {
      if (block._type === "ToolResultBlock") {
        const step = result.find((s) => s.use.id === block.tool_use_id);
        if (step) {
          step.result = block;
        }
      }
    }
    return result;
  }, [blocks]);

  const isRunning = steps.some((s) => !s.result);
  // Initialize open if running, closed if completed (history)
  const [isExpanded, setIsExpanded] = React.useState(isRunning);
  const prevIsRunning = React.useRef(isRunning);

  // Auto-open the running step
  // Auto-open the running step logic removed per user request
  // React.useEffect(() => {
  //   const runningStep = steps.find((s) => !s.result);
  //   if (runningStep) {
  //     setOpenStepId(runningStep.use.id);
  //   }
  // }, [steps]);

  // Auto-expand when new tool call starts (do NOT auto-collapse when finished)
  React.useEffect(() => {
    // If we transitioned from not running to running (new tool call), auto-expand
    if (!prevIsRunning.current && isRunning) {
      setIsExpanded(true);
    }
    prevIsRunning.current = isRunning;
  }, [isRunning]);

  if (steps.length === 0) return null;

  return (
    <div className="w-full my-2 border border-border/40 rounded-lg bg-background/50 overflow-hidden">
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger className="flex items-center gap-2 w-full p-2 hover:bg-muted/30 transition-colors cursor-pointer select-none">
          {isExpanded ? (
            <ChevronDown className="size-3 text-muted-foreground" />
          ) : (
            <ChevronRight className="size-3 text-muted-foreground" />
          )}
          <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1.5">
            Tool Execution
            {steps.length > 0 && (
              <span className="opacity-70">({steps.length})</span>
            )}
          </span>
          {/* Show little badges if collapsed */}
          {!isExpanded && (
            <div className="flex items-center gap-1 ml-auto">
              <CheckCircle2 className="size-3 text-green-500" />
            </div>
          )}
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="space-y-1 p-2 pt-0">
            {steps.map((step) => (
              <ToolStep
                key={step.use.id}
                toolUse={step.use}
                toolResult={step.result}
                isOpen={openStepId === step.use.id}
                onToggle={() =>
                  setOpenStepId(openStepId === step.use.id ? null : step.use.id)
                }
              />
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
