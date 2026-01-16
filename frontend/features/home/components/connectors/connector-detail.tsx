import { useState } from "react";
import { X, Check, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { Connector } from "../../model/connectors";
import { CapabilityFeature, DEFAULT_CAPABILITIES } from "./connector-card";

interface ConnectorDetailProps {
  connector: Connector;
  onBack: () => void;
}

/**
 * Connector detail view
 * Shows connector info, connection button, and capabilities
 */
export function ConnectorDetail({ connector, onBack }: ConnectorDetailProps) {
  const isGithub = connector.id === "github";
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const handleConnect = () => {
    setIsConnecting(true);
    // Simulate connection process
    setTimeout(() => {
      setIsConnecting(false);
      setIsConnected(true);
    }, 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-full animate-in fade-in slide-in-from-right-8 duration-300">
      {/* Header with Back */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#1a1a1a]/50 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="h-8 w-8 p-0 rounded-full hover:bg-white/10"
          >
            <X className="size-4" />
          </Button>
          <span className="text-sm font-medium text-muted-foreground">
            连接器详情
          </span>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="max-w-3xl mx-auto px-8 py-8">
          {/* Identity & Connection Section */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-5">
              <div
                className={cn(
                  "flex size-16 items-center justify-center rounded-xl shadow-lg transition-all duration-500",
                  isGithub
                    ? "bg-gradient-to-br from-[#333] to-[#000] border border-white/20"
                    : "bg-white/[0.05] border border-white/10",
                  isConnected && "ring-2 ring-green-500/50",
                )}
              >
                <connector.icon
                  className={cn(
                    "size-8 transition-all duration-500",
                    isConnected
                      ? "text-green-500"
                      : isGithub
                        ? "text-white"
                        : "text-muted-foreground",
                  )}
                />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="text-xl font-bold tracking-tight">
                    {connector.title}
                  </h3>
                  {isConnected && (
                    <Badge className="bg-green-500/10 text-green-500 border-green-500/20 px-1.5 py-0 h-4 rounded-full text-[8px] font-bold uppercase">
                      已连接
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground text-xs max-w-sm">
                  {connector.description}
                </p>
              </div>
            </div>

            <Button
              onClick={handleConnect}
              disabled={isConnecting || isConnected}
              className={cn(
                "h-10 px-6 rounded-full transition-all duration-300 font-bold text-sm",
                isConnected
                  ? "bg-green-500/10 text-green-500 border border-green-500/30"
                  : "bg-white text-black hover:bg-gray-200",
              )}
            >
              {isConnecting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : isConnected ? (
                <>
                  <Check className="mr-2 size-4" />
                  已启用
                </>
              ) : (
                "立即连接"
              )}
            </Button>
          </div>

          <Separator className="bg-white/5 mb-8" />

          {/* Capabilities Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <div className="size-3.5 rounded-full bg-primary/20" />
              <h4 className="text-xs font-bold uppercase tracking-widest text-foreground">
                核心能力
              </h4>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {DEFAULT_CAPABILITIES.map((feature, i) => (
                <CapabilityFeature
                  key={i}
                  icon={feature.icon}
                  title={feature.title}
                  desc={feature.desc}
                />
              ))}
            </div>
          </div>

          <div className="mt-12 pt-6 border-t border-white/5 flex items-center justify-between text-muted-foreground/30">
            <div className="flex gap-4 text-[9px] font-bold uppercase tracking-widest">
              <a
                href={connector.website}
                target="_blank"
                rel="noreferrer"
                className="hover:text-foreground"
              >
                Official Website
              </a>
              <a
                href={connector.privacyPolicy}
                target="_blank"
                rel="noreferrer"
                className="hover:text-foreground"
              >
                Privacy Policy
              </a>
            </div>
            <button className="text-[9px] font-bold uppercase tracking-widest hover:text-foreground">
              Report an issue
            </button>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
