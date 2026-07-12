import styles from './MixedText.module.css';

// The "ransom note" pool — a different font per letter rather than one
// display face, same idea as classic cut-and-pasted ransom notes/zine
// title cards. Deliberately excludes Anton/Rubik Beastly (didn't make
// the cut when picking from the candidates).
const FONTS = [
  'Bangers',
  'Bungee',
  'Bungee Inline',
  'Bungee Shade',
  'Rubik Distressed',
  'Rubik Wet Paint',
];

// Deterministic per-character PRNG, seeded by the full text + position +
// character — same name always renders identically across re-renders/
// reloads instead of reshuffling, matching every other "hand-placed, not
// measured" jitter in this app.
function hashSeed(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (Math.imul(hash, 31) + input.charCodeAt(i)) | 0;
  }
  return (hash >>> 0) || 1;
}

function seededRandom(seed: number) {
  let state = seed;
  return () => {
    state = (Math.imul(state, 1103515245) + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

interface MixedTextProps {
  text: string;
  className?: string;
}

export default function MixedText({ text, className }: MixedTextProps) {
  return (
    <span className={`${styles.mixed} ${className ?? ''}`}>
      {[...text].map((char, index) => {
        if (char === ' ') {
          return <span key={index}>&nbsp;</span>;
        }
        const rand = seededRandom(hashSeed(`${text}:${index}:${char}`));
        const font = FONTS[Math.floor(rand() * FONTS.length)];
        const rotate = (rand() - 0.5) * 16; // -8..8deg
        const scale = 0.88 + rand() * 0.3; // 0.88..1.18
        const shiftY = (rand() - 0.5) * 3; // -1.5..1.5px, uneven baseline
        return (
          <span
            key={index}
            className={styles.letter}
            style={{
              fontFamily: `"${font}"`,
              transform: `translateY(${shiftY}px) rotate(${rotate}deg) scale(${scale})`,
            }}
          >
            {char}
          </span>
        );
      })}
    </span>
  );
}
