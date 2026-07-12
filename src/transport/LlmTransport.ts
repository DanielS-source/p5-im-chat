import type { Contact, Message } from '../domain/types';
import type { ChatTransport, IncomingMessageEvent, TypingEvent } from './ChatTransport';

const BASE_SYSTEM_PROMPT =
  'You are a contact in a casual chat app; write like a person texting, never mention being an AI; obey the texting style below.';

function toAnthropicRole(sender: Message['sender']): 'user' | 'assistant' {
  return sender === 'me' ? 'user' : 'assistant';
}

export class LlmTransport implements ChatTransport {
  private messageListeners = new Set<(event: IncomingMessageEvent) => void>();
  private typingListeners = new Set<(event: TypingEvent) => void>();

  constructor(
    private contacts: Contact[],
    private getHistory: (threadId: string) => Message[],
  ) {}

  onMessage(cb: (event: IncomingMessageEvent) => void): () => void {
    this.messageListeners.add(cb);
    return () => this.messageListeners.delete(cb);
  }

  onTyping(cb: (event: TypingEvent) => void): () => void {
    this.typingListeners.add(cb);
    return () => this.typingListeners.delete(cb);
  }

  send(threadId: string, text: string): void {
    const contact = this.contacts.find((c) => c.id === threadId);
    if (!contact) return;

    const history = [...this.getHistory(threadId), { sender: 'me', text } as Message];
    void this.stream(contact, threadId, history);
  }

  /** Re-runs the last request as-is (history already ends with the failed user turn). */
  retry(threadId: string): void {
    const contact = this.contacts.find((c) => c.id === threadId);
    if (!contact) return;

    void this.stream(contact, threadId, this.getHistory(threadId));
  }

  private emitMessage(event: IncomingMessageEvent) {
    for (const cb of this.messageListeners) cb(event);
  }

  private emitTyping(event: TypingEvent) {
    for (const cb of this.typingListeners) cb(event);
  }

  private async stream(contact: Contact, threadId: string, history: Message[]) {
    const anthropicMessages = history.map((m) => ({
      role: toAnthropicRole(m.sender),
      content: m.text,
    }));

    const messageId = crypto.randomUUID();
    this.emitTyping({ threadId, isTyping: true });

    let response: Response;
    try {
      response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system: `${BASE_SYSTEM_PROMPT}\n\n${contact.systemPrompt}`,
          messages: anthropicMessages,
        }),
      });
    } catch {
      this.emitTyping({ threadId, isTyping: false });
      this.emitMessage({ threadId, messageId, senderId: threadId, text: '', done: true, error: 'network' });
      return;
    }

    if (!response.ok || !response.body) {
      const body = await response.json().catch(() => ({ message: 'request failed' }));
      this.emitTyping({ threadId, isTyping: false });
      this.emitMessage({
        threadId,
        messageId,
        senderId: threadId,
        text: '',
        done: true,
        error: body.message ?? 'request failed',
      });
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let accumulated = '';
    let firstChunk = true;

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split('\n\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const payload = line.replace(/^data: /, '').trim();
        if (!payload) continue;
        const event = JSON.parse(payload) as { delta?: string; done?: boolean; error?: string };

        if (event.error) {
          this.emitTyping({ threadId, isTyping: false });
          this.emitMessage({ threadId, messageId, senderId: threadId, text: accumulated, done: true, error: event.error });
          return;
        }

        if (event.delta) {
          if (firstChunk) {
            this.emitTyping({ threadId, isTyping: false });
            firstChunk = false;
          }
          accumulated += event.delta;
          this.emitMessage({ threadId, messageId, senderId: threadId, text: accumulated, done: false });
        }

        if (event.done) {
          this.emitMessage({ threadId, messageId, senderId: threadId, text: accumulated, done: true });
        }
      }
    }

    this.emitTyping({ threadId, isTyping: false });
  }
}
