// 몬스터(귀여운 입체 도트): 사람(chibi.js)과 같이 둥근 덩어리를 찍고 왼쪽 위 빛으로 음영을 넣는다(dotshape.js).
// 큰 머리, 반짝이는 큰 눈, 볼 홍조. 모양 12종 × 세 방향(앞·뒤·옆) × 걸음 3칸. 옆모습은 왼쪽을 보고 오른쪽은 뒤집는다.
// 색은 MONSTER_LOOK.pal 을 그대로 쓴다. 2배 해상도(MOB_RES)로 그린다. 모두 새로 그린 그림이다.
import { HEX, mix, mul, ellipsoid, capsule, trunk, dotCanvas } from './dotshape.js';

/** 그림 한 칸이 예전 도트 한 칸의 몇 분의 1인지 */
export const MOB_RES = 2;

const WHITE = [255, 255, 255];
const BLUSH = [255, 130, 140];
const TONGUE = [226, 60, 60];

/** 색표에서 색 꺼내기(없거나 색이 아니면 대신 쓸 색) */
const pc = (pal, k, fb) => (typeof pal[k] === 'string' && pal[k][0] === '#' ? HEX(pal[k]) : HEX(fb));
const merge = (W, ...parts) => {
  const seen = new Set();
  return parts.flat().filter(([x, y]) => !seen.has(y * W + x) && seen.add(y * W + x));
};
const bright = (c) => c[0] + c[1] + c[2] > 520;

// 눈: E 눈동자, 1 반짝임
const EYE_BIG = ['.EE.', 'E1EE', 'EEEE', '.EE.'];
const EYE_SMALL = ['EE', '1E'];

/** 템플릿 줄 길이가 고른지(테스트용) */
export function checkMobTemplates() {
  return Object.entries({ EYE_BIG, EYE_SMALL }).filter(([, r]) => r.some((x) => x.length !== r[0].length)).map(([n]) => n);
}

/** 귀여운 눈. 눈 색이 밝으면(흰 눈) 가운데 검은 눈동자를 찍는다 */
function eye(g, x, y, color, big = true) {
  const X = Math.round(x);
  const Y = Math.round(y);
  g.stamp(big ? EYE_BIG : EYE_SMALL, X, Y, { E: color, 1: WHITE });
  if (!bright(color)) return;
  const d = [24, 18, 20];
  if (big) {
    g.set(X + 2, Y + 1, d);
    g.set(X + 2, Y + 2, d);
    g.set(X + 1, Y + 2, d);
  } else g.set(X + 1, Y + 1, d);
}
const blush = (g, x, y, base, n = 2) => {
  for (let i = 0; i < n; i++) g.set(Math.round(x) + i, Math.round(y), mix(base, BLUSH, 0.55));
};

// ── 네발짐승(여우·늑대·범·멧돼지·쥐·다람쥐·토끼) ──
// P: { W, H, body:[cx,cy,rx,ry], head:r, headUp, snout:[길이,굵기], ears, tail, leg:[r], c:{main, light, nose, eye, tail, tip, inner, k}, tusk?, pigNose?, hop? }
function quad(g, P, view, step) {
  const { W, H, c } = P;
  let [cx, cy, rx, ry] = P.body;
  const o = { outline: c.k };
  const foot = H - 3;
  const lift = P.hop ? [0, 3, 1][step] : 0;
  cy -= lift;
  const r = P.head;
  const far = mul(c.main, 0.86);
  const sw = [0, 3, -3][step];
  const legR = P.leg[0];
  const big = r > 6;
  if (view === 'left') {
    const hipY = cy + ry * 0.35;
    const fx = cx - rx * 0.55;
    const bx = cx + rx * 0.55;
    const legs = (front, back, color) => {
      g.paint(capsule(fx + front * 0.3, hipY, fx + front, foot - lift, legR, legR * 0.85), color, o);
      g.paint(capsule(bx + back * 0.3, hipY, bx + back, foot - lift, legR * 1.1, legR * 0.85), color, o);
    };
    legs(sw, -sw, far);
    tail(g, P, cx + rx * 0.85, cy - ry * 0.2, 1, step);
    g.paint(ellipsoid(cx, cy, rx, ry), c.main, o);
    g.paint(ellipsoid(cx - rx * 0.1, cy + ry * 0.45, rx * 0.72, ry * 0.5, (x, y) => y > cy + ry * 0.12), c.light, { edge: false });
    legs(-sw, sw, c.main);
    const hx = cx - rx * 0.82;
    const hy = cy - ry * (P.headUp ?? 0.8);
    ears(g, P, hx + r * 0.25, hy - r * 0.55, r, 'side');
    g.paint(ellipsoid(hx, hy, r, r * 0.95), c.main, o);
    const [sl, sr] = P.snout;
    if (sl > 0) g.paint(ellipsoid(hx - r * 0.75, hy + r * 0.32, r * sl, r * sr), c.light, o);
    if (P.pigNose) g.paint(ellipsoid(hx - r * 1.05, hy + r * 0.3, r * 0.22, r * 0.38), c.nose, o);
    else g.paint(ellipsoid(hx - r * (0.75 + sl * 0.9), hy + r * 0.2, Math.max(1.2, r * 0.18), Math.max(1, r * 0.15)), c.nose, { edge: false });
    if (P.tusk) g.paint(capsule(hx - r * 0.85, hy + r * 0.62, hx - r * 1.05, hy + r * 0.2, 1.1, 0.6), c.tusk, o);
    eye(g, hx - r * 0.55, hy - r * 0.42, c.eye, big);
    blush(g, hx - r * 0.2, hy + r * 0.38, c.main, big ? 2 : 1);
    return;
  }
  const mx = W / 2;
  if (view === 'up') {
    g.paint(capsule(mx - rx * 0.32, cy, mx - rx * 0.32, foot - (step === 1 ? 2 : 0), legR, legR * 0.85), c.main, o);
    g.paint(capsule(mx + rx * 0.32, cy, mx + rx * 0.32, foot - (step === 2 ? 2 : 0), legR, legR * 0.85), c.main, o);
    g.paint(ellipsoid(mx, cy, rx * 0.62, ry * 1.05), c.main, o);
    ears(g, P, mx, cy - ry - r * 0.6, r, 'back');
    g.paint(ellipsoid(mx, cy - ry * 0.95, r, r * 0.95), c.main, o);
    tail(g, P, mx, cy + ry * 0.2, 0, step);
    return;
  }
  // 앞(down)
  tail(g, P, mx + rx * 0.45, cy - ry * 0.3, 0, step);
  g.paint(ellipsoid(mx, cy + ry * 0.1, rx * 0.62, ry * 1.05), c.main, o);
  g.paint(ellipsoid(mx, cy + ry * 0.35, rx * 0.38, ry * 0.7), c.light, { edge: false });
  g.paint(capsule(mx - rx * 0.3, cy + ry * 0.4, mx - rx * 0.3, foot - (step === 1 ? 2 : 0), legR, legR * 0.85), c.main, o);
  g.paint(capsule(mx + rx * 0.3, cy + ry * 0.4, mx + rx * 0.3, foot - (step === 2 ? 2 : 0), legR, legR * 0.85), c.main, o);
  const hy = cy - ry * 0.9;
  ears(g, P, mx, hy - r * 0.6, r, 'front');
  g.paint(ellipsoid(mx, hy, r * 1.05, r), c.main, o);
  const [sl, sr] = P.snout;
  if (sl > 0) g.paint(ellipsoid(mx, hy + r * 0.45, r * Math.max(sr, 0.42), r * sr * 0.9), c.light, o);
  if (P.pigNose) g.paint(ellipsoid(mx, hy + r * 0.45, r * 0.38, r * 0.26), c.nose, o);
  else g.paint(ellipsoid(mx, hy + r * 0.28, Math.max(1.2, r * 0.17), Math.max(1, r * 0.13)), c.nose, { edge: false });
  if (P.tusk) {
    g.paint(capsule(mx - r * 0.5, hy + r * 0.7, mx - r * 0.62, hy + r * 0.3, 1.1, 0.6), c.tusk, o);
    g.paint(capsule(mx + r * 0.5, hy + r * 0.7, mx + r * 0.62, hy + r * 0.3, 1.1, 0.6), c.tusk, o);
  }
  eye(g, mx - r * 0.52 - (big ? 2 : 1), hy - r * 0.38, c.eye, big);
  eye(g, mx + r * 0.52 - (big ? 2 : 1), hy - r * 0.38, c.eye, big);
  blush(g, mx - r * 0.75, hy + r * 0.3, c.main, big ? 2 : 1);
  blush(g, mx + r * 0.75 - (big ? 1 : 0), hy + r * 0.3, c.main, big ? 2 : 1);
}

/** 귀: 뾰족·둥근·긴·작은 */
function ears(g, P, x, y, r, view) {
  const { c } = P;
  const o = { outline: c.k };
  const offs = view === 'side' ? [0.15, -0.25] : [-0.55, 0.55];
  for (const dx of offs) {
    const ex = x + dx * r;
    if (P.ears === 'round') {
      g.paint(ellipsoid(ex, y + r * 0.1, r * 0.48, r * 0.48), c.main, o);
      if (view !== 'back') g.paint(ellipsoid(ex, y + r * 0.15, r * 0.28, r * 0.28), c.inner, { edge: false });
    } else if (P.ears === 'long') {
      g.paint(capsule(ex, y + r * 0.4, ex + dx * 1.5, y - r * 1.2, r * 0.3, r * 0.24), c.main, o);
      if (view !== 'back') g.paint(capsule(ex, y + r * 0.3, ex + dx * 1.5, y - r * 1.0, r * 0.13), c.inner, { edge: false });
    } else {
      const h = P.ears === 'small' ? 0.45 : 0.85;
      g.paint(capsule(ex, y + r * 0.45, ex + dx * r * 0.3, y - r * h, r * 0.34, r * 0.08), c.main, o);
      if (view !== 'back' && P.ears !== 'small') g.paint(capsule(ex, y + r * 0.4, ex + dx * r * 0.25, y - r * h * 0.55, r * 0.14), c.inner, { edge: false });
    }
  }
}

/** 꼬리: 복슬(끝 색)·큰 털·가는·말린·솜뭉치. dir 1 = 옆모습(뒤로 뻗음), 0 = 앞·뒤 */
function tail(g, P, x, y, dir, step) {
  const { c } = P;
  const o = { outline: c.k };
  const wag = [0, 1, -1][step];
  if (P.tail === 'fluffy') {
    const tx = x + (dir ? 9 : 5);
    const ty = y - (dir ? 6 : 8) + wag;
    g.paint(capsule(x, y, tx, ty, 2.6, 4), c.tail, o);
    g.paint(ellipsoid(tx + (dir ? 1 : 0.5), ty - 1, 3, 3), c.tip, { edge: false });
  } else if (P.tail === 'bushy') {
    const pts = merge(g.W, capsule(x, y + 2, x + (dir ? 6 : 4), y - 6, 4, 5.5), capsule(x + (dir ? 6 : 4), y - 6, x + (dir ? 3 : 1), y - 13 + wag, 5.5, 4));
    g.paint(pts, c.tail, o);
  } else if (P.tail === 'thin') {
    g.paint(capsule(x, y + 2, x + (dir ? 10 : 5), y + 4 + wag, 1.2, 0.7), c.inner, o);
  } else if (P.tail === 'curl') {
    g.paint(capsule(x, y, x + 3, y - 3 + wag, 1.2, 1), c.main, o);
  } else if (P.tail === 'puff') {
    g.paint(ellipsoid(x + (dir ? 1 : 0), y + 1, 3, 3), c.tip ?? c.main, o);
  }
}

/** 아홉 꼬리(구미호): 몸 뒤로 부채처럼 펼친다 */
function nineTails(g, c, x, y, side, step) {
  const o = { outline: c.k };
  const wag = [0, 1, -1][step];
  const [a0, a1] = side ? [-115, 15] : [-170, -10];
  for (let i = 0; i < 9; i++) {
    const a = ((a0 + ((a1 - a0) * i) / 8) * Math.PI) / 180;
    const tx = x + Math.cos(a) * 13;
    const ty = y + Math.sin(a) * 13 + (i % 2 ? wag : -wag);
    g.paint(capsule(x, y, tx, ty, 2.2, 3.2), c.tail, o);
    g.paint(ellipsoid(tx, ty, 2.4, 2.4), c.tip, { edge: false });
  }
}

// ── 서서 걷는 몸(도깨비·해골) ──
function goblin(g, c, view, step) {
  const o = { outline: c.k };
  const mx = g.W / 2;
  const foot = g.H - 3;
  const side = view === 'left';
  const swing = [0, 3, -3][step];
  const legs = (x, lift) => {
    g.paint(capsule(x, 34, x, foot - 2 - lift, 3, 2.7), c.skin, o);
    g.paint(ellipsoid(x - (side ? 1 : 0), foot - lift, 3.4, 2.2), c.dark, o);
  };
  const club = (x0, y0, x1, y1) => {
    g.paint(capsule(x0, y0, x1, y1, 1.6, 3.6), c.club, o);
    for (const t of [0.55, 0.75, 0.92]) g.set(Math.round(x0 + (x1 - x0) * t + 2), Math.round(y0 + (y1 - y0) * t), mul(c.club, 0.6));
  };
  if (view === 'up') club(mx + 9, 30, mx + 11, 14);
  if (side) {
    legs(mx + 2 + swing * 0.5, 0);
    legs(mx - 2 - swing * 0.5, 0);
  } else {
    legs(mx - 4, step === 1 ? 2 : 0);
    legs(mx + 4, step === 2 ? 2 : 0);
  }
  // 배와 범가죽 두렁이
  g.paint(ellipsoid(mx, 28, side ? 7.5 : 9, 7.5), c.skin, o);
  const cloth = trunk(30, 36, (y) => mx - (side ? 7 : 8.5) + (y - 30) * 0.1, (y) => mx + (side ? 7 : 8.5) - (y - 30) * 0.1);
  g.paint(cloth, c.cloth, o);
  for (const [x, y] of cloth) if ((x * 3 + y * 5) % 7 === 0) g.set(x, y, c.hair);
  // 팔과 방망이
  if (side) {
    club(mx - 9, 30, mx - 13, 15);
    g.paint(capsule(mx - 1, 24, mx - 8, 29, 2.4), c.skin, o);
  } else {
    g.paint(capsule(mx + 7, 24, mx + 10, 31, 2.4), c.skin, o);
    if (view === 'down') club(mx - 10, 31, mx - 12, 15);
    g.paint(capsule(mx - 7, 24, mx - 10, 31, 2.4), c.skin, o);
  }
  // 머리·헝클어진 머리털·뿔
  const hy = 13;
  const hx = side ? mx - 1 : mx;
  g.paint(ellipsoid(hx, hy, 9.5, 9), c.skin, o);
  const hairPts = ellipsoid(hx + (side ? 2 : 0), hy - 3, 10, 7, (x, y) => (view === 'up' ? y < hy + 5 : side ? y < hy - 3 || x > hx + 3 : y < hy - 4 + ((x * 7) % 3)));
  g.paint(hairPts, c.hair, o);
  g.paint(capsule(hx, hy - 8, hx + (side ? -1 : 0), hy - 15, 2.4, 0.6), c.horn, { ...o, max: 5 });
  if (view === 'up') return;
  if (side) {
    eye(g, hx - 7, hy - 1, c.eye);
    g.paint(ellipsoid(hx - 9, hy + 3, 2, 1.6), mul(c.skin, 0.9), o);
    g.set(Math.round(hx - 6), hy + 6, c.teeth);
    blush(g, hx - 4, hy + 4, c.skin);
    return;
  }
  eye(g, hx - 6, hy - 1, c.eye);
  eye(g, hx + 2, hy - 1, c.eye);
  for (let x = hx - 3; x <= hx + 2; x++) g.set(x, hy + 5, mul(c.skin, 0.55));
  g.set(hx - 2, hy + 6, c.teeth);
  g.set(hx + 1, hy + 6, c.teeth);
  blush(g, hx - 8, hy + 3, c.skin);
  blush(g, hx + 6, hy + 3, c.skin);
}

function skeleton(g, c, view, step, pal) {
  const o = { outline: c.k };
  const mx = g.W / 2;
  const foot = g.H - 3;
  const side = view === 'left';
  const sw = [0, 3, -3][step];
  const joint = mul(c.bone, 0.78);
  const dark = [40, 30, 28];
  if (pal.w === 'bow' && view === 'up') g.paint(capsule(mx + 9, 18, mx + 9, 36, 1), c.cloth, o);
  const leg = (x, fx, lift) => {
    g.paint(capsule(x, 33, fx, foot - 1 - lift, 1.6), c.bone, o);
    g.paint(ellipsoid(fx - (side ? 1 : 0), foot - lift, 2.6, 1.6), joint, o);
  };
  if (side) {
    leg(mx + 1, mx + 1 + sw, 0);
    leg(mx - 1, mx - 1 - sw, 0);
  } else {
    leg(mx - 3, mx - 3, step === 1 ? 2 : 0);
    leg(mx + 3, mx + 3, step === 2 ? 2 : 0);
  }
  // 골반·등뼈·갈비뼈·허리감개
  g.paint(ellipsoid(mx, 32, 4.5, 2.4), c.bone, o);
  g.paint(capsule(mx, 18, mx, 31, 1.2), joint, o);
  const ribs = ellipsoid(mx, 24, side ? 4.5 : 6, 5.2);
  g.paint(ribs, c.bone, o);
  for (const [x, y] of ribs) if (y % 2 === 0 && Math.abs(x + 0.5 - mx) > 1) g.set(x, y, joint);
  g.paint(trunk(31, 35, () => mx - 5, () => mx + 5), c.cloth, o);
  // 팔과 무기
  const hand = side ? [mx - 6 - sw * 0.5, 31] : [mx - 8, 31];
  if (!side) g.paint(capsule(mx + 5.5, 20, mx + 8, 31, 1.4), c.bone, o);
  g.paint(capsule(mx - (side ? 1 : 5.5), 20, hand[0], hand[1], 1.4), c.bone, o);
  if (pal.w === 'sword' && view !== 'up') {
    g.paint(capsule(hand[0], hand[1] - 1, hand[0] - 2, hand[1] - 18, 1.4, 0.6), [220, 228, 232], { ...o, max: 5 });
    g.paint(capsule(hand[0] - 3, hand[1] - 3, hand[0] + 3, hand[1] - 3, 1), [214, 176, 72], o);
  }
  if (pal.w === 'bow' && view !== 'up') {
    for (let t = -1; t <= 1; t += 0.1) g.set(Math.round(hand[0] - 3 - Math.cos(t) * 4), Math.round(hand[1] - 4 + t * 9), c.cloth);
    g.paint(capsule(hand[0] - 3, hand[1] - 13, hand[0] - 3, hand[1] + 5, 0.5), [230, 230, 220], { edge: false });
  }
  // 해골(투구)
  const hy = 11;
  const hx = side ? mx - 1 : mx;
  g.paint(ellipsoid(hx, hy, 7.8, 7.4), c.bone, { ...o, max: 5 });
  g.paint(ellipsoid(hx - (side ? 2 : 0), hy + 6, side ? 3.5 : 4.5, 2.4), c.bone, o);
  if (pal.h) g.paint(ellipsoid(hx, hy - 3, 8.6, 6, (x, y) => y < hy - 3), HEX(pal.h), { ...o, max: 5 });
  if (view === 'up') return;
  const socket = (x) => {
    g.paint(ellipsoid(x, hy + 1, 2.2, 2.4), dark, { edge: false, dither: false });
    g.set(Math.round(x - 0.5), hy + 1, c.eye);
  };
  if (side) socket(hx - 4.5);
  else {
    socket(hx - 3.2);
    socket(hx + 3.2);
  }
  for (let x = hx - (side ? 4 : 2); x <= hx + (side ? -2 : 2); x += 2) g.set(x, hy + 7, dark);
}

// ── 귀신(긴 머리 소복), 달걀귀신 ──
function ghost(g, c, view, step) {
  const o = { outline: c.k };
  const mx = g.W / 2;
  const side = view === 'left';
  const wave = [0, 1, 2][step];
  // 소복: 아래로 넓어지고 끝이 나풀거린다
  const robe = trunk(20, 38, (y) => mx - 6 - (y - 20) * 0.32 + (side ? 1 : 0), (y) => mx + 6 + (y - 20) * 0.32 + (side ? 1 : 0));
  g.paint(robe, c.robe, o);
  for (const [x, y] of robe) if ((x + wave) % 4 === 0 && y > 26) g.set(x, y, c.accent);
  for (let x = Math.round(mx - 11); x <= Math.round(mx + 12); x++) {
    const d = [3, 2, 1][(x + wave) % 3];
    for (let k = 0; k < d; k++) g.set(x, 39 + k, k === d - 1 ? c.k : c.robe);
  }
  if (!side) {
    g.paint(capsule(mx - 7, 23, mx - 9, 31, 3, 3.6), c.robe, o);
    g.paint(capsule(mx + 7, 23, mx + 9, 31, 3, 3.6), c.robe, o);
  } else g.paint(capsule(mx, 23, mx - 8, 28, 3, 3.6), c.robe, o);
  // 얼굴과 긴 머리카락
  const hy = 13;
  const hx = side ? mx - 1 : mx;
  if (view !== 'up') g.paint(ellipsoid(hx, hy, 7.6, 8), c.face, { ...o, warm: true });
  const hairLine = view === 'up'
    ? (x, y) => y < 30
    : side
      ? (x, y) => y < hy - 4 || (x > hx - 1 && y < 30)
      : (x, y) => {
        const dx = Math.abs(x + 0.5 - hx);
        return y < hy - 4 + dx * 0.2 || (dx > 5.5 && y < 30);
      };
  g.paint(ellipsoid(hx + (side ? 2 : 0), hy + 6, 9.5, 17, hairLine), c.hair, { ...o, max: 5 });
  if (view === 'up') return;
  if (side) {
    eye(g, hx - 6, hy - 1, c.eye, false);
    g.set(hx - 6, hy + 4, c.mouth);
    return;
  }
  eye(g, hx - 4, hy - 1, c.eye, false);
  eye(g, hx + 2, hy - 1, c.eye, false);
  g.set(hx - 1, hy + 4, c.mouth);
  g.set(hx, hy + 4, c.mouth);
  g.set(hx, hy + 5, c.mouth);
}

function eggGhost(g, c, view, step) {
  const o = { outline: c.k };
  const mx = g.W / 2;
  const wave = [0, 1, 2][step];
  const robe = trunk(19, 31, (y) => mx - 5 - (y - 19) * 0.3, (y) => mx + 5 + (y - 19) * 0.3);
  g.paint(robe, c.shell, o);
  for (let x = Math.round(mx - 8); x <= Math.round(mx + 9); x++) if ((x + wave) % 3 !== 0) g.set(x, 32, c.k);
  g.paint(capsule(mx - 6, 21, mx - 8, 27, 2.2, 2.8), c.shell, o);
  g.paint(capsule(mx + 6, 21, mx + 8, 27, 2.2, 2.8), c.shell, o);
  g.paint(ellipsoid(mx, 11, 7.5, 9.5), c.shell, { ...o, max: 5 });
}

// ── 뱀·이무기·용(용은 뿔·수염·등지느러미) ──
function serpent(g, c, view, step, dragon) {
  const o = { outline: c.k };
  const mx = g.W / 2;
  const base = g.H - 4;
  const sway = [0, 1, -1][step];
  const side = view === 'left';
  const coil = [ellipsoid(mx + 1, base, 14, 4.5), ellipsoid(mx, base - 5, 11, 4.2)];
  for (const pts of coil) {
    g.paint(pts, c.body, o);
    for (const [x, y] of pts) if ((x * 5 + y * 3) % 11 === 0) g.set(x, y, c.pattern);
  }
  const top = side ? [mx - 7 + sway, 11] : [mx + sway, 10];
  g.paint(capsule(mx - (side ? 1 : 0), base - 7, ...top, 4.2, 3.6), c.body, o);
  if (view !== 'up') g.paint(capsule(mx - (side ? 3 : 0), base - 7, top[0] - (side ? 1.5 : 0), top[1] + 2, 2.2, 1.8), c.belly, { edge: false });
  if (dragon) {
    for (let t = 0.15; t < 0.95; t += 0.18) {
      const x = mx + (top[0] - mx) * t + (side ? 3 : 0);
      const y = base - 7 + (top[1] - base + 7) * t;
      g.paint(capsule(x + (side ? 1 : 0), y, x + (side ? 4 : 0), y - (side ? 1 : 3), 1.4, 0.5), c.pattern, o);
    }
  }
  const [hx, hy] = [top[0] - (side ? 2 : 0), top[1] - 1];
  if (dragon) {
    g.paint(capsule(hx + (side ? 3 : -3), hy - 3, hx + (side ? 6 : -5), hy - 9, 1.4, 0.5), c.belly, { ...o, max: 5 });
    if (!side) g.paint(capsule(hx + 3, hy - 3, hx + 5, hy - 9, 1.4, 0.5), c.belly, { ...o, max: 5 });
  }
  g.paint(ellipsoid(hx, hy, side ? 6.4 : 5.6, 4.8), c.body, { ...o, max: 5 });
  if (side) g.paint(ellipsoid(hx - 3.5, hy + 1.5, 3, 2.2), c.body, o);
  if (view === 'up') return;
  const tongue = (pts) => step && pts.forEach(([x, y]) => g.set(Math.round(x), Math.round(y), TONGUE));
  if (side) {
    eye(g, hx - 3, hy - 3, c.eye, false);
    tongue([[hx - 7, hy + 2], [hx - 8, hy + 2], [hx - 9, hy + 1], [hx - 9, hy + 3]]);
    if (dragon) g.paint(capsule(hx - 5, hy + 2, hx - 10, hy + 5, 0.5), c.belly, { edge: false });
    return;
  }
  eye(g, hx - 4, hy - 2, c.eye, false);
  eye(g, hx + 2, hy - 2, c.eye, false);
  tongue([[hx, hy + 4], [hx, hy + 5]]);
  if (dragon) {
    g.paint(capsule(hx - 3, hy + 2, hx - 8, hy + 5, 0.5), c.belly, { edge: false });
    g.paint(capsule(hx + 3, hy + 2, hx + 8, hy + 5, 0.5), c.belly, { edge: false });
  }
}

// ── 불새 ──
function bird(g, c, view, step) {
  const o = { outline: c.k };
  const mx = g.W / 2;
  const flap = [0, -8, 7][step];
  const flame = [255, 220, 120];
  if (view === 'left') {
    for (const [dx, dy] of [[14, 6], [16, 2], [13, 10]]) g.paint(capsule(mx + 4, 21, mx + 4 + dx, 21 + dy, 2.2, 1), c.wing, o);
    g.paint(ellipsoid(mx + 2, 21, 9, 6.5), c.body, o);
    g.paint(capsule(mx + 2, 17, mx + 15, 14 + flap, 4, 1.6), c.wing, o);
    g.paint(capsule(mx - 1, 26, mx - 1, 31, 0.9), c.beak, { edge: false });
    g.paint(capsule(mx + 4, 26, mx + 4, 31, 0.9), c.beak, { edge: false });
    g.paint(ellipsoid(mx - 6, 12, 5.6, 5.2), c.body, { ...o, max: 5 });
    for (const [dx, dy] of [[-1, -7], [1, -8], [3, -6]]) g.paint(capsule(mx - 6, 9, mx - 6 + dx, 9 + dy, 1.4, 0.5), flame, o);
    g.paint(capsule(mx - 11, 13, mx - 15, 14, 1.6, 0.5), c.beak, o);
    eye(g, mx - 10, 10, c.eye, false);
    blush(g, mx - 8, 14, c.body);
    return;
  }
  for (const s of [-1, 1]) g.paint(capsule(mx + s * 4, 18, mx + s * 17, 16 + flap, 4, 1.8), c.wing, o);
  for (const dx of [-3, 0, 3]) g.paint(capsule(mx + dx * 0.5, 25, mx + dx, 33, 1.8, 1), c.wing, o);
  g.paint(ellipsoid(mx, 20, 7.5, 7), c.body, o);
  g.paint(ellipsoid(mx, 10, 5.6, 5.2), c.body, { ...o, max: 5 });
  for (const dx of [-2, 0, 2]) g.paint(capsule(mx, 7, mx + dx, 1, 1.4, 0.5), flame, o);
  if (view === 'up') return;
  g.paint(ellipsoid(mx, 12.5, 1.6, 1.4), c.beak, o);
  eye(g, mx - 4, 8, c.eye, false);
  eye(g, mx + 2, 8, c.eye, false);
}

// ── 박쥐 ──
function bat(g, c, view, step) {
  const o = { outline: c.k };
  const mx = g.W / 2;
  const flap = [0, -6, 5][step];
  const side = view === 'left';
  const wing = (s) => {
    const tip = [mx + s * (side ? 10 : 16), 10 + flap];
    const reach = side ? 6 : 10;
    g.paint(merge(g.W, capsule(mx, 11, ...tip, 3, 1.2), capsule(...tip, mx + s * reach, 17, 1.2, 2.4), capsule(mx, 13, mx + s * reach, 17, 2.6, 2.4)), c.wing, o);
    g.paint(capsule(mx, 11, ...tip, 0.6), c.body, { edge: false });
  };
  if (side) wing(1);
  else {
    wing(-1);
    wing(1);
  }
  g.paint(ellipsoid(mx, 12, 5, 5.5), c.body, { ...o, max: 5 });
  for (const s of side ? [1] : [-1, 1]) g.paint(capsule(mx + s * 2.5, 8, mx + s * 3.5, 2, 1.6, 0.5), c.body, o);
  if (view === 'up') return;
  if (side) {
    eye(g, mx - 4, 10, c.eye, false);
    return;
  }
  eye(g, mx - 3.5, 10, c.eye, false);
  eye(g, mx + 1.5, 10, c.eye, false);
  g.set(mx - 1, 15, WHITE);
  g.set(mx, 15, WHITE);
}

// ── 몸 종류별 판 크기·색 ──
const QUADS = {
  canine: (pal) => ({
    W: 48, H: 34, body: [27, 19, 12, 7], head: 8, snout: [0.6, 0.42], ears: 'point', tail: 'fluffy', leg: [2.6],
    c: { main: pc(pal, 'o', '#e0782a'), light: pc(pal, 'l', '#fbe3c6'), nose: pc(pal, 'n', '#111111'), eye: pc(pal, 'e', '#111111'), tail: pc(pal, 'o', '#e0782a'), tip: pc(pal, 't', '#ffffff'), inner: pc(pal, 'l', '#fbe3c6'), k: pc(pal, 'k', '#222222') },
  }),
  boar: (pal) => ({
    W: 46, H: 34, body: [26, 18, 14, 9], head: 8.5, headUp: 0.35, snout: [0, 0], pigNose: true, tusk: true, ears: 'small', tail: 'curl', leg: [3],
    c: { main: pc(pal, 'b', '#6e4a2e'), light: mix(pc(pal, 'b', '#6e4a2e'), [255, 240, 220], 0.25), nose: pc(pal, 'n', '#c48a6a'), eye: pc(pal, 'e', '#ff4d4d'), tusk: pc(pal, 'w', '#f4ecd8'), inner: pc(pal, 'n', '#c48a6a'), k: pc(pal, 'k', '#1e130b') },
  }),
  rat: (pal) => ({
    W: 34, H: 24, body: [19, 14, 9, 5.5], head: 5.6, snout: [0.55, 0.4], ears: 'round', tail: 'thin', leg: [1.8],
    c: { main: pc(pal, 'b', '#8a7f74'), light: pc(pal, 'w', '#d9cfc4'), nose: pc(pal, 'p', '#f5a6b8'), eye: pc(pal, 'e', '#111111'), inner: pc(pal, 'p', '#f5a6b8'), k: pc(pal, 'k', '#2a2420') },
  }),
  squirrel: (pal) => ({
    W: 32, H: 30, body: [15, 19, 7, 6], head: 6.4, headUp: 0.95, snout: [0.4, 0.32], ears: 'point', tail: 'bushy', leg: [1.9],
    c: { main: pc(pal, 'b', '#a0612b'), light: pc(pal, 'w', '#f0d9b5'), nose: pc(pal, 'p', '#f5a6b8'), eye: pc(pal, 'e', '#111111'), tail: pc(pal, 'T', '#c47a3a'), inner: pc(pal, 'p', '#f5a6b8'), k: pc(pal, 'k', '#2b1a10') },
  }),
  rabbit: (pal) => ({
    W: 30, H: 34, body: [16, 23, 8, 6.5], head: 6.8, headUp: 1.0, snout: [0.35, 0.3], ears: 'long', tail: 'puff', leg: [2], hop: true,
    c: { main: pc(pal, 'w', '#f4f4f4'), light: [255, 255, 255], nose: pc(pal, 'p', '#f5a6b8'), eye: pc(pal, 'e', '#c0392b'), tip: [255, 255, 255], inner: pc(pal, 'p', '#f5a6b8'), k: pc(pal, 'k', '#3a3a3a') },
  }),
};
const SIZES = { goblin: [36, 46], skeleton: [32, 46], ghost: [34, 46], egg: [28, 36], serpent: [40, 36], bird: [44, 36], bat: [40, 26] };

/**
 * 몬스터 한 칸. look: MONSTER_LOOK 항목({ art, pal, tails?, scale? }), dir: up|down|left|right, step: 0·1·2.
 * 돌려주는 것: { w, h, data, res } — res 는 해상도 배수(MOB_RES).
 */
export function mobFrame(look, dir = 'down', step = 0) {
  const pal = look.pal;
  const view = dir === 'right' ? 'left' : dir;
  const art = look.art;
  let g;
  if (QUADS[art]) {
    const P = QUADS[art](pal);
    if (look.tails) {
      // 구미호: 판을 넓혀 아홉 꼬리를 몸 뒤에
      P.W += 14;
      P.H += 10;
      P.body = [P.body[0] + (view === 'left' ? 2 : 7), P.body[1] + 10, P.body[2], P.body[3]];
      P.tail = 'none';
    }
    g = dotCanvas(P.W, P.H);
    if (look.tails) {
      const [bx, by, brx] = P.body;
      nineTails(g, P.c, view === 'left' ? bx + brx * 0.7 : g.W / 2, by - 4, view === 'left', step);
    }
    quad(g, P, view, step);
    if (pal.c && art === 'rat') {
      // 쥐왕 관
      const [bx, by, brx, bry] = P.body;
      const x = view === 'left' ? bx - brx * 0.82 : g.W / 2;
      const y = by - bry * (view === 'left' ? 0.8 : 0.9) - P.head - 1;
      g.paint(trunk(y - 2, y + 1, () => x - 3, () => x + 3), HEX(pal.c), { outline: P.c.k, max: 5 });
      for (const dx of [-2.5, 0, 2.5]) g.set(Math.round(x + dx), Math.round(y - 3), HEX(pal.c));
    }
  } else {
    const [W, H] = SIZES[art] ?? SIZES.goblin;
    g = dotCanvas(W, H);
    if (art === 'skeleton') {
      skeleton(g, { bone: pc(pal, 'b', '#e8e2d0'), eye: pc(pal, 'e', '#ff3b3b'), cloth: pc(pal, 'c', '#7a6a5a'), k: pc(pal, 'k', '#2a2620') }, view, step, pal);
    } else if (art === 'ghost') {
      ghost(g, { hair: pc(pal, 'h', '#111111'), robe: pc(pal, 'b', '#eef2f8'), face: pc(pal, 'w', '#eef2f8'), eye: pc(pal, 'e', '#3a0a0a'), mouth: pc(pal, 'm', '#a01818'), accent: mul(pc(pal, 'b', '#eef2f8'), 0.88), k: pc(pal, 'k', '#1a1a22') }, view, step);
    } else if (art === 'egg') {
      eggGhost(g, { shell: pc(pal, 'b', '#fbfaf4'), k: pc(pal, 'k', '#5a5a66') }, view, step);
    } else if (art === 'serpent') {
      serpent(g, { body: pc(pal, 'g', '#5a8a3a'), belly: pc(pal, 'y', '#d9e88a'), eye: pc(pal, 'e', '#111111'), pattern: pc(pal, 'n', '#14240c'), k: pc(pal, 'k', '#14240c') }, view, step, !!look.scale);
    } else if (art === 'bird') {
      bird(g, { body: pc(pal, 'r', '#e8341c'), wing: pc(pal, 'o', '#ff9a2e'), beak: pc(pal, 'y', '#ffd84d'), eye: pc(pal, 'e', '#111111'), k: pc(pal, 'k', '#3a0a04') }, view, step);
    } else if (art === 'bat') {
      bat(g, { body: pc(pal, 'b', '#4a3a5c'), wing: pc(pal, 'w', '#7a5a8c'), eye: pc(pal, 'e', '#ff4d4d'), k: pc(pal, 'k', '#1a1020') }, view, step);
    } else {
      goblin(g, { skin: pc(pal, 'g', '#3f7fbf'), horn: pc(pal, 'y', '#f4d03f'), eye: pc(pal, 'e', '#ffffff'), teeth: pc(pal, 'w', '#ffffff'), club: pc(pal, 'c', '#7b4a21'), cloth: pc(pal, 'f', '#e5a33b'), hair: pc(pal, 's', '#3b2a12'), dark: mul(pc(pal, 'g', '#3f7fbf'), 0.6), k: pc(pal, 'k', '#14212b') }, view, step);
    }
  }
  return { w: g.W, h: g.H, data: dir === 'right' ? g.mirrored() : g.px, res: MOB_RES };
}
