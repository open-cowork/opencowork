"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Check, Copy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { logger } from "@/lib/logger";
import {
  SyntaxHighlighter,
  getPrismLanguage,
  oneDark,
  oneLight,
} from "@/lib/markdown/prism";

type MarkdownCodeProps = React.ComponentPropsWithoutRef<"code"> & {
  node?: unknown;
};

type MarkdownPreProps = React.ComponentPropsWithoutRef<"pre"> & {
  node?: unknown;
};

const extractLanguage = (className?: string) => {
  if (!className) return undefined;
  const match = className.match(/language-([^\s]+)/);
  return match?.[1];
};

export const MarkdownCode = ({
  node,
  className,
  children,
  ...props
}: MarkdownCodeProps) => {
  void node; // react-markdown passes `node`; don't forward it to the DOM.
  return (
    <code
      className={[
        "px-1.5 py-0.5 rounded bg-muted text-muted-foreground text-[0.85rem]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
    </code>
  );
};

export const MarkdownPre = ({ node, children, ...props }: MarkdownPreProps) => {
  void node; // react-markdown passes `node`; don't forward it to the DOM.
  const { resolvedTheme } = useTheme();
  const [copied, setCopied] = React.useState(false);

  // `react-markdown@10` no longer passes an `inline` prop; handle code blocks at the `<pre>` level.
  type CodeChildProps = { children?: React.ReactNode; className?: string };
  const codeChild = React.Children.toArray(children).find(
    (child): child is React.ReactElement<CodeChildProps> =>
      React.isValidElement<CodeChildProps>(child) &&
      typeof child.props.children !== "undefined",
  );

  if (!codeChild) {
    return <pre {...props}>{children}</pre>;
  }

  const rawCode = codeChild?.props?.children;
  const rawCodeText = Array.isArray(rawCode) ? rawCode.join("") : rawCode;
  const code = String(rawCodeText ?? "").replace(/\n$/, "");

  const codeClassName =
    typeof codeChild?.props?.className === "string"
      ? codeChild.props.className
      : undefined;

  const language = getPrismLanguage(extractLanguage(codeClassName));
  const syntaxTheme = resolvedTheme === "dark" ? oneDark : oneLight;

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (error) {
      logger.error("[MarkdownPre] Copy failed", error);
    }
  };

  return (
    <div className="relative group my-4 w-full min-w-0 max-w-full overflow-hidden rounded-xl border bg-muted/40">
      <div className="absolute right-2 top-2 z-10 opacity-0 transition-opacity group-hover:opacity-100">
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          onClick={onCopy}
        >
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
        </Button>
      </div>
      <div className="max-w-full overflow-hidden bg-background/80">
        <SyntaxHighlighter
          language={language}
          style={syntaxTheme}
          wrapLongLines
          customStyle={{
            margin: 0,
            padding: "1rem",
            background: "transparent",
            fontSize: "0.85rem",
            lineHeight: "1.6",
          }}
          codeTagProps={{
            style: {
              background: "transparent",
            },
          }}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};
