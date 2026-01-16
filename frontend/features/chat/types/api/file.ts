/**
 * File/Workspace-related API types matching backend schemas
 */

export interface FileNode {
  id: string;
  name: string;
  type: "file" | "folder";
  path: string;
  children?: FileNode[] | null;
  url?: string | null;
  mimeType?: string | null;
}
