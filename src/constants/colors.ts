/** 8-color palette shared across components (avatar, art, thumb). */
export const PALETTE: [fg: string, bg: string][] = [
  ['#1db954', '#052e12'],
  ['#e91e8c', '#3a0520'],
  ['#7c4dff', '#1a0a40'],
  ['#ff6d00', '#3a1800'],
  ['#00bcd4', '#002e35'],
  ['#f44336', '#3a0a08'],
  ['#8bc34a', '#1e3008'],
  ['#ff5722', '#3a1408'],
];

export function gradient(index: number): string {
  const [fg, bg] = PALETTE[index % PALETTE.length];
  return `linear-gradient(135deg,${bg},${fg})`;
}

/** Generate a 256x256 gradient artwork blob URL for Media Session. */
const artCache = new Map<number, string>();
export function generateArtwork(index: number): string {
  const key = index % PALETTE.length;
  if (artCache.has(key)) return artCache.get(key)!;

  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const [fg, bg] = PALETTE[key];
  const grad = ctx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, bg);
  grad.addColorStop(1, fg);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const url = canvas.toDataURL('image/png');
  artCache.set(key, url);
  return url;
}
