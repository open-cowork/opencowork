"use client";

import {
  useLayoutEffect,
  useRef,
  useState,
  useCallback,
  useEffect,
} from "react";
import { useRouter } from "next/navigation";
import { gsap } from "gsap";
import {
  Plug,
  Server,
  Sparkles,
  AppWindow,
  ChevronRight,
  PowerOff,
} from "lucide-react";
import { mcpService } from "@/features/mcp/services/mcp-service";
import { skillsService } from "@/features/skills/services/skills-service";
import type { McpServer, UserMcpInstall } from "@/features/mcp/types";
import { Skill, UserSkillInstall } from "@/features/skills/types";
import { useAppShell } from "@/components/shared/app-shell-context";
import { cn } from "@/lib/utils";
import { playMcpInstallSound } from "@/lib/utils/sound";
import { useT } from "@/lib/i18n/client";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";
import { SkeletonText } from "@/components/ui/skeleton-shimmer";
import { StaggeredEntrance } from "@/components/ui/staggered-entrance";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const MCP_LIMIT = 3;
const SKILL_LIMIT = 5;

export interface CardNavProps {
  triggerText?: string;
  className?: string;
  forceExpanded?: boolean;
}

interface InstalledItem {
  id: number;
  name: string;
  enabled: boolean;
  installId: number;
}

/**
 * CardNav Component
 *
 * An expandable card that shows MCP, Skill, and App sections on hover
 */
export function CardNav({
  triggerText = "Connect your tools to Poco",
  className = "",
  forceExpanded = false,
}: CardNavProps) {
  const router = useRouter();
  const { lng } = useAppShell();
  const { t } = useT("translation");
  const [isExpanded, setIsExpanded] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const isHoveringRef = useRef(false);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // API data state
  const [mcpServers, setMcpServers] = useState<McpServer[]>([]);
  const [mcpInstalls, setMcpInstalls] = useState<UserMcpInstall[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [skillInstalls, setSkillInstalls] = useState<UserSkillInstall[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  // Fetch MCP and Skill data
  const fetchData = useCallback(async () => {
    if (hasFetched || isLoading) return;

    setIsLoading(true);
    try {
      const [mcpServersData, mcpInstallsData, skillsData, skillInstallsData] =
        await Promise.all([
          mcpService.listServers(),
          mcpService.listInstalls(),
          skillsService.listSkills(),
          skillsService.listInstalls(),
        ]);
      setMcpServers(mcpServersData);
      setMcpInstalls(mcpInstallsData);
      setSkills(skillsData);
      setSkillInstalls(skillInstallsData);
      setHasFetched(true);
    } catch (error) {
      console.error("[CardNav] Failed to fetch data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [hasFetched, isLoading]);

  // Get all installed MCPs
  const installedMcps: InstalledItem[] = mcpInstalls.map((install) => {
    const server = mcpServers.find((s) => s.id === install.server_id);
    return {
      id: install.server_id,
      name: server?.name || `MCP #${install.server_id}`,
      enabled: install.enabled,
      installId: install.id,
    };
  });

  // Get all installed Skills
  const installedSkills: InstalledItem[] = skillInstalls.map((install) => {
    const skill = skills.find((s) => s.id === install.skill_id);
    return {
      id: install.skill_id,
      name: skill?.name || `Skill #${install.skill_id}`,
      enabled: install.enabled,
      installId: install.id,
    };
  });

  // Toggle MCP enabled state
  const toggleMcpEnabled = useCallback(
    async (installId: number, currentEnabled: boolean) => {
      // Check if enabling would exceed the limit
      const currentEnabledCount = mcpInstalls.filter((i) => i.enabled).length;
      if (!currentEnabled && currentEnabledCount >= MCP_LIMIT) {
        toast.warning(t("hero.warnings.mcpLimitReached"));
        return;
      }

      try {
        await mcpService.updateInstall(installId, { enabled: !currentEnabled });
        setMcpInstalls((prev) =>
          prev.map((install) =>
            install.id === installId
              ? { ...install, enabled: !currentEnabled }
              : install,
          ),
        );
        if (!currentEnabled) {
          playMcpInstallSound();
        }

        // Check if we've exceeded the limit after enabling
        const newEnabledCount = !currentEnabled
          ? currentEnabledCount + 1
          : currentEnabledCount;
        if (newEnabledCount > MCP_LIMIT) {
          toast.warning(
            t("hero.warnings.tooManyMcps", { count: newEnabledCount }),
          );
        }
      } catch (error) {
        console.error("[CardNav] Failed to toggle MCP:", error);
      }
    },
    [mcpInstalls, t],
  );

  // Toggle Skill enabled state
  const toggleSkillEnabled = useCallback(
    async (installId: number, currentEnabled: boolean) => {
      // Check if enabling would exceed the limit
      const currentEnabledCount = skillInstalls.filter((i) => i.enabled).length;
      if (!currentEnabled && currentEnabledCount >= SKILL_LIMIT) {
        toast.warning(t("hero.warnings.skillLimitReached"));
        return;
      }

      try {
        await skillsService.updateInstall(installId, {
          enabled: !currentEnabled,
        });
        setSkillInstalls((prev) =>
          prev.map((install) =>
            install.id === installId
              ? { ...install, enabled: !currentEnabled }
              : install,
          ),
        );
        if (!currentEnabled) {
          playMcpInstallSound();
        }

        // Check if we've exceeded the limit after enabling
        const newEnabledCount = !currentEnabled
          ? currentEnabledCount + 1
          : currentEnabledCount;
        if (newEnabledCount > SKILL_LIMIT) {
          toast.warning(
            t("hero.warnings.tooManySkills", { count: newEnabledCount }),
          );
        }
      } catch (error) {
        console.error("[CardNav] Failed to toggle Skill:", error);
      }
    },
    [skillInstalls, t],
  );

  // Batch toggle all MCPs
  const batchToggleMcps = useCallback(
    async (enable: boolean) => {
      try {
        const installIds = mcpInstalls
          .filter((install) => install.enabled !== enable)
          .map((install) => install.id);
        if (installIds.length > 0) {
          await mcpService.bulkUpdateInstalls({
            enabled: enable,
            install_ids: installIds,
          });
        }
        setMcpInstalls((prev) =>
          prev.map((install) => ({ ...install, enabled: enable })),
        );
        if (enable) {
          const count = mcpInstalls.length;
          if (count > MCP_LIMIT) {
            toast.warning(t("hero.warnings.tooManyMcps", { count }));
          } else {
            playMcpInstallSound();
          }
        }
      } catch (error) {
        console.error("[CardNav] Failed to batch toggle MCPs:", error);
        toast.error(t("hero.toasts.actionFailed"));
      }
    },
    [mcpInstalls, t],
  );

  // Batch toggle all Skills
  const batchToggleSkills = useCallback(
    async (enable: boolean) => {
      try {
        const installIds = skillInstalls
          .filter((install) => install.enabled !== enable)
          .map((install) => install.id);
        if (installIds.length > 0) {
          await skillsService.bulkUpdateInstalls({
            enabled: enable,
            install_ids: installIds,
          });
        }
        setSkillInstalls((prev) =>
          prev.map((install) => ({ ...install, enabled: enable })),
        );
        if (enable) {
          const count = skillInstalls.length;
          if (count > SKILL_LIMIT) {
            toast.warning(t("hero.warnings.tooManySkills", { count }));
          } else {
            playMcpInstallSound();
          }
        }
      } catch (error) {
        console.error("[CardNav] Failed to batch toggle Skills:", error);
        toast.error(t("hero.toasts.actionFailed"));
      }
    },
    [skillInstalls, t],
  );

  // Handle warning icon click
  const handleWarningClick = useCallback(
    (type: "mcp" | "skill") => {
      const count =
        type === "mcp"
          ? installedMcps.filter((i) => i.enabled).length
          : installedSkills.filter((i) => i.enabled).length;
      toast.warning(
        t(`hero.warnings.tooMany${type === "mcp" ? "Mcps" : "Skills"}`, {
          count,
        }),
      );
    },
    [installedMcps, installedSkills, t],
  );

  const createTimeline = useCallback(() => {
    const navEl = navRef.current;
    const cards = cardsRef.current.filter(Boolean);
    if (!navEl) return null;

    gsap.set(navEl, { height: 48 });
    gsap.set(cards, { opacity: 0, scale: 0.95, y: 15 });

    const tl = gsap.timeline({
      paused: true,
      defaults: { ease: "power2.out" },
    });

    tl.to(navEl, { height: "auto", duration: 0.15 });
    tl.to(
      cards,
      { opacity: 1, scale: 1, y: 0, duration: 0.25, stagger: 0.08 },
      "-=0.25",
    );

    return tl;
  }, []);

  useLayoutEffect(() => {
    const tl = createTimeline();
    tlRef.current = tl;
    return () => {
      tl?.kill();
      tlRef.current = null;
    };
  }, [createTimeline]);

  const openMenu = useCallback(() => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }

    if (!isExpanded) {
      setIsExpanded(true);
      fetchData();

      requestAnimationFrame(() => {
        if (!tlRef.current) {
          tlRef.current = createTimeline();
        }
        tlRef.current?.play(0);
      });
    }
  }, [isExpanded, fetchData, createTimeline]);

  const closeMenu = useCallback(() => {
    const tl = tlRef.current;
    if (!tl || !isExpanded) return;

    tl.reverse();
    tl.eventCallback("onReverseComplete", () => {
      setIsExpanded(false);
    });
  }, [isExpanded]);

  // Handle forceExpanded prop
  useEffect(() => {
    if (forceExpanded) {
      openMenu();
    } else if (!isHoveringRef.current) {
      closeMenu();
    }
  }, [forceExpanded, openMenu, closeMenu]);

  const handleMouseEnter = useCallback(() => {
    isHoveringRef.current = true;
    openMenu();
  }, [openMenu]);

  const handleMouseLeave = useCallback(() => {
    isHoveringRef.current = false;
    closeTimeoutRef.current = setTimeout(() => {
      if (!isHoveringRef.current && !forceExpanded) {
        closeMenu();
      }
    }, 50);
  }, [closeMenu, forceExpanded]);

  const setCardRef = (index: number) => (el: HTMLDivElement | null) => {
    cardsRef.current[index] = el;
  };

  const handleLabelClick = useCallback(
    (e: React.MouseEvent, path: string) => {
      e.stopPropagation();
      router.push(`/${lng}/${path}?from=home`);
    },
    [router, lng],
  );

  const renderItemBadges = (
    items: InstalledItem[],
    emptyText: string,
    type: "mcp" | "skill",
  ) => {
    if (isLoading && !hasFetched) {
      return (
        <div className="flex flex-col gap-1">
          <SkeletonText className="h-3 w-20" />
          <SkeletonText className="h-3 w-24" />
          <SkeletonText className="h-3 w-16" />
        </div>
      );
    }

    if (items.length === 0) {
      return (
        <span className="text-xs italic text-muted-foreground">
          {emptyText}
        </span>
      );
    }

    const toggleFn = type === "mcp" ? toggleMcpEnabled : toggleSkillEnabled;

    return (
      <div className="flex flex-col gap-2">
        {/* Item list */}
        <div className="flex flex-col gap-1 max-h-[180px] overflow-y-auto -mr-1 pr-2 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/10 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/30 transition-colors">
          <StaggeredEntrance show={hasFetched} staggerDelay={30} duration={300}>
            {items.map((item) => (
              <button
                key={item.id}
                className={cn(
                  "group/item flex items-center gap-2.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition-all duration-200 text-left w-full cursor-pointer select-none",
                  "text-muted-foreground hover:text-foreground hover:bg-muted/60 active:bg-muted/80",
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFn(item.installId, item.enabled);
                }}
                type="button"
              >
                <div
                  className={cn(
                    "w-2 h-2 rounded-full transition-all duration-300 flex-shrink-0",
                    item.enabled
                      ? "bg-primary shadow-[0_0_6px_-1px_hsl(var(--primary)/0.6)] scale-100"
                      : "bg-muted-foreground/30 scale-90 group-hover/item:bg-muted-foreground/50",
                  )}
                />
                <span className="flex-1 truncate tracking-tight opacity-90 group-hover/item:opacity-100">
                  {item.name}
                </span>
              </button>
            ))}
          </StaggeredEntrance>
        </div>
      </div>
    );
  };

  return (
    <div className={cn("w-full", className)}>
      <nav
        ref={navRef}
        className={cn(
          "relative rounded-xl border border-border bg-card/50 overflow-hidden transition-all duration-[0.4s] ease-[cubic-bezier(0.23,1,0.32,1)] backdrop-blur-md",
          "hover:shadow-[0_12px_40px_-12px_rgba(var(--foreground),0.15)] hover:bg-card/80",
          isExpanded &&
            "shadow-[0_12px_40px_-12px_rgba(var(--foreground),0.15)] bg-card/80",
        )}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Entry Bar */}
        <div className="group flex items-center gap-3 p-3.5 cursor-pointer">
          <Plug
            className={cn(
              "size-5 flex-shrink-0 text-muted-foreground transition-all duration-300",
              isExpanded && "rotate-12",
            )}
          />
          <span className="text-sm font-medium text-muted-foreground transition-colors duration-300">
            {triggerText}
          </span>
        </div>

        {/* Modular Content */}
        <div ref={contentRef} className="overflow-hidden">
          <div className="grid grid-cols-3 gap-4 p-4 border-t border-border/50 max-[900px]:grid-cols-1">
            {/* MCP Card */}
            <div
              ref={setCardRef(0)}
              className="group relative flex flex-col p-5 rounded-lg border bg-muted/30 border-border/50 hover:-translate-y-0.5 hover:bg-muted/40 hover:shadow-[0_4px_12px_-2px_rgba(var(--foreground),0.05)] transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] min-h-[140px]"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center justify-center size-9 rounded-md bg-muted text-muted-foreground transition-all duration-300">
                    <Server className="size-[1.125rem]" />
                  </div>
                  <button
                    className="flex items-center gap-1 bg-transparent border-none cursor-pointer transition-all duration-200 rounded px-2 py-1 -mx-2 -my-1 hover:bg-muted/50 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
                    onClick={(e) => handleLabelClick(e, "capabilities/mcp")}
                    type="button"
                  >
                    <span className="text-base font-semibold tracking-[-0.01em] text-foreground">
                      MCP
                    </span>
                    <ChevronRight className="size-3.5 text-muted-foreground transition-transform duration-200 hover:translate-x-0.5" />
                  </button>
                </div>
                <div className="flex items-center gap-1">
                  {installedMcps.filter((i) => i.enabled).length > 0 && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            batchToggleMcps(false);
                          }}
                          className="flex items-center justify-center size-6 rounded-md hover:bg-muted/60 transition-colors text-muted-foreground hover:text-foreground"
                          type="button"
                        >
                          <PowerOff className="size-3.5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" sideOffset={4}>
                        <span>Disable all</span>
                      </TooltipContent>
                    </Tooltip>
                  )}
                  {installedMcps.filter((i) => i.enabled).length >
                    MCP_LIMIT && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleWarningClick("mcp");
                      }}
                      className="flex items-center justify-center size-6 rounded-full hover:bg-amber-500/20 transition-colors"
                      type="button"
                      title="Click to view details"
                    >
                      <AlertTriangle className="size-4 text-amber-500" />
                    </button>
                  )}
                </div>
              </div>
              {renderItemBadges(installedMcps, "MCP not installed", "mcp")}
            </div>

            {/* Skill Card */}
            <div
              ref={setCardRef(1)}
              className="group relative flex flex-col p-5 rounded-lg border bg-muted/30 border-border/50 hover:-translate-y-0.5 hover:bg-muted/40 hover:shadow-[0_4px_12px_-2px_rgba(var(--foreground),0.05)] transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] min-h-[140px]"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center justify-center size-9 rounded-md bg-muted text-muted-foreground transition-all duration-300">
                    <Sparkles className="size-[1.125rem]" />
                  </div>
                  <button
                    className="flex items-center gap-1 bg-transparent border-none cursor-pointer transition-all duration-200 rounded px-2 py-1 -mx-2 -my-1 hover:bg-muted/50 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
                    onClick={(e) => handleLabelClick(e, "capabilities/skills")}
                    type="button"
                  >
                    <span className="text-base font-semibold tracking-[-0.01em] text-foreground">
                      Skills
                    </span>
                    <ChevronRight className="size-3.5 text-muted-foreground transition-transform duration-200 hover:translate-x-0.5" />
                  </button>
                </div>
                <div className="flex items-center gap-1">
                  {installedSkills.filter((i) => i.enabled).length > 0 && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            batchToggleSkills(false);
                          }}
                          className="flex items-center justify-center size-6 rounded-md hover:bg-muted/60 transition-colors text-muted-foreground hover:text-foreground"
                          type="button"
                        >
                          <PowerOff className="size-3.5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" sideOffset={4}>
                        <span>Disable all</span>
                      </TooltipContent>
                    </Tooltip>
                  )}
                  {installedSkills.filter((i) => i.enabled).length >
                    SKILL_LIMIT && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleWarningClick("skill");
                      }}
                      className="flex items-center justify-center size-6 rounded-full hover:bg-amber-500/20 transition-colors"
                      type="button"
                      title="Click to view details"
                    >
                      <AlertTriangle className="size-4 text-amber-500" />
                    </button>
                  )}
                </div>
              </div>
              {renderItemBadges(installedSkills, "Skill not installed", "skill")}
            </div>

            {/* App Card */}
            <div className="group relative flex flex-col p-5 rounded-lg border bg-muted/30 border-border/50 hover:-translate-y-0.5 hover:bg-muted/40 hover:shadow-[0_4px_12px_-2px_rgba(var(--foreground),0.05)] transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] min-h-[140px]">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="flex items-center justify-center size-9 rounded-md bg-muted text-muted-foreground transition-all duration-300">
                  <AppWindow className="size-[1.125rem]" />
                </div>
                <span className="text-base font-semibold tracking-[-0.01em] text-foreground">
                  Apps
                </span>
              </div>
              <span className="text-xs italic text-muted-foreground">
                Coming Soon
              </span>
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
}

export default CardNav;
