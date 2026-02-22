"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n/client";

interface OnboardingTourProps {
  open: boolean;
  runId: number;
  lng: string;
  onClose: (completed: boolean) => void;
}

interface TourStep {
  id: string;
  titleKey: string;
  descriptionKey: string;
  selector?: string;
  path?: string;
  viewId?: string;
  confineToSidebar?: boolean;
  padding?: number;
}

const TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    titleKey: "onboarding.steps.welcome.title",
    descriptionKey: "onboarding.steps.welcome.description",
  },
  {
    id: "new-task",
    titleKey: "onboarding.steps.newTask.title",
    descriptionKey: "onboarding.steps.newTask.description",
    selector: '[data-onboarding="sidebar-new-task"]',
    path: "/home",
    confineToSidebar: true,
    padding: 6,
  },
  {
    id: "mode-toggle",
    titleKey: "onboarding.steps.modeToggle.title",
    descriptionKey: "onboarding.steps.modeToggle.description",
    selector: '[data-onboarding="home-mode-toggle"]',
    path: "/home",
  },
  {
    id: "composer",
    titleKey: "onboarding.steps.composer.title",
    descriptionKey: "onboarding.steps.composer.description",
    selector: '[data-onboarding="home-task-composer"]',
    path: "/home",
  },
  {
    id: "capabilities",
    titleKey: "onboarding.steps.capabilities.title",
    descriptionKey: "onboarding.steps.capabilities.description",
    selector: '[data-onboarding="sidebar-capabilities"]',
    path: "/capabilities",
    viewId: "skills",
    confineToSidebar: true,
    padding: 6,
  },
  {
    id: "skills-detail",
    titleKey: "onboarding.steps.skillsDetail.title",
    descriptionKey: "onboarding.steps.skillsDetail.description",
    selector: '[data-onboarding="capabilities-detail"]',
    path: "/capabilities",
    viewId: "skills",
  },
  {
    id: "projects",
    titleKey: "onboarding.steps.projects.title",
    descriptionKey: "onboarding.steps.projects.description",
    selector: '[data-onboarding="sidebar-projects"]',
    confineToSidebar: true,
    padding: 6,
  },
  {
    id: "task-list",
    titleKey: "onboarding.steps.taskList.title",
    descriptionKey: "onboarding.steps.taskList.description",
    selector: '[data-onboarding="sidebar-task-list"]',
    confineToSidebar: true,
    padding: 6,
  },
  {
    id: "quick-menu",
    titleKey: "onboarding.steps.quickMenu.title",
    descriptionKey: "onboarding.steps.quickMenu.description",
    selector: '[data-onboarding="sidebar-footer-bottom"]',
    confineToSidebar: true,
    padding: 0,
  },
];

const CARD_WIDTH = 360;
const CARD_HEIGHT = 220;
const VIEWPORT_MARGIN = 16;
const SPOTLIGHT_PADDING = 10;
const SPOTLIGHT_RADIUS = 16;
const MIN_VISIBLE_SIZE = 8;

function isStepVisible(rect: DOMRect): boolean {
  return rect.width >= MIN_VISIBLE_SIZE && rect.height >= MIN_VISIBLE_SIZE;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function OnboardingTour({
  open,
  runId,
  lng,
  onClose,
}: OnboardingTourProps) {
  const { t } = useT("translation");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [stepIndex, setStepIndex] = React.useState(0);
  const [targetRect, setTargetRect] = React.useState<DOMRect | null>(null);
  const [constraintRect, setConstraintRect] = React.useState<DOMRect | null>(
    null,
  );
  const [viewport, setViewport] = React.useState({ width: 0, height: 0 });

  const step = TOUR_STEPS[stepIndex];
  const isLastStep = stepIndex >= TOUR_STEPS.length - 1;

  const expectedPath = React.useMemo(() => {
    if (!step?.path) return null;
    return lng ? `/${lng}${step.path}` : step.path;
  }, [lng, step?.path]);

  const expectedHref = (() => {
    if (!expectedPath) return null;
    if (!step?.viewId) return expectedPath;
    const params = new URLSearchParams();
    params.set("view", step.viewId);
    return `${expectedPath}?${params.toString()}`;
  })();

  React.useEffect(() => {
    if (!open) return;
    setStepIndex(0);
  }, [open, runId]);

  const goPrev = React.useCallback(() => {
    setStepIndex((current) => Math.max(0, current - 1));
  }, []);

  const goNext = React.useCallback(() => {
    if (isLastStep) {
      onClose(true);
      return;
    }

    setStepIndex((current) => Math.min(current + 1, TOUR_STEPS.length - 1));
  }, [isLastStep, onClose]);

  React.useEffect(() => {
    if (!open || !expectedPath || !expectedHref) return;

    const isPathMatched = pathname === expectedPath;
    const isViewMatched =
      !step?.viewId || searchParams.get("view") === step.viewId;
    if (isPathMatched && isViewMatched) return;

    router.push(expectedHref);
  }, [
    expectedHref,
    expectedPath,
    open,
    pathname,
    router,
    searchParams,
    step?.viewId,
  ]);

  React.useEffect(() => {
    if (!open) {
      setTargetRect(null);
      setConstraintRect(null);
      return;
    }

    const syncTarget = () => {
      setViewport({ width: window.innerWidth, height: window.innerHeight });

      if (!step?.selector) {
        setTargetRect(null);
        setConstraintRect(null);
        return;
      }

      const target = document.querySelector<HTMLElement>(step.selector);
      if (!target) {
        setTargetRect(null);
        setConstraintRect(null);
        return;
      }

      const rect = target.getBoundingClientRect();
      if (!isStepVisible(rect)) {
        setTargetRect(null);
        setConstraintRect(null);
        return;
      }

      setTargetRect(rect);

      if (step.confineToSidebar) {
        const sidebar = target.closest<HTMLElement>(
          '[data-slot="sidebar-inner"]',
        );
        setConstraintRect(sidebar ? sidebar.getBoundingClientRect() : null);
      } else {
        setConstraintRect(null);
      }
    };

    syncTarget();

    const delayed = window.setTimeout(syncTarget, 220);
    window.addEventListener("resize", syncTarget);
    window.addEventListener("scroll", syncTarget, true);

    return () => {
      window.clearTimeout(delayed);
      window.removeEventListener("resize", syncTarget);
      window.removeEventListener("scroll", syncTarget, true);
    };
  }, [open, pathname, searchParams, step?.confineToSidebar, step?.selector]);

  React.useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose(false);
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goPrev();
        return;
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        goNext();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goNext, goPrev, onClose, open]);

  const spotlightStyle = React.useMemo<React.CSSProperties | undefined>(() => {
    if (!targetRect || !viewport.width || !viewport.height) return undefined;
    const stepPadding = step?.padding ?? SPOTLIGHT_PADDING;
    const boundaryLeft = constraintRect
      ? clamp(constraintRect.left, 0, viewport.width)
      : 0;
    const boundaryRight = constraintRect
      ? clamp(constraintRect.right, 0, viewport.width)
      : viewport.width;
    const boundaryTop = constraintRect
      ? clamp(constraintRect.top, 0, viewport.height)
      : 0;
    const boundaryBottom = constraintRect
      ? clamp(constraintRect.bottom, 0, viewport.height)
      : viewport.height;
    const left = clamp(
      targetRect.left - stepPadding,
      boundaryLeft,
      boundaryRight,
    );
    const top = clamp(
      targetRect.top - stepPadding,
      boundaryTop,
      boundaryBottom,
    );
    const right = clamp(
      targetRect.right + stepPadding,
      boundaryLeft,
      boundaryRight,
    );
    const bottom = clamp(
      targetRect.bottom + stepPadding,
      boundaryTop,
      boundaryBottom,
    );

    return {
      width: Math.max(0, right - left),
      height: Math.max(0, bottom - top),
      left,
      top,
    };
  }, [
    constraintRect,
    step?.padding,
    targetRect,
    viewport.height,
    viewport.width,
  ]);

  const cardStyle = React.useMemo<React.CSSProperties>(() => {
    const maxWidth = viewport.width
      ? Math.min(CARD_WIDTH, viewport.width - VIEWPORT_MARGIN * 2)
      : CARD_WIDTH;

    if (!targetRect || !viewport.width || !viewport.height) {
      return {
        width: maxWidth,
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)",
      };
    }

    const left = clamp(
      targetRect.left,
      VIEWPORT_MARGIN,
      viewport.width - maxWidth - VIEWPORT_MARGIN,
    );

    const preferredTop = targetRect.bottom + 14;
    const fallbackTop = targetRect.top - CARD_HEIGHT - 14;
    const top =
      preferredTop + CARD_HEIGHT + VIEWPORT_MARGIN <= viewport.height
        ? preferredTop
        : clamp(
            fallbackTop,
            VIEWPORT_MARGIN,
            viewport.height - CARD_HEIGHT - VIEWPORT_MARGIN,
          );

    return {
      width: maxWidth,
      left,
      top,
    };
  }, [targetRect, viewport.height, viewport.width]);

  const maskedOverlayStyle = React.useMemo<
    React.CSSProperties | undefined
  >(() => {
    if (!spotlightStyle || !viewport.width || !viewport.height) {
      return undefined;
    }

    const spotlightLeft = Math.max(0, spotlightStyle.left as number);
    const spotlightTop = Math.max(0, spotlightStyle.top as number);
    const spotlightWidth = Math.max(0, spotlightStyle.width as number);
    const spotlightHeight = Math.max(0, spotlightStyle.height as number);
    const spotlightRadius = Math.min(
      SPOTLIGHT_RADIUS,
      spotlightWidth / 2,
      spotlightHeight / 2,
    );

    const outerPath = `M0 0 H${viewport.width} V${viewport.height} H0 Z`;
    const innerPath = [
      `M${spotlightLeft + spotlightRadius} ${spotlightTop}`,
      `H${spotlightLeft + spotlightWidth - spotlightRadius}`,
      `A${spotlightRadius} ${spotlightRadius} 0 0 1 ${
        spotlightLeft + spotlightWidth
      } ${spotlightTop + spotlightRadius}`,
      `V${spotlightTop + spotlightHeight - spotlightRadius}`,
      `A${spotlightRadius} ${spotlightRadius} 0 0 1 ${
        spotlightLeft + spotlightWidth - spotlightRadius
      } ${spotlightTop + spotlightHeight}`,
      `H${spotlightLeft + spotlightRadius}`,
      `A${spotlightRadius} ${spotlightRadius} 0 0 1 ${spotlightLeft} ${
        spotlightTop + spotlightHeight - spotlightRadius
      }`,
      `V${spotlightTop + spotlightRadius}`,
      `A${spotlightRadius} ${spotlightRadius} 0 0 1 ${
        spotlightLeft + spotlightRadius
      } ${spotlightTop}`,
      "Z",
    ].join(" ");
    const svgMask = `<svg xmlns='http://www.w3.org/2000/svg' width='${viewport.width}' height='${viewport.height}' viewBox='0 0 ${viewport.width} ${viewport.height}'><path d='${outerPath} ${innerPath}' fill='white' fill-rule='evenodd' clip-rule='evenodd'/></svg>`;
    const maskUrl = `url("data:image/svg+xml;utf8,${encodeURIComponent(svgMask)}")`;

    return {
      WebkitMaskImage: maskUrl,
      maskImage: maskUrl,
      WebkitMaskMode: "alpha",
      maskMode: "alpha",
      WebkitMaskRepeat: "no-repeat",
      maskRepeat: "no-repeat",
      WebkitMaskPosition: "0 0",
      maskPosition: "0 0",
      WebkitMaskSize: "100% 100%",
      maskSize: "100% 100%",
    };
  }, [spotlightStyle, viewport.height, viewport.width]);

  if (!open || !step) return null;

  return (
    <div className="fixed inset-0 z-[120]" role="dialog" aria-modal="true">
      <div
        className="absolute inset-0 bg-slate-950/55 backdrop-blur-[1px]"
        style={maskedOverlayStyle}
      />

      {spotlightStyle ? (
        <div
          className="pointer-events-none absolute rounded-2xl border-2 border-primary/70 shadow-xl transition-[top,left,width,height] duration-300 ease-out motion-reduce:transition-none"
          style={spotlightStyle}
        >
          <div className="absolute inset-0 rounded-2xl border border-primary/50 motion-safe:animate-pulse motion-reduce:animate-none" />
        </div>
      ) : null}

      <div
        className="absolute rounded-2xl border border-border bg-card p-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200 motion-reduce:animate-none"
        style={cardStyle}
      >
        <div className="mb-3">
          <h2 className="truncate text-sm font-semibold text-foreground">
            {t("onboarding.progress", {
              current: stepIndex + 1,
              total: TOUR_STEPS.length,
            })}{" "}
            · {t(step.titleKey)}
          </h2>
        </div>

        <p className="text-sm leading-6 text-muted-foreground">
          {t(step.descriptionKey)}
        </p>

        {step.selector && !targetRect ? (
          <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
            {t("onboarding.targetUnavailable")}
          </p>
        ) : null}

        <div className="mt-4 flex items-center justify-between gap-2">
          <Button type="button" variant="ghost" onClick={() => onClose(false)}>
            {t("onboarding.skip")}
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={goPrev}
              disabled={stepIndex === 0}
            >
              <ChevronLeft className="size-4" />
              {t("onboarding.back")}
            </Button>
            <Button type="button" onClick={goNext}>
              {isLastStep ? t("onboarding.done") : t("onboarding.next")}
              {isLastStep ? null : <ChevronRight className="size-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
