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

// Use the specified pdfjs-dist worker version
const workerSrc = `https://unpkg.com/pdfjs-dist@4.3.136/build/pdf.worker.min.mjs`;

let workerConfigured = false;

/**
 * Initialize the PDF.js worker and configure global error suppression
 * Suppress benign warnings such as "TextLayer task cancelled" due to unmount
 */
function configurePDFWorker() {
  if (workerConfigured || typeof window === "undefined") return;

  pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
  workerConfigured = true;

  // Define log patterns to suppress
  const suppressPatterns = [/TextLayer/, /task cancelled/, /AbortException/];
  const shouldSuppress = (args: unknown[]) =>
    args.some((arg) => suppressPatterns.some((p) => p.test(String(arg))));

  const originalWarn = console.warn;
  const originalError = console.error;

  // Override console methods to reduce noise
  console.warn = (...args) =>
    shouldSuppress(args) ? null : originalWarn(...args);
  console.error = (...args) =>
    shouldSuppress(args) ? null : originalError(...args);
}

// Configure on module load
configurePDFWorker();

/**
 * Wrapped document viewer client component
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
