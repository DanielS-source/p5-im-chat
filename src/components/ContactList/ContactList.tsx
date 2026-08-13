import { useState } from 'react';
import type { Contact, ContactStatus } from '../../domain/types';
import ContactPortrait from '../ContactPortrait/ContactPortrait';
import FieldMotifs from '../FieldMotifs/FieldMotifs';
import FloatingLogo from '../FloatingLogo/FloatingLogo';
import StatusBar from '../StatusBar/StatusBar';
import styles from './ContactList.module.css';

interface ContactListProps {
  contacts: Contact[];
  lastMessages: Record<string, string>;
  unreadCounts: Record<string, number>;
  showParticles: boolean;
  onSelect: (contactId: string) => void;
  onOpenSettings: () => void;
}

// A handful of slight variations on the same asymmetric quadrilateral
// (same idea as design-target's contact rows) — picked per contact by a
// seeded hash rather than every row using the identical clip, so the list
// doesn't look stamped from one cutter.
const PANEL_CLIPS = [
  'polygon(0% 10%, 100% 0%, 98% 92%, 2% 100%)',
  'polygon(0% 8%, 99% 0%, 100% 90%, 2% 100%)',
  'polygon(0% 12%, 100% 0%, 98% 88%, 2% 100%)',
];

const SECTIONS: { status: ContactStatus; label: string }[] = [
  { status: 'online', label: 'Online now' },
  { status: 'offline', label: 'Offline' },
];

// Same deterministic per-id jitter pattern used throughout this app
// (Bubble's tail, ConnectingLines' meeting points, MixedText's letters) —
// stable across re-renders instead of reshuffling every time the list
// re-renders (e.g. while typing in the search box).
function hashSeed(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (Math.imul(hash, 31) + input.charCodeAt(i)) | 0;
  }
  return (hash >>> 0) || 1;
}

function seededRandom(seed: number) {
  let state = seed;
  return () => {
    state = (Math.imul(state, 1103515245) + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

interface ContactRowProps {
  contact: Contact;
  index: number;
  lastMessage: string | undefined;
  unreadCount: number;
  onSelect: (contactId: string) => void;
}

function ContactRow({ contact, index, lastMessage, unreadCount, onSelect }: ContactRowProps) {
  const seed = hashSeed(contact.id);
  const rand = seededRandom(seed);
  const avatarRotate = (rand() - 0.5) * 14;
  const panelRotate = (rand() - 0.5) * 3;
  const clip = PANEL_CLIPS[seed % PANEL_CLIPS.length];
  // Kept for the avatar frame's flip rhythm even though the panel itself
  // no longer alternates color (always paper now — see .panel).
  const flipFrame = index % 2 === 1;

  return (
    <li className={contact.status === 'offline' ? styles.offline : undefined}>
      <button className={styles.row} type="button" onClick={() => onSelect(contact.id)}>
        <span
          className={styles.avatarBox}
          style={{ transform: `translateY(6px) rotate(${avatarRotate}deg)` }}
        >
          <ContactPortrait contact={contact} flip={flipFrame} />
        </span>
        <span className={styles.panelWrap} style={{ transform: `rotate(${panelRotate}deg)` }}>
          <span className={styles.panelShard} style={{ clipPath: clip }} />
          <span className={styles.panel} style={{ clipPath: clip }}>
            <span className={styles.nameRow}>
              <span className={styles.name}>{contact.name}</span>
              {unreadCount > 0 && (
                <span className={styles.unreadBadge}>{unreadCount > 9 ? '9+' : unreadCount}</span>
              )}
            </span>
            <span className={styles.subtitle}>{lastMessage ?? contact.textingStyle}</span>
          </span>
        </span>
      </button>
    </li>
  );
}

export default function ContactList({
  contacts,
  lastMessages,
  unreadCounts,
  showParticles,
  onSelect,
  onOpenSettings,
}: ContactListProps) {
  const [query, setQuery] = useState('');

  const filtered = contacts.filter((contact) =>
    contact.name.toLowerCase().includes(query.trim().toLowerCase()),
  );
  const onlineCount = contacts.filter((contact) => contact.status === 'online').length;

  return (
    <div className={styles.screen}>
      {showParticles && <FieldMotifs />}
      <StatusBar />
      <div className={styles.header}>
        <FloatingLogo className={styles.logo} />
        <div className={styles.titleBlock}>
          <span className={styles.title}>Contacts</span>
          <span className={styles.tagline}>
            {contacts.length} contacts &middot; {onlineCount} online
          </span>
        </div>
        <button className={styles.settings} type="button" onClick={onOpenSettings}>
          Settings
        </button>
      </div>
      <div className={styles.searchOuter}>
        <div className={styles.searchWrap}>
          <span className={styles.searchShard} />
          <span className={styles.searchPanel}>
            <input
              className={styles.searchInput}
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search contacts..."
              aria-label="Search contacts"
            />
          </span>
        </div>
      </div>
      <ul className={styles.list}>
        {SECTIONS.map(({ status, label }) => {
          const sectionContacts = filtered.filter((contact) => contact.status === status);
          if (sectionContacts.length === 0) return null;
          return (
            <li key={status} className={styles.section}>
              <span className={styles.sectionLabel}>{label}</span>
              <ul className={styles.sectionList}>
                {sectionContacts.map((contact, index) => (
                  <ContactRow
                    key={contact.id}
                    contact={contact}
                    index={index}
                    lastMessage={lastMessages[contact.id]}
                    unreadCount={unreadCounts[contact.id] ?? 0}
                    onSelect={onSelect}
                  />
                ))}
              </ul>
            </li>
          );
        })}
      </ul>
      <div className={styles.vignette} aria-hidden="true" />
    </div>
  );
}
