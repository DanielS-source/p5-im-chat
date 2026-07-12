import type { Contact, Message } from '../domain/types';
import type { ChatTransport, IncomingMessageEvent, TypingEvent } from './ChatTransport';
import type { ReplyStrategy } from './replyStrategies';
import { LlmReplyStrategy, SilentReplyStrategy } from './replyStrategies';

const llmStrategy = new LlmReplyStrategy();
const silentStrategy = new SilentReplyStrategy();

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
    void this.strategyFor(contact).reply({
      contact,
      threadId,
      history,
      emitMessage: (event) => this.emitMessage(event),
      emitTyping: (event) => this.emitTyping(event),
    });
  }

  /** Re-runs the last request as-is (history already ends with the failed user turn). */
  retry(threadId: string): void {
    const contact = this.contacts.find((c) => c.id === threadId);
    if (!contact) return;

    void this.strategyFor(contact).reply({
      contact,
      threadId,
      history: this.getHistory(threadId),
      emitMessage: (event) => this.emitMessage(event),
      emitTyping: (event) => this.emitTyping(event),
    });
  }

  // Most contacts talk to the model; a contact flagged `silent` gets the
  // no-op strategy instead, so sending to them never costs a token.
  private strategyFor(contact: Contact): ReplyStrategy {
    return contact.silent ? silentStrategy : llmStrategy;
  }

  private emitMessage(event: IncomingMessageEvent) {
    for (const cb of this.messageListeners) cb(event);
  }

  private emitTyping(event: TypingEvent) {
    for (const cb of this.typingListeners) cb(event);
  }
}
