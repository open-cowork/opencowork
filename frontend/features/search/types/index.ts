export interface SearchResultTask {
  id: string;
  title: string;
  status: string;
  timestamp: string;
  type: "task";
}

export interface SearchResultProject {
  id: string;
  name: string;
  taskCount?: number;
  type: "project";
}

export interface SearchResultMessage {
  id: number;
  content: string;
  chatId: string;
  timestamp: string;
  type: "message";
}

export type SearchResult =
  | SearchResultTask
  | SearchResultProject
  | SearchResultMessage;
