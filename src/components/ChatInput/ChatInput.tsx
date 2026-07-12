import { useState } from 'react';
import type { FormEvent } from 'react';
import styles from './ChatInput.module.css';

interface ChatInputProps {
  onSend: (text: string) => void;
}

// Hand-drawn in Figma, exported at native size — white/black layers remap
// to --paper/--ink (same convention as FloatingLogo's asset), paint order
// preserved exactly as exported: paper base, ink shard, paper icon body,
// ink details, paper accent, two more ink details. (No outline stroke pass
// this time — an earlier export included one by mistake.)
const SEND_VIEW_WIDTH = 59;
const SEND_VIEW_HEIGHT = 37;
const SEND_BASE_PATH =
  'M31 30.5L26 35.5L24 33.5H21.5L19.5 36.5L8 34.5L0.5 26L2 22L2.5 18.5L0 13V10L5 3.5L17 1.5L21 6.5L23.5 7L25.5 3.5L39 2.5L41 5.5L44 6L46.5 0L58.5 0.5L56 32.5L45 34L39.5 30.5H31Z';
const SEND_SHARD_PATH =
  'M9.5 32.5L3.5 26L5 22L4.5 17L3 11.5L3.5 9L7 5L16 3.5L20.5 10H25L26.5 6H38L40 9H43L46.5 7L47.5 2.5H55L53 31.5H45L40 27.5H30.5L26.5 31L23 31.5L21.5 30H19.5L17.5 33.5L15 32.5H9.5Z';
const SEND_ICON_PATH =
  'M18 9.49999L15.5 13C11.1001 8.59999 10 12.5 11.5 14.5C13.5 15.5 17 17.3333 18.5 19L19 17.5C22.2 9.9 26 13.6667 27.5 16.5V8.5H30L31 9.5H32C35.2 6.3 38 10.1667 39 12.5V24.5H35V13.5C33 11.5 31.5 12.6667 31 13.5V24.5H29C24 30.5 20.3333 26.8333 19 25C19 25.6667 18.2 27.5 15 29.5C11.8 31.5 8 27.6667 6.5 25.5L9.5 22.5C10 24 15 26 15.5 24C16.3576 20.57 14.5 20.5 10.5 19C7.3 17.8 6.16669 15.5 6.00003 14.5C5.5 1.5 17 7.00002 18 9.49999Z';
const SEND_DETAIL_1_PATH = 'M25.5 19C24.8333 17.1667 23.1 14.6 21.5 19H25.5Z';
const SEND_ACCENT_PATH = 'M50.4999 26L52 4.5H48.9999L48.4999 11C32.4999 9 39 32 50.4999 26Z';
const SEND_DETAIL_2_PATH = 'M48 15.5L47.5 22C41.5002 24 41.0001 15 47 14.5L48 15.5Z';
const SEND_DETAIL_3_PATH =
  'M21.5 22.5L26.5 21.5C26.5 21.3333 27 21.5 26.5 22.5C26 23.5 26 24 24 24.5C22.4661 24.8835 22.1667 23.8333 21.5 22.5Z';

export default function ChatInput({ onSend }: ChatInputProps) {
  const [value, setValue] = useState('');

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const text = value.trim();
    if (!text) return;
    onSend(text);
    setValue('');
  }

  return (
    <form className={styles.bar} onSubmit={handleSubmit}>
      <div className={styles.inputFrame}>
        <div className={styles.shard} />
        <div className={styles.panel}>
          <input
            className={styles.input}
            type="text"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="Type a message..."
            aria-label="Message"
          />
        </div>
      </div>
      <button className={styles.send} type="submit" disabled={!value.trim()} aria-label="Send">
        <svg
          className={styles.sendIcon}
          viewBox={`0 0 ${SEND_VIEW_WIDTH} ${SEND_VIEW_HEIGHT}`}
          aria-hidden="true"
        >
          <path d={SEND_BASE_PATH} fill="var(--paper)" />
          <path d={SEND_SHARD_PATH} fill="var(--ink)" />
          <path d={SEND_ICON_PATH} fill="var(--paper)" />
          <path d={SEND_DETAIL_1_PATH} fill="var(--ink)" />
          <path d={SEND_ACCENT_PATH} fill="var(--paper)" />
          <path d={SEND_DETAIL_2_PATH} fill="var(--ink)" />
          <path d={SEND_DETAIL_3_PATH} fill="var(--ink)" />
        </svg>
      </button>
    </form>
  );
}
