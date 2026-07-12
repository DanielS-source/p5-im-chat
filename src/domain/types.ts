export type AvatarShape = 'star' | 'diamond' | 'shard' | 'burst';

export type ContactStatus = 'online' | 'away' | 'offline';

export interface Contact {
  id: string;
  name: string;
  color: string;
  avatarShape: AvatarShape;
  systemPrompt: string;
  textingStyle: string;
  status: ContactStatus;
  // Optional — when true, LlmTransport skips the API call entirely for this
  // contact (no fetch, no token spend). Lets a contact exist purely for UI
  // testing (sending messages, layout, etc.) without ever costing tokens.
  silent?: boolean;
}

export type MessageStatus = 'sending' | 'sent' | 'error';

export interface Message {
  id: string;
  threadId: string;
  sender: 'me' | string;
  text: string;
  timestamp: number;
  status: MessageStatus;
}

export interface Thread {
  contactId: string;
  messages: Message[];
}
