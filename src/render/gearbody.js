// 갑옷·방패를 플레이어 그림에 입힌다(gearlook.js 가 쓴다).
// 갑옷: 목 아래 옷 색을 그 갑옷 색(trim.d)으로 바꿔 칠한다. 살색·검은 머리·테두리·금장식은 그대로, 주름 그늘은 살린다.
// 방패: 앞모습은 무기 반대쪽 손에, 뒷모습은 등에 둥근 방패를 그린다(옆모습은 몸에 가려 안 그린다).
import { ITEMS } from '../data/items.js';

const INK = '#2a1d14';

function hexRgb(hex) {
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
}

function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h /= 6;
  return [h, s, l];
}

function hslToRgb(h, s, l) {
  if (!s) return [l * 255, l * 255, l * 255];
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const f = (t) => {
    const u = t < 0 ? t + 1 : t > 1 ? t - 1 : t;
    if (u < 1 / 6) return p + (q - p) * 6 * u;
    if (u < 1 / 2) return q;
    if (u < 2 / 3) return p + (q - p) * (2 / 3 - u) * 6;
    return p;
  };
  return [f(h + 1 / 3) * 255, f(h) * 255, f(h - 1 / 3) * 255];
}

/** 옷으로 칠할 칸인가: 살색·어두운 머리·테두리·금장식은 아니다 */
function isCloth(h, s, l) {
  const deg = h * 360;
  if (l < 0.1) return false; // 테두리
  if (l < 0.27 && s < 0.22) return false; // 검은 머리
  if (deg >= 5 && deg <= 42 && s >= 0.25 && s <= 0.8 && l >= 0.55 && l <= 0.9) return false; // 살색
  if (deg >= 38 && deg <= 62 && s > 0.45 && l > 0.35) return false; // 금장식
  return true;
}

/** 목 아래 옷을 갑옷 색으로 칠한 그림(갑옷이 없거나 기본 옷이면 그대로) */
export function dressBody(bare, armorId, head) {
  const trim = ITEMS[armorId]?.trim;
  if (!trim || typeof document === 'undefined') return bare;
  const c = document.createElement('canvas');
  c.width = bare.width;
  c.height = bare.height;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.drawImage(bare, 0, 0);
  const neck = Math.round(head[1] + head[2] * 0.9);
  const data = g.getImageData(0, neck, c.width, c.height - neck);
  const d = data.data;
  const [th, ts, tl0] = rgbToHsl(...hexRgb(trim.d));
  const tl = Math.min(0.84, Math.max(0.16, tl0));
  // 옷 칸들의 평균 밝기(주름 그늘을 그만큼 살린다)
  let sum = 0;
  let n = 0;
  const marks = new Uint8Array(d.length / 4);
  for (let i = 0, k = 0; i < d.length; i += 4, k++) {
    if (d[i + 3] < 160) continue;
    const [h, s, l] = rgbToHsl(d[i], d[i + 1], d[i + 2]);
    if (!isCloth(h, s, l)) continue;
    marks[k] = 1;
    sum += l;
    n++;
  }
  if (!n) return bare;
  const mean = sum / n;
  for (let i = 0, k = 0; i < d.length; i += 4, k++) {
    if (!marks[k]) continue;
    const l = rgbToHsl(d[i], d[i + 1], d[i + 2])[2];
    const nl = Math.min(0.96, Math.max(0.06, tl + (l - mean) * 0.9));
    const [r, gg, b] = hslToRgb(th, ts, nl);
    d[i] = r;
    d[i + 1] = gg;
    d[i + 2] = b;
  }
  g.putImageData(data, 0, neck);
  return c;
}

// ── 방패 ──
const SHIELD_LOOK = {
  woodShield: { fill: '#9a6a3a', rim: '#5a3a1e', planks: true },
  leatherShield: { fill: '#b8864e', rim: '#6b4423', stitch: true },
  ironShield: { fill: '#9aa3ab', rim: '#5a6168', boss: '#c8ced4' },
  mirrorShield: { fill: '#b8862e', rim: '#6b4a14', mirror: true },
  turtleShield: { fill: '#5a7a3a', rim: '#34481e', hex: true },
  ghostFaceShield: { fill: '#a8322a', rim: '#4a1410', face: true },
  blackTortoiseShield: { fill: '#24404a', rim: '#0e1c22', boss: '#e8b84a', hex: true },
  highShield55: { fill: '#c0392b', rim: '#6a1a12', boss: '#e8b84a' },
  highShield65: { fill: '#2f8a9a', rim: '#14444c', boss: '#e8b84a' },
  highShield75: { fill: '#e8b84a', rim: '#8a5a14', boss: '#ff6a3a' },
  highShield85: { fill: '#d8e4ff', rim: '#7a8ac8', boss: '#e8b84a', glow: '#bfd4ff' },
};

/** 방패를 그린다. view: 'front' | 'up' | 'side'(옆은 그리지 않는다) */
export function drawShield(ctx, id, anchor, view) {
  if (view === 'side') return;
  const look = SHIELD_LOOK[id] ?? SHIELD_LOOK.ironShield;
  const [cx, top, w] = anchor.head;
  const r = w * 0.3;
  // 앞모습: 무기 쥔 손의 반대쪽 손(머리 가운데를 기준으로 거울 자리), 뒷모습: 등 가운데
  const x = view === 'up' ? cx : 2 * cx - anchor.grip[0];
  const y = view === 'up' ? top + w * 1.45 : anchor.grip[1] - r * 0.3;
  ctx.save();
  if (look.glow) {
    ctx.shadowColor = look.glow;
    ctx.shadowBlur = 16;
  }
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = look.fill;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.lineWidth = r * 0.16;
  ctx.strokeStyle = look.rim;
  ctx.stroke();
  ctx.lineWidth = 3;
  ctx.strokeStyle = INK;
  ctx.beginPath();
  ctx.arc(x, y, r + r * 0.08, 0, Math.PI * 2);
  ctx.stroke();
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r * 0.9, 0, Math.PI * 2);
  ctx.clip();
  ctx.strokeStyle = 'rgba(40,20,8,0.45)';
  ctx.lineWidth = 2;
  if (look.planks) for (const dx of [-0.45, 0, 0.45]) {
    ctx.beginPath();
    ctx.moveTo(x + dx * r, y - r);
    ctx.lineTo(x + dx * r, y + r);
    ctx.stroke();
  }
  if (look.hex) for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
    ctx.stroke();
  }
  if (look.stitch) {
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(x, y, r * 0.75, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.restore();
  if (look.mirror) {
    ctx.fillStyle = '#f4e8b0';
    ctx.beginPath();
    ctx.arc(x, y, r * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.beginPath();
    ctx.arc(x - r * 0.15, y - r * 0.15, r * 0.15, 0, Math.PI * 2);
    ctx.fill();
  }
  if (look.face) {
    ctx.fillStyle = '#ffe080';
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(x + s * r * 0.32, y - r * 0.15, r * 0.13, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#f4f0e0';
    ctx.fillRect(x - r * 0.35, y + r * 0.2, r * 0.7, r * 0.18);
  }
  if (look.boss) {
    ctx.fillStyle = look.boss;
    ctx.beginPath();
    ctx.arc(x, y, r * 0.22, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = INK;
    ctx.stroke();
  }
  ctx.restore();
}
