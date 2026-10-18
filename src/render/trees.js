// 키 큰 나무(32×48): 잎 덩어리를 여러 겹으로 칠해 입체감을 낸다. 오리지널 도트.
import { HI } from './smooth.js';
import { isClassic, dotify } from './artmode.js';

const cache = new Map();

const PALETTES = {
  green: { dark: '#163a14', mid: '#235a1e', light: '#36802c', hi: '#6aac4a' },
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
  const key = `${isClassic() ? 'px' : 'hd'}:${kind}:${variant}`;
  if (cache.has(key)) return cache.get(key);
  if (isClassic()) {
    const px = dotify(32, 48, (ctx) => paintTree(ctx, kind, variant));
    cache.set(key, px);
    return px;
  }
  const c = Object.assign(document.createElement('canvas'), { width: 32 * HI, height: 48 * HI, lw: 32, lh: 48 });
  const ctx = c.getContext('2d');
  ctx.scale(HI, HI);
  paintTree(ctx, kind, variant);
  cache.set(key, c);
  return c;
}

/** 작은 난수(나무마다 같은 모양이 나오게 variant로 씨앗을 준다) */
function seeded(seed) {
  let x = seed * 9301 + 49297;
  return () => {
    x = (x * 9301 + 49297) % 233280;
    return x / 233280;
  };
}

/** 납작한 잎 덩어리: 어두운 바탕 → 위쪽 밝은 층 → 점점이 빛 */
function clump(ctx, rnd, cx, cy, rx, ry, p, blossom) {
  blob(ctx, cx, cy, rx, ry, p.dark);
  blob(ctx, cx - rx * 0.08, cy - ry * 0.22, rx * 0.86, ry * 0.7, p.mid);
  blob(ctx, cx - rx * 0.25, cy - ry * 0.45, rx * 0.5, ry * 0.38, p.light);
  for (let i = 0; i < Math.round(rx * 1.4); i++) {
    const a = rnd() * Math.PI * 2;
    const d = Math.sqrt(rnd());
    const x = cx + Math.cos(a) * rx * 0.85 * d;
    const y = cy + Math.sin(a) * ry * 0.8 * d - 1;
    ctx.fillStyle = y < cy ? p.hi : p.light;
    ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
  }
  if (blossom) {
    for (let i = 0; i < Math.round(rx * 1.6); i++) {
      const x = cx + (rnd() * 2 - 1) * rx * 0.85;
      const y = cy + (rnd() * 2 - 1) * ry * 0.75;
      ctx.fillStyle = rnd() < 0.7 ? '#f29ac0' : '#ffe6f0';
      ctx.fillRect(Math.round(x), Math.round(y), 1.4, 1.4);
    }
  }
}

/** 분재처럼 굽은 줄기 */
function trunk(ctx, rnd, o) {
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const path = () => {
    ctx.beginPath();
    ctx.moveTo(16, 47);
    ctx.bezierCurveTo(13 + o, 40, 20 + o, 34, 15 - o, 24);
    ctx.moveTo(16 + o * 0.5, 34);
    ctx.quadraticCurveTo(11, 33, 8 - o, 29);
    ctx.moveTo(15, 30);
    ctx.quadraticCurveTo(21, 28, 24 + o, 24);
  };
  path();
  ctx.strokeStyle = '#2a1808';
  ctx.lineWidth = 4.2;
  ctx.stroke();
  path();
  ctx.strokeStyle = '#6a4422';
  ctx.lineWidth = 2.6;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(15.4, 46);
  ctx.bezierCurveTo(12.6 + o, 40, 19.4 + o, 34, 14.5 - o, 25);
  ctx.strokeStyle = '#9a6a3a';
  ctx.lineWidth = 0.9;
  ctx.stroke();
}

function paintTree(ctx, kind, variant) {
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
    // 활엽수: 분재처럼 굽은 줄기에 납작한 잎 덩어리 여러 층(원작 마을 나무 느낌). 세 번째 모양은 꽃나무
    const rnd = seeded(variant + 3);
    const o = (variant - 1) * 1.5;
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.beginPath();
    ctx.ellipse(16, 46, 9, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
    trunk(ctx, rnd, o);
    const blossom = variant === 2 && kind === 'green';
    clump(ctx, rnd, 8 - o, 28, 7, 4.2, p, blossom);
    clump(ctx, rnd, 24 + o, 23, 7.5, 4.6, p, blossom);
    clump(ctx, rnd, 15 - o, 15, 10, 6.5, p, blossom);
    clump(ctx, rnd, 18 + o * 0.5, 7, 6.5, 4.2, p, blossom);
  }
}
