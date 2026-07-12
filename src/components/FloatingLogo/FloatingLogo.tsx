import styles from './FloatingLogo.module.css';

// Hand-drawn, exported at native size. Colors mapped to this app's
// tokens: black -> --ink, red -> --blood ("main" — the currently
// selected field color, not a fixed red), white -> --paper.
const VIEW_WIDTH = 78;
const VIEW_HEIGHT = 68;
const OUTER_PATH = 'M35 59.5L14.5 67.5L0 11.5L25 2L25.5 9.5L34 5.5L48.5 0L67 2L78 49L39 63L35 59.5Z';
const ACCENT_PATH = 'M30 55.5L20 57.5L7.5 19.5L21 13.5L30 55.5Z';
const LETTERING_PATH =
  'M46.5 51L38.5 53.5L25.5 16L37.5 11V14.5L47 27L48.5 9.5H62L68 46L59.5 48L51.5 18L50 39.5L38 23L46.5 51Z';

interface FloatingLogoProps {
  className?: string;
}

export default function FloatingLogo({ className }: FloatingLogoProps) {
  return (
    <svg
      className={`${styles.logo} ${className ?? ''}`}
      viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
      role="img"
      aria-label="IM"
    >
      <path d={OUTER_PATH} fill="var(--ink)" />
      <path d={ACCENT_PATH} fill="var(--blood)" />
      <path d={LETTERING_PATH} fill="var(--paper)" />
    </svg>
  );
}
