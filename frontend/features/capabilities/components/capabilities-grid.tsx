"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Puzzle,
  Server,
  Sparkles,
  Key,
  FileText,
  Command as CommandIcon,
  Bot,
} from "lucide-react";

import { useT } from "@/lib/i18n/client";
import { FeatureCard } from "@/components/ui/feature-card";

interface CapabilitiesCard {
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

export function CapabilitiesGrid() {
  const { t } = useT("translation");
  const router = useRouter();
  const params = useParams();
  const lng = React.useMemo(() => {
    const value = params?.lng;
    if (!value) return undefined;
    return Array.isArray(value) ? value[0] : value;
  }, [params]);

  const cards: CapabilitiesCard[] = React.useMemo(
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
        actionHref: "/capabilities/skills",
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
        actionHref: "/capabilities/mcp",
        comingSoon: false,
      },
      {
        id: "env-vars",
        icon: <Key className="size-6" />,
        title: t("library.envVars.card.title", "Environment Variables"),
        description: t(
          "library.envVars.card.description",
          "Manage API keys and secrets",
        ),
        features: [
          t("library.envVars.card.feature1", "Store sensitive data securely"),
          t("library.envVars.card.feature2", "Shared across multiple MCPs"),
          t("library.envVars.card.feature3", "Encrypted in transit and at rest"),
        ],
        actionLabel: t("library.envVars.card.action", "Manage Variables"),
        actionHref: "/capabilities/env-vars",
        comingSoon: false,
      },
      {
        id: "personalization",
        icon: <FileText className="size-6" />,
        title: t("library.personalization.card.title", "Personalization"),
        description: t(
          "library.personalization.card.description",
          "Set long-term preferences and instructions for all tasks",
        ),
        features: [
          t("library.personalization.card.feature1", "Applies to your account"),
          t("library.personalization.card.feature2", "Custom instructions"),
          t(
            "library.personalization.card.feature3",
            "Update anytime; applies to the next task",
          ),
        ],
        actionLabel: t("library.personalization.card.action", "Open Settings"),
        actionHref: "/capabilities/personalization",
        comingSoon: false,
      },
      {
        id: "slash-commands",
        icon: <CommandIcon className="size-6" />,
        title: t("library.slashCommands.card.title", "Slash Commands"),
        description: t(
          "library.slashCommands.card.description",
          "Save common / commands and auto-complete them in chat input",
        ),
        features: [
          t("library.slashCommands.card.feature1", "Personal command library"),
          t(
            "library.slashCommands.card.feature2",
            "Supports argument-hint and allowed-tools",
          ),
          t("library.slashCommands.card.feature3", "Auto-complete and insert /"),
        ],
        actionLabel: t("library.slashCommands.card.action", "Manage Commands"),
        actionHref: "/capabilities/slash-commands",
        comingSoon: false,
      },
      {
        id: "sub-agents",
        icon: <Bot className="size-6" />,
        title: t("library.subAgents.card.title", "Sub-agents"),
        description: t(
          "library.subAgents.card.description",
          "Create reusable specialized sub-agents for isolation and parallelism.",
        ),
        features: [
          t(
            "library.subAgents.card.feature1",
            "Isolated context to reduce noise",
          ),
          t(
            "library.subAgents.card.feature2",
            "Parallel sub-agents to speed up complex tasks",
          ),
          t(
            "library.subAgents.card.feature3",
            "Restrict tools and models for better control",
          ),
        ],
        actionLabel: t("library.subAgents.card.action", "Manage Sub-agents"),
        actionHref: "/capabilities/sub-agents",
        comingSoon: false,
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
        actionHref: "/capabilities/more",
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
      router.push(lng ? `/${lng}${href}` : href);
    },
    [router, lng],
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
