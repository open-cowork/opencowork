import { File, Sparkles } from "lucide-react";

/**
 * Empty state component for artifacts panel
 */
interface ArtifactsEmptyProps {
  sessionStatus?: "running" | "accepted" | "completed" | "failed" | "cancelled";
}

/**
 * Empty state component for artifacts panel
 */
export function ArtifactsEmpty({ sessionStatus }: ArtifactsEmptyProps) {
  const isRunning = sessionStatus === "running" || sessionStatus === "accepted";

  if (isRunning) {
    return (
      <div className="flex items-center justify-center flex-1 h-full w-full bg-background/50">
        <div className="relative flex flex-col items-center justify-center">
          {/* Logo and Ripple Animation */}
          <div className="relative flex items-center justify-center mb-8">
            {/* Ripple rings - Neutral colors */}
            <div className="absolute size-20 rounded-full border border-foreground/20 animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite]" />
            <div className="absolute size-32 rounded-full border border-foreground/10 animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite_1s]" />

            {/* Center Logo/Icon */}
            <div className="relative z-10 bg-background p-4 rounded-full border border-border shadow-sm">
              <Sparkles className="size-8 text-foreground" />
            </div>
          </div>

          {/* Text */}
          <div className="text-center space-y-2">
            <h3 className="text-lg font-medium text-foreground">
              CoCo正在创造中...
            </h3>
            <p className="text-xs text-muted-foreground/80">
              Agent is working on your task
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center flex-1 h-full w-full">
      <div className="text-center text-muted-foreground">
        <File className="size-12 mx-auto mb-3 opacity-50" />
        <p className="text-sm">暂无文件变更</p>
        <p className="text-xs mt-1">AI 执行产生的文件变更将在此处展示</p>
      </div>
    </div>
  );
}
