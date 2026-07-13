import { useLayoutEffect, useEffect, useRef, useState } from 'react';
import type { Contact, Message } from '../../domain/types';
import Avatar from '../Avatar/Avatar';
import Bubble from '../Bubble/Bubble';
import ChatInput from '../ChatInput/ChatInput';
import ConnectingLines from '../ConnectingLines/ConnectingLines';
import type { LineSegment } from '../ConnectingLines/ConnectingLines';
import DateSeparator from '../DateSeparator/DateSeparator';
import FieldMotifs from '../FieldMotifs/FieldMotifs';
import FloatingLogo from '../FloatingLogo/FloatingLogo';
// import MixedText from '../MixedText/MixedText';
// import NamePlate from '../NamePlate/NamePlate';
import StatusBar from '../StatusBar/StatusBar';
import TypingIndicator from '../TypingIndicator/TypingIndicator';
import styles from './ThreadScreen.module.css';

// Aligns with the avatar chip's horizontal center (14px .messages padding
// + half of AvatarChip's 96px width), not each bubble's own (width-
// dependent) edge — so consecutive same-side messages connect via a
// consistent vertical ribbon straight through the avatar column, matching
// design-reference/p5-im-chat-ref-2.webp.
const LEFT_LANE_INSET = 62;
// "me" has no avatar to center on — this sits behind the bubble itself
// instead. Pulled well inward (not just behind the bubble's edge) so that
// even with the zigzag jitter applied (+-MEETING_POINT_JITTER) the
// meeting point stays inside even the narrowest bubble (110px min-width)
// instead of poking out past its left or right edge.
const RIGHT_LANE_INSET = 55;
// Max left/right shift applied to each message's own meeting point (see
// meetingPointJitter) — the zigzag effect, achieved by perturbing where
// consecutive segments join rather than adding wiggle points mid-segment.
// Needs to be large relative to the line's own stroke width or it just
// gets swallowed by the stroke itself (9 was invisible against a 46px
// line — the centerline barely moved compared to the line's own girth).
const MEETING_POINT_JITTER = 28;

function straightPath(x1: number, y1: number, x2: number, y2: number): string {
  return `M${x1} ${y1}L${x2} ${y2}`;
}

function isSameDay(a: number, b: number): boolean {
  const dateA = new Date(a);
  const dateB = new Date(b);
  return (
    dateA.getFullYear() === dateB.getFullYear() &&
    dateA.getMonth() === dateB.getMonth() &&
    dateA.getDate() === dateB.getDate()
  );
}

function formatDateParts(timestamp: number): { day: string; month: string; weekday: string } {
  const date = new Date(timestamp);
  return {
    day: String(date.getDate()).padStart(2, '0'),
    month: String(date.getMonth() + 1).padStart(2, '0'),
    weekday: date.toLocaleDateString([], { weekday: 'short' }).slice(0, 2).toUpperCase(),
  };
}

// Deterministic per-message shift, stable across re-renders/reloads
// (seeded by message.id) rather than reshuffling every render — same
// "hand-placed, not measured" idea used for the bubble/avatar jitter
// elsewhere in this app.
function hashSeed(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (Math.imul(hash, 31) + input.charCodeAt(i)) | 0;
  }
  return (hash >>> 0) || 1;
}

// Direction strictly alternates by position (left, right, left, right...)
// — a real zigzag needs guaranteed alternation. Independent per-message
// random jitter (the previous approach) can land on the same side several
// times in a row just by chance, which reads as the line drifting to one
// side rather than zigzagging. Only the *magnitude* varies per message
// (via the id hash), for a bit of hand-drawn irregularity without
// breaking the alternating pattern itself.
function meetingPointJitter(messageId: string, index: number): number {
  const direction = index % 2 === 0 ? 1 : -1;
  const magnitudeRatio = 0.75 + ((hashSeed(messageId) % 1000) / 1000) * 0.25; // 0.75..1.0
  return direction * MEETING_POINT_JITTER * magnitudeRatio;
}

interface ThreadScreenProps {
  contact: Contact;
  messages: Message[];
  onSend: (text: string) => void;
  onBack: () => void;
  isTyping: boolean;
  error: string | null;
  onRetry: () => void;
  showTimestamps: boolean;
}

export default function ThreadScreen({
  contact,
  messages,
  onSend,
  onBack,
  isTyping,
  error,
  onRetry,
  showTimestamps,
}: ThreadScreenProps) {
  const messagesRef = useRef<HTMLDivElement>(null);
  const bubbleRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [lineSegments, setLineSegments] = useState<LineSegment[]>([]);
  const [contentHeight, setContentHeight] = useState(0);

  useEffect(() => {
    const el = messagesRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, isTyping, error]);

  useLayoutEffect(() => {
    const container = messagesRef.current;
    if (!container) return;

    function measure() {
      const containerEl = container!;
      const containerRect = containerEl.getBoundingClientRect();
      const rightLaneX = containerEl.clientWidth - RIGHT_LANE_INSET;

      // One anchor per message, at its row's vertical *center* (not
      // top/bottom) — connecting center-to-center means each segment runs
      // the full height of both messages' own rows, not just the gap
      // between them, and consecutive segments share an exact endpoint at
      // every message's center. That's what makes it read as one
      // continuous line meeting behind each portrait/bubble instead of
      // disconnected pieces that only exist in the gaps.
      const points = messages.map((message, index) => {
        const el = bubbleRefs.current[index];
        if (!el) return null;
        const rect = el.getBoundingClientRect();
        const isMine = message.sender === 'me';
        const laneX = isMine ? rightLaneX : LEFT_LANE_INSET;
        return {
          x: laneX + meetingPointJitter(message.id, index),
          y: (rect.top + rect.bottom) / 2 - containerRect.top + containerEl.scrollTop,
        };
      });

      const segments: LineSegment[] = [];
      for (let i = 0; i < points.length - 1; i++) {
        const from = points[i];
        const to = points[i + 1];
        if (!from || !to) continue;
        const thick = messages[i].sender === messages[i + 1].sender;
        segments.push({
          id: `${messages[i].id}-${messages[i + 1].id}`,
          path: straightPath(from.x, from.y, to.x, to.y),
          thick,
          // Which way this particular segment leans, since the shadow
          // direction depends on it (see ConnectingLines).
          tiltsRight: to.x > from.x,
        });
      }

      setLineSegments(segments);
      setContentHeight(containerEl.scrollHeight);
    }

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(container);
    for (const el of bubbleRefs.current) {
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [messages]);

  return (
    <div className={styles.screen}>
      <FieldMotifs />
      <StatusBar onBack={onBack} />
      <FloatingLogo className={styles.floatingLogo} />
      {/* Parked for now — contact name + status next to the logo didn't
          land visually. Re-enable (and probably redesign NamePlate) later. */}
      {/* <div className={styles.nameBlock}>
        <NamePlate>
          <MixedText text={contact.name} className={styles.contactName} />
        </NamePlate>
        <span className={styles.status}>{contact.status}</span>
      </div> */}
      <div className={styles.messages} ref={messagesRef}>
        {messages.length === 0 && !isTyping && !error && (
          <div className={styles.emptyState}>
            <Avatar shape={contact.avatarShape} color={contact.color} size={72} />
            <span className={styles.emptyTitle}>No messages yet</span>
            <span className={styles.emptySubtitle}>Say hi to {contact.name} to get started</span>
          </div>
        )}
        <ConnectingLines segments={lineSegments} height={contentHeight} />
        {messages.map((message, index) => {
          const previous = messages[index - 1];
          const showDateSeparator = !previous || !isSameDay(previous.timestamp, message.timestamp);
          return (
            <div key={message.id}>
              {showDateSeparator && <DateSeparator {...formatDateParts(message.timestamp)} />}
              <div ref={(el) => (bubbleRefs.current[index] = el)}>
                <Bubble message={message} contact={contact} showTimestamp={showTimestamps} />
              </div>
            </div>
          );
        })}
        {isTyping && <TypingIndicator />}
        {error && (
          <div className={styles.error}>
            <span>Couldn't get a reply: {error}</span>
            <button type="button" onClick={onRetry}>
              Retry
            </button>
          </div>
        )}
      </div>
      <ChatInput onSend={onSend} />
    </div>
  );
}
