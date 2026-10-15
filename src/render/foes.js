// 몬스터 기술 그리기: 바닥 예고 장판, 날아오는 탄, 시전 중인 마법진
import { TILE } from '../config.js';

const DIR_ANGLE = { right: 0, down: Math.PI / 2, left: Math.PI, up: -Math.PI / 2 };

function rgba(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** 예고 장판: 칸마다 붉게 깜빡이고, 가운데부터 차오르는 사각형이 꽉 차면 터진다 */
export function drawHazards(ctx, game) {
  for (const h of game.hazards) {
    const f = Math.min(1, (game.now - h.start) / Math.max(1, h.at - h.start));
    const pulse = 0.5 + 0.5 * Math.sin(game.now / (f > 0.7 ? 45 : 90));
    for (const t of h.tiles) {
      const x = t.x * TILE;
      const y = t.y * TILE;
      roundRect(ctx, x + 1.5, y + 1.5, TILE - 3, TILE - 3, 5);
      ctx.fillStyle = rgba('#ff2a2a', 0.12 + 0.1 * pulse);
      ctx.fill();
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = rgba('#ff4a3a', 0.55 + 0.35 * pulse);
      ctx.stroke();
      const s = (TILE - 6) * f;
      roundRect(ctx, x + TILE / 2 - s / 2, y + TILE / 2 - s / 2, s, s, 4);
      ctx.fillStyle = rgba(h.color, 0.25 + 0.2 * f);
      ctx.fill();
    }
  }
}

/** 몬스터 발밑 마법진(시전 중) */
export function drawFoeCasting(ctx, game, m, cx, cy, scale) {
  const c = m.casting;
  if (!c) return;
  const f = Math.min(1, (game.now - c.start) / Math.max(1, c.until - c.start));
  const r = (10 + 4 * f) * scale;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(1, 0.45);
  ctx.rotate(game.now / 260);
  ctx.strokeStyle = rgba(c.sk.color, 0.9);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    ctx.moveTo(Math.cos(a) * r * 0.55, Math.sin(a) * r * 0.55);
    ctx.lineTo(Math.cos(a + 2.1) * r * 0.55, Math.sin(a + 2.1) * r * 0.55);
  }
  ctx.stroke();
  ctx.restore();
  // 모여드는 빛 알갱이
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + game.now / 300;
    const d = (1 - ((game.now / 500 + i / 6) % 1)) * 14 * scale;
    ctx.fillStyle = rgba(c.sk.color, 0.85);
    ctx.beginPath();
    ctx.arc(cx + Math.cos(a) * d, cy - 10 * scale + Math.sin(a) * d * 0.6, 1.3, 0, Math.PI * 2);
    ctx.fill();
  }
  // 탄을 쏠 방향 표시(옅은 화살표)
  if (c.dir && c.sk.kind === 'bolt') {
    const a = DIR_ANGLE[c.dir];
    ctx.save();
    ctx.translate(cx, cy - 8);
    ctx.rotate(a);
    ctx.fillStyle = rgba(c.sk.color, 0.35 + 0.4 * f);
    ctx.beginPath();
    ctx.moveTo(18, 0);
    ctx.lineTo(10, -5);
    ctx.lineTo(10, 5);
    ctx.fill();
    ctx.restore();
  }
}

/** 때리기 직전 번쩍임: 몸 뒤로 붉은 빛 */
export function drawStrikeTell(ctx, cx, cy, size, now) {
  const g = ctx.createRadialGradient(cx, cy, 2, cx, cy, size * 0.7);
  const a = 0.35 + 0.25 * Math.sin(now / 40);
  g.addColorStop(0, `rgba(255, 70, 50, ${a})`);
  g.addColorStop(1, 'rgba(255, 70, 50, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(cx - size, cy - size, size * 2, size * 2);
}

const SHOT = {
  fire(ctx, s, now) {
    for (let i = 4; i >= 1; i--) {
      ctx.fillStyle = `rgba(255, ${120 + i * 20}, 40, ${0.18 * (5 - i)})`;
      ctx.beginPath();
      ctx.arc(-i * 4.5, Math.sin(now / 50 + i) * 1.5, 5 - i * 0.7, 0, Math.PI * 2);
      ctx.fill();
    }
    glowBall(ctx, 6, '#fff6c2', '#ff7b2e');
  },
  ice(ctx) {
    const g = ctx.createLinearGradient(-10, 0, 10, 0);
    g.addColorStop(0, 'rgba(160, 220, 255, 0.2)');
    g.addColorStop(1, '#ffffff');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(11, 0);
    ctx.lineTo(-2, -3.5);
    ctx.lineTo(-12, 0);
    ctx.lineTo(-2, 3.5);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(80, 160, 220, 0.9)';
    ctx.lineWidth = 0.8;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath();
    ctx.moveTo(-6, 0);
    ctx.lineTo(9, 0);
    ctx.stroke();
  },
  water(ctx, s, now) {
    for (let i = 1; i <= 3; i++) {
      ctx.fillStyle = 'rgba(190, 230, 255, 0.6)';
      ctx.beginPath();
      ctx.arc(-i * 5, Math.sin(now / 80 + i * 2) * 3, 1.4, 0, Math.PI * 2);
      ctx.fill();
    }
    glowBall(ctx, 5.5, '#e8f8ff', '#2f8fe0');
  },
  dark(ctx, s, now) {
    glowBall(ctx, 6, '#f0d8ff', '#6a2bbf');
    ctx.strokeStyle = 'rgba(210, 160, 255, 0.8)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 2; i++) {
      ctx.beginPath();
      ctx.arc(0, 0, 8, now / 120 + i * Math.PI, now / 120 + i * Math.PI + 1.6);
      ctx.stroke();
    }
  },
  arrow(ctx) {
    ctx.strokeStyle = '#8b5a2b';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-10, 0);
    ctx.lineTo(8, 0);
    ctx.stroke();
    ctx.fillStyle = '#d5dbdb';
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(7, -2.5);
    ctx.lineTo(7, 2.5);
    ctx.fill();
    ctx.fillStyle = '#f4f1ea';
    ctx.beginPath();
    ctx.moveTo(-10, 0);
    ctx.lineTo(-13, -3);
    ctx.lineTo(-7, 0);
    ctx.lineTo(-13, 3);
    ctx.fill();
  },
  spear(ctx) {
    ctx.strokeStyle = '#6b4423';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(-14, 0);
    ctx.lineTo(8, 0);
    ctx.stroke();
    const g = ctx.createLinearGradient(8, -3, 15, 3);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(1, '#7f8c8d');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(16, 0);
    ctx.lineTo(8, -3);
    ctx.lineTo(9.5, 0);
    ctx.lineTo(8, 3);
    ctx.fill();
    ctx.fillStyle = '#c0392b';
    ctx.fillRect(5, -2, 2, 4);
  },
};

function glowBall(ctx, r, core, edge) {
  const g = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 0.5, 0, 0, r * 1.9);
  g.addColorStop(0, core);
  g.addColorStop(0.45, edge);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, r * 1.9, 0, Math.PI * 2);
  ctx.fill();
}

export function drawEnemyShots(ctx, game) {
  for (const s of game.enemyShots) {
    ctx.save();
    ctx.translate(s.x * TILE + 16, s.y * TILE + 12);
    ctx.rotate(Math.atan2(s.dy, s.dx));
    (SHOT[s.look] ?? SHOT.fire)(ctx, s, game.now);
    ctx.restore();
  }
}
