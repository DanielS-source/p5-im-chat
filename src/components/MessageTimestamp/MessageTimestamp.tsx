import styles from './MessageTimestamp.module.css';

interface MessageTimestampProps {
  timestamp: number;
  isMine?: boolean;
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export default function MessageTimestamp({ timestamp, isMine }: MessageTimestampProps) {
  // "Them" = white badge, black outline (outer black/bigger, inner white/
  // smaller). "Me" = flipped colors (black badge, white outline) *and*
  // mirrored horizontally, to match the tail/bubble direction on that
  // side — only the svg mirrors, not .time, so the digits stay upright.
  const outerColor = isMine ? 'white' : 'black';
  const innerColor = isMine ? 'black' : 'white';

  return (
    <div className={styles.wrap}>
      <svg
        className={isMine ? styles.svgMirrored : undefined}
        width="99"
        height="45"
        viewBox="0 0 99 45"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M26 27L0 44.5L47.5 43L46.5 33L99 29L97 0L23 8L26 27Z" fill={outerColor} />
        <path d="M30 29L9.5 41L43 39L42 29L95.5 25.5L89.5 4L29 10.5L30 29Z" fill={innerColor} />
      </svg>
      <span
        className={`${styles.time} ${isMine ? styles.timeMine : styles.timeThem}`}
        style={{ color: innerColor === 'white' ? 'black' : 'white' }}
      >
        {formatTime(timestamp)}
      </span>
    </div>
  );
}
