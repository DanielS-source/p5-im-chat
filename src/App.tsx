import { useEffect, useRef, useState } from 'react';
import contactsData from './data/contacts.json';
import { seedMessagesByContact } from './data/seedThread';
import ContactList from './components/ContactList/ContactList';
import ThreadScreen from './components/ThreadScreen/ThreadScreen';
import SettingsScreen from './components/SettingsScreen/SettingsScreen';
import { LocalStorageThreadStore } from './store/LocalStorageThreadStore';
import { loadReadState, saveReadState } from './store/readState';
import { adjustBrightness, loadThemePreference, saveThemePreference } from './store/themePreference';
import { LlmTransport } from './transport/LlmTransport';
import type { Contact, Message } from './domain/types';

const contacts = contactsData as Contact[];
const threadStore = new LocalStorageThreadStore();

function loadInitialMessages(contactId: string): Message[] {
  const saved = threadStore.load(contactId);
  if (saved) return saved.messages;
  return seedMessagesByContact[contactId] ?? [];
}

export default function App() {
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [theme, setTheme] = useState(loadThemePreference);
  // TEMP: lets the message timestamp badges be toggled on/off while
  // deciding if they're worth keeping — see SettingsScreen's Display
  // section. Remove once decided.
  const [showTimestamps, setShowTimestamps] = useState(false);
  const [readState, setReadState] = useState(loadReadState);

  useEffect(() => {
    saveThemePreference(theme);
    // --main, plus its derived --main-dark/--main-light companions —
    // every preset color gets consistent lighter/darker
    // shades this way instead of each one needing its own hand-picked
    // pair. Anything wanting a darker/lighter variant of the current
    // field color (typing indicator shard, connecting-line shadow, field
    // motifs, ...) should reference these rather than applying its own
    // one-off brightness filter.
    document.documentElement.style.setProperty('--main', theme.accentColor);
    document.documentElement.style.setProperty('--main-dark', adjustBrightness(theme.accentColor, 0.5));
    document.documentElement.style.setProperty('--main-light', adjustBrightness(theme.accentColor, 1.6));
    // "Noir mode... just greys things" — a single filter on the root
    // desaturates every color in the app at once rather than needing a
    // second full palette of grayscale custom properties to maintain.
    document.documentElement.style.filter = theme.noir ? 'grayscale(1)' : '';
  }, [theme]);

  const messagesRef = useRef(messages);
  messagesRef.current = messages;
  const selectedContactRef = useRef(selectedContactId);
  selectedContactRef.current = selectedContactId;

  const transportRef = useRef<LlmTransport>();
  if (!transportRef.current) {
    transportRef.current = new LlmTransport(contacts, (threadId) =>
      selectedContactRef.current === threadId ? messagesRef.current : [],
    );
  }

  // Newest message timestamp from that contact counts as "read" — called
  // both when a thread is first opened and whenever a message arrives
  // while it's already open, so unread counts only build up for threads
  // the user isn't currently looking at.
  function markThreadRead(contactId: string, threadMessages: Message[]) {
    const newestFromThem = threadMessages
      .filter((m) => m.sender !== 'me')
      .reduce((max, m) => Math.max(max, m.timestamp), 0);
    if (newestFromThem === 0) return;
    setReadState((prev) => {
      if ((prev[contactId] ?? 0) >= newestFromThem) return prev;
      const next = { ...prev, [contactId]: newestFromThem };
      saveReadState(next);
      return next;
    });
  }

  useEffect(() => {
    const transport = transportRef.current!;

    const unsubMessage = transport.onMessage((event) => {
      if (event.threadId !== selectedContactRef.current) return;

      if (event.error) {
        setError(event.error);
        return;
      }

      setMessages((prev) => {
        const existing = prev.find((m) => m.id === event.messageId);
        const updated: Message = {
          id: event.messageId,
          threadId: event.threadId,
          sender: event.senderId,
          text: event.text,
          timestamp: existing?.timestamp ?? Date.now(),
          status: event.done ? 'sent' : 'sending',
        };
        const next = existing
          ? prev.map((m) => (m.id === event.messageId ? updated : m))
          : [...prev, updated];

        if (event.done) {
          threadStore.save({ contactId: event.threadId, messages: next });
          markThreadRead(event.threadId, next);
        }
        return next;
      });
    });

    const unsubTyping = transport.onTyping((event) => {
      if (event.threadId === selectedContactRef.current) setIsTyping(event.isTyping);
    });

    return () => {
      unsubMessage();
      unsubTyping();
    };
  }, []);

  function handleSelect(contactId: string) {
    setSelectedContactId(contactId);
    const initialMessages = loadInitialMessages(contactId);
    setMessages(initialMessages);
    setError(null);
    setIsTyping(false);
    markThreadRead(contactId, initialMessages);
  }

  function handleSend(text: string) {
    if (!selectedContactId) return;
    const message: Message = {
      id: crypto.randomUUID(),
      threadId: selectedContactId,
      sender: 'me',
      text,
      timestamp: Date.now(),
      status: 'sent',
    };
    const next = [...messages, message];
    setMessages(next);
    threadStore.save({ contactId: selectedContactId, messages: next });
    setError(null);
    transportRef.current!.send(selectedContactId, text);
  }

  function handleRetry() {
    if (!selectedContactId) return;
    setError(null);
    transportRef.current!.retry(selectedContactId);
  }

  const selectedContact = contacts.find((contact) => contact.id === selectedContactId);

  if (showSettings) {
    return (
      <SettingsScreen
        accentColor={theme.accentColor}
        noir={theme.noir}
        onAccentChange={(accentColor) => setTheme((prev) => ({ ...prev, accentColor }))}
        onNoirChange={(noir) => setTheme((prev) => ({ ...prev, noir }))}
        showTimestamps={showTimestamps}
        onShowTimestampsChange={setShowTimestamps}
        showParticles={theme.particlesEnabled}
        onShowParticlesChange={(particlesEnabled) => setTheme((prev) => ({ ...prev, particlesEnabled }))}
        onBack={() => setShowSettings(false)}
      />
    );
  }

  if (!selectedContact) {
    const lastMessages: Record<string, string> = {};
    const unreadCounts: Record<string, number> = {};
    for (const contact of contacts) {
      const contactMessages = loadInitialMessages(contact.id);
      const last = contactMessages[contactMessages.length - 1];
      // Collapsed to one line here (data prep) rather than in ContactList,
      // which just truncates with CSS — a multi-paragraph message (Priya's
      // texting style) would otherwise show its raw newlines before the
      // ellipsis ever kicks in.
      if (last) lastMessages[contact.id] = last.text.replace(/\s+/g, ' ').trim();

      const lastRead = readState[contact.id] ?? 0;
      unreadCounts[contact.id] = contactMessages.filter(
        (m) => m.sender !== 'me' && m.timestamp > lastRead,
      ).length;
    }
    return (
      <ContactList
        contacts={contacts}
        lastMessages={lastMessages}
        unreadCounts={unreadCounts}
        showParticles={theme.particlesEnabled}
        onSelect={handleSelect}
        onOpenSettings={() => setShowSettings(true)}
      />
    );
  }

  return (
    <ThreadScreen
      contact={selectedContact}
      messages={messages}
      onSend={handleSend}
      onBack={() => setSelectedContactId(null)}
      isTyping={isTyping}
      error={error}
      onRetry={handleRetry}
      showTimestamps={showTimestamps}
      showParticles={theme.particlesEnabled}
    />
  );
}
