import type { LucideIcon } from "lucide-react";
import {
  Folder,
  FileText,
  FileCode,
  FileImage,
  File,
  Music,
  Video,
  FileJson,
  Presentation,
} from "lucide-react";

export type FileType =
  | "folder"
  | "pdf"
  | "doc"
  | "docx"
  | "xls"
  | "xlsx"
  | "ppt"
  | "pptx"
  | "html"
  | "code"
  | "image"
  | "video"
  | "audio"
  | "json"
  | "yaml"
  | "markdown"
  | "text"
  | "unknown";

const FILE_ICONS: Record<FileType, LucideIcon> = {
  folder: Folder,
  pdf: FileText,
  doc: FileText,
  docx: FileText,
  xls: FileText,
  xlsx: FileText,
  ppt: Presentation,
  pptx: Presentation,
  html: FileCode,
  code: FileCode,
  image: FileImage,
  video: Video,
  audio: Music,
  json: FileJson,
  yaml: FileJson,
  markdown: FileCode,
  text: FileText,
  unknown: File,
};

const FILE_EXTENSIONS: Record<string, FileType> = {
  // Documents
  pdf: "pdf",
  doc: "doc",
  docx: "docx",
  xls: "xls",
  xlsx: "xlsx",
  ppt: "ppt",
  pptx: "pptx",
  txt: "text",
  md: "markdown",
  markdown: "markdown",
  // Code
  ts: "code",
  tsx: "code",
  js: "code",
  jsx: "code",
  html: "html",
  css: "code",
  scss: "code",
  py: "code",
  go: "code",
  rs: "code",
  java: "code",
  cpp: "code",
  c: "code",
  h: "code",
  cs: "code",
  php: "code",
  rb: "code",
  swift: "code",
  kt: "code",
  // Data
  json: "json",
  xml: "code",
  yaml: "code",
  yml: "yaml",
  toml: "code",
  // Images
  jpg: "image",
  jpeg: "image",
  png: "image",
  gif: "image",
  svg: "image",
  webp: "image",
  ico: "image",
  bmp: "image",
  // Video
  mp4: "video",
  webm: "video",
  mov: "video",
  avi: "video",
  mkv: "video",
  // Audio
  mp3: "audio",
  wav: "audio",
  ogg: "audio",
  flac: "audio",
  aac: "audio",
};

export function getFileType(filename: string): FileType {
  if (filename.endsWith("/")) return "folder";

  const ext = filename.split(".").pop()?.toLowerCase();
  if (!ext) return "unknown";

  return FILE_EXTENSIONS[ext] || "unknown";
}

export function getFileIcon(filename: string): LucideIcon {
  const fileType = getFileType(filename);
  return FILE_ICONS[fileType];
}

export function getFileIconColor(filename: string): string {
  const fileType = getFileType(filename);

  const COLORS: Record<FileType, string> = {
    folder: "text-chart-2",
    pdf: "text-destructive",
    doc: "text-destructive",
    docx: "text-destructive",
    xls: "text-primary",
    xlsx: "text-primary",
    ppt: "text-chart-4",
    pptx: "text-chart-4",
    html: "text-chart-4",
    code: "text-chart-2",
    image: "text-chart-3",
    video: "text-chart-3",
    audio: "text-chart-4",
    json: "text-chart-4",
    yaml: "text-chart-4",
    markdown: "text-muted-foreground",
    text: "text-muted-foreground",
    unknown: "text-muted-foreground",
  };

  return COLORS[fileType];
}
