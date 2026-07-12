import type { AvatarShape } from '../../domain/types';

interface AvatarProps {
  shape: AvatarShape;
  color: string;
  size?: number;
}

const SHAPE_PATHS: Record<AvatarShape, string> = {
  star: 'M50 4 L61 36 L96 36 L67 57 L78 92 L50 70 L22 92 L33 57 L4 36 L39 36 Z',
  diamond: 'M50 2 L88 38 L62 98 L38 98 L12 38 Z',
  shard: 'M38 2 L82 20 L96 55 L58 98 L18 80 L4 42 Z',
  burst: 'M50 0 L60 30 L92 12 L68 42 L100 50 L68 58 L92 88 L60 70 L50 100 L40 70 L8 88 L32 58 L0 50 L32 42 L8 12 L40 30 Z',
};

export default function Avatar({ shape, color, size = 48 }: AvatarProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="img"
      aria-label={`${shape} avatar`}
    >
      <path
        d={SHAPE_PATHS[shape]}
        fill={color}
        strokeWidth={4}
        strokeLinejoin="miter"
        style={{ stroke: 'var(--ink)' }}
      />
    </svg>
  );
}
