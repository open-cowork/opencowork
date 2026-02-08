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
import { MessageSquare, Layers, Monitor, PanelLeft } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const [hasFooterSelection, setHasFooterSelection] = React.useState(false);
  const swiperRef = React.useRef<SwiperType | null>(null);
  const browserEnabled = Boolean(
    session?.config_snapshot?.browser_enabled ||
    session?.state_patch?.browser?.enabled,
  );

  React.useEffect(() => {
    setActiveIndex(0);
    setHasFooterSelection(true);

    if (swiperRef.current && swiperRef.current.activeIndex !== 0) {
      swiperRef.current.slideTo(0, 0);
    }
  }, [sessionId]);

  const footerTabs = [
    {
      label: t("mobile.chat"),
      icon: MessageSquare,
      index: 0,
    },
    {
      label: t("mobile.artifacts"),
      icon: Layers,
      index: 1,
    },
    {
      label: t("mobile.computer"),
      icon: Monitor,
      index: 2,
    },
  ] as const;

  return (
    <div className="flex h-full w-full select-text flex-col overflow-hidden">
      <div className="z-50 shrink-0 border-b bg-background px-3 py-1.5">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setOpenMobile(true)}
            aria-label={t("sidebar.openMain")}
            title={t("sidebar.openMain")}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border/60 bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <PanelLeft className="size-4" />
          </button>

          <div className="relative min-w-0 flex-1 rounded-full border border-border/60 bg-muted/60 p-1">
            <div
              className={cn(
                "pointer-events-none absolute inset-y-1 left-1 w-[calc((100%-0.5rem)/3)] rounded-full border border-border/70 bg-background shadow-sm transition-[transform,opacity] duration-300 ease-out",
                hasFooterSelection ? "opacity-100" : "opacity-0",
              )}
              style={{ transform: `translateX(${activeIndex * 100}%)` }}
            />

            <div className="relative grid grid-cols-3">
              {footerTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeIndex === tab.index;

                return (
                  <button
                    key={tab.index}
                    type="button"
                    onClick={() => {
                      setHasFooterSelection(true);
                      swiperRef.current?.slideTo(tab.index);
                    }}
                    className={cn(
                      "z-10 flex h-8 flex-row items-center justify-center gap-1.5 rounded-full px-2 transition-colors",
                      isActive
                        ? "font-semibold text-foreground"
                        : "text-muted-foreground",
                    )}
                  >
                    <Icon className="size-4" />
                    <span className="text-xs font-medium leading-none">
                      {tab.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1">
        <Swiper
          modules={[Navigation]}
          spaceBetween={0}
          slidesPerView={1}
          allowTouchMove
          className="h-full"
          onSlideChange={(swiper) => {
            setActiveIndex(swiper.activeIndex);
            setHasFooterSelection(true);
          }}
          onSwiper={(swiper) => {
            swiperRef.current = swiper;
          }}
        >
          <SwiperSlide className="h-full">
            <div
              className={cn(
                "h-full",
                activeIndex === 0 ? "bg-background" : "bg-muted/50",
              )}
            >
              <ChatPanel
                session={session}
                statePatch={session?.state_patch}
                progress={session?.progress}
                currentStep={session?.state_patch.current_step ?? undefined}
                updateSession={updateSession}
                onIconClick={() => setOpenMobile(true)}
                hideHeader
              />
            </div>
          </SwiperSlide>

          <SwiperSlide className="h-full">
            <div
              className={cn(
                "h-full",
                activeIndex === 1 ? "bg-background" : "bg-muted/50",
              )}
            >
              <ArtifactsPanel
                fileChanges={session?.state_patch.workspace_state?.file_changes}
                sessionId={sessionId}
                sessionStatus={session?.status}
                hideHeader
              />
            </div>
          </SwiperSlide>

          <SwiperSlide className="h-full">
            <div
              className={cn(
                "h-full",
                activeIndex === 2 ? "bg-background" : "bg-muted/50",
              )}
            >
              {sessionId ? (
                <ComputerPanel
                  sessionId={sessionId}
                  sessionStatus={session?.status}
                  browserEnabled={browserEnabled}
                  hideHeader
                />
              ) : null}
            </div>
          </SwiperSlide>
        </Swiper>
      </div>
    </div>
  );
}
