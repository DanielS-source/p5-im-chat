import type { Contact, Message } from '../../domain/types';
import { pathToClipPolygon } from '../../utils/clipPath';
import AvatarChip from '../AvatarChip/AvatarChip';
import MessageBadges from '../MessageBadges/MessageBadges';
import MessageTimestamp from '../MessageTimestamp/MessageTimestamp';
import styles from './Bubble.module.css';

interface BubbleProps {
  message: Message;
  contact: Contact;
  showTimestamp?: boolean;
}

// Hand-drawn in Figma, exported at native size. The body carries no tail —
// the tail is a separate, fixed-pixel-size shape (see TAIL_* below) so it
// never scales with the bubble's own size. The "me" variant mirrors both
// groups (see .bubble--me .shape/.tail in the CSS module), so one pair of
// shapes drives both sides until that stops looking right and outgoing
// messages need their own.
const BODY_VIEW_WIDTH = 251;
const BODY_VIEW_HEIGHT = 70;
const BODY_OUTLINE_PATH = 'M251 0L13.5 2.5L0 64L231 66L251 0Z';
const BODY_FILL_PATH = 'M228.5 62L4 59.5L15 6.5L239.5 3L228.5 62Z';

// Small decorative shape, rendered at a fixed pixel size (see .tail in the
// CSS module) instead of being stretched to fill the bubble box like the
// body — this is what keeps it a constant size regardless of message length.
// Extends further to the right (from the sender's/"them" perspective) than
// it is tall, by design — that extra reach is what tucks under the body's
// fill layer for a smooth transition instead of a visible cutoff. See
// .tail's `width`/`left` in the CSS module for how far it reaches vs. how
// far it pokes out.
const TAIL_VIEW_BOX = '0 0 44 30';
const TAIL_OUTLINE_PATH = 'M9 24.5L10 30L43 23L42 0L18.5 13.5L16 9L0 24.5H9Z';
const TAIL_FILL_PATH = 'M16.5 18L22 15L42.5 3.5L44 20.5L20 24L11.5 25.5V20L4.5 22L14 13L16.5 18Z';

const BODY_OUTLINE_CLIP = pathToClipPolygon(BODY_OUTLINE_PATH, BODY_VIEW_WIDTH, BODY_VIEW_HEIGHT);
const BODY_FILL_CLIP = pathToClipPolygon(BODY_FILL_PATH, BODY_VIEW_WIDTH, BODY_VIEW_HEIGHT);
const TEXT_CLIP_PATH = BODY_FILL_CLIP;
const TEXT_CLIP_PATH_MIRRORED = pathToClipPolygon(BODY_FILL_PATH, BODY_VIEW_WIDTH, BODY_VIEW_HEIGHT, true);

export default function Bubble({ message, contact, showTimestamp = true }: BubbleProps) {
  const isMine = message.sender === 'me';

  return (
    <div
      className={`${styles.row} ${isMine ? styles['row--me'] : styles['row--them']} ${
        showTimestamp ? styles['row--withTimestamp'] : ''
      }`}
    >
      {showTimestamp && (
        <div className={styles.timestamp}>
          <MessageTimestamp timestamp={message.timestamp} isMine={isMine} />
        </div>
      )}
      {!isMine && <AvatarChip contact={contact} />}
      <div className={`${styles.bubble} ${isMine ? styles['bubble--me'] : styles['bubble--them']}`}>
        {/* Paint order back to front: tail outline, body outline, tail
            fill, body fill. Each layer is its own element (rather than
            tail-outline+tail-fill sharing one <svg>, or body-outline+
            body-fill sharing one wrapper) so the two shapes can interleave
            in this specific order. .tail/.shape are reused as classes
            across multiple elements here — each gets the same fixed
            size/position or mirror transform independently. */}
        <svg className={styles.tail} viewBox={TAIL_VIEW_BOX} aria-hidden="true">
          <path className={styles.outline} d={TAIL_OUTLINE_PATH} />
        </svg>
        <div className={styles.shape}>
          <div className={styles.outline} style={{ clipPath: BODY_OUTLINE_CLIP }} />
        </div>
        <svg className={styles.tail} viewBox={TAIL_VIEW_BOX} aria-hidden="true">
          <path className={styles.fill} d={TAIL_FILL_PATH} />
        </svg>
        <div className={styles.shape}>
          <div className={styles.fill} style={{ clipPath: BODY_FILL_CLIP }} />
        </div>
        <span
          className={styles.text}
          style={{ clipPath: isMine ? TEXT_CLIP_PATH_MIRRORED : TEXT_CLIP_PATH }}
        >
          {message.text}
        </span>
        <MessageBadges text={message.text} />
      </div>
    </div>
  );
}
