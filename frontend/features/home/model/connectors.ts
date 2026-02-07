import * as React from "react";
import {
  Chrome,
  Mail,
  Calendar,
  HardDrive,
  Github,
  Slack,
  Database,
  Command,
  Search,
} from "lucide-react";

export const ConnectorIcons = {
  chrome: Chrome,
  gmail: Mail,
  calendar: Calendar,
  drive: HardDrive,
  outlook: Mail,
  github: Github,
  slack: Slack,
  notion: Database,
  zapier: Command,
  search: Search,
};

export type ConnectorType = "app" | "mcp" | "skill" | "api";

export interface Connector {
  id: string;
  type: ConnectorType;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  author: string;
  website: string;
  privacyPolicy: string;
  connected?: boolean;
}

export const AVAILABLE_CONNECTORS: Connector[] = [
  // APPS
  {
    id: "gmail",
    type: "app",
    title: "Gmail",
    description: "Compose emails, search threads, and quickly generate summaries",
    icon: ConnectorIcons.gmail,
    author: "Poco",
    website: "https://google.com/gmail",
    privacyPolicy: "https://policies.google.com",
  },
  {
    id: "gcal",
    type: "app",
    title: "Google Calendar",
    description: "View schedules and optimize time and activity management",
    icon: ConnectorIcons.calendar,
    author: "Poco",
    website: "https://calendar.google.com",
    privacyPolicy: "https://policies.google.com",
  },
  {
    id: "gdrive",
    type: "app",
    title: "Google Drive",
    description:
      "Quickly access files, search content intelligently, and let Poco help you manage documents more efficiently",
    icon: ConnectorIcons.drive,
    author: "Poco",
    website: "https://drive.google.com",
    privacyPolicy: "https://policies.google.com",
  },
  {
    id: "outlook-mail",
    type: "app",
    title: "Outlook Mail",
    description:
      "Write, search, and manage your Outlook emails seamlessly in Poco",
    icon: ConnectorIcons.outlook,
    author: "Microsoft",
    website: "https://outlook.live.com",
    privacyPolicy: "https://privacy.microsoft.com",
  },
  {
    id: "github",
    type: "app",
    title: "GitHub",
    description: "Manage repositories, collaborate on development, and review code",
    icon: ConnectorIcons.github,
    author: "GitHub",
    website: "https://github.com",
    privacyPolicy: "https://docs.github.com/en/site-policy",
  },
  {
    id: "slack",
    type: "app",
    title: "Slack",
    description: "Read and write Slack conversations in Poco",
    icon: ConnectorIcons.slack,
    author: "Slack",
    website: "https://slack.com",
    privacyPolicy: "https://slack.com/privacy",
  },
  {
    id: "notion",
    type: "app",
    title: "Notion",
    description: "Search and update content to automate workflows",
    icon: ConnectorIcons.notion,
    author: "Notion",
    website: "https://notion.so",
    privacyPolicy: "https://www.notion.so/privacy",
  },

  // MCPs
  {
    id: "filesystem",
    type: "mcp",
    title: "File System",
    description: "Allow reading and writing files on the local file system",
    icon: ConnectorIcons.drive, // Reuse drive icon or similar
    author: "ModelContextProtocol",
    website: "https://modelcontextprotocol.io",
    privacyPolicy: "https://modelcontextprotocol.io/privacy",
  },
  {
    id: "postgres",
    type: "mcp",
    title: "PostgreSQL",
    description: "Read-only database access for PostgreSQL",
    icon: ConnectorIcons.notion, // Reuse database icon
    author: "ModelContextProtocol",
    website: "https://modelcontextprotocol.io",
    privacyPolicy: "https://modelcontextprotocol.io/privacy",
  },
  {
    id: "sentry",
    type: "mcp",
    title: "Sentry",
    description: "Retrieve and analyze error reports from Sentry",
    icon: ConnectorIcons.zapier, // Reuse command icon
    author: "Sentry",
    website: "https://sentry.io",
    privacyPolicy: "https://sentry.io/privacy",
  },

  // SKILLS
  {
    id: "web-search",
    type: "skill",
    title: "Web Search",
    description:
      "Perform real-time web searches to retrieve up-to-date information.",
    icon: ConnectorIcons.search,
    author: "Poco",
    website: "https://open-cowork.com",
    privacyPolicy: "https://open-cowork.com/privacy",
  },
  {
    id: "code-interpreter",
    type: "skill",
    title: "Code Interpreter",
    description: "Execute Python code safely in a sandboxed environment.",
    icon: ConnectorIcons.zapier, // Reuse command icon
    author: "Poco",
    website: "https://open-cowork.com",
    privacyPolicy: "https://open-cowork.com/privacy",
  },
];
