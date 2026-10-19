import { TILE } from '../config.js';
import { isNinja } from './artmode.js';
import { drawFxDot } from './fxdots.js';

const DIR_ANGLE = { right: 0, down: Math.PI / 2, left: Math.PI, up: -Math.PI / 2 };
const center = (v) => v * TILE + 16;

// 몬스터 기술이 터질 때의 모양별 색
const BLAST_COLORS = {
  fire: ['#fff3b0', '#ff7b2e', '#c0392b'],
  ice: ['#ffffff', '#bfe9ff', '#5dade2'],
  water: ['#e8f8ff', '#4fb3ff', '#1f5f9f'],
  dark: ['#f0d8ff', '#a066ff', '#3b1466'],
  quake: ['#fff1c2', '#e0a060', '#6b4423'],
  nova: ['#ffffff', '#ff9fd0', '#c2185b'],
  slash: ['#ffffff', '#ff6b6b', '#8b1a1a'],
  dash: ['#fff3b0', '#ffd166', '#a8743f'],
  arrow: ['#ffffff', '#e8d6a8', '#8b5a2b'],
  spear: ['#ffffff', '#d5dbdb', '#566573'],
};

const DRAW = {
  /** 몬스터 기술 폭발: 번쩍임 + 퍼지는 고리 + 튀는 조각 */
  blast(ctx, e, f, cx, cy) {
    const [core, mid, dark] = BLAST_COLORS[e.look] ?? BLAST_COLORS.fire;
    const r = 6 + f * 14;
    ctx.globalAlpha = (1 - f) * 0.9;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, core);
    g.addColorStop(0.5, mid);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = mid;
    ctx.lineWidth = 2 * (1 - f);
    ctx.beginPath();
    ctx.arc(cx, cy, r * 1.15, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = e.look === 'ice' ? '#ffffff' : dark;
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + (e.x * 3 + e.y) % 1;
      const d = 4 + f * 15;
      const sz = 2.2 * (1 - f) + 0.5;
      if (e.look === 'ice') {
        ctx.save();
        ctx.translate(cx + Math.cos(a) * d, cy + Math.sin(a) * d);
        ctx.rotate(a);
        ctx.fillRect(-sz, -sz / 3, sz * 2, sz / 1.5);
        ctx.restore();
      } else {
        ctx.beginPath();
        ctx.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d - (e.look === 'quake' ? f * 6 : 0), sz, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  },
  /** 돌진: 지나간 길에 남는 바람 줄기 */
  dash(ctx, e, f) {
    const x0 = center(e.x);
    const y0 = center(e.y);
    const x1 = center(e.tx);
    const y1 = center(e.ty);
    ctx.globalAlpha = (1 - f) * 0.8;
    ctx.lineCap = 'round';
    for (const [off, w] of [[-5, 1.2], [0, 2.4], [5, 1.2]]) {
      const nx = (y1 - y0) === 0 ? 0 : off;
      const ny = (x1 - x0) === 0 ? 0 : off;
      ctx.strokeStyle = e.color;
      ctx.lineWidth = w;
      ctx.beginPath();
      ctx.moveTo(x0 + nx, y0 + ny);
      ctx.lineTo(x0 + (x1 - x0) * (0.3 + f * 0.7) + nx, y0 + (y1 - y0) * (0.3 + f * 0.7) + ny);
      ctx.stroke();
    }
  },
  /** 몬스터 할퀴기: 세 줄 긁힌 자국 */
  claw(ctx, e, f, cx, cy) {
    ctx.globalAlpha = 1 - f;
    ctx.strokeStyle = '#ff5252';
    ctx.lineCap = 'round';
    const grow = Math.min(1, f * 3);
    for (let i = -1; i <= 1; i++) {
      ctx.lineWidth = 2.2 - Math.abs(i) * 0.6;
      ctx.beginPath();
      ctx.moveTo(cx - 8 + i * 5, cy - 9);
      ctx.lineTo(cx - 8 + i * 5 + 14 * grow, cy - 9 + 16 * grow);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.moveTo(cx - 8, cy - 9);
    ctx.lineTo(cx - 8 + 14 * grow, cy - 9 + 16 * grow);
    ctx.stroke();
  },
  /** 베기: 초승달 모양 칼빛 + 잔상 + 튀는 불티. big이면 더 크고 길게 */
  slash(ctx, e, f, cx, cy) {
    const a = DIR_ANGLE[e.dir] ?? 0;
    const R = e.big ? 22 : 17;
    const bx = cx - Math.cos(a) * (e.big ? 12 : 10);
    const by = cy - Math.sin(a) * (e.big ? 12 : 10);
    const grow = Math.min(1, f * 2.2);
    const start = a - 1.3;
    const end = start + 2.6 * grow;
    const color = e.color ?? '#ffffff';
    ctx.lineCap = 'round';
    // 바깥 번짐
    ctx.globalAlpha = (1 - f) * 0.35;
    ctx.strokeStyle = color;
    ctx.lineWidth = e.big ? 14 : 9;
    ctx.beginPath();
    ctx.arc(bx, by, R, start, end);
    ctx.stroke();
    // 초승달 칼빛(가운데가 두껍다)
    ctx.globalAlpha = 1 - f * 0.9;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(bx, by, R + (e.big ? 3 : 2), start, end);
    ctx.arc(bx + Math.cos(a) * 4, by + Math.sin(a) * 4, R - 3, end, start, true);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = e.big ? 2.2 : 1.6;
    ctx.beginPath();
    ctx.arc(bx, by, R + 1, start + 0.15, end);
    ctx.stroke();
    // 잔상
    ctx.globalAlpha = (1 - f) * 0.45;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(bx, by, R - 6, start + 0.3, end - 0.2);
    ctx.stroke();
    // 불티
    ctx.globalAlpha = 1 - f;
    ctx.fillStyle = '#fff6d0';
    for (let i = 0; i < (e.big ? 6 : 3); i++) {
      const t = end - i * 0.22;
      const d = R + 3 + f * (8 + i * 2);
      ctx.beginPath();
      ctx.arc(bx + Math.cos(t) * d, by + Math.sin(t) * d, 1.3 * (1 - f) + 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
  },
  hit(ctx, e, f, cx, cy) {
    const big = e.crit ? 1.8 : 1;
    ctx.globalAlpha = 1 - f;
    if (f < 0.25) {
      ctx.fillStyle = e.crit ? 'rgba(255, 230, 120, 0.8)' : 'rgba(255,255,255,0.7)';
      ctx.beginPath();
      ctx.arc(cx, cy, 10 * big * (1 - f * 2), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = e.crit ? '#ffd84d' : '#fff0b4';
    ctx.lineWidth = e.crit ? 3 : 2;
    const rays = e.crit ? 10 : 6;
    for (let i = 0; i < rays; i++) {
      const a = (i / rays) * Math.PI * 2 + 0.3;
      const r1 = (4 + f * 6) * big;
      const r2 = (9 + f * 10) * big;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
      ctx.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2);
      ctx.stroke();
    }
    ctx.fillStyle = '#ffb347';
    for (let i = 0; i < 5; i++) {
      const a = i * 1.3 + 0.5;
      const d = f * 18 * big;
      ctx.fillRect(cx + Math.cos(a) * d, cy + Math.sin(a) * d + f * f * 10, 2, 2);
    }
  },
  bite(ctx, e, f, cx, cy) {
    ctx.strokeStyle = `rgba(255,80,80,${1 - f})`;
    ctx.lineWidth = 2;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(cx - 8 + i * 5, cy - 9);
      ctx.lineTo(cx + 4 + i * 5, cy + 9);
      ctx.stroke();
    }
  },
  ring(ctx, e, f, cx, cy) {
    const r = (e.radius + 0.5) * TILE * Math.min(1, f * 1.6);
    ctx.globalAlpha = (1 - f) * 0.35;
    ctx.fillStyle = e.color;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1 - f;
    ctx.strokeStyle = e.color;
    ctx.lineWidth = 3;
    ctx.stroke();
  },
  burst(ctx, e, f, cx, cy) {
    ctx.globalAlpha = 1 - f;
    ctx.fillStyle = e.color;
    ctx.beginPath();
    ctx.arc(cx, cy, 6 + f * 12, 0, Math.PI * 2);
    ctx.fill();
  },
  bolt(ctx, e, f, cx, cy) {
    ctx.globalAlpha = 1 - f;
    ctx.strokeStyle = e.color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    let y = cy - TILE * 3;
    ctx.moveTo(cx, y);
    for (let i = 0; i < 6; i++) {
      y += TILE * 0.5;
      ctx.lineTo(cx + (i % 2 ? 7 : -7), y);
    }
    ctx.lineTo(cx, cy);
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx, cy, 8 * (1 - f), 0, Math.PI * 2);
    ctx.fill();
  },
  orb(ctx, e, f, cx, cy) {
    ctx.globalAlpha = 1 - f;
    ctx.fillStyle = e.color;
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + f * 6;
      ctx.beginPath();
      ctx.arc(cx + Math.cos(a) * (14 - f * 10), cy + Math.sin(a) * (14 - f * 10), 3, 0, Math.PI * 2);
      ctx.fill();
    }
  },
  heal(ctx, e, f, cx, cy) {
    ctx.globalAlpha = 1 - f;
    ctx.fillStyle = '#7dff9b';
    for (let i = 0; i < 5; i++) {
      const x = cx - 12 + i * 6;
      const y = cy + 10 - f * 26 - (i % 2) * 6;
      ctx.fillRect(x - 1, y - 3, 2, 6);
      ctx.fillRect(x - 3, y - 1, 6, 2);
    }
  },
  aura(ctx, e, f, cx, cy) {
    ctx.globalAlpha = 1 - f;
    ctx.strokeStyle = e.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, 10 + f * 16, 0, Math.PI * 2);
    ctx.stroke();
  },
  levelup(ctx, e, f, cx, cy) {
    ctx.globalAlpha = 1 - f;
    const grad = ctx.createLinearGradient(0, cy - 60, 0, cy + 16);
    grad.addColorStop(0, 'rgba(255, 215, 0, 0)');
    grad.addColorStop(1, 'rgba(255, 215, 0, 0.6)');
    ctx.fillStyle = grad;
    ctx.fillRect(cx - 14, cy - 60, 28, 76);
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(0,0,0,0.8)';
    const text = e.text ?? 'LEVEL UP!';
    ctx.strokeText(text, cx, cy - 26 - f * 12);
    ctx.fillStyle = '#ffe066';
    ctx.fillText(text, cx, cy - 26 - f * 12);
  },
  poof(ctx, e, f, cx, cy) {
    ctx.globalAlpha = (1 - f) * 0.7;
    ctx.fillStyle = '#dfe6e9';
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + 0.6;
      ctx.beginPath();
      ctx.arc(cx + Math.cos(a) * f * 10, cy + Math.sin(a) * f * 10, 5 * (1 - f) + 2, 0, Math.PI * 2);
      ctx.fill();
    }
  },
  smoke(ctx, e, f, cx, cy) {
    ctx.globalAlpha = (1 - f) * 0.8;
    ctx.fillStyle = '#4a4560';
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(cx + Math.cos(a) * (4 + f * 12), cy + 6 + Math.sin(a) * (3 + f * 6) - f * 8, 6 * (1 - f) + 2, 0, Math.PI * 2);
      ctx.fill();
    }
  },
  line(ctx, e, f) {
    ctx.globalAlpha = 1 - f;
    ctx.strokeStyle = e.color;
    ctx.lineCap = 'round';
    ctx.lineWidth = 10 * (1 - f) + 2;
    ctx.beginPath();
    ctx.moveTo(center(e.x), center(e.y));
    ctx.lineTo(center(e.x2), center(e.y2));
    ctx.stroke();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
  },
  chain(ctx, e, f) {
    ctx.globalAlpha = 1 - f;
    ctx.strokeStyle = e.color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    e.points.forEach((p, i) => {
      const x = center(p.x);
      const y = center(p.y);
      if (i === 0) {
        ctx.moveTo(x, y);
        return;
      }
      const prev = e.points[i - 1];
      const mx = (center(prev.x) + x) / 2 + (Math.random() - 0.5) * 10;
      const my = (center(prev.y) + y) / 2 + (Math.random() - 0.5) * 10;
      ctx.lineTo(mx, my);
      ctx.lineTo(x, y);
    });
    ctx.stroke();
  },
  pillar(ctx, e, f, cx, cy) {
    const h = 70;
    ctx.globalAlpha = (1 - f) * 0.85;
    const grad = ctx.createLinearGradient(0, cy - h, 0, cy + 12);
    grad.addColorStop(0, 'rgba(255,255,255,0)');
    grad.addColorStop(1, e.color);
    ctx.fillStyle = grad;
    const w = 18 * (1 - f * 0.5);
    ctx.fillRect(cx - w / 2, cy - h, w, h + 12);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(cx - 2, cy - h, 4, h + 12);
  },
  meteor(ctx, e, f, cx, cy) {
    if (f < 0.55) {
      const t = f / 0.55;
      const x = cx + 40 * (1 - t);
      const y = cy - 90 * (1 - t);
      ctx.fillStyle = '#ffdd88';
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,120,40,0.7)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 14, y - 30);
      ctx.stroke();
      return;
    }
    const t = (f - 0.55) / 0.45;
    ctx.globalAlpha = 1 - t;
    ctx.fillStyle = '#ff6a2e';
    ctx.beginPath();
    ctx.arc(cx, cy, 6 + t * 18, 0, Math.PI * 2);
    ctx.fill();
  },
  cracks(ctx, e, f, cx, cy) {
    ctx.globalAlpha = 1 - f;
    ctx.strokeStyle = '#3b2a18';
    ctx.lineWidth = 2;
    const len = (e.radius + 0.5) * TILE;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + 0.3;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a) * len * 0.5 + 4, cy + Math.sin(a) * len * 0.5);
      ctx.lineTo(cx + Math.cos(a) * len, cy + Math.sin(a) * len);
      ctx.stroke();
    }
  },
  frost(ctx, e, f, cx, cy) {
    ctx.globalAlpha = 1 - f;
    ctx.fillStyle = '#e8f8ff';
    const r = (e.radius + 0.5) * TILE;
    for (let i = 0; i < 14; i++) {
      const a = i * 2.4;
      const d = (i / 14) * r;
      const x = cx + Math.cos(a) * d;
      const y = cy + Math.sin(a) * d;
      ctx.fillRect(x - 1, y - 4, 2, 8);
      ctx.fillRect(x - 4, y - 1, 8, 2);
    }
  },
};

export function drawEffect(ctx, e, now) {
  const draw = DRAW[e.type];
  if (!draw || now < e.start) return;
  const f = Math.min(1, (now - e.start) / e.dur);
  ctx.save();
  // 새 도트 모드면 FX 시트 그림을 먼저 써 보고, 없으면 원래 그림
  if (!(isNinja() && drawFxDot(ctx, e, f, center(e.x), center(e.y)))) draw(ctx, e, f, center(e.x), center(e.y));
  ctx.restore();
}
