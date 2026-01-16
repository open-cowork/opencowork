"use client";

import * as React from "react";
import DocViewer, {
  DocViewerRenderers,
  type DocViewerProps,
} from "react-doc-viewer";
import { pdfjs } from "react-pdf";
import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";

export type { DocViewerProps } from "react-doc-viewer";

// 使用指定的 pdfjs-dist 版本 worker
const workerSrc = `https://unpkg.com/pdfjs-dist@4.3.136/build/pdf.worker.min.mjs`;

let workerConfigured = false;

/**
 * 初始化 PDF.js Worker 并配置全局错误抑制
 * 抑制 "TextLayer task cancelled" 等由于组件卸载导致的正常警告
 */
function configurePDFWorker() {
  if (workerConfigured || typeof window === "undefined") return;

  pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
  workerConfigured = true;

  // 定义需要屏蔽的日志模式
  const suppressPatterns = [/TextLayer/, /task cancelled/, /AbortException/];
  const shouldSuppress = (args: unknown[]) =>
    args.some((arg) => suppressPatterns.some((p) => p.test(String(arg))));

  const originalWarn = console.warn;
  const originalError = console.error;

  // 重写 console 方法以减少干扰
  console.warn = (...args) =>
    shouldSuppress(args) ? null : originalWarn(...args);
  console.error = (...args) =>
    shouldSuppress(args) ? null : originalError(...args);
}

// 模块加载即配置
configurePDFWorker();

/**
 * 封装后的文档查看器客户端组件
 */
export function DocViewerClient(props: DocViewerProps) {
  return (
    <DocViewer
      {...props}
      pluginRenderers={props.pluginRenderers ?? DocViewerRenderers}
    />
  );
}

export default DocViewerClient;
