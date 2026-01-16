export interface ModelInfo {
  id: string;
  name: string;
  description: string;
  icon: string;
  provider: "anthropic" | "openai" | "google";
}

export interface UsageStats {
  credits: number;
  tokensUsed: number;
  duration: number;
  todayUsage: number;
  weekUsage: number;
  monthUsage: number;
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
}
