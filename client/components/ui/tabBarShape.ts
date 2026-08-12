/** SVG path for Style 6 tab bar — top edge curves up at the active tab. */
export function buildBubbleTabBarPath(
  w: number,
  h: number,
  r: number,
  cx: number,
  bumpW: number,
  bumpH: number,
): string {
  'worklet';
  if (w <= 0 || h <= 0) return '';

  const bl = Math.max(r + 2, cx - bumpW / 2);
  const br = Math.min(w - r - 2, cx + bumpW / 2);

  if (bl >= br - 4) {
    // Fallback: plain rounded rect when bump has no room
    return [
      `M ${r} 0`,
      `H ${w - r}`,
      `Q ${w} 0 ${w} ${r}`,
      `V ${h - r}`,
      `Q ${w} ${h} ${w - r} ${h}`,
      `H ${r}`,
      `Q 0 ${h} 0 ${h - r}`,
      `V ${r}`,
      `Q 0 0 ${r} 0`,
      'Z',
    ].join(' ');
  }

  return [
    `M ${r} 0`,
    `H ${bl}`,
    `C ${bl + bumpW * 0.2} 0 ${cx - bumpW * 0.32} ${-bumpH} ${cx} ${-bumpH}`,
    `C ${cx + bumpW * 0.32} ${-bumpH} ${br - bumpW * 0.2} 0 ${br} 0`,
    `H ${w - r}`,
    `Q ${w} 0 ${w} ${r}`,
    `V ${h - r}`,
    `Q ${w} ${h} ${w - r} ${h}`,
    `H ${r}`,
    `Q 0 ${h} 0 ${h - r}`,
    `V ${r}`,
    `Q 0 0 ${r} 0`,
    'Z',
  ].join(' ');
}
