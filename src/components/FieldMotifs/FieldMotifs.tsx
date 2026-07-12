import { useMemo } from 'react';
import styles from './FieldMotifs.module.css';

// Original abstract shard/slash silhouettes (0-14 viewBox) — not traced
// from any reference. Angular, not organic, to match this app's own
// visual language rather than the softer petal/snowflake shapes that
// inspired the falling-particle *technique* this component borrows.
const MOTIF_PATHS = [
  'M2 0L5 0L12 12L9 14L2 2Z', // diagonal slash
  'M7 0L11 3L14 8L10 14L3 12L0 6L4 1Z', // jagged splatter
  'M0 10L6 0L14 4L9 14Z', // small shard
];

const MOTIF_COUNT = 14;

interface Motif {
  id: number;
  left: number;
  duration: number;
  delay: number;
  scale: number;
  rotateDir: number;
  sway: number;
  pathIndex: number;
}

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function buildMotifs(count: number): Motif[] {
  return Array.from({ length: count }, (_, id) => ({
    id,
    left: randomBetween(0, 100),
    duration: randomBetween(14, 26),
    // Negative delay starts each particle already mid-fall instead of
    // every one bursting from the top in sync on mount.
    delay: -randomBetween(0, 26),
    scale: randomBetween(0.5, 1.1),
    rotateDir: Math.random() < 0.5 ? 1 : -1,
    sway: randomBetween(16, 44),
    pathIndex: Math.floor(Math.random() * MOTIF_PATHS.length),
  }));
}

export default function FieldMotifs() {
  const motifs = useMemo(() => buildMotifs(MOTIF_COUNT), []);

  return (
    <div className={styles.field} aria-hidden="true">
      {motifs.map((motif) => (
        <svg
          key={motif.id}
          className={styles.motif}
          viewBox="0 0 14 14"
          style={
            {
              left: `${motif.left}%`,
              animationDuration: `${motif.duration}s`,
              animationDelay: `${motif.delay}s`,
              '--scale': motif.scale,
              '--rotate-dir': motif.rotateDir,
              '--sway': `${motif.sway}px`,
            } as React.CSSProperties
          }
        >
          {/* --main-light (lighter shade of the current field color),
              not --ink — matches --main-dark/--main-light being the
              established lighter/darker companions of the "main" field
              color (see App.tsx's theme effect). */}
          <path d={MOTIF_PATHS[motif.pathIndex]} fill="var(--main-light)" fillOpacity="0.85" />
        </svg>
      ))}
    </div>
  );
}
