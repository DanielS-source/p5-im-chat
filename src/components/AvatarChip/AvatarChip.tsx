import { useId } from 'react';
import type { Contact } from '../../domain/types';
import Avatar from '../Avatar/Avatar';
import styles from './AvatarChip.module.css';

interface AvatarChipProps {
  contact: Contact;
}

// Hand-drawn in Figma, exported at native size, all three layers merged
// into one shared coordinate space (outer outline, middle rim, inner —
// the inner one doubles as each contact's accent-color background).
const VIEW_WIDTH = 75;
const VIEW_HEIGHT = 51;
const OUTER_PATH = 'M22.8132 49.5905L0.813202 0.590462L65.8132 7.59046L73.8132 38.0905L22.8132 49.5905Z';
const MIDDLE_PATH = 'M26.3132 43.0905L11.8132 3.59046L64.8132 9.59046L71.8132 36.0905L26.3132 43.0905Z';
const INNER_PATH = 'M27.3132 40.5905L15.8132 8.09046L63.3132 11.0905L69.8132 34.5905L27.3132 40.5905Z';

// PLACEHOLDER — temp AI-generated art (background removed, name text
// cropped), not final. Delete PORTRAITS entries as real hand-drawn/final
// art replaces them; once every contact has real art, this whole
// fallback-to-<Avatar> path can go and the component simplifies back to
// three flat <path> fills plus one <image>.
//
// Hard clip on the left and bottom, following INNER_PATH's actual
// (diagonal, in both cases) edges exactly — art crossing either line gets
// hidden, same treatment on both sides. Allowed to overflow past the top
// and right instead.
//
// Left edge specifically: bottom-left vertex is at x=27.3132, top-left at
// x=15.8132 — a real diagonal, not a vertical line. Connecting the
// bottom-left point directly to the *extended* top-left point in one
// straight line (an earlier version of this) cuts across that diagonal at
// a shallower angle than the true edge, which is more restrictive than
// the frame's actual boundary through the framed region. Using the real
// bottom-left-to-top-left segment first, then continuing straight up only
// above the true top-left vertex, keeps the hard clip exactly on the
// drawn edge and confines the "vertical extension" purely to the
// breakout allowance above it.
const RIGHT_OVERFLOW = 35;
const PLACEHOLDER_CLIP_PATH = [
  'M27.3132 40.5905', // bottom-left — INNER_PATH's actual vertex, anchors the (preserved) bottom edge
  'L15.8132 8.09046', // true left diagonal, exactly as drawn — nothing simplified here
  `L15.8132 ${8.09046 - VIEW_HEIGHT}`, // only above the real top-left vertex does it go vertical (breakout)
  `L${63.3132 + RIGHT_OVERFLOW} ${11.0905 - VIEW_HEIGHT}`, // top-right — extended up and right
  `L${69.8132 + RIGHT_OVERFLOW} 34.5905`, // right overflow, at the original bottom-right's height
  'L69.8132 34.5905', // back to the original bottom-right corner — preserves the bottom edge exactly
  'Z',
].join('');

const PORTRAITS: Partial<Record<string, string>> = {
  raven: '/portraits/raven.png',
};

export default function AvatarChip({ contact }: AvatarChipProps) {
  const clipId = useId();
  const portraitSrc = PORTRAITS[contact.id];

  return (
    <svg
      className={styles.chip}
      viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
      role="img"
      aria-label={`${contact.name} avatar`}
    >
      <defs>
        <clipPath id={clipId}>
          <path d={PLACEHOLDER_CLIP_PATH} />
        </clipPath>
      </defs>
      <path d={OUTER_PATH} fill="var(--ink)" />
      <path d={MIDDLE_PATH} fill="var(--paper)" />
      <path d={INNER_PATH} fill={contact.color} />
      <g clipPath={`url(#${clipId})`}>
        {portraitSrc ? (
          // Pulled down so its bottom edge (y=45) sits past the inner
          // path's deepest bottom point (y=40.6 at its bottom-left vertex)
          // — the diagonal bottom edge cuts through actual image content
          // everywhere along it, reading as the art having been trimmed by
          // the frame rather than just floating above empty background.
          <image href={portraitSrc} x={9} y={-9} width={54} height={54} aria-hidden="true" />
        ) : (
          <g transform="translate(9 -22)" aria-hidden="true">
            <Avatar shape={contact.avatarShape} color="var(--paper)" size={56} />
          </g>
        )}
      </g>
    </svg>
  );
}
