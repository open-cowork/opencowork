"use client";

import * as React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";

import { Button } from "@/components/ui/button";
import { Check, Copy } from "lucide-react";
import type { MessageBlock } from "@/features/chat/types";
import type { ToolUseBlock, ToolResultBlock } from "@/features/chat/types";
import { ToolChain } from "./tool-chain";
import remarkBreaks from "remark-breaks";
import { cn } from "@/lib/utils";

type CodeProps = {
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
};

type LinkProps = {
  children?: React.ReactNode;
  href?: string;
  ref?: React.Ref<HTMLAnchorElement>;
};

const PreBlock = ({
  children,
  className,
  ...props
}: React.DetailedHTMLProps<
  React.HTMLAttributes<HTMLPreElement>,
  HTMLPreElement
> & { node?: unknown }) => {
  const preRef = React.useRef<HTMLPreElement>(null);
  const [isCopied, setIsCopied] = React.useState(false);

  const onCopy = async () => {
    if (!preRef.current) return;
    const text = preRef.current.textContent || "";
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy code", err);
    }
  };

  return (
    <div className="relative group my-4">
      <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-background/80 bg-background/50 backdrop-blur-sm"
          onClick={onCopy}
        >
          {isCopied ? (
            <Check className="h-4 w-4" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      </div>
      <pre
        ref={preRef}
        className={cn("rounded-lg overflow-x-auto", className)}
        {...props}
      >
        {children}
      </pre>
    </div>
  );
};

export function MessageContent({
  content,
}: {
  content: string | MessageBlock[];
}) {
  // Helper function to extract text content from message
  const getTextContent = (content: string | MessageBlock[]): string => {
    if (typeof content === "string") {
      return content;
    }
    // If it's an array of blocks, extract text from TextBlock
    if (Array.isArray(content)) {
      // This helper is used for copy-paste mainly, so we just want the text parts
      const textBlocks = content.filter(
        (block: MessageBlock) => block._type === "TextBlock",
      );
      return textBlocks
        .map((block: MessageBlock) =>
          block._type === "TextBlock" ? block.text : "",
        )
        .join("\n\n");
    }
    return String(content);
  };

  const textContent = getTextContent(content);

  // If content is string, render as before
  if (typeof content === "string") {
    return (
      <div className="prose prose-sm dark:prose-invert max-w-none break-words w-full min-w-0 [&_pre]:whitespace-pre-wrap [&_pre]:break-words [&_code]:break-words [&_p]:break-words [&_*]:break-words">
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkBreaks]}
          rehypePlugins={[rehypeHighlight]}
          components={{
            pre: PreBlock,
            code: ({ inline, className, children }: CodeProps) => {
              return !inline ? (
                <code className={className}>{children}</code>
              ) : (
                <code className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground text-sm">
                  {children}
                </code>
              );
            },
            a: ({ children, href, ...props }: LinkProps) => (
              <a
                className="text-foreground underline underline-offset-4 decoration-muted-foreground/30 hover:decoration-foreground transition-colors"
                target="_blank"
                rel="noopener noreferrer"
                href={href}
                {...props}
              >
                {children}
              </a>
            ),
            h1: ({ children }) => (
              <h1 className="text-2xl font-bold mb-4 mt-6 text-foreground">
                {children}
              </h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-xl font-bold mb-3 mt-5 text-foreground">
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-lg font-bold mb-2 mt-4 text-foreground">
                {children}
              </h3>
            ),
          }}
        >
          {textContent}
        </ReactMarkdown>
      </div>
    );
  }

  // Handle array of blocks (Tools + Text)
  // We need to group them: sequence of tool blocks -> ToolChain, sequence of text blocks -> Markdown
  const groups: { type: "text" | "tool"; blocks: MessageBlock[] }[] = [];
  let currentGroup: { type: "text" | "tool"; blocks: MessageBlock[] } | null =
    null;

  for (const block of content) {
    const isTool =
      block._type === "ToolUseBlock" || block._type === "ToolResultBlock";
    const type = isTool ? "tool" : "text";

    if (!currentGroup || currentGroup.type !== type) {
      currentGroup = { type, blocks: [] };
      groups.push(currentGroup);
    }
    currentGroup.blocks.push(block);
  }

  return (
    <div className="space-y-4 w-full min-w-0">
      {groups.map((group, index) => {
        if (group.type === "tool") {
          return (
            <ToolChain
              key={index}
              blocks={group.blocks as (ToolUseBlock | ToolResultBlock)[]}
            />
          );
        } else {
          const text = group.blocks
            .map((b) => (b._type === "TextBlock" ? b.text : ""))
            .join("\n\n");
          if (!text.trim()) return null;

          return (
            <div
              key={index}
              className="prose prose-sm dark:prose-invert max-w-none break-words w-full min-w-0 [&_pre]:whitespace-pre-wrap [&_pre]:break-words [&_code]:break-words [&_p]:break-words [&_*]:break-words"
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkBreaks]}
                rehypePlugins={[rehypeHighlight]}
                components={{
                  pre: PreBlock,
                  code: ({ inline, className, children }: CodeProps) => {
                    return !inline ? (
                      <code className={className}>{children}</code>
                    ) : (
                      <code className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground text-sm">
                        {children}
                      </code>
                    );
                  },
                  a: ({ children, href, ...props }: LinkProps) => (
                    <a
                      className="text-foreground underline underline-offset-4 decoration-muted-foreground/30 hover:decoration-foreground transition-colors"
                      target="_blank"
                      rel="noopener noreferrer"
                      href={href}
                      {...props}
                    >
                      {children}
                    </a>
                  ),
                  h1: ({ children }) => (
                    <h1 className="text-2xl font-bold mb-4 mt-6 text-foreground">
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-xl font-bold mb-3 mt-5 text-foreground">
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-lg font-bold mb-2 mt-4 text-foreground">
                      {children}
                    </h3>
                  ),
                }}
              >
                {text}
              </ReactMarkdown>
            </div>
          );
        }
      })}
    </div>
  );
}
