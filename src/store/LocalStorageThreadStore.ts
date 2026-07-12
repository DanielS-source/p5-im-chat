import type { Thread } from '../domain/types';
import type { ThreadStore } from './ThreadStore';

const KEY_PREFIX = 'phantom-chat:thread:';

export class LocalStorageThreadStore implements ThreadStore {
  load(contactId: string): Thread | undefined {
    const raw = localStorage.getItem(KEY_PREFIX + contactId);
    if (!raw) return undefined;

    try {
      return JSON.parse(raw) as Thread;
    } catch {
      return undefined;
    }
  }

  save(thread: Thread): void {
    localStorage.setItem(KEY_PREFIX + thread.contactId, JSON.stringify(thread));
  }
}
