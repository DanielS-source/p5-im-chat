import { useId } from 'react';
import type { Contact } from '../../domain/types';
import { PORTRAITS } from '../../data/portraits';
import styles from './ContactPortrait.module.css';

interface ContactPortraitProps {
  contact: Contact;
  // Mirrors the frame (and its clip window) horizontally, for a bit of
  // rhythm when alternated down a list — the portrait drawn inside is
  // counter-mirrored right back to its normal orientation (see MIRROR
  // below), so only the frame itself flips, never the picture.
  flip?: boolean;
}

// Hand-drawn in Figma, exported at native size — the portrait frame used
// everywhere *except* the Thread screen's message bubbles (that's
// AvatarChip's job, a different asset). Two drawn layers (outer/middle);
// the third path in the source SVG is stroke-only and deliberately never
// rendered here — it's just the boundary the portrait gets clipped to,
// not art in its own right. The contact's accent color is filled in as a
// backing layer instead (see ACCENT_PATH below), matching AvatarChip's
// INNER_PATH treatment.
const VIEW_WIDTH = 101;
const VIEW_HEIGHT = 103;
const OUTER_PATH = 'M92.0787 0.563309L0.578735 12.5633L15.5787 102.063L100.079 87.0633L92.0787 0.563309Z';
const MIDDLE_PATH = 'M91.0787 84.0633L19.5787 93.0633L8.07874 15.5633L87.5787 8.06331L91.0787 84.0633Z';

// The real, undilated innermost square — just the four drawn vertices, no
// breakout. Used for the accent-color backing so the color stays confined
// to the frame's actual boundary instead of bleeding into the breakout
// allowance below (which exists purely so the *portrait image* can escape
// the frame's tight top-right corner, not so the color fill can).
const ACCENT_PATH = 'M26.5787 87.5633L15.0787 20.5633L79.0787 13.5633L83.0787 76.5633Z';

// Breakout allowance, same idea as AvatarChip's PLACEHOLDER_CLIP_PATH: the
// left and bottom edges stay hard-clipped exactly on the drawn boundary,
// but the top and right edges get extended way past the viewBox instead
// of following the real (tighter) frame edge there — portraits generally
// have the subject's head right at the top of the source crop, so without
// this the frame's own top edge was cutting into it.
const RIGHT_OVERFLOW = 35;
const INNER_CLIP_PATH = [
  'M26.5787 87.5633', // bottom-left — real vertex, anchors the preserved bottom edge
  'L15.0787 20.5633', // true left edge, exactly as drawn — nothing simplified here
  `L15.0787 ${20.5633 - VIEW_HEIGHT}`, // only above the real top-left vertex does it go vertical (breakout)
  `L${79.0787 + RIGHT_OVERFLOW} ${13.5633 - VIEW_HEIGHT}`, // top-right — extended up and right
  `L${83.0787 + RIGHT_OVERFLOW} 76.5633`, // right overflow, at the real bottom-right's height
  'L83.0787 76.5633', // back to the real bottom-right corner — preserves the bottom edge exactly
  'Z',
].join('');

// Mirrors in place within the viewBox (x' = VIEW_WIDTH - x). Applying this
// twice (nested) is the identity transform, which is how the inner
// portrait/avatar group cancels the outer frame group's flip.
const MIRROR = `translate(${VIEW_WIDTH}, 0) scale(-1, 1)`;

export default function ContactPortrait({ contact, flip }: ContactPortraitProps) {
  const clipId = useId();
  const portraitSrc = PORTRAITS[contact.id];

  const content = <image href={portraitSrc} x={7} y={14} width={84} height={84} aria-hidden="true" />;

  return (
    <svg
      className={styles.portrait}
      viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
      role="img"
      aria-label={`${contact.name} portrait`}
    >
      <defs>
        <clipPath id={clipId}>
          <path d={INNER_CLIP_PATH} />
        </clipPath>
      </defs>
      <g transform={flip ? MIRROR : undefined}>
        <path d={OUTER_PATH} fill="var(--ink)" />
        <path d={MIDDLE_PATH} fill="var(--paper)" />
        <g clipPath={`url(#${clipId})`}>
          {/* Accent-color backing, same trick as AvatarChip's INNER_PATH —
              sits behind the portrait so any transparent background in the
              art (the whole point of the earlier bg-removal pass) shows the
              contact's own color instead of flat paper. */}
          <path d={ACCENT_PATH} fill={contact.color} />
          {flip ? <g transform={MIRROR}>{content}</g> : content}
        </g>
      </g>
    </svg>
  );
}
