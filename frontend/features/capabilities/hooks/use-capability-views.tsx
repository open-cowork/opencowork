"use client";

import * as React from "react";
import type { LucideIcon } from "lucide-react";
import {
  Sparkles,
  Puzzle,
  Server,
  KeySquare,
  FileText,
  Command as CommandIcon,
  Bot,
} from "lucide-react";

import { useT } from "@/lib/i18n/client";
import { PresetsPageClient } from "@/features/capabilities/presets/components/presets-page-client";
import { SkillsPageClient } from "@/features/capabilities/skills/components/skills-page-client";
import { McpPageClient } from "@/features/capabilities/mcp/components/mcp-page-client";
import { EnvVarsPageClient } from "@/features/capabilities/env-vars/components/env-vars-page-client";
import { PersonalizationPageClient } from "@/features/capabilities/personalization/components/personalization-page-client";
import { SlashCommandsPageClient } from "@/features/capabilities/slash-commands/components/slash-commands-page-client";
import { SubAgentsPageClient } from "@/features/capabilities/sub-agents/components/sub-agents-page-client";

export interface CapabilityView {
  id: string;
  label: string;
  description: string;
  group: "featured" | "primary" | "secondary" | "tertiary";
  icon: LucideIcon;
  component: React.ComponentType;
}

export function useCapabilityViews(): CapabilityView[] {
  const { t } = useT("translation");

  return React.useMemo(
    () => [
      {
        id: "presets",
        label: t("library.presets.title"),
        description: t("library.presets.description"),
        group: "featured",
        icon: Sparkles,
        component: PresetsPageClient,
      },
      {
        id: "skills",
        label: t("library.skillsStore.title"),
        description: t("library.skillsStore.description"),
        group: "primary",
        icon: Puzzle,
        component: SkillsPageClient,
      },
      {
        id: "mcp",
        label: t("library.mcpInstall.title"),
        description: t("library.mcpInstall.description"),
        group: "primary",
        icon: Server,
        component: McpPageClient,
      },
      {
        id: "slash-commands",
        label: t("library.slashCommands.card.title"),
        description: t("library.slashCommands.card.description"),
        group: "primary",
        icon: CommandIcon,
        component: SlashCommandsPageClient,
      },
      {
        id: "sub-agents",
        label: t("library.subAgents.card.title"),
        description: t("library.subAgents.card.description"),
        group: "secondary",
        icon: Bot,
        component: SubAgentsPageClient,
      },
      {
        id: "env",
        label: t("library.envVars.sidebarTitle"),
        description: t("library.envVars.description"),
        group: "tertiary",
        icon: KeySquare,
        component: EnvVarsPageClient,
      },
      {
        id: "personalization",
        label: t("library.personalization.card.title"),
        description: t("library.personalization.card.description"),
        group: "tertiary",
        icon: FileText,
        component: PersonalizationPageClient,
      },
    ],
    [t],
  );
}
