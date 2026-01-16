"use client";

import * as React from "react";

import { ArrowUp, Mic, Plus, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useT } from "@/lib/i18n/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AVAILABLE_CONNECTORS,
  type ConnectorType,
} from "@/features/home/model/connectors";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
  hasMessages?: boolean;
}

export function ChatInput({
  value,
  onChange,
  onSend,
  disabled,
  hasMessages = false,
}: ChatInputProps) {
  const { t } = useT("translation");
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const isComposing = React.useRef(false);

  // Auto-resize textarea
  React.useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      if (
        e.nativeEvent.isComposing ||
        isComposing.current ||
        e.keyCode === 229
      ) {
        return;
      }
      e.preventDefault();
      if (value.trim() && !disabled) {
        onSend();
      }
    }
  };

  return (
    <div className="border-t border-border p-4">
      <div className="max-w-4xl mx-auto">
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          {/* Input area */}
          <div className="px-4 pb-3 pt-4">
            <Textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onCompositionStart={() => (isComposing.current = true)}
              onCompositionEnd={() => {
                requestAnimationFrame(() => {
                  isComposing.current = false;
                });
              }}
              placeholder={hasMessages ? "" : t("hero.placeholder")}
              disabled={disabled}
              className="min-h-[60px] max-h-[40vh] w-full resize-none border-0 p-0 text-base shadow-none placeholder:text-muted-foreground/50 focus-visible:ring-0"
              rows={1}
            />
          </div>

          {/* Bottom toolbar */}
          <div className="flex items-center justify-between px-3 pb-3">
            {/* Left side buttons */}
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-9 rounded-xl hover:bg-accent"
                title={t("hero.attachFile")}
                disabled={disabled}
              >
                <Plus className="size-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-9 rounded-xl hover:bg-accent"
                    title={t("hero.tools")}
                    disabled={disabled}
                  >
                    <SlidersHorizontal className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="w-56 max-h-64 overflow-y-auto"
                >
                  {(() => {
                    const order: Record<ConnectorType, number> = {
                      mcp: 0,
                      skill: 1,
                      app: 2,
                      api: 3,
                    };
                    const sortedConnectors = [...AVAILABLE_CONNECTORS].sort(
                      (a, b) => (order[a.type] ?? 99) - (order[b.type] ?? 99),
                    );

                    return sortedConnectors.map((connector) => (
                      <DropdownMenuItem
                        key={connector.id}
                        disabled
                        className="opacity-50 cursor-not-allowed"
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2">
                            <connector.icon className="size-4" />
                            <span>{connector.title}</span>
                          </div>
                          {/* TODO: Implement connection logic */}
                          <span className="text-xs font-medium">连接</span>
                        </div>
                      </DropdownMenuItem>
                    ));
                  })()}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Right side buttons */}
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-9 rounded-xl hover:bg-accent"
                title={t("hero.voiceInput")}
                disabled={disabled}
              >
                <Mic className="size-4" />
              </Button>
              <Button
                onClick={onSend}
                disabled={!value.trim() || disabled}
                size="icon"
                className="size-9 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground"
                title={t("hero.send")}
              >
                <ArrowUp className="size-4" />
              </Button>
            </div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Enter {t("hints.send")}，Shift + Enter {t("hints.newLine")}
        </p>
      </div>
    </div>
  );
}
