"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import type { FileNode } from "@/features/chat/types";
import { File, Download, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DocViewerProps } from "react-doc-viewer";

/** 动态导出以避免服务端渲染错误，并提供骨架屏效果 */
const DocViewer = dynamic<DocViewerProps>(
  () => import("./doc-viewer-client").then((m) => m.DocViewerClient),
  {
    ssr: false,
    loading: () => (
      <div className="h-full flex items-center justify-center p-8 text-muted-foreground animate-pulse text-sm">
        正在加载预览引擎...
      </div>
    ),
  },
);

/** 核心渲染映射表，只保留 DocViewer 真实支持的格式 */
const SUPPORTED_MAP: Record<string, string> = {
  pdf: "pdf",
  doc: "doc",
  docx: "docx",
  xls: "xls",
  xlsx: "xlsx",
  ppt: "ppt",
  pptx: "pptx",
  txt: "txt",
  htm: "html",
  html: "html",
  jpg: "jpg",
  jpeg: "jpg",
  png: "png",
  bmp: "bmp",
};

/** CSS 变量重置：修复某些 UI 框架（如 shadcn）的动画属性导致预览层错位的问题 */
const VIEW_CLASSNAME =
  "h-full w-full animate-in fade-in duration-300 [--tw-enter-opacity:1] [--tw-enter-scale:1] [--tw-enter-translate-x:0] [--tw-enter-translate-y:0]";

const DocumentViewerComponent = ({ file }: { file?: FileNode }) => {
  // 分支 1: 未选择文件
  if (!file)
    return (
      <div className="h-full flex flex-col items-center justify-center rounded-xl bg-muted/5 p-12 text-center text-muted-foreground">
        <File className="size-10 mb-4 opacity-20" />
        <p className="text-sm font-medium">请从左侧选择文件进行预览</p>
        <p className="text-xs mt-1 opacity-50">
          支持 PDF、Office 文档及常见图片格式
        </p>
      </div>
    );

  const { url, name } = file;
  const ext = name?.split(".").pop()?.toLowerCase() || ""; // 提取后缀名
  const type = SUPPORTED_MAP[ext]; // 匹配预览引擎支持的类型

  // 分支 2: 文件正在上传或处理中（缺少 URL）
  if (!url) return <StatusLayout icon={File} title="文件处理中" desc={name} />;

  // 分支 3: 格式不支持（如 zip, exe 等）
  if (!type)
    return (
      <StatusLayout
        icon={File}
        title="该格式暂不支持预览"
        desc={name}
        action={
          <div className="flex gap-2 mt-6">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => window.open(url, "_blank")}
            >
              <ExternalLink className="size-4" />
              新窗口打开
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => {
                const a = document.createElement("a");
                a.href = url;
                a.download = name;
                a.click();
              }}
            >
              <Download className="size-4" />
              下载原文件
            </Button>
          </div>
        }
      />
    );

  // 分支 4: 正常预览
  return (
    <div className={VIEW_CLASSNAME}>
      <DocViewer
        key={url} // CRITICAL: 必须用 URL 作为 key，确保切换文件时预览组件完全重新挂载
        documents={[{ uri: url, fileType: type }]}
        config={{ header: { disableHeader: false } }}
        className="h-full"
      />
    </div>
  );
};
export const DocumentViewer = React.memo(DocumentViewerComponent);
DocumentViewer.displayName = "DocumentViewer";

/** 状态页布局：集中管理报错、加载和空状态的 UI 呈现 */
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
    <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{desc}</p>
    {action}
  </div>
);
