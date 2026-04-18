export type BlockerStatus = "waiting" | "in-progress" | "pending" | "resolved";

export interface Blocker {
  id: number;
  title: string;
  detail: string;
  status: BlockerStatus;
}

export interface SprintItem {
  done: boolean;
  text: string;
}

export interface WireItem {
  id: number;
  date: string;
  tag: string;
  title: string;
  body: string;
}

export interface DocItem {
  id: number;
  date: string;
  title: string;
  type: string;
  tags: string[];
}

export interface SavedNote {
  id: number;
  text: string;
  time: string;
  date: string;
  sent: boolean;
}

export type ChatRole = "assistant" | "user";

export interface ChatMessage {
  role: ChatRole;
  content: string;
  capturedNoteIds?: number[];
}

export interface ConciergeAction {
  type: "note";
  text: string;
}

export interface ConciergeReply {
  content: string;
  actions: ConciergeAction[];
}
