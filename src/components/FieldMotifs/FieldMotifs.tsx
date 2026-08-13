import { useMemo } from 'react';
import { MOTIF_ASSETS, motifMaskSrc } from '../../data/motifAssets';
import styles from './FieldMotifs.module.css';

const MOTIF_COUNT = 14;

interface Motif {
  id: number;
  left: number;
  duration: number;
  delay: number;
  scale: number;
  rotateDir: number;
  sway: number;
  assetIndex: number;
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
    assetIndex: Math.floor(Math.random() * MOTIF_ASSETS.length),
  }));
}

export default function FieldMotifs() {
  const motifs = useMemo(() => buildMotifs(MOTIF_COUNT), []);

  return (
    <div className={styles.field} aria-hidden="true">
      {motifs.map((motif) => {
        const asset = MOTIF_ASSETS[motif.assetIndex];
        return (
          <div
            key={motif.id}
            className={styles.motif}
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
            <img className={styles.img} src={asset.src} alt="" />
            {asset.recolor !== 'none' && (
              <div
                className={styles.recolorOverlay}
                style={{
                  maskImage: `url("${encodeURI(motifMaskSrc(asset.src, asset.recolor))}")`,
                  WebkitMaskImage: `url("${encodeURI(motifMaskSrc(asset.src, asset.recolor))}")`,
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
