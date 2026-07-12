// Straight-line-only SVG path parser (M/L/H/V/Z) — enough for the hand-drawn
// polygon shapes exported from Figma. Shared by any component that turns a
// hand-drawn Figma path into a CSS clip-path (Bubble, NamePlate, ...).
function parsePathPoints(d: string): [number, number][] {
  const points: [number, number][] = [];
  let x = 0;
  let y = 0;
  const commands = d.match(/[MLHVZ][^MLHVZ]*/gi) ?? [];
  for (const command of commands) {
    const type = command[0];
    const args = command
      .slice(1)
      .trim()
      .split(/[\s,]+/)
      .filter(Boolean)
      .map(Number);
    if (type === 'M' || type === 'L') {
      for (let i = 0; i < args.length; i += 2) {
        x = args[i];
        y = args[i + 1];
        points.push([x, y]);
      }
    } else if (type === 'H') {
      for (const arg of args) {
        x = arg;
        points.push([x, y]);
      }
    } else if (type === 'V') {
      for (const arg of args) {
        y = arg;
        points.push([x, y]);
      }
    }
  }
  return points;
}

// Expresses one axis value as "the nearest box edge, plus a fixed pixel
// offset" (e.g. `calc(0% + 13.5px)`) instead of a plain percentage. A pure
// percentage stretches the hand-drawn corner jitter along with the box, so
// a tiny box and a much larger one render visibly different corner shapes.
// Anchoring to the nearest edge with a constant px offset keeps every
// corner's jitter identical at any box size — only the straight run
// between corners (the "diagonal") absorbs the size change.
function coordExpr(value: number, max: number): string {
  const anchor = value < max / 2 ? 0 : max;
  const offset = value - anchor;
  const anchorPercent = anchor === 0 ? 0 : 100;
  if (offset === 0) return `${anchorPercent}%`;
  const sign = offset > 0 ? '+' : '-';
  return `calc(${anchorPercent}% ${sign} ${Math.abs(offset).toFixed(2)}px)`;
}

export function pathToClipPolygon(
  d: string,
  viewWidth: number,
  viewHeight: number,
  mirror = false,
): string {
  const points = parsePathPoints(d);
  const formatted = points
    .map(([x, y]) => {
      const px = mirror ? viewWidth - x : x;
      return `${coordExpr(px, viewWidth)} ${coordExpr(y, viewHeight)}`;
    })
    .join(', ');
  return `polygon(${formatted})`;
}
