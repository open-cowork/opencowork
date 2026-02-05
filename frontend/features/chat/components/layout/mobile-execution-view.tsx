"use client";

import * as React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import "swiper/css";
import "swiper/css/navigation";
import { useSidebar } from "@/components/ui/sidebar";
import { ChatPanel } from "../execution/chat-panel/chat-panel";
import { ArtifactsPanel } from "../execution/file-panel/artifacts-panel";
import { ComputerPanel } from "../execution/computer-panel/computer-panel";
import type { ExecutionSession } from "@/features/chat/types";
import { useT } from "@/lib/i18n/client";
import { MessageSquare, Layers, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

interface MobileExecutionViewProps {
  session: ExecutionSession | null;
  sessionId?: string;
  updateSession: (newSession: Partial<ExecutionSession>) => void;
}

export function MobileExecutionView({
  session,
  sessionId,
  updateSession,
}: MobileExecutionViewProps) {
  const { t } = useT("translation");
  const { setOpenMobile } = useSidebar();
  const [activeIndex, setActiveIndex] = React.useState(0);
  const swiperRef = React.useRef<SwiperType | null>(null);
  const isSessionActive =
    session?.status === "running" || session?.status === "accepted";
  const browserEnabled = Boolean(
    session?.config_snapshot?.browser_enabled ||
    session?.state_patch?.browser?.enabled,
  );

  const defaultPanelTab = isSessionActive ? "computer" : "artifacts";
  const [panelTab, setPanelTab] = React.useState<string>(defaultPanelTab);
  const didManualSwitchRef = React.useRef(false);
  const prevDefaultRef = React.useRef<string>(defaultPanelTab);
  const lastSessionIdRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    const key = sessionId || "";
    if (lastSessionIdRef.current === key) return;
    lastSessionIdRef.current = key;
    didManualSwitchRef.current = false;
    prevDefaultRef.current = defaultPanelTab;
    setPanelTab(defaultPanelTab);
  }, [defaultPanelTab, sessionId]);

  React.useEffect(() => {
    if (prevDefaultRef.current === defaultPanelTab) return;
    prevDefaultRef.current = defaultPanelTab;
    if (!didManualSwitchRef.current) {
      setPanelTab(defaultPanelTab);
    }
  }, [defaultPanelTab]);

  return (
    <div className="h-full w-full flex flex-col overflow-hidden select-text">
      {/* Main swiper content - takes available height */}
      <div className="flex-1 min-h-0">
        <Swiper
          modules={[Navigation]}
          spaceBetween={0}
          slidesPerView={1}
          allowTouchMove={true}
          className="h-full"
          onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
          onSwiper={(swiper) => {
            swiperRef.current = swiper;
          }}
          onTouchEnd={(swiper) => {
            // diff > 0 means Pulling Right (L->R)
            // isBeginning means we are at the start edge
            if (
              swiper.activeIndex === 0 &&
              swiper.touches.diff > 70 &&
              swiper.isBeginning
            ) {
              setOpenMobile(true);
            }
          }}
        >
          <SwiperSlide className="h-full">
            <div
              className={`h-full ${activeIndex === 0 ? "bg-background" : "bg-muted/50"}`}
            >
              <ChatPanel
                session={session}
                statePatch={session?.state_patch}
                progress={session?.progress}
                currentStep={session?.state_patch.current_step ?? undefined}
                updateSession={updateSession}
                onIconClick={() => setOpenMobile(true)}
              />
            </div>
          </SwiperSlide>
          <SwiperSlide className="h-full">
            <div
              className={`h-full ${activeIndex === 1 ? "bg-background" : "bg-muted/50"}`}
            >
              <Tabs
                value={panelTab}
                onValueChange={(value) => {
                  didManualSwitchRef.current = true;
                  setPanelTab(value);
                }}
                className="h-full min-h-0 flex flex-col"
              >
                <div className="px-3 pt-3">
                  <TabsList>
                    <TabsTrigger value="computer">
                      <Monitor className="size-4" />
                      {t("mobile.computer")}
                      {session?.status && isSessionActive ? (
                        <Badge variant="secondary" className="ml-1">
                          {t("computer.status.live")}
                        </Badge>
                      ) : null}
                    </TabsTrigger>
                    <TabsTrigger value="artifacts">
                      <Layers className="size-4" />
                      {t("mobile.artifacts")}
                    </TabsTrigger>
                  </TabsList>
                </div>

                <div className="flex-1 min-h-0 overflow-hidden">
                  <TabsContent
                    value="computer"
                    className="h-full min-h-0 data-[state=inactive]:hidden"
                  >
                    {sessionId ? (
                      <ComputerPanel
                        sessionId={sessionId}
                        sessionStatus={session?.status}
                        browserEnabled={browserEnabled}
                      />
                    ) : null}
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
                    />
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          </SwiperSlide>
        </Swiper>
      </div>

      {/* Footer Navigation */}
      <div className="shrink-0 h-16 border-t bg-background flex items-center justify-center gap-6 px-4 z-50">
        <button
          onClick={() => swiperRef.current?.slideTo(0)}
          className={cn(
            "flex flex-row items-center gap-2 px-4 py-2 rounded-full transition-colors",
            activeIndex === 0
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground hover:bg-muted",
          )}
        >
          <MessageSquare className="h-4 w-4" />
          <span className="text-sm font-medium">{t("mobile.chat")}</span>
        </button>

        <button
          onClick={() => swiperRef.current?.slideTo(1)}
          className={cn(
            "flex flex-row items-center gap-2 px-4 py-2 rounded-full transition-colors",
            activeIndex === 1
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground hover:bg-muted",
          )}
        >
          {isSessionActive ? (
            <Monitor className="h-4 w-4" />
          ) : (
            <Layers className="h-4 w-4" />
          )}
          <span className="text-sm font-medium">
            {isSessionActive ? t("mobile.computer") : t("mobile.artifacts")}
          </span>
        </button>
      </div>
    </div>
  );
}
