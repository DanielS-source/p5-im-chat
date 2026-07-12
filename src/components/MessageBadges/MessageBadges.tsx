import styles from './MessageBadges.module.css';

// Hand-drawn, exported at native size — outer silhouette + two interior
// detail shapes per glyph, same layered construction as everything else
// in this app.
const EXCLAMATION_OUTER = 'M4.5 13.5L0 26L9 29L16 17L24.5 4L10.5 0L4.5 13.5Z';
const EXCLAMATION_DETAILS = [
  'M2.5 24L5 19.5L10.5 22L8 26.5L2.5 24Z',
  'M6 18L10 20L19.5 6L12 3.5L8 11.5L6 18Z',
];

const QUESTION_OUTER = 'M0.5 68L25.5 74.5L35.5 52.5L49.5 43.5L54.5 16L35 0L8.5 4L0 26L13.5 32L4.5 46L0.5 68Z';
const QUESTION_DETAILS = [
  'M26 55L22.5 67L9 63.5L13.5 51L26 55Z',
  'M15.5 45.5L27 49C27.4 43.8 31.8333 41.8333 34 41.5C50.5 34 48 20.5 43.5 15C24.5 1.90735e-06 13.3333 12.5 9.5 20.5L21 26C21 24 21 19.5 27 19.5C37 19.5 32.5 29.5 32.5 29.5C32.5 30 22 33 18 36.5C16 38.25 15.3333 43.8333 15.5 45.5Z',
];

interface Glyph {
  viewBoxWidth: number;
  viewBoxHeight: number;
  outer: string;
  details: string[];
  targetHeight: number;
}

const GLYPHS: Record<'!' | '?', Glyph> = {
  '!': {
    viewBoxWidth: 25,
    viewBoxHeight: 29,
    outer: EXCLAMATION_OUTER,
    details: EXCLAMATION_DETAILS,
    targetHeight: 30, // slightly bigger than before (was ~24)
  },
  '?': {
    viewBoxWidth: 55,
    viewBoxHeight: 75,
    outer: QUESTION_OUTER,
    details: QUESTION_DETAILS,
    targetHeight: 30,
  },
};

// Caps how many badges stack at once — "Hello ?!?!" gets 3, not 4.
const MAX_BADGES = 3;
// Gap between bunched badges — negative, so their bounding boxes overlap
// rather than just touch. Three tiers rather than one: "!" fills
// noticeably less of its own bounding box than "?" does, so a "!"-"!"
// pair needs pulling in further than a "?"-"?" pair to look evenly
// spaced, and a mixed "?"-"!"/"!"-"?" pair sits between the two.
const GAP = -6;
const EXCLAMATION_GAP = -12;
const MIXED_GAP = -9;

function gapBetween(a: '!' | '?', b: '!' | '?'): number {
  if (a === b) return a === '!' ? EXCLAMATION_GAP : GAP;
  return MIXED_GAP;
}

// Trailing run of ?/! characters, up to MAX_BADGES of them, in their
// original order — "Hello ?!?!" -> "?!?!" -> last 3 -> "!?!". Strips a
// trailing run of emoji (+ whitespace) first so "nice!😊" still reads as
// ending in "!" instead of finding no punctuation at all.
// Built from a string (not a literal /.../ character class) so the
// zero-width-joiner and variation-selector escapes stay as visible,
// unambiguous text in source rather than invisible literal characters.
const TRAILING_EMOJI_RUN = new RegExp('[\\p{Extended_Pictographic}\\u200D\\uFE0F\\s]+$', 'gu');

// Checks every line, not just the message's very last character — a wall
// of text where an early line ends "yay!!" but the message trails off
// with more lines after it should still badge. Scans from the last line
// backward so the most recent emphatic line wins if more than one line
// qualifies, rather than blending multiple lines together into one badge
// stack.
function extractPunctuationRun(text: string): string {
  const lines = text.split('\n');
  for (let i = lines.length - 1; i >= 0; i--) {
    const withoutTrailingEmoji = lines[i].replace(TRAILING_EMOJI_RUN, '');
    const match = withoutTrailingEmoji.match(/[?!]+$/);
    if (match) return match[0].slice(-MAX_BADGES);
  }
  return '';
}

interface PlacedGlyph {
  glyph: Glyph;
  x: number;
  y: number;
  scale: number;
}

function layoutBadges(run: string): { placed: PlacedGlyph[]; totalWidth: number; maxHeight: number } {
  const chars = [...run] as Array<'!' | '?'>;
  const glyphs = chars.map((char) => GLYPHS[char]);
  const maxHeight = Math.max(...glyphs.map((g) => g.targetHeight));
  let x = 0;
  const placed: PlacedGlyph[] = [];
  glyphs.forEach((glyph, i) => {
    const scale = glyph.targetHeight / glyph.viewBoxHeight;
    const width = glyph.viewBoxWidth * scale;
    const y = maxHeight - glyph.targetHeight; // bottom-align shorter glyphs
    placed.push({ glyph, x, y, scale });
    const isLast = i === glyphs.length - 1;
    if (!isLast) {
      x += width + gapBetween(chars[i], chars[i + 1]);
    } else {
      x += width;
    }
  });
  return { placed, totalWidth: x, maxHeight };
}

interface MessageBadgesProps {
  text: string;
}

export default function MessageBadges({ text }: MessageBadgesProps) {
  const run = extractPunctuationRun(text);
  if (!run) return null;

  const { placed, totalWidth, maxHeight } = layoutBadges(run);

  return (
    <svg
      className={styles.badges}
      viewBox={`0 0 ${totalWidth} ${maxHeight}`}
      style={{ width: totalWidth, height: maxHeight }}
      aria-hidden="true"
    >
      {/* Two full passes over every badge — all outers, then all inner
          details — instead of interleaving per badge (outer, details,
          outer, details...). Bunched close enough to overlap,
          interleaving would let a later badge's opaque white outer shape
          paint over an earlier badge's black inner details wherever their
          boxes intersect; painting every outer first guarantees no inner
          detail can ever be covered by any outer shape. */}
      {placed.map((p, i) => (
        <g key={`outer-${i}`} transform={`translate(${p.x} ${p.y}) scale(${p.scale})`}>
          <path d={p.glyph.outer} fill="var(--paper)" />
        </g>
      ))}
      {placed.map((p, i) => (
        <g key={`inner-${i}`} transform={`translate(${p.x} ${p.y}) scale(${p.scale})`}>
          {p.glyph.details.map((d) => (
            <path key={d} d={d} fill="var(--ink)" />
          ))}
        </g>
      ))}
    </svg>
  );
}
