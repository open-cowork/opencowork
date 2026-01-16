"use client";

import { FileCard } from "@/components/shared/file-card";
import type { MessageBlock, InputFile } from "@/features/chat/types";

export function UserMessage({
  content,
  attachments,
}: {
  content: string | MessageBlock[];
  attachments?: InputFile[];
}) {
  // Parse content if it's an array of blocks
  const parseContent = (content: string | MessageBlock[]): string => {
    if (typeof content === "string") {
      return content;
    }

    // Filter out ToolResultBlock and only keep TextBlock
    const textBlocks = content.filter(
      (block): block is { _type: "TextBlock"; text: string } =>
        block._type === "TextBlock",
    );

    // Join all text blocks with newlines
    return textBlocks.map((block) => block.text).join("\n\n");
  };

  const textContent = parseContent(content);

  return (
    <div className="flex flex-col items-end mb-4 w-full gap-2">
      {attachments && attachments.length > 0 && (
        <div className="max-w-[85%] bg-muted rounded-lg p-2">
          <div className="flex flex-wrap gap-2">
            {attachments.map((file, i) => (
              <FileCard
                key={i}
                file={file}
                className="bg-background border-border w-48"
                showRemove={false}
              />
            ))}
          </div>
        </div>
      )}
      {textContent && (
        <div className="max-w-[85%] bg-muted text-foreground rounded-lg px-4 py-2">
          <p className="whitespace-pre-wrap break-words">{textContent}</p>
        </div>
      )}
    </div>
  );
}
