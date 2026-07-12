import styles from './ConnectingLines.module.css';

export interface LineSegment {
  id: string;
  path: string;
  thick: boolean;
  // Which way this segment leans — the shadow direction mirrors it: a
  // left-leaning segment casts its shadow to the bottom-right, a
  // right-leaning one to the bottom-left, rather than a single fixed
  // shadow direction regardless of the segment's own tilt.
  tiltsRight: boolean;
}

interface ConnectingLinesProps {
  segments: LineSegment[];
  height: number;
}

const SHADOW_OFFSET = 6;

export default function ConnectingLines({ segments, height }: ConnectingLinesProps) {
  if (segments.length === 0 || height === 0) return null;

  return (
    <svg className={styles.lines} style={{ height }} aria-hidden="true">
      {segments.map((segment) => {
        const shadowDx = segment.tiltsRight ? -SHADOW_OFFSET : SHADOW_OFFSET;
        const strokeWidth = segment.thick ? 34 : 14;
        return (
          <g key={segment.id}>
            <path
              className={styles.shadow}
              d={segment.path}
              fill="none"
              strokeWidth={strokeWidth}
              strokeLinejoin="miter"
              strokeLinecap="butt"
              transform={`translate(${shadowDx} ${SHADOW_OFFSET})`}
            />
            <path
              d={segment.path}
              fill="none"
              stroke="var(--ink)"
              // Thick: nudged down again (46 -> 34) — also lets the zigzag
              // meeting-point jitter actually read against it instead of
              // getting swallowed by an overly wide stroke. Thin
              // (side-switch) unchanged, still a clear contrast to the
              // thick lane.
              strokeWidth={strokeWidth}
              strokeLinejoin="miter"
              strokeLinecap="butt"
            />
          </g>
        );
      })}
    </svg>
  );
}
