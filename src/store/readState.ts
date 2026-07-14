const KEY = 'phantom-chat:read-state';

// contactId -> the timestamp of the newest message from them the user has
// actually seen. No entry means "never opened" — every message from that
// contact counts as unread, same as a real chat app's first-open state.
export type ReadState = Record<string, number>;

export function loadReadState(): ReadState {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ReadState) : {};
  } catch {
    return {};
  }
}

export function saveReadState(state: ReadState): void {
  localStorage.setItem(KEY, JSON.stringify(state));
}
