// 한복 입은 사람 도트(약 3.3등신). 2배 해상도(64×80) 칸에 머리·몸·팔다리를 둥근 덩어리로 찍고,
// 왼쪽 위에서 오는 빛으로 덩어리마다 4~5단 음영을 넣어 입체감을 낸다. 부위마다 그 색의 진한 테두리를 두른다.
// 얼굴은 눈(흰자·눈동자·반짝임)·눈썹·코 그늘·입·볼을 한 칸씩 찍어 또렷하게 한다.
// 캔버스 없이 RGBA 배열을 돌려주므로 브라우저(ImageData)와 노드(미리보기 PNG·테스트) 둘 다에서 쓴다.
export const CW = 64;
export const CH = 80;
/** 칸 한 개가 게임 좌표 몇 분의 1인지(2배 해상도) */
export const DOT_RES = 2;
/** 발바닥 줄(이 줄이 게임 칸 아래쪽에 닿는다) */
export const FOOT_ROW = 74;

const HEX = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
const mul = (a, k) => a.map((v) => Math.max(0, Math.min(255, Math.round(v * k))));

// 빛: 왼쪽 위 앞에서
const L = (() => {
  const v = [-0.55, -0.65, 0.75];
  const n = Math.hypot(...v);
  return v.map((x) => x / n);
})();
const COOL = [52, 40, 88];
const WARM = [255, 246, 224];
/** 바탕색 → 음영 다섯 단(짙은 그늘·그늘·바탕·밝음·반짝임) */
function tones(base) {
  return [mix(mul(base, 0.56), COOL, 0.22), mix(mul(base, 0.76), COOL, 0.1), base, mix(mul(base, 1.08), WARM, 0.14), mix(mul(base, 1.12), WARM, 0.42)];
}
const toneOf = (lit) => (lit < -0.05 ? 0 : lit < 0.3 ? 1 : lit < 0.64 ? 2 : lit < 0.86 ? 3 : 4);
const edgeOf = (base) => mix(mul(base, 0.32), [22, 12, 10], 0.45);

// ── 덩어리(픽셀 목록 + 겉면 방향) ──
function norm(nx, ny, nz) {
  const n = Math.hypot(nx, ny, nz) || 1;
  return [nx / n, ny / n, nz / n];
}
/** 타원체 */
function ellipsoid(cx, cy, rx, ry, clip) {
  const out = [];
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const dx = (x + 0.5 - cx) / rx;
      const dy = (y + 0.5 - cy) / ry;
      const d = dx * dx + dy * dy;
      if (d > 1 || (clip && !clip(x, y))) continue;
      out.push([x, y, dx, dy, Math.sqrt(1 - d)]);
    }
  }
  return out;
}
/** 캡슐(끝이 둥근 막대, 굵기가 r0→r1 로 바뀐다) */
function capsule(x0, y0, x1, y1, r0, r1 = r0) {
  const out = [];
  const vx = x1 - x0;
  const vy = y1 - y0;
  const len2 = vx * vx + vy * vy || 1;
  const R = Math.max(r0, r1);
  for (let y = Math.floor(Math.min(y0, y1) - R); y <= Math.ceil(Math.max(y0, y1) + R); y++) {
    for (let x = Math.floor(Math.min(x0, x1) - R); x <= Math.ceil(Math.max(x0, x1) + R); x++) {
      const px = x + 0.5;
      const py = y + 0.5;
      const t = Math.max(0, Math.min(1, ((px - x0) * vx + (py - y0) * vy) / len2));
      const ox = px - (x0 + vx * t);
      const oy = py - (y0 + vy * t);
      const r = r0 + (r1 - r0) * t;
      const d = Math.hypot(ox, oy);
      if (d > r) continue;
      out.push([x, y, ox / r, oy / r, Math.sqrt(Math.max(0, 1 - (d / r) ** 2))]);
    }
  }
  return out;
}
/** 줄마다 왼쪽·오른쪽 끝이 바뀌는 몸통(원통처럼 가로로 둥글고, 아래로 갈수록 살짝 어둡다) */
function trunk(y0, y1, xl, xr) {
  const out = [];
  for (let y = y0; y <= y1; y++) {
    const a = xl(y);
    const b = xr(y);
    const cx = (a + b) / 2;
    const hw = (b - a) / 2 || 1;
    const ny = -0.25 + 0.5 * ((y - y0) / Math.max(1, y1 - y0));
    for (let x = Math.round(a); x < Math.round(b); x++) {
      const nx = Math.max(-0.98, Math.min(0.98, (x + 0.5 - cx) / hw));
      out.push([x, y, nx, ny, Math.sqrt(1 - nx * nx)]);
    }
  }
  return out;
}

// ── 그리기 판 ──
function canvas() {
  const px = new Uint8ClampedArray(CW * CH * 4);
  const set = (x, y, c) => {
    if (x < 0 || y < 0 || x >= CW || y >= CH) return;
    px.set([c[0], c[1], c[2], 255], (y * CW + x) * 4);
  };
  /** 덩어리를 음영으로 칠한다. edge: 둘레에 진한 테두리, max: 가장 밝은 단(4면 반짝임) */
  const paint = (pts, base, { edge = true, max = 3, flat = false, edgeColor } = {}) => {
    const t = tones(base);
    if (edge) {
      const inside = new Set(pts.map(([x, y]) => y * CW + x));
      const ec = edgeColor ?? edgeOf(base);
      for (const [x, y] of pts) {
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const X = x + dx;
          const Y = y + dy;
          if (!inside.has(Y * CW + X)) set(X, Y, ec);
        }
      }
    }
    for (const [x, y, nx, ny, nz] of pts) {
      const n = norm(nx, ny, nz);
      set(x, y, flat ? base : t[Math.min(max, toneOf(n[0] * L[0] + n[1] * L[1] + n[2] * L[2]))]);
    }
  };
  /** 글자 그림 찍기(얼굴 등). pal: 글자 → 색 */
  const stamp = (rows, ox, oy, pal) => rows.forEach((row, y) => [...row].forEach((ch, x) => pal[ch] && set(ox + x, oy + y, pal[ch])));
  return { px, set, paint, stamp };
}

// ── 얼굴 글자 그림 ──
// k 속눈썹·윤곽, w 흰자, 1 반짝임, I 눈동자 가운데, i 눈동자
const EYE_FRONT = ['kkkk', 'w1Iw', 'wIIw', '.ii.'];
const EYE_SIDE = ['kkk', 'I1w', 'IIw', 'ii.'];
const EYE_SIDE_F = ['kkkk', 'I1w.', 'IIw.', 'ii..'];

/** 템플릿 줄 길이가 고른지(테스트용) */
export function checkTemplates() {
  const bad = [];
  for (const [name, rows] of Object.entries({ EYE_FRONT, EYE_SIDE, EYE_SIDE_F })) {
    if (rows.some((r) => r.length !== rows[0].length)) bad.push(name);
  }
  return bad;
}

const SKIN = [246, 204, 166];
const LIP = [160, 72, 62];
const LIP_F = [214, 72, 74];
const BLUSH = [255, 140, 130];
const SHOE = [72, 52, 40];
const SOCK = [240, 236, 224];
const WHITE = [246, 242, 230];
const EYE_PAL = { k: [40, 24, 18], w: [250, 250, 246], 1: [255, 255, 255], I: [22, 12, 8], i: [70, 42, 28] };
const WOOD = [118, 78, 42];
const GUARD = [228, 186, 80];
const BEAD = [212, 150, 70];

// 무기 길이(칸), 손 자리, 바라보는 각도
const WEAPON_LEN = { sword: 24, dagger: 14, staff: 32, fan: 12, spear: 36 };
const FACE = { down: 90, up: -90, left: 180, right: 0 };
const IDLE_ANGLE = { down: 105, up: -60, left: 135 };
const SWING = [-115, -55, 5, 45];
const REACH = [0, 2, 4, 3];

/** 무기: 손잡이·코등이·날(칼), 자루와 구슬(지팡이), 자루와 창날(창), 펼친 부채 */
function drawWeapon(g, [hx, hy], angle, w) {
  const len = WEAPON_LEN[w.wtype] ?? 16;
  const tint = HEX(w.tint ?? '#d5dbdb');
  const r = (angle * Math.PI) / 180;
  const c = Math.cos(r);
  const s = Math.sin(r);
  const at = (t) => [hx + c * t, hy + s * t];
  if (w.wtype === 'staff' || w.wtype === 'spear') {
    const tip = w.wtype === 'spear' ? len - 7 : len;
    g.paint(capsule(...at(-8), ...at(tip), 1.2), WOOD);
    if (w.wtype === 'spear') g.paint(capsule(...at(tip - 1), ...at(len), 2, 0.4), tint, { max: 4 });
    else g.paint(ellipsoid(...at(len + 1.5), 2.8, 2.8), tint, { max: 4 });
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
        if (d < 2 || d > len || Math.abs(a) > 0.62) continue;
        pts.push([x, y, 0, 0, 1, Math.round((a + 0.62) / 0.155) % 2]);
      }
    }
    g.paint(pts, tint, { flat: true });
    for (const [x, y, , , , rib] of pts) if (rib) g.set(x, y, mul(tint, 0.8));
    return;
  }
  g.paint(capsule(...at(-2), ...at(3), 1.1), WOOD);
  g.paint(capsule(hx + c * 3 - s * 3.2, hy + s * 3 + c * 3.2, hx + c * 3 + s * 3.2, hy + s * 3 - c * 3.2, 1), GUARD, { max: 4 });
  g.paint(capsule(...at(4.5), ...at(len), 1.5, 0.6), tint, { max: 4 });
}

/** 생김새 → 쓰는 색들 */
function colors(look) {
  return {
    cloth: HEX(look.cloth),
    trim: HEX(look.trim ?? '#c0392b'),
    pants: HEX(look.pants ?? '#e9e2cf'),
    skirt: HEX(look.skirt ?? look.trim ?? '#c0392b'),
    hair: HEX(look.hair ?? '#2b211d'),
    pin: HEX(look.pin ?? '#e8c060'),
    hat: HEX(look.hat?.color ?? '#2a2a2a'),
  };
}

// ── 부위 그리기(왼쪽을 보는 옆모습은 'left' 로 그리고 오른쪽은 뒤집는다) ──

/** 바지 다리 하나: 엉덩이 → 발목, 대님, 버선, 신 */
function leg(g, col, hx, fx, lift, side) {
  const fy = 71 - lift;
  g.paint(capsule(hx, 51, fx, fy - 6, 5.4, 4.1), col.pants);
  g.paint(capsule(fx, fy - 5.5, fx, fy - 4.5, 3.4), col.trim);
  g.paint(capsule(fx, fy - 3.5, fx, fy - 2, 2.6), SOCK, { edge: false });
  g.paint(ellipsoid(fx - (side ? 1 : 0), fy, side ? 4.4 : 3.8, 2.6), SHOE, { max: 4 });
}

/** 치마: 가슴 아래에서 넓게 퍼진다. 주름 줄을 넣는다 */
function skirt(g, col, side, step) {
  const sway = side ? [0, -1, 1][step] : 0;
  const pts = side
    ? trunk(40, 72, (y) => 24 - (y - 40) * 0.16 + sway * ((y - 40) / 32), (y) => 39 + (y - 40) * 0.14)
    : trunk(40, 72, (y) => 22 - (y - 40) * 0.2, (y) => 42 + (y - 40) * 0.2);
  g.paint(pts, col.skirt);
  const pleat = mul(col.skirt, 0.78);
  for (const [x, y] of pts) if (y > 45 && y < 72 && (x + (side ? 1 : 0)) % 5 === 0) g.set(x, y, pleat);
}

/** 신코만 보이는 발(치마 아래) */
function skirtFeet(g, side, step) {
  if (side) {
    const fx = [25, 22, 28][step];
    g.paint(ellipsoid(fx, 73, 3.4, 1.8), SHOE, { max: 4 });
    return;
  }
  if (step !== 1) g.paint(ellipsoid(28, 73, 2.8, 1.7), SOCK);
  if (step !== 2) g.paint(ellipsoid(36, 73, 2.8, 1.7), SOCK);
}

/** 팔: 소매(어깨 → 손목), 끝동, 손 */
function arm(g, col, sx, sy, hx, hy, female) {
  g.paint(capsule(sx, sy, hx, hy - 1, 3.4, 3), col.cloth);
  if (female) g.paint(capsule(hx + (sx - hx) * 0.18, hy - 1 + (sy - hy) * 0.18, hx, hy - 1, 3.1), col.trim);
  g.paint(ellipsoid(hx, hy + 1, 2.4, 2.6), SKIN);
}

/** 머리털(앞·뒤·옆), 상투·쪽머리 */
function hair(g, col, view, hy, female) {
  if (view === 'up') {
    if (female) {
      g.paint(ellipsoid(32, hy - 1, 11, 11.5, (x, y) => y < hy + 9), col.hair, { max: 4 });
      g.paint(ellipsoid(32, hy + 8, 4.6, 3.6), col.hair, { max: 4 });
      g.paint(capsule(26, hy + 8, 38, hy + 8, 0.8), col.pin, { max: 4 });
    } else {
      g.paint(ellipsoid(32, hy - 2, 11, 11, (x, y) => y < hy + 7), col.hair, { max: 4 });
    }
    return;
  }
  if (view === 'down') {
    const line = female
      ? (x, y) => {
        const dx = Math.abs(x + 0.5 - 32);
        return y < hy - 4 + dx * 0.25 || (dx > 8.2 && y < hy + 7);
      }
      : (x, y) => {
        const dx = Math.abs(x + 0.5 - 32);
        return y < hy - 5 + Math.max(0, dx - 6) * 1.7 && y < hy + 4;
      };
    g.paint(ellipsoid(32, hy - 2, 11, 10.5, line), col.hair, { max: 4 });
    if (female) for (let y = hy - 10; y < hy - 4; y++) g.set(32, y, mul(col.hair, 0.6)); // 가르마
    return;
  }
  // 옆(왼쪽을 본다): 앞머리와 정수리·뒤통수를 덮는다
  const line = (x, y) => y < hy - 5 || x + 0.5 > 31 + (y - (hy - 5)) * 0.25;
  g.paint(ellipsoid(32.5, hy - 2, 10.8, 10.5, (x, y) => line(x, y) && y < hy + (female ? 9 : 6)), col.hair, { max: 4 });
  if (female) {
    g.paint(ellipsoid(40, hy + 7, 3.8, 3.6), col.hair, { max: 4 });
    g.paint(capsule(37, hy + 7, 44, hy + 7, 0.8), col.pin, { max: 4 });
  }
}

/** 얼굴: 눈썹·눈·코 그늘·입·볼 */
function face(g, view, hy, female) {
  const brow = [40, 26, 20];
  const nose = tones(SKIN)[1];
  const blush = mix(SKIN, BLUSH, 0.45);
  const lip = female ? LIP_F : LIP;
  if (view === 'down') {
    for (const [x, y] of [[25, hy - 2], [26, hy - 3], [27, hy - 3], [28, hy - 3], [36, hy - 3], [37, hy - 3], [38, hy - 3], [39, hy - 2]]) g.set(x, y, brow);
    g.stamp(EYE_FRONT, 25, hy, EYE_PAL);
    g.stamp(EYE_FRONT, 36, hy, EYE_PAL);
    if (female) {
      // 눈꼬리 속눈썹
      g.set(24, hy, EYE_PAL.k);
      g.set(40, hy, EYE_PAL.k);
    }
    g.set(33, hy + 5, nose);
    g.set(32, hy + 6, nose);
    for (const x of [24, 25, 39, 40]) g.set(x, hy + 5, blush);
    g.set(30, hy + 7, lip);
    g.set(31, hy + 7, mul(lip, 0.8));
    g.set(32, hy + 7, mul(lip, 0.8));
    g.set(33, hy + 7, lip);
    return;
  }
  // 옆(왼쪽)
  for (const [x, y] of [[23, hy - 3], [24, hy - 3], [25, hy - 3], [26, hy - 2]]) g.set(x, y, brow);
  g.stamp(female ? EYE_SIDE_F : EYE_SIDE, 23, hy, EYE_PAL);
  g.set(25, hy + 5, blush);
  g.set(26, hy + 5, blush);
  g.set(23, hy + 7, lip);
  g.set(24, hy + 7, mul(lip, 0.8));
}

/** 쓰개: 갓·투구·관·두건 */
function hat(g, col, view, hy, kind) {
  const c = col.hat;
  const side = view === 'left';
  const cx = side ? 33 : 32;
  if (kind === 'gat') {
    g.paint(trunk(hy - 17, hy - 8, () => cx - 6.5, () => cx + 6.5), c, { max: 4 });
    g.paint(ellipsoid(cx, hy - 17, 6.5, 2), c, { max: 4 });
    g.paint(ellipsoid(cx, hy - 7, 17.5, side ? 2.4 : 3.2), c, { max: 4 });
    if (view !== 'up') {
      // 갓끈 구슬
      const [x0, x1] = side ? [27, 25] : [22, 26];
      for (let t = 0; t <= 1; t += 0.12) g.set(Math.round(x0 + (x1 - x0) * t), Math.round(hy - 5 + 15 * t), BEAD);
      if (!side) for (let t = 0; t <= 1; t += 0.12) g.set(Math.round(42 + (38 - 42) * t), Math.round(hy - 5 + 15 * t), BEAD);
    }
    return;
  }
  if (kind === 'helm') {
    g.paint(ellipsoid(cx, hy - 3, 11.8, 10.5, (x, y) => y < hy - 3), c, { max: 4 });
    if (side) g.paint(capsule(cx + 9, hy - 3, cx + 10, hy + 8, 2), c);
    else {
      g.paint(capsule(21, hy - 3, 21, hy + 8, 1.9), c);
      g.paint(capsule(43, hy - 3, 43, hy + 8, 1.9), c);
    }
    g.paint(capsule(cx - 11.5, hy - 4, cx + 11.5, hy - 4, 1.4), mul(c, 0.85), { max: 4 });
    g.paint(ellipsoid(cx, hy - 14, 2, 2), GUARD, { max: 4 });
    return;
  }
  if (kind === 'crown') {
    g.paint(trunk(hy - 14, hy - 9, () => cx - 6, () => cx + 6), c, { max: 4 });
    for (const dx of [-5, 0, 5]) g.paint(ellipsoid(cx + dx, hy - 15.5, 1.6, 2), c, { max: 4 });
    if (view !== 'up') g.paint(ellipsoid(cx, hy - 11.5, 1.4, 1.4), [214, 48, 64], { max: 4 });
    return;
  }
  if (kind === 'band') {
    if (side) {
      g.paint(capsule(22, hy - 6, 42, hy - 4, 1.4), c);
      g.paint(capsule(42, hy - 4, 46, hy + 4, 1), c);
    } else g.paint(capsule(21.5, hy - 5, 42.5, hy - 5, 1.4), c);
  }
}

/**
 * 한 칸 만들기.
 * look: { cloth, pants?, skirt?, trim?, hair?, female?, hat?: {kind, color}, weapon?: {wtype, tint} }
 * dir: up|down|left|right
 * opts: { step: 0(서기)·1·2(걷기), pose: 'stand'|'attack'|'cast', phase: 0~3(공격 휘두르기 단계) }
 */
export function chibiFrame(look, dir, { step = 0, pose = 'stand', phase = 0 } = {}) {
  const g = canvas();
  const col = colors(look);
  const female = !!look.female;
  const view = dir === 'right' ? 'left' : dir;
  const side = view === 'left';
  const bob = step ? 1 : 0;
  const hy = 19 - bob; // 머리 가운데 줄
  const sy = 35 - bob; // 어깨 줄
  const weapon = look.weapon && pose !== 'cast' ? look.weapon : null;

  // 걸을 때 팔 흔들기, 공격할 때 손을 내민다
  const swing = side ? [0, 3, -3][step] : [0, 1, -1][step];
  const faceDir = side ? 'left' : view;
  const fwd = { down: [0, 1], up: [0, -1], left: [-1, 0] }[faceDir];
  const reach = pose === 'attack' ? REACH[phase] : 0;
  const swingSign = view === 'left' || view === 'up' ? -1 : 1;
  const angle = pose === 'attack' ? FACE[faceDir] + swingSign * SWING[phase] : IDLE_ANGLE[faceDir];

  // 손 자리(무기 든 손 = 앞쪽 손)
  let main;
  let off;
  if (side) {
    main = [29 - swing + fwd[0] * reach, 49 - bob];
    off = [35 + swing, 48 - bob];
  } else if (view === 'down') {
    main = [20 + reach * 0.3, 49 - bob - swing + fwd[1] * reach * 0.5];
    off = [44, 49 - bob + swing];
  } else {
    main = [44 - reach * 0.3, 49 - bob - swing];
    off = [20, 49 - bob + swing];
  }

  // ── 뒤쪽 ──
  if (weapon && view === 'up') drawWeapon(g, main, angle, weapon);
  if (side) {
    // 먼 쪽 팔
    if (pose === 'cast') arm(g, col, 33, sy, 27, sy + 6, female);
    else arm(g, col, 33, sy, off[0], off[1], female);
  }

  // ── 다리·치마 ──
  if (female) {
    skirtFeet(g, side, step);
    skirt(g, col, side, step);
  } else if (side) {
    const [far, near] = [[33, 37, 31], [31, 26, 33]].map(([h, f1, f2]) => [h, [32, f1, f2][step]]);
    leg(g, col, far[0], far[1], 0, true);
    leg(g, col, near[0], near[1], 0, true);
  } else {
    leg(g, col, 27, 27, step === 1 ? 2 : 0, false);
    leg(g, col, 37, 37, step === 2 ? 2 : 0, false);
  }

  // ── 몸통 ──
  g.paint(capsule(32, 27 - bob, 32, 32 - bob, 3), SKIN, { edge: false });
  const top = 32 - bob;
  const bottom = (female ? 41 : 51) - bob;
  const round = (y, a, b) => (y - top < 2 ? [a + 2 - (y - top), b - 2 + (y - top)] : [a, b]);
  if (side) {
    g.paint(trunk(top, bottom, (y) => round(y, 25, 39)[0] - (y - top) * 0.05, (y) => round(y, 25, 39)[1] + (y - top) * 0.05), col.cloth);
    g.paint(capsule(27, top + 1, 28.5, top + 6, 1.1), WHITE, { edge: false });
    g.paint(capsule(26, top + 9, 25, top + (female ? 18 : 15), 1), col.trim);
  } else {
    g.paint(trunk(top, bottom, (y) => round(y, 22, 42)[0] - (y - top) * 0.1, (y) => round(y, 22, 42)[1] + (y - top) * 0.1), col.cloth);
    if (view === 'down') {
      // 동정(흰 깃)과 고름
      g.paint(capsule(36.5, top + 0.5, 29.5, top + 9, 1.2), WHITE, { edge: false });
      g.paint(capsule(30, top + 9, 28, top + (female ? 19 : 16), 1), col.trim);
      g.paint(capsule(31, top + 9, 32.5, top + (female ? 21 : 17), 1), col.trim);
      g.paint(ellipsoid(30.5, top + 9, 1.8, 1.4), col.trim);
    }
  }

  // ── 팔(앞쪽) ──
  if (pose === 'cast' && !side) {
    arm(g, col, 22.5, sy, 17, 24 - bob, female);
    arm(g, col, 41.5, sy, 47, 24 - bob, female);
  } else if (pose === 'cast') {
    arm(g, col, 31, sy, 19, 40 - bob, female);
  } else if (side) {
    // 앞쪽 손은 무기 다음에 다시 찍어 주먹을 덮는다
    arm(g, col, 31, sy, main[0], main[1], female);
  } else {
    arm(g, col, 22.5, sy, view === 'down' ? main[0] : off[0], view === 'down' ? main[1] : off[1], female);
    arm(g, col, 41.5, sy, view === 'down' ? off[0] : main[0], view === 'down' ? off[1] : main[1], female);
  }

  // ── 머리 ──
  const hk = look.hat?.kind;
  if (!side) {
    g.paint(ellipsoid(21.8, hy + 1, 1.8, 2.8), SKIN);
    g.paint(ellipsoid(42.2, hy + 1, 1.8, 2.8), SKIN);
  }
  if (!female && hk !== 'gat' && hk !== 'helm') g.paint(ellipsoid(side ? 33 : 32, hy - 12, 3.6, 3.6), col.hair, { max: 4 });
  g.paint(ellipsoid(side ? 31 : 32, hy, 10.2, 11), SKIN);
  if (side) g.paint(ellipsoid(21.4, hy + 3.5, 1.5, 1.9), SKIN);
  if (view !== 'up') face(g, view, hy, female);
  hair(g, col, view, hy, female);
  if (side) g.paint(ellipsoid(32.8, hy + 1.5, 1.6, 2.5), SKIN);
  if (hk) hat(g, col, view, hy, hk);

  // ── 앞쪽 무기 ──
  if (weapon && view !== 'up') {
    drawWeapon(g, main, angle, weapon);
    g.paint(ellipsoid(main[0], main[1] + 1, 2.4, 2.6), SKIN);
  }

  if (dir === 'right') {
    const out = new Uint8ClampedArray(g.px.length);
    for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) out.set(g.px.subarray((y * CW + x) * 4, (y * CW + x) * 4 + 4), (y * CW + (CW - 1 - x)) * 4);
    return { w: CW, h: CH, data: out };
  }
  return { w: CW, h: CH, data: g.px };
}
