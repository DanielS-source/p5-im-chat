import type { ReactNode } from 'react';
import { pathToClipPolygon } from '../../utils/clipPath';
import styles from './NamePlate.module.css';

// Hand-drawn in Figma, exported at native size — same shard+panel idea as
// the message bubbles (see Bubble.tsx), applied to the floating contact
// name instead. OUTER is the bigger, offset black shard; INNER is the
// lighter panel sitting on top (its placeholder #D9D9D9 fill is dropped in
// favor of --paper, same remap as FloatingLogo's asset).
const VIEW_WIDTH = 306;
const VIEW_HEIGHT = 79;
const OUTER_PATH = 'M9.05957 0.50473L0.55957 78.0047L305.06 69.5047L295.06 3.50473L9.05957 0.50473Z';
const INNER_PATH = 'M8.55957 71.0047L14.0596 8.00473L284.56 14.0047L298.06 60.5047L8.55957 71.0047Z';

const OUTER_CLIP = pathToClipPolygon(OUTER_PATH, VIEW_WIDTH, VIEW_HEIGHT);
const INNER_CLIP = pathToClipPolygon(INNER_PATH, VIEW_WIDTH, VIEW_HEIGHT);

interface NamePlateProps {
  children: ReactNode;
  className?: string;
}

export default function NamePlate({ children, className }: NamePlateProps) {
  return (
    <div className={`${styles.plate} ${className ?? ''}`}>
      <div className={styles.shard} style={{ clipPath: OUTER_CLIP }} />
      <div className={styles.panel} style={{ clipPath: INNER_CLIP }} />
      <div className={styles.content} style={{ clipPath: INNER_CLIP }}>
        {children}
      </div>
    </div>
  );
}
