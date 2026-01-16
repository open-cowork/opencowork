"use client";

import * as React from "react";
import {
  Trash2,
  Loader2,
  Pencil,
  Eye,
  EyeOff,
  Copy,
  Check,
  Globe,
  Key,
  Lock,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { cn } from "@/lib/utils";
import type { EnvVar } from "@/features/env-vars/types";

// Mock data for env vars (kept for fallback)
const MOCK_ENV_VARS: EnvVar[] = [
  {
    id: 1,
    user_id: "user1",
    key: "OPENAI_API_KEY",
    value: "sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    is_secret: true,
    scope: "global",
    created_at: "2024-01-01",
    updated_at: "2024-01-15",
    description: null,
  },
  {
    id: 2,
    user_id: "user1",
    key: "ANTHROPIC_API_KEY",
    value: "sk-ant-xxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    is_secret: true,
    scope: "global",
    created_at: "2024-01-02",
    updated_at: "2024-01-10",
    description: null,
  },
];

interface EnvVarsGridProps {
  envVars?: EnvVar[];
  savingKey?: string | null;
  onDelete?: (id: number) => void;
  onSave?: (envVar: EnvVar) => Promise<void>;
}

export function EnvVarsGrid({
  envVars: propEnvVars,
  savingKey,
  onDelete,
  onSave,
}: EnvVarsGridProps) {
  const [visibleKeys, setVisibleKeys] = React.useState<Set<string>>(new Set());
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null);
  const [editingId, setEditingId] = React.useState<number | null>(null);
  const inputRefs = React.useRef<Map<number, HTMLInputElement>>(new Map());

  const envVars = propEnvVars?.length ? propEnvVars : MOCK_ENV_VARS;

  const toggleVisibility = (key: string) => {
    setVisibleKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleCopy = async (value: string | null, key: string) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      toast.success("已复制");
      setTimeout(() => setCopiedKey(null), 1500);
    } catch {
      toast.error("复制失败");
    }
  };

  const startEditing = (id: number) => {
    setEditingId(id);
    // Timeout to allow render to complete before selecting
    setTimeout(() => {
      const input = inputRefs.current.get(id);
      if (input) {
        input.focus();
        input.select();
      }
    }, 0);
  };

  const handleSave = async (envVar: EnvVar, newValue: string) => {
    if (newValue === envVar.value) {
      setEditingId(null);
      return;
    }
    if (onSave) {
      await onSave({ ...envVar, value: newValue });
    }
    setEditingId(null);
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    envVar: EnvVar,
  ) => {
    if (e.key === "Enter") {
      handleSave(envVar, e.currentTarget.value);
      e.currentTarget.blur();
    } else if (e.key === "Escape") {
      setEditingId(null);
      if (inputRefs.current.get(envVar.id)) {
        inputRefs.current.get(envVar.id)!.value = envVar.value || "";
      }
    }
  };

  // Grouping Logic
  const groupedVars = React.useMemo(() => {
    const groups = {
      mcp: [] as EnvVar[],
      user: [] as EnvVar[],
      global: [] as EnvVar[],
    };
    envVars.forEach((v) => {
      const scope = (v.scope || "user") as keyof typeof groups;
      if (groups[scope]) {
        groups[scope].push(v);
      } else {
        groups.user.push(v); // Fallback
      }
    });
    return groups;
  }, [envVars]);

  const getScopeLabel = (scope: string) => {
    switch (scope) {
      case "global":
        return "全局变量"; // Global Vars
      case "mcp":
        return "MCP 变量"; // MCP Vars
      case "user":
        return "用户变量"; // User Vars
      default:
        return scope;
    }
  };

  const getScopeIcon = (scope: string) => {
    switch (scope) {
      case "global":
        return <Globe className="size-4" />;
      case "mcp":
        return <Key className="size-4" />;
      default:
        return <Lock className="size-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {Object.entries(groupedVars).map(([scope, vars]) => {
        if (vars.length === 0) return null;

        return (
          <div key={scope} className="space-y-3">
            {/* Scope Header - Subtle */}
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground/70 px-1">
              {getScopeIcon(scope)}
              <span>{getScopeLabel(scope)}</span>
            </div>

            <div className="space-y-3">
              {vars.map((envVar) => {
                const isLoading = savingKey === envVar.key;
                const isVisible = visibleKeys.has(envVar.key);
                const isCopied = copiedKey === envVar.key;
                const isEditing = editingId === envVar.id;

                return (
                  <div key={envVar.id} className="flex items-center gap-3">
                    <div className="flex-1">
                      <InputGroup className="focus-within:ring-border focus-within:border-foreground/20 transition-all">
                        <InputGroupAddon className="bg-muted/30 min-w-[140px] px-3 justify-start font-mono text-xs text-muted-foreground font-medium border-r select-text">
                          {envVar.key}
                        </InputGroupAddon>
                        <InputGroupInput
                          ref={(el) => {
                            if (el) inputRefs.current.set(envVar.id, el);
                            else inputRefs.current.delete(envVar.id);
                          }}
                          type={
                            !isEditing && envVar.is_secret && !isVisible
                              ? "password"
                              : "text"
                          }
                          defaultValue={envVar.value || ""}
                          readOnly={!isEditing}
                          className={cn(
                            "font-mono text-sm",
                            !isEditing &&
                              "cursor-default text-muted-foreground",
                            isEditing && "text-foreground",
                          )}
                          onKeyDown={(e) => handleKeyDown(e, envVar)}
                          onBlur={(e) => {
                            if (isEditing) {
                              handleSave(envVar, e.target.value);
                            }
                          }}
                        />
                        {envVar.is_secret && (
                          <InputGroupButton
                            onClick={() => toggleVisibility(envVar.key)}
                            title={isVisible ? "隐藏" : "显示"}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            {isVisible ? (
                              <EyeOff className="size-4" />
                            ) : (
                              <Eye className="size-4" />
                            )}
                          </InputGroupButton>
                        )}
                        <InputGroupButton
                          onClick={() => handleCopy(envVar.value, envVar.key)}
                          title="复制"
                          className="text-muted-foreground hover:text-foreground"
                        >
                          {isCopied ? (
                            <Check className="size-4" />
                          ) : (
                            <Copy className="size-4" />
                          )}
                        </InputGroupButton>
                      </InputGroup>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      {isLoading ? (
                        <Loader2 className="size-4 animate-spin text-muted-foreground" />
                      ) : (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-muted-foreground hover:text-foreground"
                            onClick={() => startEditing(envVar.id)}
                            title="修改"
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-muted-foreground hover:text-destructive"
                            onClick={() => onDelete?.(envVar.id)}
                            title="删除"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
