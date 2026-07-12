export interface IncomingMessageEvent {
  threadId: string;
  messageId: string;
  senderId: string;
  /** Cumulative text so far — safe to setState with directly. */
  text: string;
  done: boolean;
  error?: string;
}

export interface TypingEvent {
  threadId: string;
  isTyping: boolean;
}

export interface ChatTransport {
  send(threadId: string, text: string): void;
  onMessage(cb: (event: IncomingMessageEvent) => void): () => void;
  onTyping(cb: (event: TypingEvent) => void): () => void;
}
