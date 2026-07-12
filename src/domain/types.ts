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
