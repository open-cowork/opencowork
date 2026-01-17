"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import type { FileNode } from "@/features/chat/types";
import {
  File,
  Download,
  ExternalLink,
  Loader2,
  Check,
  Copy,
  ChevronLeft,
} from "lucide-react";
import { useT } from "@/lib/i18n/client";
import { Button } from "@/components/ui/button";
import type { DocViewerProps } from "react-doc-viewer";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import rehypeHighlight from "rehype-highlight";
import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter";
import oneDark from "react-syntax-highlighter/dist/esm/styles/prism/one-dark";
import javascript from "react-syntax-highlighter/dist/esm/languages/prism/javascript";
import typescript from "react-syntax-highlighter/dist/esm/languages/prism/typescript";
import tsx from "react-syntax-highlighter/dist/esm/languages/prism/tsx";
import jsx from "react-syntax-highlighter/dist/esm/languages/prism/jsx";
import python from "react-syntax-highlighter/dist/esm/languages/prism/python";
import jsonLang from "react-syntax-highlighter/dist/esm/languages/prism/json";
import markdown from "react-syntax-highlighter/dist/esm/languages/prism/markdown";
import markup from "react-syntax-highlighter/dist/esm/languages/prism/markup";
import bash from "react-syntax-highlighter/dist/esm/languages/prism/bash";
import yaml from "react-syntax-highlighter/dist/esm/languages/prism/yaml";
import css from "react-syntax-highlighter/dist/esm/languages/prism/css";
import scss from "react-syntax-highlighter/dist/esm/languages/prism/scss";
import less from "react-syntax-highlighter/dist/esm/languages/prism/less";
import go from "react-syntax-highlighter/dist/esm/languages/prism/go";
import java from "react-syntax-highlighter/dist/esm/languages/prism/java";
import php from "react-syntax-highlighter/dist/esm/languages/prism/php";
import ruby from "react-syntax-highlighter/dist/esm/languages/prism/ruby";
import swift from "react-syntax-highlighter/dist/esm/languages/prism/swift";
import kotlin from "react-syntax-highlighter/dist/esm/languages/prism/kotlin";
import csharp from "react-syntax-highlighter/dist/esm/languages/prism/csharp";
import cLang from "react-syntax-highlighter/dist/esm/languages/prism/c";
import cpp from "react-syntax-highlighter/dist/esm/languages/prism/cpp";
import objectivec from "react-syntax-highlighter/dist/esm/languages/prism/objectivec";
import sql from "react-syntax-highlighter/dist/esm/languages/prism/sql";
import powershell from "react-syntax-highlighter/dist/esm/languages/prism/powershell";
import docker from "react-syntax-highlighter/dist/esm/languages/prism/docker";
import ini from "react-syntax-highlighter/dist/esm/languages/prism/ini";
import rust from "react-syntax-highlighter/dist/esm/languages/prism/rust";
import { cn } from "@/lib/utils";

import "highlight.js/styles/github-dark.css";

const registerSyntaxLanguages = (() => {
  let registered = false;
  return () => {
    if (registered) return;
    const register = (name: string, language: unknown) => {
      SyntaxHighlighter.registerLanguage(name, language);
    };

    register("javascript", javascript);
    register("typescript", typescript);
    register("tsx", tsx);
    register("jsx", jsx);
    register("python", python);
    register("json", jsonLang);
    register("markdown", markdown);
    register("markup", markup);
    register("bash", bash);
    register("yaml", yaml);
    register("css", css);
    register("scss", scss);
    register("less", less);
    register("go", go);
    register("java", java);
    register("php", php);
    register("ruby", ruby);
    register("swift", swift);
    register("kotlin", kotlin);
    register("csharp", csharp);
    register("c", cLang);
    register("cpp", cpp);
    register("objectivec", objectivec);
    register("sql", sql);
    register("powershell", powershell);
    register("docker", docker);
    register("ini", ini);
    register("rust", rust);
    registered = true;
  };
})();

registerSyntaxLanguages();

const dispatchCloseViewer = () => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("close-document-viewer"));
};

const DocViewer = dynamic<DocViewerProps>(
  () => import("./doc-viewer-client").then((m) => m.DocViewerClient),
  {
    ssr: false,
    loading: () => {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const { t } = useT("translation");
      return (
        <div className="h-full flex items-center justify-center p-8 text-muted-foreground animate-pulse text-sm">
          {t("artifacts.viewer.loadingEngine")}
        </div>
      );
    },
  },
);

const DOC_VIEWER_TYPE_MAP: Record<string, string> = {
  bmp: "bmp",
  doc: "doc",
  docx: "docx",
  jpg: "jpg",
  jpeg: "jpg",
  pdf: "pdf",
  png: "png",
  ppt: "ppt",
  pptx: "pptx",
  tiff: "tiff",
  xls: "xls",
  xlsx: "xlsx",
};

const TEXT_LANGUAGE_MAP: Record<string, string> = {
  txt: "text",
  log: "text",
  csv: "text",
  md: "markdown",
  markdown: "markdown",
  mdown: "markdown",
  mdx: "markdown",
  py: "python",
  pyw: "python",
  js: "javascript",
  jsx: "jsx",
  ts: "typescript",
  tsx: "tsx",
  json: "json",
  jsonc: "json",
  html: "markup",
  htm: "markup",
  xml: "markup",
  yml: "yaml",
  yaml: "yaml",
  sh: "bash",
  bash: "bash",
  zsh: "bash",
  css: "css",
  scss: "scss",
  less: "less",
  go: "go",
  java: "java",
  rb: "ruby",
  php: "php",
  swift: "swift",
  kt: "kotlin",
  kotlin: "kotlin",
  cs: "csharp",
  csharp: "csharp",
  c: "c",
  h: "c",
  cpp: "cpp",
  cxx: "cpp",
  hpp: "cpp",
  mm: "objectivec",
  m: "objectivec",
  ps1: "powershell",
  dockerfile: "docker",
  env: "ini",
  ini: "ini",
  cfg: "ini",
  conf: "ini",
  toml: "ini",
  properties: "ini",
  rs: "rust",
  cjs: "javascript",
  mjs: "javascript",
};

const MIME_LANGUAGE_RULES: Array<{ test: RegExp; language: string }> = [
  { test: /^application\/json/i, language: "json" },
  { test: /javascript/i, language: "javascript" },
  { test: /typescript/i, language: "typescript" },
  { test: /python/i, language: "python" },
  { test: /markdown/i, language: "markdown" },
  { test: /^text\/(plain|csv)/i, language: "text" },
  { test: /(shell|bash|zsh)/i, language: "bash" },
  { test: /(yaml|yml)/i, language: "yaml" },
  { test: /(html|xml)/i, language: "markup" },
  { test: /css/i, language: "css" },
  { test: /java/i, language: "java" },
  { test: /c\+\+/i, language: "cpp" },
  { test: /\bc\b/i, language: "c" },
  { test: /go/i, language: "go" },
  { test: /rust/i, language: "rust" },
  { test: /sql/i, language: "sql" },
];

const VIEW_CLASSNAME =
  "h-full w-full max-h-full animate-in fade-in duration-300 [--tw-enter-opacity:1] [--tw-enter-scale:1] [--tw-enter-translate-x:0] [--tw-enter-translate-y:0] overflow-hidden flex flex-col min-h-0";

const DEFAULT_TEXT_LANGUAGE = "text";
const NO_SOURCE_ERROR = "NO_SOURCE";

type FileContentState =
  | { status: "idle" | "loading" }
  | { status: "success"; content: string }
  | { status: "error"; code: "NO_SOURCE" | "FETCH_ERROR"; message?: string };

interface UseFileTextContentParams {
  file?: FileNode;
  fallbackUrl?: string;
}

const useFileTextContent = ({
  file,
  fallbackUrl,
}: UseFileTextContentParams) => {
  const [state, setState] = React.useState<FileContentState>({
    status: "idle",
  });
  const [refreshKey, setRefreshKey] = React.useState(0);

  const refetch = React.useCallback(() => {
    setRefreshKey((key) => key + 1);
  }, []);

  React.useEffect(() => {
    if (!file) {
      setState({ status: "idle" });
      return;
    }

    let isMounted = true;
    const controller = new AbortController();

    const load = async () => {
      setState({ status: "loading" });
      try {
        let text: string | undefined;

        if (fallbackUrl) {
          const isSameOrigin =
            typeof window !== "undefined" &&
            new URL(fallbackUrl, window.location.origin).origin ===
              window.location.origin;

          const response = await fetch(fallbackUrl, {
            signal: controller.signal,
            credentials: isSameOrigin ? "include" : "omit",
          });
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }
          text = await response.text();
        } else {
          throw new Error(NO_SOURCE_ERROR);
        }

        if (!isMounted) return;
        setState({ status: "success", content: text ?? "" });
      } catch (error) {
        if (!isMounted || controller.signal.aborted) return;
        if (error instanceof Error && error.message === NO_SOURCE_ERROR) {
          setState({ status: "error", code: "NO_SOURCE" });
          return;
        }
        setState({
          status: "error",
          code: "FETCH_ERROR",
          message:
            error instanceof Error
              ? error.message
              : typeof error === "string"
                ? error
                : undefined,
        });
      }
    };

    void load();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [file, fallbackUrl, refreshKey]);

  return { state, refetch } as const;
};

const ensureAbsoluteUrl = (url?: string | null) => {
  if (!url) return undefined;
  if (
    url.startsWith("http") ||
    url.startsWith("blob:") ||
    url.startsWith("data:")
  ) {
    return url;
  }
  try {
    if (typeof window !== "undefined") {
      return new URL(url, window.location.origin).toString();
    }
    return url;
  } catch (error) {
    console.warn("[DocumentViewer] Failed to resolve URL", error);
    return url;
  }
};

const extractExtension = (file?: FileNode) => {
  if (!file) return "";
  const sources = [file.name, file.path, file.url].filter(Boolean) as string[];
  for (const source of sources) {
    const sanitized = source.split(/[?#]/)[0];
    const parts = sanitized.split(".");
    if (parts.length > 1) {
      const ext = parts.pop()?.toLowerCase();
      if (ext) return ext;
    }
  }
  return "";
};

const getTextLanguage = (ext: string, mime?: string | null) => {
  if (ext && TEXT_LANGUAGE_MAP[ext]) return TEXT_LANGUAGE_MAP[ext];
  if (mime) {
    const match = MIME_LANGUAGE_RULES.find(({ test }) => test.test(mime));
    if (match) return match.language;
    if (mime.startsWith("text/")) return DEFAULT_TEXT_LANGUAGE;
  }
  return undefined;
};

interface ViewerToolbarProps {
  file: FileNode;
  subtitle?: string;
  resolvedUrl?: string;
  onCopy?: () => void;
  copyDisabled?: boolean;
  copyState?: "idle" | "copied";
}

const DocumentViewerToolbar = ({
  file,
  subtitle,
  resolvedUrl,
  onCopy,
  copyDisabled,
  copyState = "idle",
}: ViewerToolbarProps) => (
  <div className="w-full border-b px-3 py-2 text-xs text-muted-foreground sm:px-4 overflow-hidden">
    <div className="flex items-center gap-3 min-w-0 overflow-hidden">
      <Button
        size="icon"
        variant="ghost"
        className="h-8 w-8 shrink-0"
        onClick={dispatchCloseViewer}
      >
        <ChevronLeft className="size-4" />
      </Button>
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <span
          className="text-sm font-medium text-foreground min-w-0 max-w-full truncate overflow-hidden"
          title={file.name || file.path}
        >
          {file.name || file.path}
        </span>
        {subtitle && (
          <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
            {subtitle}
          </span>
        )}
      </div>
      <div className="ml-auto flex shrink-0 items-center gap-2">
        {onCopy && (
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={onCopy}
            disabled={copyDisabled}
          >
            {copyState === "copied" ? (
              <Check className="size-4" />
            ) : (
              <Copy className="size-4" />
            )}
          </Button>
        )}
        {resolvedUrl && (
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={() => {
              const link = document.createElement("a");
              link.href = resolvedUrl;
              link.download = file.name || file.path || "document";
              link.click();
            }}
          >
            <Download className="size-4" />
          </Button>
        )}
      </div>
    </div>
  </div>
);

const MarkdownPreBlock = ({
  children,
  className,
  ...props
}: React.DetailedHTMLProps<
  React.HTMLAttributes<HTMLPreElement>,
  HTMLPreElement
> & { node?: unknown }) => {
  const preRef = React.useRef<HTMLPreElement>(null);
  const [copied, setCopied] = React.useState(false);

  const onCopy = async () => {
    if (!preRef.current) return;
    try {
      await navigator.clipboard.writeText(preRef.current.textContent ?? "");
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (error) {
      console.error("[DocumentViewer] Copy block failed", error);
    }
  };

  return (
    <div className="relative group my-4 overflow-hidden rounded-xl border bg-muted/40">
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
      <pre
        ref={preRef}
        className={cn(
          "overflow-x-auto whitespace-pre bg-background/80 p-4 text-sm leading-relaxed",
          className,
        )}
        {...props}
      >
        {children}
      </pre>
    </div>
  );
};

interface TextDocumentViewerProps {
  file: FileNode;
  language?: string;
  sessionId?: string;
  resolvedUrl?: string;
}

const TextDocumentViewer = ({
  file,
  language = DEFAULT_TEXT_LANGUAGE,
  sessionId,
  resolvedUrl,
}: TextDocumentViewerProps) => {
  const { t } = useT("translation");
  const { state, refetch } = useFileTextContent({
    file,
    fallbackUrl: resolvedUrl,
  });
  const [copyState, setCopyState] = React.useState<"idle" | "copied">("idle");
  const syntaxLanguage =
    language && language !== DEFAULT_TEXT_LANGUAGE ? language : undefined;
  const subtitle = (language || DEFAULT_TEXT_LANGUAGE).toUpperCase();

  const handleCopy = React.useCallback(async () => {
    if (state.status !== "success") return;
    try {
      await navigator.clipboard.writeText(state.content);
      setCopyState("copied");
      setTimeout(() => setCopyState("idle"), 1500);
    } catch (error) {
      console.error("[DocumentViewer] Copy failed", error);
    }
  }, [state]);

  if (state.status === "idle" || state.status === "loading") {
    return (
      <div
        className={cn(
          VIEW_CLASSNAME,
          "flex min-w-0 items-center justify-center text-sm text-muted-foreground",
        )}
      >
        <Loader2 className="mr-2 size-4 animate-spin" />
        {t("artifacts.viewer.loadingDoc")}
      </div>
    );
  }

  if (state.status === "error") {
    const isSourceError = state.code === "NO_SOURCE";
    return (
      <div className={VIEW_CLASSNAME}>
        <StatusLayout
          icon={File}
          title={
            isSourceError
              ? t("artifacts.viewer.notSupported")
              : t("artifacts.viewer.fetchError")
          }
          desc={isSourceError ? file.name : state.message}
          action={
            !isSourceError && (
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={refetch}
              >
                {t("artifacts.viewer.retry")}
              </Button>
            )
          }
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        VIEW_CLASSNAME,
        "flex min-w-0 flex-col rounded-xl border bg-card shadow-sm",
      )}
    >
      <DocumentViewerToolbar
        file={file}
        subtitle={subtitle}
        resolvedUrl={resolvedUrl}
        onCopy={handleCopy}
        copyDisabled={state.status !== "success"}
        copyState={copyState}
      />
      <div className="flex-1 overflow-auto min-h-0 p-4">
        <SyntaxHighlighter
          language={syntaxLanguage}
          style={oneDark}
          wrapLines={false}
          showLineNumbers
          lineNumberStyle={{
            userSelect: "none",
            WebkitUserSelect: "none",
            minWidth: "2.5em",
            paddingRight: "1em",
            textAlign: "right",
            opacity: 0.5,
          }}
          customStyle={{
            background: "transparent",
            margin: 0,
            padding: 0,
            fontSize: "0.85rem",
            overflow: "visible",
          }}
          codeTagProps={{
            style: {
              background: "transparent",
            },
          }}
          PreTag={({ children, ...props }) => (
            <pre
              {...props}
              style={{
                background: "transparent",
                margin: 0,
                overflow: "visible",
              }}
            >
              {children}
            </pre>
          )}
        >
          {state.content}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};

const MarkdownDocumentViewer = ({
  file,
  sessionId,
  resolvedUrl,
}: {
  file: FileNode;
  sessionId?: string;
  resolvedUrl?: string;
}) => {
  const { t } = useT("translation");
  const { state, refetch } = useFileTextContent({
    file,
    fallbackUrl: resolvedUrl,
  });
  const [copyState, setCopyState] = React.useState<"idle" | "copied">("idle");

  const handleCopy = React.useCallback(async () => {
    if (state.status !== "success") return;
    try {
      await navigator.clipboard.writeText(state.content);
      setCopyState("copied");
      setTimeout(() => setCopyState("idle"), 1500);
    } catch (error) {
      console.error("[DocumentViewer] Copy markdown failed", error);
    }
  }, [state]);

  if (state.status === "idle" || state.status === "loading") {
    return (
      <div
        className={cn(
          VIEW_CLASSNAME,
          "flex min-w-0 items-center justify-center text-sm text-muted-foreground",
        )}
      >
        <Loader2 className="mr-2 size-4 animate-spin" />
        {t("artifacts.viewer.loadingDoc")}
      </div>
    );
  }

  if (state.status === "error") {
    const isSourceError = state.code === "NO_SOURCE";
    return (
      <div className={VIEW_CLASSNAME}>
        <StatusLayout
          icon={File}
          title={
            isSourceError
              ? t("artifacts.viewer.notSupported")
              : t("artifacts.viewer.fetchError")
          }
          desc={isSourceError ? file.name : state.message}
          action={
            !isSourceError && (
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={refetch}
              >
                {t("artifacts.viewer.retry")}
              </Button>
            )
          }
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        VIEW_CLASSNAME,
        "flex min-w-0 flex-col rounded-xl border bg-card shadow-sm",
      )}
    >
      <DocumentViewerToolbar
        file={file}
        subtitle="MARKDOWN"
        resolvedUrl={resolvedUrl}
        onCopy={handleCopy}
        copyDisabled={state.status !== "success"}
        copyState={copyState}
      />
      <div className="flex-1 overflow-auto bg-background min-h-0">
        <div className="mx-auto w-full max-w-4xl px-4 py-6">
          <div className="prose prose-sm dark:prose-invert max-w-none break-words [&_*]:break-words">
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkBreaks]}
              rehypePlugins={[rehypeHighlight]}
              components={{
                pre: MarkdownPreBlock,
                code: ({ inline, className, children }) =>
                  inline ? (
                    <code className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground text-[0.85rem]">
                      {children}
                    </code>
                  ) : (
                    <code className={className}>{children}</code>
                  ),
                a: ({ children, href, ...props }) => (
                  <a
                    className="text-primary underline underline-offset-4 decoration-primary/30 hover:decoration-primary"
                    target="_blank"
                    rel="noopener noreferrer"
                    href={href}
                    {...props}
                  >
                    {children}
                  </a>
                ),
                h1: ({ children }) => (
                  <h1 className="text-3xl font-bold mb-6 pb-2 border-b border-border">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-2xl font-semibold mb-4 mt-8">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-xl font-semibold mb-3 mt-6">
                    {children}
                  </h3>
                ),
                table: ({ children }) => (
                  <div className="overflow-x-auto my-6 border rounded-lg">
                    <table className="w-full border-collapse text-sm">
                      {children}
                    </table>
                  </div>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-primary/20 bg-primary/5 pl-4 py-1 italic my-6 rounded-r-sm">
                    {children}
                  </blockquote>
                ),
                hr: () => <hr className="my-8 border-t border-border/60" />,
              }}
            >
              {state.content}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
};

const DocumentViewerComponent = ({
  file,
  sessionId,
}: {
  file?: FileNode;
  sessionId?: string;
}) => {
  const { t } = useT("translation");

  if (!file)
    return (
      <div className="h-full flex flex-col items-center justify-center rounded-xl bg-muted/5 p-12 text-center text-muted-foreground">
        <File className="size-10 mb-4 opacity-20" />
        <p className="text-sm font-medium">
          {t("artifacts.viewer.selectFile")}
        </p>
        <p className="text-xs mt-1 opacity-50">
          {t("artifacts.viewer.supportedFormats")}
        </p>
      </div>
    );

  if (!file.url)
    return (
      <StatusLayout
        icon={File}
        title={t("artifacts.viewer.processing")}
        desc={file.name}
      />
    );

  const resolvedUrl = ensureAbsoluteUrl(file.url);
  const extension = extractExtension(file);
  const docType = DOC_VIEWER_TYPE_MAP[extension];
  const textLanguage = getTextLanguage(extension, file.mimeType);

  if (docType) {
    const subtitle = (extension || docType).toUpperCase();
    const documentUri = resolvedUrl || file.url!;
    return (
      <div
        className={cn(
          VIEW_CLASSNAME,
          "flex min-w-0 flex-col rounded-xl border bg-card shadow-sm",
        )}
      >
        <DocumentViewerToolbar
          file={file}
          subtitle={subtitle}
          resolvedUrl={documentUri}
        />
        <div className="flex-1 overflow-hidden bg-black/5">
          <DocViewer
            key={documentUri}
            documents={[{ uri: documentUri, fileType: docType }]}
            config={{ header: { disableHeader: true } }}
            className="h-full"
          />
        </div>
      </div>
    );
  }

  if (textLanguage === "markdown") {
    return (
      <MarkdownDocumentViewer
        file={file}
        sessionId={sessionId}
        resolvedUrl={resolvedUrl}
      />
    );
  }

  if (textLanguage) {
    return (
      <TextDocumentViewer
        file={file}
        language={textLanguage}
        sessionId={sessionId}
        resolvedUrl={resolvedUrl}
      />
    );
  }

  return (
    <StatusLayout
      icon={File}
      title={t("artifacts.viewer.notSupported")}
      desc={file.name}
      action={
        resolvedUrl && (
          <div className="flex gap-2 mt-6">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() =>
                window.open(resolvedUrl, "_blank", "noopener,noreferrer")
              }
            >
              <ExternalLink className="size-4" />
              {t("artifacts.viewer.openInNewWindow")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => {
                const link = document.createElement("a");
                link.href = resolvedUrl;
                link.download = file.name || file.path;
                link.click();
              }}
            >
              <Download className="size-4" />
              {t("artifacts.viewer.downloadOriginal")}
            </Button>
          </div>
        )
      }
    />
  );
};

export const DocumentViewer = React.memo(DocumentViewerComponent);
DocumentViewer.displayName = "DocumentViewer";

interface StatusLayoutProps {
  icon: React.ElementType;
  title: string;
  desc?: string;
  action?: React.ReactNode;
}

const StatusLayout = ({
  icon: Icon,
  title,
  desc,
  action,
}: StatusLayoutProps) => (
  <div className="flex flex-col items-center justify-center h-full p-8 text-center max-w-sm mx-auto">
    <div className="p-4 bg-muted rounded-full mb-4 opacity-50">
      <Icon className="size-10 text-muted-foreground" />
    </div>
    <h3 className="font-semibold text-base">{title}</h3>
    {desc && (
      <p className="text-xs text-muted-foreground mt-2 leading-relaxed break-words break-all">
        {desc}
      </p>
    )}
    {action}
  </div>
);
