import { Shield, Globe, Info, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Connector } from "../../model/connectors";

interface ConnectorCardProps {
  connector: Connector;
  isComingSoon?: boolean;
  onClick: () => void;
}

/**
 * Individual connector card for the grid
 */
export function ConnectorCard({
  connector,
  isComingSoon = true,
  onClick,
}: ConnectorCardProps) {
  return (
    <div
      className={cn(
        "group flex items-start gap-4 p-5 rounded-2xl border transition-all duration-300",
        isComingSoon
          ? "border-white/5 bg-white/[0.02] opacity-40 grayscale cursor-not-allowed"
          : "border-white/10 bg-white/[0.03] hover:bg-white/[0.08] hover:border-white/20 hover:scale-[1.02] cursor-pointer shadow-lg hover:shadow-primary/5",
      )}
      onClick={() => {
        if (!isComingSoon) {
          onClick();
        }
      }}
    >
      <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-white/[0.05] border border-white/10 group-hover:bg-primary/10 group-hover:border-primary/20 transition-colors">
        <connector.icon className="size-6 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          <div className="font-semibold text-base truncate group-hover:text-primary transition-colors">
            {connector.title}
          </div>
          {isComingSoon && (
            <Badge
              variant="outline"
              className="text-[9px] h-4 bg-muted/30 border-white/10 text-muted-foreground/60 px-1.5"
            >
              开发中
            </Badge>
          )}
        </div>
        <div className="text-sm text-muted-foreground/70 line-clamp-2 leading-relaxed">
          {connector.description}
        </div>
      </div>
    </div>
  );
}

/**
 * Feature item for connector capabilities
 */
interface CapabilityFeatureProps {
  icon: React.ElementType;
  title: string;
  desc: string;
}

export function CapabilityFeature({
  icon: Icon,
  title,
  desc,
}: CapabilityFeatureProps) {
  return (
    <div className="group p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all flex items-start gap-3">
      <div className="size-8 rounded-lg bg-white/[0.03] flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
        <Icon className="size-4 text-muted-foreground/60 group-hover:text-primary transition-colors" />
      </div>
      <div className="min-w-0">
        <div className="font-bold text-sm mb-0.5 truncate group-hover:text-primary transition-colors">
          {title}
        </div>
        <div className="text-[11px] text-muted-foreground/50 leading-snug line-clamp-2">
          {desc}
        </div>
      </div>
    </div>
  );
}

/**
 * Default capabilities for all connectors
 */
export const DEFAULT_CAPABILITIES = [
  {
    title: "自动化流程",
    desc: "基于事件驱动，触发复杂任务流",
    icon: Globe,
  },
  {
    title: "智能协作助手",
    desc: "AI 深入理解上下文，提供建议",
    icon: Info,
  },
  {
    title: "安全管理系统",
    desc: "采用企业级加密，确保数据安全",
    icon: Shield,
  },
  {
    title: "全局搜索索引",
    desc: "跨平台查询，毫秒级召回对话",
    icon: Search,
  },
];
