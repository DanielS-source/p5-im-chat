import { useEffect, useState } from 'react';
import styles from './StatusBar.module.css';

interface StatusBarProps {
  onBack?: () => void;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function StatusBar({ onBack }: StatusBarProps) {
  const [time, setTime] = useState(() => formatTime(new Date()));

  useEffect(() => {
    // Minute precision is all a status bar clock needs — no reason to
    // re-render every second for a value that only changes once a minute.
    const interval = setInterval(() => setTime(formatTime(new Date())), 15_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={styles.statusBar}>
      <div className={styles.backdrop} aria-hidden="true" />
      {onBack && (
        <button className={styles.back} type="button" onClick={onBack} aria-label="Back">
          &lt;
        </button>
      )}
      <span className={styles.time}>{time}</span>
    </div>
  );
}
