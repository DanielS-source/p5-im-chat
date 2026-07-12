import type { Contact, Message } from '../domain/types';
import type { IncomingMessageEvent, TypingEvent } from './ChatTransport';

const BASE_SYSTEM_PROMPT =
  'You are a contact in a casual chat app; write like a person texting, never mention being an AI; obey the texting style below.';

function toAnthropicRole(sender: Message['sender']): 'user' | 'assistant' {
  return sender === 'me' ? 'user' : 'assistant';
}

export interface ReplyContext {
  contact: Contact;
  threadId: string;
  history: Message[];
  emitMessage: (event: IncomingMessageEvent) => void;
  emitTyping: (event: TypingEvent) => void;
}

export interface ReplyStrategy {
  reply(ctx: ReplyContext): Promise<void>;
}

// The only strategy that actually talks to the model — everything else
// (system prompt assembly, SSE parsing, streaming state) lives here so
// LlmTransport itself just has to pick a strategy per contact.
export class LlmReplyStrategy implements ReplyStrategy {
  async reply({ contact, threadId, history, emitMessage, emitTyping }: ReplyContext): Promise<void> {
    const anthropicMessages = history.map((m) => ({
      role: toAnthropicRole(m.sender),
      content: m.text,
    }));

    const messageId = crypto.randomUUID();
    emitTyping({ threadId, isTyping: true });

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
      emitTyping({ threadId, isTyping: false });
      emitMessage({ threadId, messageId, senderId: threadId, text: '', done: true, error: 'network' });
      return;
    }

    if (!response.ok || !response.body) {
      const body = await response.json().catch(() => ({ message: 'request failed' }));
      emitTyping({ threadId, isTyping: false });
      emitMessage({
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
          emitTyping({ threadId, isTyping: false });
          emitMessage({ threadId, messageId, senderId: threadId, text: accumulated, done: true, error: event.error });
          return;
        }

        if (event.delta) {
          if (firstChunk) {
            emitTyping({ threadId, isTyping: false });
            firstChunk = false;
          }
          accumulated += event.delta;
          emitMessage({ threadId, messageId, senderId: threadId, text: accumulated, done: false });
        }

        if (event.done) {
          emitMessage({ threadId, messageId, senderId: threadId, text: accumulated, done: true });
        }
      }
    }

    emitTyping({ threadId, isTyping: false });
  }
}

// Deliberately does nothing — no fetch, no typing indicator, no emitted
// message. For contacts that exist purely to exercise sending/UI without
// ever spending an LLM call.
export class SilentReplyStrategy implements ReplyStrategy {
  async reply(): Promise<void> {}
}
