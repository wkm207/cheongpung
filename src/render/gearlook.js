// 장비가 보이는 플레이어 그림: 무기를 지운 맨손 그림(assets/people/*_bare.png) 뒤에 끼고 있는 무기를,
// 머리에는 쓰개를 그려 한 장으로 합친다. 무기는 몸 뒤에 그려서 주먹이 손잡이를 쥔 것처럼 보인다.
// 무기·쓰개 모양은 종류(칼·비수·지팡이·부채, 두건·삿갓·갓·투구·관)와 레벨·승급·색(tint)으로 정한다.
import { ITEMS } from '../data/items.js';
import { GEAR_ANCHORS } from '../data/gearanchors.js';

const PAD = 44; // 무기·쓰개가 그림 밖으로 나가도 잘리지 않게 위·옆으로 늘리는 여백
const MAX_CACHE = 48;
const INK = '#2a1d14';
const bares = new Map();
const looks = new Map();

function bareOf(key) {
  const src = `assets/people/${key}_bare.png`;
  if (!bares.has(src)) {
    const img = new Image();
    img.src = src;
    bares.set(src, img);
  }
  const img = bares.get(src);
  return img.complete && img.naturalWidth ? img : null;
}

/**
 * 장비를 입힌 그림(캔버스). 맨손 그림이 아직이거나 자리 정보가 없으면 원래 그림 그대로.
 * 돌려준 캔버스의 hScale 만큼 키를 늘려 그리면 사람 크기가 원래 그림과 같다.
 */
export function gearLook(img, equip) {
  const key = img?.src?.match(/people\/([a-z]+_[mf]\d+(?:_up|_side)?)\.png/)?.[1];
  const anchor = key && GEAR_ANCHORS[key];
  if (!anchor || typeof document === 'undefined') return img;
  const bare = bareOf(key);
  if (!bare) return img;
  const weapon = ITEMS[equip?.weapon]?.type === 'weapon' ? equip.weapon : null;
  const helmet = ITEMS[equip?.helmet]?.type === 'helmet' ? equip.helmet : null;
  const ck = `${key}|${weapon}|${helmet}`;
  if (looks.has(ck)) return looks.get(ck);
  const c = document.createElement('canvas');
  c.width = bare.width + PAD * 2;
  c.height = bare.height + PAD;
  const ctx = c.getContext('2d');
  ctx.translate(PAD, PAD);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  if (weapon) drawWeapon(ctx, weapon, anchor);
  ctx.drawImage(bare, 0, 0);
  if (helmet) drawHat(ctx, helmet, anchor.head, key.endsWith('_side'), key.endsWith('_up'));
  c.hScale = c.height / bare.height;
  c.gearTag = ck;
  looks.set(ck, c);
  if (looks.size > MAX_CACHE) looks.delete(looks.keys().next().value);
  return c;
}

// ── 색 도우미 ──
function mix(hex, to, t) {
  const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const a = p(hex);
  const b = p(to);
  return `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(',')})`;
}

function paint(ctx, fill, path, { glow = null, line = 3 } = {}) {
  ctx.save();
  if (glow) {
    ctx.shadowColor = glow;
    ctx.shadowBlur = 14;
  }
  path();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.restore();
  path();
  ctx.lineWidth = line;
  ctx.strokeStyle = INK;
  ctx.stroke();
}

const rect = (ctx, x, y, w, h) => () => {
  ctx.beginPath();
  ctx.rect(x, y, w, h);
};

// ── 무기: 쥔 곳을 (0,0), 무기 끝을 +x 쪽으로 놓고 그린다 ──
function drawWeapon(ctx, id, a) {
  const it = ITEMS[id];
  const [gx, gy] = a.grip;
  const [tx, ty] = a.tip;
  const L0 = Math.hypot(tx - gx, ty - gy);
  ctx.save();
  ctx.translate(gx, gy);
  ctx.rotate(Math.atan2(ty - gy, tx - gx));
  const butt = a.butt ? Math.hypot(a.butt[0] - gx, a.butt[1] - gy) : 0;
  (WEAPON_ART[it.wtype] ?? WEAPON_ART.sword)(ctx, it, id, L0, butt);
  ctx.restore();
}

const GOLD = '#e8b84a';
const tierOf = (it) => it.tier ?? 0;
const glowOf = (it) => (tierOf(it) >= 2 ? it.tint ?? '#ffffff' : null);

function blade(ctx, it, id, L, w, guardW) {
  const tier = tierOf(it);
  const wood = /^wood/.test(id);
  const col = it.tint ?? '#d5dbdb';
  // 손잡이(주먹 뒤로 조금 나온다)
  paint(ctx, wood ? '#8a5a2a' : '#4a2e1c', rect(ctx, -30, -4.5, 42, 9), { line: 2.5 });
  // 코등이
  const gw = guardW + tier * 4;
  paint(ctx, tier >= 1 ? GOLD : wood ? '#6b4423' : '#7a7f86', rect(ctx, 10, -gw / 2, 7, gw));
  // 칼날: 끝이 뾰족하다
  paint(ctx, col, () => {
    ctx.beginPath();
    ctx.moveTo(17, -w / 2);
    ctx.lineTo(L - w * 1.1, -w / 2);
    ctx.lineTo(L, 0);
    ctx.lineTo(L - w * 1.1, w / 2);
    ctx.lineTo(17, w / 2);
    ctx.closePath();
  }, { glow: glowOf(it) });
  // 날 가운데 밝은 줄
  ctx.strokeStyle = mix(col.length === 7 ? col : '#d5dbdb', '#ffffff', 0.6);
  ctx.lineWidth = Math.max(2, w * 0.22);
  ctx.beginPath();
  ctx.moveTo(20, -w * 0.12);
  ctx.lineTo(L - w * 1.3, -w * 0.12);
  ctx.stroke();
  // 3차 무기: 코등이에 보석
  if (tier >= 3) paint(ctx, it.tint ?? '#ff5e5e', () => {
    ctx.beginPath();
    ctx.arc(13.5, 0, 5, 0, Math.PI * 2);
  }, { line: 2 });
  // 끝 손잡이 장식
  paint(ctx, tier >= 1 ? GOLD : '#5a4030', () => {
    ctx.beginPath();
    ctx.arc(-31, 0, 5.5, 0, Math.PI * 2);
  }, { line: 2.5 });
}

const lenK = (it) => 0.9 + (Math.min(it.level ?? 1, 99) / 99) * 0.22;

const WEAPON_ART = {
  sword: (ctx, it, id, L0) => blade(ctx, it, id, L0 * lenK(it), 13 + ((it.level ?? 0) >= 24 ? 3 : 0) + ((it.level ?? 0) >= 55 ? 2 : 0), 22),
  dagger: (ctx, it, id, L0) => blade(ctx, it, id, L0 * (lenK(it) - 0.04), 11 + ((it.level ?? 0) >= 30 ? 2 : 0), 17),
  staff: (ctx, it, id, L0, butt) => {
    const tier = tierOf(it);
    const head = L0 - 20;
    const col = it.tint ?? '#5dade2';
    // 자루
    paint(ctx, tier >= 2 ? '#3a2a1e' : '#7a5232', rect(ctx, -(butt || 60), -5, (butt || 60) + head - 10, 10), { line: 2.5 });
    if (tier >= 1) for (const at of [-20, head - 30]) paint(ctx, GOLD, rect(ctx, at, -6.5, 6, 13), { line: 2 });
    // 머리: 구슬(백골장은 해골)
    const r = 18 + tier * 2;
    if (tier >= 1) {
      ctx.strokeStyle = INK;
      ctx.lineWidth = 7;
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.arc(head, 0, r + 2, s * 0.9, s * 2.3, s < 0);
        ctx.stroke();
      }
      ctx.strokeStyle = GOLD;
      ctx.lineWidth = 4;
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.arc(head, 0, r + 2, s * 0.9, s * 2.3, s < 0);
        ctx.stroke();
      }
    }
    if (/skull/.test(id)) {
      paint(ctx, '#f2ece0', () => {
        ctx.beginPath();
        ctx.arc(head, 0, r, 0, Math.PI * 2);
      });
      ctx.fillStyle = INK;
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.arc(head + 3, s * 7, 4.5, 0, Math.PI * 2);
        ctx.fill();
      }
      return;
    }
    paint(ctx, col, () => {
      ctx.beginPath();
      ctx.arc(head, 0, r, 0, Math.PI * 2);
    }, { glow: glowOf(it) ?? (tier >= 1 ? col : null) });
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath();
    ctx.arc(head + r * 0.3, -r * 0.35, r * 0.28, 0, Math.PI * 2);
    ctx.fill();
  },
  fan: (ctx, it, id, L0) => {
    const tier = tierOf(it);
    const R = L0 * (0.95 + tier * 0.03);
    const spread = 0.95;
    const col = it.tint ?? '#fdfefe';
    const rib = tier >= 2 ? GOLD : '#6b4423';
    // 종이
    paint(ctx, col, () => {
      ctx.beginPath();
      ctx.arc(0, 0, R, -spread, spread);
      ctx.arc(0, 0, R * 0.38, spread, -spread, true);
      ctx.closePath();
    }, { glow: glowOf(it) });
    // 살
    ctx.strokeStyle = rib;
    ctx.lineWidth = 3;
    for (let i = 0; i <= 8; i++) {
      const t = -spread + (i * spread * 2) / 8;
      ctx.beginPath();
      ctx.moveTo(Math.cos(t) * 4, Math.sin(t) * 4);
      ctx.lineTo(Math.cos(t) * R * 0.97, Math.sin(t) * R * 0.97);
      ctx.stroke();
    }
    // 승급 부채: 둥근 무늬
    if (tier >= 1) {
      ctx.fillStyle = tier >= 3 ? '#e04a3a' : mix(col.length === 7 ? col : '#ffffff', '#1a3a6a', 0.55);
      ctx.beginPath();
      ctx.arc(R * 0.7, 0, R * 0.14, 0, Math.PI * 2);
      ctx.fill();
    }
    // 바깥 살 두 개와 사북
    paint(ctx, rib, () => {
      ctx.beginPath();
      ctx.arc(0, 0, 6, 0, Math.PI * 2);
    }, { line: 2 });
  },
};

// ── 쓰개: head = [가운데 x, 정수리 y, 머리 폭]. 이마 줄(y0)에 걸쳐 쓴다 ──
const HAT_OF = {
  headband: 'band', strawHat: 'satgat', leatherCap: 'cap', paeraengi: 'paeraengi', jeonrip: 'jeonrip', heukrip: 'gat',
  ironHelm: 'helm', eagleHelm: 'eagle', dragonHelm: 'dragon', phoenixCrown: 'crown',
};

function drawHat(ctx, id, [cx, top, w], side, back) {
  const it = ITEMS[id];
  const style = HAT_OF[id] ?? (id.startsWith('highHelm') ? 'crown' : 'helm');
  const y0 = top + w * 0.36;
  ctx.save();
  ctx.translate(cx + (side ? -w * 0.06 : 0), y0);
  HAT_ART[style](ctx, w, it, back);
  ctx.restore();
}

const ell = (ctx, x, y, rx, ry, a0 = 0, a1 = Math.PI * 2) => () => {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, a0, a1);
};

function brimmed(ctx, w, { brim, brimH, crownW, crownH, color, band, alpha = 1 }) {
  ctx.globalAlpha = alpha;
  paint(ctx, color, ell(ctx, 0, 0, (w * brim) / 2, w * brimH));
  paint(ctx, color, () => {
    ctx.beginPath();
    ctx.moveTo(-crownW * w / 2, 0);
    ctx.lineTo(-crownW * w * 0.46, -crownH * w);
    ctx.quadraticCurveTo(0, -crownH * w * 1.12, crownW * w * 0.46, -crownH * w);
    ctx.lineTo(crownW * w / 2, 0);
    ctx.closePath();
  });
  if (band) paint(ctx, band, rect(ctx, -crownW * w / 2, -w * 0.09, crownW * w, w * 0.08), { line: 2 });
  ctx.globalAlpha = 1;
}

function dome(ctx, w, color, rim) {
  paint(ctx, color, () => {
    ctx.beginPath();
    ctx.ellipse(0, 0, w * 0.56, w * 0.5, 0, Math.PI, Math.PI * 2);
    ctx.closePath();
  });
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.beginPath();
  ctx.ellipse(-w * 0.18, -w * 0.3, w * 0.12, w * 0.07, -0.5, 0, Math.PI * 2);
  ctx.fill();
  paint(ctx, rim, rect(ctx, -w * 0.6, -w * 0.06, w * 1.2, w * 0.12), { line: 2.5 });
}

const HAT_ART = {
  band: (ctx, w) => {
    paint(ctx, '#7a2a2a', rect(ctx, -w * 0.52, -w * 0.12, w * 1.04, w * 0.14));
  },
  satgat: (ctx, w) => {
    paint(ctx, '#d9b36a', () => {
      ctx.beginPath();
      ctx.moveTo(-w * 0.8, w * 0.06);
      ctx.lineTo(0, -w * 0.5);
      ctx.lineTo(w * 0.8, w * 0.06);
      ctx.quadraticCurveTo(0, w * 0.16, -w * 0.8, w * 0.06);
      ctx.closePath();
    });
    ctx.strokeStyle = '#9a7434';
    ctx.lineWidth = 2;
    for (const t of [-0.5, -0.25, 0, 0.25, 0.5]) {
      ctx.beginPath();
      ctx.moveTo(0, -w * 0.46);
      ctx.lineTo(t * w * 1.4, w * 0.08);
      ctx.stroke();
    }
  },
  cap: (ctx, w) => dome(ctx, w * 0.95, '#8a5a32', '#5a3a22'),
  paeraengi: (ctx, w) => brimmed(ctx, w, { brim: 1.4, brimH: 0.09, crownW: 0.62, crownH: 0.4, color: '#caa45c', band: '#7a2a2a' }),
  jeonrip: (ctx, w) => {
    brimmed(ctx, w, { brim: 1.3, brimH: 0.1, crownW: 0.68, crownH: 0.38, color: '#2a2622', band: '#a8322a' });
    paint(ctx, '#d43a2a', ell(ctx, 0, -w * 0.46, w * 0.09, w * 0.09), { line: 2 });
  },
  gat: (ctx, w) => brimmed(ctx, w, { brim: 1.55, brimH: 0.07, crownW: 0.56, crownH: 0.5, color: '#1c1a1a', alpha: 0.92 }),
  helm: (ctx, w) => {
    dome(ctx, w, '#9aa3ab', '#6a7178');
    paint(ctx, '#6a7178', rect(ctx, -w * 0.035, -w * 0.66, w * 0.07, w * 0.18), { line: 2 });
  },
  eagle: (ctx, w) => {
    dome(ctx, w, '#6f6a62', '#4a443c');
    paint(ctx, '#f4efe2', () => {
      ctx.beginPath();
      ctx.moveTo(-w * 0.04, -w * 0.48);
      ctx.quadraticCurveTo(w * 0.1, -w * 1.0, w * 0.36, -w * 0.92);
      ctx.quadraticCurveTo(w * 0.14, -w * 0.72, w * 0.08, -w * 0.46);
      ctx.closePath();
    }, { line: 2.5 });
  },
  dragon: (ctx, w, it) => {
    for (const s of [-1, 1]) paint(ctx, GOLD, () => {
      ctx.beginPath();
      ctx.moveTo(s * w * 0.3, -w * 0.38);
      ctx.quadraticCurveTo(s * w * 0.62, -w * 0.62, s * w * 0.5, -w * 0.9);
      ctx.quadraticCurveTo(s * w * 0.46, -w * 0.6, s * w * 0.18, -w * 0.44);
      ctx.closePath();
    }, { line: 2.5 });
    dome(ctx, w, '#2f8a78', GOLD);
    paint(ctx, it.tint ?? '#ff5e5e', ell(ctx, 0, -w * 0.06, w * 0.06, w * 0.06), { line: 2 });
  },
  crown: (ctx, w, it, back) => {
    const col = it.tint ?? GOLD;
    paint(ctx, GOLD, () => {
      ctx.beginPath();
      ctx.moveTo(-w * 0.42, w * 0.02);
      ctx.lineTo(-w * 0.46, -w * 0.3);
      for (let i = 0; i < 5; i++) {
        const x = -w * 0.46 + (i + 0.5) * (w * 0.92 / 5);
        ctx.lineTo(x, -w * (i % 2 ? 0.36 : 0.52));
        ctx.lineTo(x + (w * 0.92) / 10, -w * 0.3);
      }
      ctx.lineTo(w * 0.42, w * 0.02);
      ctx.closePath();
    }, { glow: it.tint ?? null });
    if (!back) paint(ctx, it === ITEMS.phoenixCrown ? '#e04a3a' : col, ell(ctx, 0, -w * 0.16, w * 0.07, w * 0.07), { line: 2 });
  },
};
