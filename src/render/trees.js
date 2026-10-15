// 키 큰 나무(32×48): 잎 덩어리를 여러 겹으로 칠해 입체감을 낸다. 오리지널 도트.
import { HI } from './smooth.js';

const cache = new Map();

const PALETTES = {
  green: { dark: '#173f18', mid: '#24612a', light: '#35843a', hi: '#58a84e' },
  pine: { dark: '#0f3226', mid: '#1a4a38', light: '#256148', hi: '#3a7d5e' },
  snow: { dark: '#14382c', mid: '#1d4a3a', light: '#e8eef3', hi: '#ffffff' },
  dry: { dark: '#3d3a16', mid: '#5c5a24', light: '#7d7a34', hi: '#a3a052' },
};

function blob(ctx, cx, cy, rx, ry, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

export function treeSprite(kind = 'green', variant = 0) {
  const key = `${kind}:${variant}`;
  if (cache.has(key)) return cache.get(key);
  const c = Object.assign(document.createElement('canvas'), { width: 32 * HI, height: 48 * HI, lw: 32, lh: 48 });
  const ctx = c.getContext('2d');
  ctx.scale(HI, HI);
  const p = PALETTES[kind] ?? PALETTES.green;
  if (kind === 'pine' || kind === 'snow') {
    // 소나무: 층층이 쌓인 삼각 잎
    for (let i = 0; i < 4; i++) {
      const y = 8 + i * 8;
      const half = 6 + i * 3;
      ctx.fillStyle = p.dark;
      ctx.beginPath();
      ctx.moveTo(16, y - 6);
      ctx.lineTo(16 + half, y + 6);
      ctx.lineTo(16 - half, y + 6);
      ctx.fill();
      ctx.fillStyle = p.mid;
      ctx.beginPath();
      ctx.moveTo(16, y - 5);
      ctx.lineTo(16 + half - 3, y + 4);
      ctx.lineTo(16 - half + 1, y + 4);
      ctx.fill();
      ctx.fillStyle = p.light;
      ctx.fillRect(16 - half + 2, y + 2, half - 2, 2);
    }
  } else {
    const o = variant * 1.5;
    blob(ctx, 16, 24, 14, 12, p.dark);
    blob(ctx, 14 - o, 20, 12, 11, p.mid);
    blob(ctx, 19 + o, 18, 10, 9, p.mid);
    blob(ctx, 12, 15, 8, 7, p.light);
    blob(ctx, 10, 12, 4, 3, p.hi);
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.beginPath();
    ctx.ellipse(20, 28, 10, 6, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  cache.set(key, c);
  return c;
}
