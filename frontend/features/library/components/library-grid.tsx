"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Puzzle, Server, Clock, Sparkles, Key } from "lucide-react";

import { useT } from "@/lib/i18n/client";
import { FeatureCard } from "@/components/ui/feature-card";

interface LibraryCard {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  features: string[];
  actionLabel: string;
  actionHref: string;
  badge?: string;
  comingSoon?: boolean;
}

export function LibraryGrid() {
  const { t } = useT("translation");
  const router = useRouter();

  const cards: LibraryCard[] = React.useMemo(
    () => [
      {
        id: "skills-store",
        icon: <Puzzle className="size-6" />,
        title: t("library.skillsStore.title"),
        description: t("library.skillsStore.description"),
        features: [
          t("library.skillsStore.feature1"),
          t("library.skillsStore.feature2"),
          t("library.skillsStore.feature3"),
        ],
        actionLabel: t("library.skillsStore.action"),
        actionHref: "/library/skills",
        comingSoon: false,
      },
      {
        id: "mcp-install",
        icon: <Server className="size-6" />,
        title: t("library.mcpInstall.title"),
        description: t("library.mcpInstall.description"),
        features: [
          t("library.mcpInstall.feature1"),
          t("library.mcpInstall.feature2"),
          t("library.mcpInstall.feature3"),
        ],
        actionLabel: t("library.mcpInstall.action"),
        actionHref: "/library/mcp",
        comingSoon: false,
      },
      {
        id: "env-vars",
        icon: <Key className="size-6" />,
        title: t("library.envVars.card.title", "环境变量"),
        description: t(
          "library.envVars.card.description",
          "管理 API Key 和密钥",
        ),
        features: [
          t("library.envVars.card.feature1", "安全存储敏感信息"),
          t("library.envVars.card.feature2", "支持多个 MCP 共享使用"),
          t("library.envVars.card.feature3", "加密传输和存储"),
        ],
        actionLabel: t("library.envVars.card.action", "管理变量"),
        actionHref: "/library/env-vars",
        comingSoon: false,
      },
      {
        id: "scheduled-tasks",
        icon: <Clock className="size-6" />,
        title: t("library.scheduledTasks.title"),
        description: t("library.scheduledTasks.description"),
        features: [
          t("library.scheduledTasks.feature1"),
          t("library.scheduledTasks.feature2"),
          t("library.scheduledTasks.feature3"),
        ],
        actionLabel: t("library.scheduledTasks.action"),
        actionHref: "/library/scheduled-tasks",
        badge: t("library.comingSoon"),
        comingSoon: true,
      },
      {
        id: "more",
        icon: <Sparkles className="size-6" />,
        title: t("library.more.title"),
        description: t("library.more.description"),
        features: [
          t("library.more.feature1"),
          t("library.more.feature2"),
          t("library.more.feature3"),
        ],
        actionLabel: t("library.more.action"),
        actionHref: "/library/more",
        badge: t("library.comingSoon"),
        comingSoon: true,
      },
    ],
    [t],
  );

  const handleCardClick = React.useCallback(
    (href: string, comingSoon?: boolean) => {
      if (comingSoon) {
        console.log("Coming soon:", href);
        return;
      }
      router.push(href);
    },
    [router],
  );

  return (
    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => (
        <FeatureCard
          key={card.id}
          id={card.id}
          icon={card.icon}
          title={card.title}
          description={card.description}
          actionLabel={card.actionLabel}
          badge={card.badge}
          comingSoon={card.comingSoon}
          onAction={() => handleCardClick(card.actionHref, card.comingSoon)}
        />
      ))}
    </div>
  );
}
