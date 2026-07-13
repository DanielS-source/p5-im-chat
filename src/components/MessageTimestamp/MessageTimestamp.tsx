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
        width="101"
        height="45"
        viewBox="0 0 101 45"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M26 27.5L0 45L47.5 43.5L46.5 33.5L99 29.5L101 0L23 8.5L26 27.5Z" fill={outerColor} />
        <path d="M30 29.5L9.5 41.5L43 39.5L42 29.5L95.5 26L92.5 4L29 11L30 29.5Z" fill={innerColor} />
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
