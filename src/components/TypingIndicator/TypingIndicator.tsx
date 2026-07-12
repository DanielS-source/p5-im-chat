import styles from './TypingIndicator.module.css';

// Hand-drawn shard, exported at native size.
const VIEW_WIDTH = 66;
const VIEW_HEIGHT = 37;
const SHARD_PATH = 'M14.5 24L0 37L12.5 32L14.5 37L23.5 33L25 36.5L66 29L63 0L15.5 13.5L19.5 24L17 27L14.5 24Z';

export default function TypingIndicator() {
  return (
    <div className={styles.wrapper} role="status" aria-live="polite">
      <svg className={styles.shard} viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`} aria-hidden="true">
        {/* --main-dark (App.tsx derives it from whatever field color is
            currently selected), not a fixed hex — this way it tracks any
            theme instead of staying red under other themes. */}
        <path d={SHARD_PATH} fill="var(--main-dark)" />
      </svg>
      <span className={styles.dots} aria-hidden="true">
        <span className={styles.dot} />
        <span className={styles.dot} />
        <span className={styles.dot} />
      </span>
      <span className={styles.srOnly}>Typing…</span>
    </div>
  );
}
