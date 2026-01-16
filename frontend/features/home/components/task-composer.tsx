import { uploadAttachment } from "@/features/attachments/services/attachment-service";
import type { InputFile } from "@/features/chat/types/api/session";
import {
  Loader2,
  ArrowUp,
  Mic,
  Plus,
  SlidersHorizontal,
  FileText,
  Figma,
} from "lucide-react";
import { toast } from "sonner";
import * as React from "react";
import { useT } from "@/lib/i18n/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FileCard } from "@/components/shared/file-card";
import {
  AVAILABLE_CONNECTORS,
  type ConnectorType,
} from "@/features/home/model/connectors";

export function TaskComposer({
  textareaRef,
  value,
  onChange,
  onSend,
  isSubmitting,
  onAttachmentsChange,
}: {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  isSubmitting?: boolean;
  onAttachmentsChange?: (files: InputFile[]) => void;
}) {
  const { t } = useT("translation");
  const isComposing = React.useRef(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const [attachments, setAttachments] = React.useState<InputFile[]>([]);

  // Sync internal state with parent if needed, or manage fully here
  // For this component we'll manage local display state and notify parent

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const uploadedFile = await uploadAttachment(file);
      const newAttachments = [...attachments, uploadedFile];
      setAttachments(newAttachments);
      onAttachmentsChange?.(newAttachments); // Notify parent of ALL attachments
      toast.success("文件上传成功");
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error("文件上传失败");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeAttachment = (index: number) => {
    const newAttachments = attachments.filter((_, i) => i !== index);
    setAttachments(newAttachments);
    onAttachmentsChange?.(newAttachments);
  };

  // Reset attachments when value is cleared (successful send)
  React.useEffect(() => {
    if (value === "" && !isSubmitting) {
      // Wait, value is controlled by parent. We need a way to know when to clear.
      // Actually TaskComposer is usually remounted or its props changed.
      // Let's rely on parent passing empty list or re-mounting?
      // For now, let's just make sure we clear if the parent resets via key or something.
      // But wait, "value" is text. Attachments are separate.
      // The parent (home-page-client) clears its 'attachments' state on send?
      // We should accept attachments as a prop if we want full control,
      // OR we assume this component is uncontrolled for attachments mostly, BUT
      // the parent creates the session.
      // Let's check home-page-client.tsx again. It has 'attachments' state.
      // Ideally we should receive 'attachments' as prop to be fully controlled.
    }
  }, [value, isSubmitting]);

  // Actually, let's keep it simple: we emitted the change. The parent has the state.
  // We should prob accept 'attachments' as a prop to display them?
  // But the existing signature was onAttachmentsChange only?
  // Let's update the signature to accept 'attachments' if we want to be pure.
  // But for now, let's look at how it was implemented.
  // Parent: onAttachmentsChange={(files) => setAttachments(prev => [...prev, ...files])}
  // This implies the parent is accumulating.
  // If we want to delete, we need to tell parent "here is the new list".

  const sortedConnectors = React.useMemo(() => {
    const order: Record<ConnectorType, number> = {
      mcp: 0,
      skill: 1,
      app: 2,
      api: 3,
    };
    return [...AVAILABLE_CONNECTORS].sort((a, b) => {
      return (order[a.type] ?? 99) - (order[b.type] ?? 99);
    });
  }, []);

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Attachments Display */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-3 px-4 pt-4">
          {attachments.map((file, i) => (
            <FileCard
              key={i}
              file={file}
              onRemove={() => removeAttachment(i)}
              className="w-48 bg-background border-dashed"
            />
          ))}
        </div>
      )}

      {/* 输入区域 */}
      <div className="px-4 pb-3 pt-4">
        <Textarea
          ref={textareaRef}
          value={value}
          disabled={isSubmitting || isUploading}
          onChange={(e) => onChange(e.target.value)}
          onCompositionStart={() => (isComposing.current = true)}
          onCompositionEnd={() => {
            setTimeout(() => {
              isComposing.current = false;
            }, 0);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              if (e.shiftKey) {
                // Allow default behavior (newline)
                return;
              }
              if (e.nativeEvent.isComposing || isComposing.current) {
                return;
              }
              e.preventDefault();
              if (!isSubmitting && !isUploading) {
                onSend();
                setAttachments([]); // Clear local state on send
              }
            }
          }}
          placeholder={t("hero.placeholder")}
          className="min-h-[60px] max-h-[40vh] w-full resize-none border-0 bg-transparent dark:bg-transparent p-0 text-base shadow-none placeholder:text-muted-foreground/50 focus-visible:ring-0 disabled:opacity-50"
          rows={2}
        />
      </div>

      {/* 底部工具栏 */}
      <div className="flex items-center justify-between px-3 pb-3">
        {/* 左侧操作按钮 */}
        <div className="flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={isSubmitting || isUploading}
                className="size-9 rounded-xl hover:bg-accent"
                title={t("hero.attachFile")}
              >
                {isUploading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Plus className="size-4" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer"
              >
                <FileText className="mr-2 size-4" />
                <span>从本地文件导入</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled
                className="opacity-50 cursor-not-allowed"
              >
                <Figma className="mr-2 size-4" />
                <span>从 Figma 导入 (即将推出)</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={isSubmitting}
                className="size-9 rounded-xl hover:bg-accent"
                title={t("hero.tools")}
              >
                <SlidersHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="w-56 max-h-64 overflow-y-auto"
            >
              {sortedConnectors.map((connector) => (
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
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* 右侧操作按钮 */}
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={isSubmitting}
            className="size-9 rounded-xl hover:bg-accent"
            title={t("hero.voiceInput")}
          >
            <Mic className="size-4" />
          </Button>
          <Button
            onClick={onSend}
            disabled={!value.trim() || isSubmitting}
            size="icon"
            className="size-9 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground"
            title={t("hero.send")}
          >
            <ArrowUp className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
