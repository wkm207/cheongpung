// 한복 입은 사람(약 4등신, 사실적인 비율). 3배 해상도(96×120) 칸에 머리·목·몸·팔다리(어깨·팔꿈치·무릎)를 둥근 덩어리로 찍고
// 왼쪽 위 빛과 점무늬 음영으로 입체감을 낸다(dotshape.js). 얼굴은 갸름한 턱선, 흰자 있는 아몬드 눈, 콧대·콧구멍 그늘, 입술.
// 남자는 망건과 상투, 여자는 가르마와 쪽머리·비녀. 캔버스 없이 RGBA 배열을 돌려주므로 노드(미리보기·테스트)에서도 돈다.
import { HEX, mix, mul, tones, ellipsoid, capsule, trunk, dotCanvas } from './dotshape.js';

export const CW = 96;
export const CH = 120;
/** 칸 한 개가 게임 좌표 몇 분의 1인지(3배 해상도) */
export const DOT_RES = 3;
/** 발바닥 줄(이 줄이 게임 칸 아래쪽에 닿는다) */
export const FOOT_ROW = 111;

const SKIN = [240, 200, 164];
const LIP = [178, 96, 86];
const LIP_F = [210, 82, 90];
const BLUSH = [240, 150, 140];
const SHOE = [62, 44, 36];
const WHITE = [246, 243, 234];
const SOCK = [240, 236, 226];
const MANGGEON = [40, 34, 34];
const WOOD = [118, 78, 42];
const GUARD = [222, 182, 82];
const BEAD = [206, 146, 70];
const EYE_PAL = { k: [34, 22, 20], w: [246, 244, 240], I: [52, 32, 24], 1: [255, 255, 255], s: tones(SKIN, true)[2] };

// 눈: k 눈꺼풀·속눈썹, w 흰자, I 눈동자, 1 반짝임, s 아래 눈꺼풀 그늘
const EYE = ['.kkkk.', 'kw1Iwk', '.wIIw.', '..ss..'];
const EYE_SIDE = ['.kkk', 'I1wk', 'IIw.', '.ss.'];

/** 템플릿 줄 길이가 고른지(테스트용) */
export function checkTemplates() {
  return Object.entries({ EYE, EYE_SIDE }).filter(([, rows]) => rows.some((r) => r.length !== rows[0].length)).map(([n]) => n);
}

// 무기 길이(칸), 바라보는 각도
const WEAPON_LEN = { sword: 33, dagger: 20, staff: 45, fan: 17, spear: 51 };
const FACE = { down: 90, up: -90, left: 180 };
const IDLE_ANGLE = { down: 105, up: -60, left: 135 };
const SWING = [-115, -55, 5, 45];
const REACH = [0, 3, 6, 4];

/** 무기: 손잡이·코등이·날(칼), 자루와 구슬(지팡이), 자루와 창날(창), 펼친 부채 */
function drawWeapon(g, [hx, hy], angle, w) {
  const len = WEAPON_LEN[w.wtype] ?? 24;
  const tint = HEX(w.tint ?? '#d5dbdb');
  const r = (angle * Math.PI) / 180;
  const c = Math.cos(r);
  const s = Math.sin(r);
  const at = (t) => [hx + c * t, hy + s * t];
  if (w.wtype === 'staff' || w.wtype === 'spear') {
    const tip = w.wtype === 'spear' ? len - 10 : len;
    g.paint(capsule(...at(-10), ...at(tip), 1.6), WOOD);
    if (w.wtype === 'spear') g.paint(capsule(...at(tip - 1), ...at(len), 2.8, 0.5), tint, { max: 5 });
    else g.paint(ellipsoid(...at(len + 2.5), 4, 4), tint, { max: 5 });
    return;
  }
  if (w.wtype === 'fan') {
    const pts = [];
    for (let y = Math.floor(hy - len - 1); y <= hy + len + 1; y++) {
      for (let x = Math.floor(hx - len - 1); x <= hx + len + 1; x++) {
        const dx = x + 0.5 - hx;
        const dy = y + 0.5 - hy;
        const d = Math.hypot(dx, dy);
        let a = Math.atan2(dy, dx) - r;
        a = Math.atan2(Math.sin(a), Math.cos(a));
        if (d < 3 || d > len || Math.abs(a) > 0.62) continue;
        pts.push([x, y, 0, -0.3, 1, Math.round((a + 0.62) / 0.124) % 2]);
      }
    }
    g.paint(pts, tint, { dither: false });
    for (const [x, y, , , , rib] of pts) if (rib) g.set(x, y, mul(tint, 0.84));
    return;
  }
  g.paint(capsule(...at(-3), ...at(4.5), 1.5), WOOD);
  g.paint(capsule(hx + c * 4.5 - s * 4.5, hy + s * 4.5 + c * 4.5, hx + c * 4.5 + s * 4.5, hy + s * 4.5 - c * 4.5, 1.4), GUARD, { max: 5 });
  g.paint(capsule(...at(6.5), ...at(len), 2, 0.7), tint, { max: 5 });
}

/** 생김새 → 쓰는 색들. 아주 어두운 머리색은 윤기가 보이게 살짝 띄운다 */
function colors(look) {
  const hair = HEX(look.hair ?? '#2b211d');
  return {
    cloth: HEX(look.cloth),
    trim: HEX(look.trim ?? '#c0392b'),
    pants: HEX(look.pants ?? '#e9e2cf'),
    skirt: HEX(look.skirt ?? look.trim ?? '#c0392b'),
    hair: hair.reduce((a, b) => a + b) < 150 ? mix(hair, [80, 68, 84], 0.28) : hair,
    pin: HEX(look.pin ?? '#e8c060'),
    hat: HEX(look.hat?.color ?? '#2a2a2a'),
  };
}

/** 갸름한 얼굴: 위는 둥근 머리, 아래로 갈수록 턱이 좁아진다 */
function headShape(cx, cy, rx, ry) {
  return ellipsoid(cx, cy, rx, ry, (x, y) => {
    const dy = (y + 0.5 - cy) / ry;
    if (dy <= 0.1) return true;
    const dx = Math.abs(x + 0.5 - cx) / rx;
    return dx < Math.sqrt(Math.max(0, 1 - dy * dy)) * (1 - 0.32 * (dy - 0.1));
  });
}

/** 여러 덩어리를 겹치는 픽셀 없이 한 덩어리로(팔꿈치·무릎에 선이 생기지 않게) */
const merge = (...parts) => {
  const seen = new Set();
  return parts.flat().filter(([x, y]) => !seen.has(y * CW + x) && seen.add(y * CW + x));
};

/** 선형 보간 몸통 너비: [[y, 왼쪽, 오른쪽], …] */
const lerpRows = (rows) => {
  const at = (y, i) => {
    for (let k = 1; k < rows.length; k++) {
      if (y <= rows[k][0]) {
        const [y0, ...a] = rows[k - 1];
        const [y1, ...b] = rows[k];
        const t = (y - y0) / Math.max(1, y1 - y0);
        return a[i] + (b[i] - a[i]) * Math.max(0, Math.min(1, t));
      }
    }
    return rows[rows.length - 1][i + 1];
  };
  return [(y) => at(y, 0), (y) => at(y, 1)];
};

/** 팔: 어깨 → 팔꿈치 → 손목(소매는 배래처럼 끝으로 넓게), 끝동, 손 */
function arm(g, col, s, e, w, female) {
  g.paint(merge(capsule(...s, ...e, 4.4, 4.1), capsule(...e, ...w, 4.1, 4.9)), col.cloth);
  if (female) g.paint(capsule(e[0] + (w[0] - e[0]) * 0.72, e[1] + (w[1] - e[1]) * 0.72, ...w, 4.8), col.trim);
  g.paint(ellipsoid(w[0], w[1] + 3, 2.6, 3.2), SKIN, { warm: true });
}

/** 바지 다리: 엉덩이 → 무릎 → 발목, 대님, 신 */
function leg(g, col, hip, knee, ankle, side) {
  g.paint(merge(capsule(...hip, ...knee, 7, 6), capsule(...knee, ...ankle, 6, 4.2)), col.pants);
  g.paint(capsule(ankle[0], ankle[1], ankle[0], ankle[1] + 1.5, 3.8), mix(col.trim, col.pants, 0.3));
  g.paint(ellipsoid(ankle[0] - (side ? 2 : 0), ankle[1] + 5.3, side ? 6 : 5, 3.2), SHOE, { max: 5 });
}

/** 치마: 가슴에서 발까지 넓게 퍼지고 주름 줄이 진다 */
function skirt(g, col, side, step) {
  const sway = side ? [0, -2, 2][step] : 0;
  const pts = side
    ? trunk(52, 109, (y) => 39 - (y - 52) * 0.12 + sway * ((y - 52) / 57), (y) => 57 + (y - 52) * 0.1)
    : trunk(52, 109, (y) => 36 - (y - 52) * 0.18, (y) => 60 + (y - 52) * 0.18);
  g.paint(pts, col.skirt);
  const pleat = mul(col.skirt, 0.86);
  for (const [x, y] of pts) if (y > 58 && y < 109 && (x + (side ? 2 : 0)) % 6 === 0) g.set(x, y, pleat);
}

/** 버선코만 보이는 발(치마 아래) */
function skirtFeet(g, side, step) {
  if (side) {
    g.paint(ellipsoid([38, 33, 43][step], 110, 4, 2.2), SOCK);
    return;
  }
  if (step !== 1) g.paint(ellipsoid(43, 110, 3.6, 2.1), SOCK);
  if (step !== 2) g.paint(ellipsoid(53, 110, 3.6, 2.1), SOCK);
}

/** 머리털 윤기: 위쪽 둥근 띠를 밝게 */
function shine(g, col, pts, cx, cy, r) {
  const hi = mix(col.hair, [255, 250, 240], 0.32);
  for (const [x, y] of pts) {
    const d = Math.hypot(x + 0.5 - cx, (y + 0.5 - cy) * 1.15);
    if (Math.abs(d - r) < 0.8 && x + 0.5 < cx + r * 0.3 && y + 0.5 < cy - 1) g.set(x, y, hi);
  }
}

/** 머리털: 남자는 빗어 올린 머리·상투·망건, 여자는 가르마·쪽머리·비녀 */
function hair(g, col, view, female, hk) {
  const knot = !female && hk !== 'gat' && hk !== 'helm';
  if (view === 'up') {
    if (knot) g.paint(ellipsoid(48, 9.5, 3.6, 4), col.hair, { max: 5 });
    const pts = ellipsoid(48, 24, 11.6, 12.4, (x, y) => y < (female ? 36 : 34));
    g.paint(pts, col.hair, { max: 5 });
    shine(g, col, pts, 48, 24, 8);
    if (female) {
      g.paint(ellipsoid(48, 35, 5.5, 4.4), col.hair, { max: 5 });
      g.paint(capsule(40, 35, 56, 35, 1.1), col.pin, { max: 5 });
    } else if (hk !== 'gat' && hk !== 'helm') g.paint(capsule(37, 17, 59, 17, 1.2), MANGGEON);
    return;
  }
  if (view === 'down') {
    if (knot) g.paint(ellipsoid(48, 9.5, 3.6, 4), col.hair, { max: 5 });
    const line = female
      ? (x, y) => {
        const dx = Math.abs(x + 0.5 - 48);
        return dx < 9.6 ? y < 17 + dx * 0.42 : y < 31;
      }
      : (x, y) => {
        const dx = Math.abs(x + 0.5 - 48);
        return dx < 9.6 ? y < 17.5 + Math.max(0, dx - 4) * 0.6 : y < 29;
      };
    const pts = ellipsoid(48, 24, 11.6, 12.4, line);
    g.paint(pts, col.hair, { max: 5 });
    shine(g, col, pts, 48, 24, 8.5);
    if (female) for (let y = 13; y < 18; y++) g.set(48, y, mul(col.hair, 0.6)); // 가르마
    else if (hk !== 'gat' && hk !== 'helm') g.paint(capsule(37.5, 17, 58.5, 17, 1.2), MANGGEON);
    return;
  }
  // 옆(왼쪽을 본다): 정수리부터 뒤통수를 덮는다
  if (knot) g.paint(ellipsoid(49, 9.5, 3.6, 4), col.hair, { max: 5 });
  const back = female ? 37 : 33;
  const edgeX = female ? 46.5 : 52.5;
  const pts = ellipsoid(49, 24, 11.4, 12.4, (x, y) => (y < 17 || x + 0.5 > edgeX + (y - 17) * 0.12) && y < back);
  g.paint(pts, col.hair, { max: 5 });
  shine(g, col, pts, 49, 24, 8.5);
  if (female) {
    g.paint(ellipsoid(60, 34, 4.6, 4.3), col.hair, { max: 5 });
    g.paint(capsule(55, 34, 67, 34, 1.1), col.pin, { max: 5 });
  } else if (hk !== 'gat' && hk !== 'helm') g.paint(capsule(38.5, 17, 59, 17.5, 1.2), MANGGEON);
}

/** 얼굴: 눈썹·눈·콧대·콧구멍·입술(·볼) */
function face(g, view, female) {
  const sk = tones(SKIN, true);
  const brow = female ? [70, 48, 40] : [44, 30, 26];
  const lip = female ? LIP_F : LIP;
  if (view === 'down') {
    for (const x of [41, 42, 43, 44, 45, 51, 52, 53, 54, 55]) g.set(x, 21, brow);
    if (!female) for (const x of [40, 41, 42, 43, 53, 54, 55, 56]) g.set(x, 22, brow);
    else {
      g.set(40, 22, brow);
      g.set(56, 22, brow);
    }
    g.stamp(EYE, 40, 23, EYE_PAL);
    g.stamp(EYE, 51, 23, EYE_PAL);
    if (female) {
      g.set(39, 23, EYE_PAL.k);
      g.set(57, 23, EYE_PAL.k);
    }
    for (let y = 27; y <= 30; y++) g.set(49, y, sk[2]); // 콧대 그늘
    g.set(48, 31, sk[4]);
    g.set(49, 31, sk[1]);
    g.set(47, 32, sk[0]);
    g.set(50, 32, sk[0]);
    g.set(48, 32, sk[1]);
    g.set(49, 32, sk[1]);
    for (let x = 46; x <= 50; x++) g.set(x, 34, mul(lip, 0.78));
    for (let x = 46; x <= 50; x++) g.set(x, 35, lip);
    g.set(47, 35, mix(lip, [255, 255, 255], 0.3));
    for (let x = 47; x <= 49; x++) g.set(x, 36, sk[2]);
    if (female) for (const x of [41, 42, 43, 53, 54, 55]) g.set(x, 30, mix(SKIN, BLUSH, 0.45));
    return;
  }
  // 옆(왼쪽)
  for (const x of [39, 40, 41, 42, 43]) g.set(x, 21, brow);
  g.stamp(EYE_SIDE, 39, 23, EYE_PAL);
  if (female) g.set(38, 23, EYE_PAL.k);
  g.set(38, 32, sk[0]); // 콧구멍
  g.set(38, 34, mul(lip, 0.78));
  g.set(39, 34, mul(lip, 0.78));
  g.set(38, 35, lip);
  g.set(39, 35, lip);
  if (female) for (const x of [41, 42]) g.set(x, 30, mix(SKIN, BLUSH, 0.45));
}

/** 쓰개: 갓·투구·관·두건 */
function hat(g, col, view, kind) {
  const c = col.hat;
  const side = view === 'left';
  const cx = side ? 49 : 48;
  if (kind === 'gat') {
    g.paint(trunk(1, 13, () => cx - 7, () => cx + 7), c, { max: 5 });
    g.paint(ellipsoid(cx, 1.5, 7, 2.2), c, { max: 5 });
    g.paint(ellipsoid(cx, 14.5, 22, side ? 2.6 : 3.8), c, { max: 5 });
    if (view !== 'up') {
      // 갓끈 구슬
      const ends = side ? [[40, 18, 43, 41]] : [[34, 18, 41, 41], [62, 18, 55, 41]];
      for (const [x0, y0, x1, y1] of ends) for (let t = 0; t <= 1; t += 0.08) g.set(Math.round(x0 + (x1 - x0) * t), Math.round(y0 + (y1 - y0) * t), BEAD);
    }
    return;
  }
  if (kind === 'helm') {
    g.paint(ellipsoid(cx, 22, 12.8, 12, (x, y) => y < 21), c, { max: 5 });
    if (side) g.paint(capsule(cx + 10, 21, cx + 10.5, 34, 2.8), c);
    else {
      g.paint(capsule(35.5, 21, 35.5, 34, 2.7), c);
      g.paint(capsule(60.5, 21, 60.5, 34, 2.7), c);
    }
    g.paint(capsule(cx - 12.8, 20.5, cx + 12.8, 20.5, 1.9), mul(c, 0.86), { max: 5 });
    g.paint(ellipsoid(cx, 9, 2.6, 2.6), GUARD, { max: 5 });
    return;
  }
  if (kind === 'crown') {
    g.paint(trunk(7, 14, () => cx - 7.5, () => cx + 7.5), c, { max: 5 });
    for (const dx of [-6, 0, 6]) g.paint(ellipsoid(cx + dx, 5.5, 2, 2.6), c, { max: 5 });
    if (view !== 'up') g.paint(ellipsoid(cx, 10.5, 1.9, 1.9), [214, 48, 64], { max: 5 });
    return;
  }
  if (kind === 'band') {
    if (side) {
      g.paint(capsule(38, 18, 60, 19, 1.9), c);
      g.paint(capsule(60, 19, 64, 30, 1.4), c);
    } else g.paint(capsule(36.5, 18.5, 59.5, 18.5, 1.9), c);
  }
}

/**
 * 한 칸 만들기.
 * look: { cloth, pants?, skirt?, trim?, hair?, female?, hat?: {kind, color}, weapon?: {wtype, tint} }
 * dir: up|down|left|right
 * opts: { step: 0(서기)·1·2(걷기), pose: 'stand'|'attack'|'cast', phase: 0~3(공격 휘두르기 단계) }
 */
export function chibiFrame(look, dir, { step = 0, pose = 'stand', phase = 0 } = {}) {
  const g = dotCanvas(CW, CH);
  const col = colors(look);
  const female = !!look.female;
  const view = dir === 'right' ? 'left' : dir;
  const side = view === 'left';
  const hk = look.hat?.kind;
  const weapon = look.weapon && pose !== 'cast' ? look.weapon : null;
  const reach = pose === 'attack' ? REACH[phase] : 0;
  const swingSign = side || view === 'up' ? -1 : 1;
  const angle = pose === 'attack' ? FACE[view] + swingSign * SWING[phase] : IDLE_ANGLE[view];
  const sw = side ? [0, 5, -5][step] : [0, 2, -2][step]; // 팔 흔들기
  const sh = female ? 2 : 0; // 여자는 어깨가 좁다

  // 팔 자리: [어깨, 팔꿈치, 손목] — 무기 든 손(main)은 앞쪽 손
  let main;
  let off;
  if (side) {
    main = [[48, 48], [46 - sw * 0.5, 61], [45 - sw - reach, 73]];
    off = [[50, 48], [51 + sw * 0.5, 61], [52 + sw, 72]];
  } else {
    const L = [[35.5 + sh, 48], [33 + sh, 61], [32.5 + sh, 73 - sw]];
    const R = [[60.5 - sh, 48], [63 - sh, 61], [63.5 - sh, 73 + sw]];
    if (view === 'down') {
      main = L;
      off = R;
      main[2] = [main[2][0], main[2][1] + reach];
    } else {
      main = R;
      off = L;
      main[2] = [main[2][0], main[2][1] - reach * 0.5];
    }
  }
  if (pose === 'cast') {
    if (side) main = [[48, 48], [41, 51], [32, 51]];
    else {
      main = [[35.5 + sh, 48], [29, 42], [30, 31]];
      off = [[60.5 - sh, 48], [67, 42], [66, 31]];
    }
  }
  const hand = [main[2][0], main[2][1] + 3];

  // ── 뒤쪽 ──
  if (weapon && view === 'up') drawWeapon(g, hand, angle, weapon);
  if (side) arm(g, col, ...off, female);

  // ── 다리·치마 ──
  if (female) {
    skirtFeet(g, side, step);
    skirt(g, col, side, step);
  } else if (side) {
    const feet = [[[50, 103], [46, 103]], [[57, 103], [39, 103]], [[42, 103], [55, 103]]][step];
    const knee = (f) => [(48 + f[0]) / 2 - 2, 89];
    leg(g, col, [49, 72], knee(feet[0][0] ? feet[0] : feet[0]), feet[0], true);
    leg(g, col, [47, 72], knee(feet[1]), feet[1], true);
  } else {
    const liftL = step === 1 ? 3 : 0;
    const liftR = step === 2 ? 3 : 0;
    leg(g, col, [42.5, 72], [41.5, 90 - liftL], [41, 102.5 - liftL], false);
    leg(g, col, [53.5, 72], [54.5, 90 - liftR], [55, 102.5 - liftR], false);
  }

  // ── 목·몸통(저고리) ──
  g.paint(capsule(side ? 48 : 48, 36, 48, 44, 4.2), SKIN, { warm: true, edge: false });
  if (side) {
    const [xl, xr] = lerpRows(female ? [[43, 43, 53], [46, 40, 56], [54, 40, 56]] : [[43, 43, 54], [47, 40, 57], [62, 41, 56], [72, 40, 57]]);
    g.paint(trunk(43, female ? 54 : 72, xl, xr), col.cloth);
    g.paint(capsule(41.5, 44, 44, 52, 1.5), female ? col.trim : mul(col.cloth, 0.78));
    g.paint(capsule(42, 44, 44, 50, 0.9), WHITE, { edge: false });
    g.paint(capsule(41, 53, 39.5, female ? 70 : 64, 1), col.trim);
  } else {
    const rows = female
      ? [[43, 38, 58], [46, 35, 61], [54, 35, 61]]
      : [[43, 37, 59], [47, 33, 63], [62, 35, 61], [72, 34, 62]];
    const [xl, xr] = lerpRows(rows);
    g.paint(trunk(43, female ? 54 : 72, xl, xr), col.cloth);
    if (view === 'down') {
      // 깃·동정·고름
      const git = female ? col.trim : mul(col.cloth, 0.78);
      g.paint(capsule(39, 43, 48, female ? 51 : 54, 1.4), git);
      g.paint(capsule(57, 43, 45, female ? 52 : 58, 1.6), git);
      g.paint(capsule(55.5, 43, 46.5, female ? 50 : 54, 0.9), WHITE, { edge: false });
      const ky = female ? 52 : 58;
      g.paint(capsule(45, ky + 1, 42.5, female ? 70 : 68, 1), col.trim);
      g.paint(capsule(46, ky + 1, 47, female ? 72 : 70, 1), col.trim);
      g.paint(ellipsoid(45.5, ky, 2, 1.5), col.trim);
    }
  }

  // ── 팔(앞쪽) ──
  if (side) arm(g, col, ...main, female);
  else {
    arm(g, col, ...main, female);
    arm(g, col, ...off, female);
  }

  // ── 머리 ──
  if (!side) {
    g.paint(ellipsoid(37.3, 27, 1.9, 3.4), SKIN, { warm: true });
    g.paint(ellipsoid(58.7, 27, 1.9, 3.4), SKIN, { warm: true });
    g.paint(headShape(48, 25, 10.5, 12.4), SKIN, { warm: true });
  } else {
    const pts = [...headShape(49, 25, 10.3, 12.4), ...ellipsoid(44.5, 31.5, 6.4, 5.8, (x, y) => y < 38)];
    const seen = new Set();
    g.paint(pts.filter(([x, y]) => !seen.has(y * CW + x) && seen.add(y * CW + x)), SKIN, { warm: true });
    g.paint(ellipsoid(38.6, 29.5, 1.6, 2.6), SKIN, { warm: true });
  }
  if (view !== 'up') face(g, view, female);
  if (side && !female) g.paint(ellipsoid(50.5, 27, 1.7, 3.1), SKIN, { warm: true });
  hair(g, col, view, female, hk);
  if (hk) hat(g, col, view, hk);

  // ── 앞쪽 무기 ──
  if (weapon && view !== 'up') {
    drawWeapon(g, hand, angle, weapon);
    g.paint(ellipsoid(hand[0], hand[1], 2.6, 3.2), SKIN, { warm: true });
  }

  return { w: CW, h: CH, data: dir === 'right' ? g.mirrored() : g.px };
}
