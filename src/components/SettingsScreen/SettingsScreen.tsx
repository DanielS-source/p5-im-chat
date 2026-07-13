import FieldMotifs from '../FieldMotifs/FieldMotifs';
import FloatingLogo from '../FloatingLogo/FloatingLogo';
import StatusBar from '../StatusBar/StatusBar';
import styles from './SettingsScreen.module.css';

interface SettingsScreenProps {
  accentColor: string;
  noir: boolean;
  onAccentChange: (color: string) => void;
  onNoirChange: (noir: boolean) => void;
  showTimestamps: boolean;
  onShowTimestampsChange: (show: boolean) => void;
  onBack: () => void;
}

interface Preset {
  name: string;
  color: string;
  rotate: number;
}

// Fixed, not seeded — only four of these ever exist, so hand-picked jitter
// reads fine and skips a hash function for something this small.
const PRESETS: Preset[] = [
  { name: 'Red', color: '#C21000', rotate: -4 },
  { name: 'Blue', color: '#101899', rotate: 3 },
  { name: 'Green', color: '#0C7C4A', rotate: -3 },
  { name: 'Purple', color: '#5A0FA8', rotate: 5 },
];

const PANEL_CLIP = 'polygon(0% 8%, 100% 0%, 98% 92%, 2% 100%)';

export default function SettingsScreen({
  accentColor,
  noir,
  onAccentChange,
  onNoirChange,
  showTimestamps,
  onShowTimestampsChange,
  onBack,
}: SettingsScreenProps) {
  return (
    <div className={styles.screen}>
      <FieldMotifs />
      <StatusBar onBack={onBack} />
      <div className={styles.header}>
        <FloatingLogo className={styles.logo} />
        <div className={styles.titleBlock}>
          <span className={styles.title}>Setup</span>
          <span className={styles.tagline}>Make it yours</span>
        </div>
      </div>

      <div className={styles.body}>
        <div className={styles.section}>
          <span className={styles.sectionLabel}>Theme color</span>
          <div className={styles.card}>
            <span className={styles.cardShard} style={{ clipPath: PANEL_CLIP }} />
            <span className={styles.cardPanel} style={{ clipPath: PANEL_CLIP }}>
              {PRESETS.map((preset) => {
                const isActive = !noir && accentColor.toLowerCase() === preset.color.toLowerCase();
                return (
                  <button
                    key={preset.color}
                    type="button"
                    className={styles.swatchButton}
                    aria-label={preset.name}
                    aria-pressed={isActive}
                    onClick={() => {
                      onNoirChange(false);
                      onAccentChange(preset.color);
                    }}
                  >
                    <span
                      className={styles.swatch}
                      style={{ backgroundColor: preset.color, transform: `rotate(${preset.rotate}deg)` }}
                    />
                    {isActive && (
                      <span className={styles.swatchCheck} aria-hidden="true">
                        &#10003;
                      </span>
                    )}
                  </button>
                );
              })}
            </span>
          </div>
        </div>

        <div className={styles.section}>
          <span className={styles.sectionLabel}>Display</span>
          <div className={styles.card}>
            <span className={styles.cardShard} style={{ clipPath: PANEL_CLIP }} />
            <span className={`${styles.cardPanel} ${styles.cardPanelDark}`} style={{ clipPath: PANEL_CLIP }}>
              <span className={styles.toggleRow}>
                <span className={styles.toggleText}>
                  <span className={styles.toggleTitle}>Noir mode</span>
                  <span className={styles.toggleSubtitle}>strip the color, keep the drama</span>
                </span>
                <button
                  type="button"
                  className={styles.toggleTrack}
                  aria-pressed={noir}
                  aria-label="Toggle noir mode"
                  onClick={() => onNoirChange(!noir)}
                >
                  <span className={`${styles.toggleKnob} ${noir ? styles.toggleKnobActive : ''}`} />
                </button>
              </span>
              {/* TEMP: deciding whether the timestamp badges are worth
                  keeping — see MessageTimestamp/Bubble. Remove once decided. */}
              <span className={styles.toggleRow}>
                <span className={styles.toggleText}>
                  <span className={styles.toggleTitle}>Message times</span>
                  <span className={styles.toggleSubtitle}>show the HH:mm badge on each bubble</span>
                </span>
                <button
                  type="button"
                  className={styles.toggleTrack}
                  aria-pressed={showTimestamps}
                  aria-label="Toggle message timestamps"
                  onClick={() => onShowTimestampsChange(!showTimestamps)}
                >
                  <span className={`${styles.toggleKnob} ${showTimestamps ? styles.toggleKnobActive : ''}`} />
                </button>
              </span>
            </span>
          </div>
        </div>
      </div>

      <div className={styles.vignette} aria-hidden="true" />
    </div>
  );
}
