import type { Thread } from '../domain/types';

export interface ThreadStore {
  load(contactId: string): Thread | undefined;
  save(thread: Thread): void;
}
