import { TILE } from '../config.js';

const DIR_ANGLE = { right: 0, down: Math.PI / 2, left: Math.PI, up: -Math.PI / 2 };
const center = (v) => v * TILE + 16;

const DRAW = {
  slash(ctx, e, f, cx, cy) {
    const a = DIR_ANGLE[e.dir] ?? 0;
    ctx.strokeStyle = `rgba(255,255,255,${1 - f})`;
    ctx.lineWidth = e.big ? 4 : 2.5;
    ctx.beginPath();
    ctx.arc(cx - Math.cos(a) * 10, cy - Math.sin(a) * 10, 16, a - 1.1 + f * 0.6, a + 1.1 + f * 0.6);
    ctx.stroke();
  },
  hit(ctx, e, f, cx, cy) {
    ctx.strokeStyle = `rgba(255,240,180,${1 - f})`;
    ctx.lineWidth = 2;
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const r1 = 4 + f * 6;
      const r2 = 9 + f * 8;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
      ctx.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2);
      ctx.stroke();
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
  draw(ctx, e, f, center(e.x), center(e.y));
  ctx.restore();
}
