"use client";

import * as React from "react";
import { ChatPanel } from "../execution/chat-panel/chat-panel";
import { ArtifactsPanel } from "../execution/file-panel/artifacts-panel";
import { ComputerPanel } from "../execution/computer-panel/computer-panel";
import { MobileExecutionView } from "./mobile-execution-view";
import { useExecutionSession } from "@/features/chat/hooks/use-execution-session";
import { useTaskHistoryContext } from "@/features/projects/contexts/task-history-context";
import { useIsMobile } from "@/hooks/use-mobile";
import { Layers, Loader2, Monitor } from "lucide-react";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useT } from "@/lib/i18n/client";

interface ExecutionContainerProps {
  sessionId: string;
}

export function ExecutionContainer({ sessionId }: ExecutionContainerProps) {
  const { t } = useT("translation");
  const { refreshTasks } = useTaskHistoryContext();
  const { session, isLoading, error, updateSession } = useExecutionSession({
    sessionId,
    onPollingStop: refreshTasks,
  });
  const isMobile = useIsMobile();
  const isSessionActive =
    session?.status === "running" || session?.status === "accepted";
  const browserEnabled = Boolean(
    session?.config_snapshot?.browser_enabled ||
    session?.state_patch?.browser?.enabled,
  );

  const defaultRightTab = isSessionActive ? "computer" : "artifacts";
  const [rightTab, setRightTab] = React.useState<string>(defaultRightTab);
  const didManualSwitchRef = React.useRef(false);
  const prevDefaultRef = React.useRef<string>(defaultRightTab);
  const lastSessionIdRef = React.useRef<string | null>(null);

  // Reset right panel tab when session changes.
  React.useEffect(() => {
    if (lastSessionIdRef.current === sessionId) return;
    lastSessionIdRef.current = sessionId;
    didManualSwitchRef.current = false;
    prevDefaultRef.current = defaultRightTab;
    setRightTab(defaultRightTab);
  }, [defaultRightTab, sessionId]);

  // Smart default: switch to artifacts on completion only if user didn't manually switch.
  React.useEffect(() => {
    if (prevDefaultRef.current === defaultRightTab) return;
    prevDefaultRef.current = defaultRightTab;
    if (!didManualSwitchRef.current) {
      setRightTab(defaultRightTab);
    }
  }, [defaultRightTab]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-dvh bg-background select-text">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/20" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-dvh bg-background select-text">
        <div className="text-center">
          <p className="text-destructive mb-2">{t("errors.boundary.title")}</p>
          <p className="text-muted-foreground text-sm">
            {error.message || t("errors.boundary.description")}
          </p>
        </div>
      </div>
    );
  }

  // Mobile view (under 768px)
  if (isMobile) {
    return (
      <MobileExecutionView
        session={session}
        sessionId={sessionId}
        updateSession={updateSession}
      />
    );
  }

  // Desktop resizable layout
  const tabsSwitch = (
    <TabsList className="min-w-0 max-w-full overflow-hidden">
      <TabsTrigger value="computer" className="!flex-none min-w-0 px-2">
        <Monitor className="size-4" />
        <span className="whitespace-nowrap">{t("mobile.computer")}</span>
        {session?.status && isSessionActive ? (
          <span
            className="ml-1 inline-flex items-center"
            aria-label={t("computer.status.live")}
            title={t("computer.status.live")}
          >
            <span
              aria-hidden
              className="size-2 shrink-0 rounded-full bg-primary motion-safe:animate-pulse"
            />
          </span>
        ) : null}
      </TabsTrigger>
      <TabsTrigger value="artifacts" className="!flex-none min-w-0 px-2">
        <Layers className="size-4" />
        <span className="whitespace-nowrap">{t("mobile.artifacts")}</span>
      </TabsTrigger>
    </TabsList>
  );

  return (
    <div className="flex h-dvh min-h-0 min-w-0 overflow-hidden bg-background select-text">
      <ResizablePanelGroup direction="horizontal" className="min-h-0 min-w-0">
        {/* Left panel - Chat with status cards (45%) */}
        <ResizablePanel
          defaultSize={45}
          minSize={30}
          className="min-h-0 min-w-0 overflow-hidden"
        >
          <div className="h-full w-full min-h-0 min-w-0 flex flex-col overflow-hidden">
            <ChatPanel
              session={session}
              statePatch={session?.state_patch}
              progress={session?.progress}
              currentStep={session?.state_patch.current_step ?? undefined}
              updateSession={updateSession}
            />
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right panel - Artifacts (55%) */}
        <ResizablePanel
          defaultSize={55}
          minSize={30}
          className="min-h-0 min-w-0 overflow-hidden"
        >
          <div className="h-full w-full min-h-0 min-w-0 flex flex-col overflow-hidden bg-muted/30">
            <Tabs
              value={rightTab}
              onValueChange={(value) => {
                didManualSwitchRef.current = true;
                setRightTab(value);
              }}
              className="h-full min-h-0 flex flex-col"
            >
              <div className="flex-1 min-h-0 overflow-hidden">
                <TabsContent
                  value="computer"
                  className="h-full min-h-0 data-[state=inactive]:hidden"
                >
                  <ComputerPanel
                    sessionId={sessionId}
                    sessionStatus={session?.status}
                    browserEnabled={browserEnabled}
                    headerAction={tabsSwitch}
                  />
                </TabsContent>
                <TabsContent
                  value="artifacts"
                  className="h-full min-h-0 data-[state=inactive]:hidden"
                >
                  <ArtifactsPanel
                    fileChanges={
                      session?.state_patch.workspace_state?.file_changes
                    }
                    sessionId={sessionId}
                    sessionStatus={session?.status}
                    headerAction={tabsSwitch}
                  />
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
