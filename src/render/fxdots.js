// 새 도트 모드의 마법·타격 효과: 'Ninja Adventure' FX 시트(CC0)를 칸마다 넘겨 그린다.
// 시트는 가로로 이어진 칸들이고, 색이 필요한 효과는 시트에 색을 덧입힌 사본을 만들어 둔다.
// 시트가 아직 안 받아졌거나 맞는 그림이 없으면 false 를 돌려줘 원래(벡터) 효과를 그리게 한다.

// [파일, 칸 수]
const SHEETS = {
  slash: ['slash.png', 4],
  cut: ['cut.png', 4],
  cutx: ['cutx.png', 4],
  claw: ['claw.png', 4],
  explosion: ['explosion.png', 9],
  ice: ['ice.png', 10],
  rock: ['rock.png', 14],
  thunder: ['thunder.png', 8],
  waterpillar: ['waterpillar.png', 9],
  spirit: ['spirit.png', 5],
  circle: ['circle.png', 4],
  spark: ['spark.png', 6],
  sparkle: ['sparkle.png', 10],
  aura: ['aura.png', 5],
  smoke: ['smoke.png', 6],
};
const sheets = {};
let ready = false;
export const fxReady = () => ready;

export function loadFx() {
  if (typeof Image === 'undefined') return Promise.resolve(false);
  const jobs = Object.entries(SHEETS).map(([key, [file]]) => new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      sheets[key] = img;
      resolve();
    };
    img.onerror = () => resolve();
    img.src = `assets/fx/${file}`;
  }));
  return Promise.all(jobs).then(() => {
    ready = Object.keys(SHEETS).every((k) => sheets[k]);
    return ready;
  });
}

const tinted = new Map();
/** 시트에 색을 덧입힌 사본(amount: 0~1) */
function tint(key, color, amount) {
  const id = `${key}|${color}|${amount}`;
  if (tinted.has(id)) return tinted.get(id);
  const src = sheets[key];
  const c = document.createElement('canvas');
  c.width = src.width;
  c.height = src.height;
  const ctx = c.getContext('2d');
  ctx.drawImage(src, 0, 0);
  ctx.globalCompositeOperation = 'source-atop';
  ctx.globalAlpha = amount;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, c.width, c.height);
  tinted.set(id, c);
  return c;
}

/**
 * 시트 한 칸 그리기. f: 0~1 진행, (x,y): 가운데(anchor 'bottom'이면 아래 가운데).
 * opts: { scale, angle, color, amount, alpha, anchor }
 */
function frame(ctx, key, f, x, y, { scale = 1, angle = 0, color, amount = 0.55, alpha = 1, anchor = 'center' } = {}) {
  const [, n] = SHEETS[key];
  const img = color ? tint(key, color, amount) : sheets[key];
  const fw = img.width / n;
  const fh = img.height;
  const i = Math.min(n - 1, Math.floor(f * n));
  const w = fw * scale;
  const h = fh * scale;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.globalAlpha = alpha;
  ctx.translate(Math.round(x), Math.round(y));
  if (angle) ctx.rotate(angle);
  ctx.drawImage(img, i * fw, 0, fw, fh, -w / 2, anchor === 'bottom' ? -h : -h / 2, w, h);
  ctx.restore();
}

const DIR_ANGLE = { right: 0, down: Math.PI / 2, left: Math.PI, up: -Math.PI / 2 };
const isWhite = (c) => !c || /^#f{3}(f{3})?$/i.test(c);

// 몬스터 기술 폭발 모양 → [시트, 배율, 색, 아래 기준?]
const BLAST = {
  fire: ['explosion', 1.2],
  ice: ['ice', 1.3],
  water: ['waterpillar', 1.2, null, true],
  quake: ['rock', 1.2],
  dark: ['spirit', 1.4, '#a066ff'],
  nova: ['spark', 1.5, '#ff9fd0'],
  slash: ['cutx', 1.4, '#ff6b6b'],
  dash: ['smoke', 1.2],
  arrow: ['cut', 1.2],
  spear: ['cut', 1.3, '#d5dbdb'],
};

const FX = {
  slash(ctx, e, f, cx, cy) {
    const a = DIR_ANGLE[e.dir] ?? 0;
    frame(ctx, 'slash', f, cx - Math.cos(a) * 3, cy - Math.sin(a) * 3, { scale: e.big ? 1.7 : 1.3, angle: a, color: isWhite(e.color) ? null : e.color });
  },
  hit(ctx, e, f, cx, cy) {
    frame(ctx, e.crit ? 'cutx' : 'cut', f, cx, cy, { scale: e.crit ? 1.6 : 1.1, color: e.crit ? '#ffd84d' : null, amount: 0.35 });
  },
  claw(ctx, e, f, cx, cy) {
    frame(ctx, 'claw', f, cx, cy, { scale: 1.3, color: '#ff4040', amount: 0.5 });
  },
  bite(ctx, e, f, cx, cy) {
    frame(ctx, 'claw', f, cx, cy, { scale: 1.2, color: '#ff4040', amount: 0.5 });
  },
  blast(ctx, e, f, cx, cy) {
    const [key, scale, color, bottom] = BLAST[e.look] ?? BLAST.fire;
    frame(ctx, key, f, cx, bottom ? cy + 12 : cy, { scale, color, anchor: bottom ? 'bottom' : 'center' });
  },
  bolt(ctx, e, f, cx, cy) {
    frame(ctx, 'thunder', f, cx, cy + 10, { scale: 2.2, anchor: 'bottom', color: isWhite(e.color) ? null : e.color, amount: 0.35 });
    if (f > 0.3) frame(ctx, 'circle', (f - 0.3) / 0.7, cx, cy + 6, { scale: 1.1, color: e.color, amount: 0.6 });
  },
  burst(ctx, e, f, cx, cy) {
    frame(ctx, 'circle', f, cx, cy, { scale: 1.2, color: e.color, amount: 0.7 });
  },
  orb(ctx, e, f, cx, cy) {
    frame(ctx, 'spark', f, cx, cy, { scale: 1.3, color: e.color, amount: 0.6 });
  },
  aura(ctx, e, f, cx, cy) {
    frame(ctx, 'aura', f, cx, cy + 14, { scale: 1.6, anchor: 'bottom', color: e.color, amount: 0.65 });
  },
  heal(ctx, e, f, cx, cy) {
    frame(ctx, 'sparkle', f, cx, cy - 2, { scale: 1.4, color: '#7dff9b', amount: 0.6 });
  },
  poof(ctx, e, f, cx, cy) {
    frame(ctx, 'smoke', f, cx, cy + 4, { scale: 1 });
  },
  smoke(ctx, e, f, cx, cy) {
    frame(ctx, 'smoke', f, cx, cy + 2, { scale: 1.5, color: '#4a4560', amount: 0.6 });
  },
  meteor(ctx, e, f, cx, cy) {
    if (f < 0.55) return false; // 떨어지는 동안은 원래 그림
    frame(ctx, 'explosion', (f - 0.55) / 0.45, cx, cy, { scale: 1.5 });
    return true;
  },
};

/** 도트 효과를 그렸으면 true */
export function drawFxDot(ctx, e, f, cx, cy) {
  const draw = FX[e.type];
  if (!ready || !draw) return false;
  return draw(ctx, e, f, cx, cy) !== false;
}
