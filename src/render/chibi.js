// 한복 입은 사람 도트(원작처럼 머리가 큰 약 2.6등신). 2배 해상도(64×80) 칸에 머리·몸·팔다리를 둥근 덩어리로 찍고,
// 왼쪽 위 빛으로 덩어리마다 음영을 넣어 입체감을 낸다. 바깥 둘레는 진한 테두리, 부위가 겹치는 안쪽은 연한 선.
// 얼굴은 큰 눈(눈동자·반짝임)·눈썹·코·작은 입·볼 홍조, 머리는 앞머리 가닥과 윤기 띠.
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
  const v = [-0.5, -0.6, 0.8];
  const n = Math.hypot(...v);
  return v.map((x) => x / n);
})();
const COOL = [60, 50, 96];
const WARM_SHADOW = [196, 112, 96];
const WARM = [255, 248, 232];
/** 바탕색 → 음영 다섯 단(짙은 그늘·그늘·바탕·밝음·반짝임). warm: 살처럼 그늘을 붉게 */
function tones(base, warm) {
  const sh = warm ? WARM_SHADOW : COOL;
  return [mix(mul(base, 0.66), sh, 0.25), mix(mul(base, 0.84), sh, 0.12), base, mix(mul(base, 1.05), WARM, 0.12), mix(mul(base, 1.1), WARM, 0.45)];
}
const toneOf = (lit) => (lit < 0.05 ? 0 : lit < 0.38 ? 1 : lit < 0.7 ? 2 : lit < 0.9 ? 3 : 4);
const OUTLINE = [34, 22, 20];

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
    const ny = -0.3 + 0.6 * ((y - y0) / Math.max(1, y1 - y0));
    for (let x = Math.round(a); x < Math.round(b); x++) {
      const nx = Math.max(-0.97, Math.min(0.97, (x + 0.5 - cx) / hw));
      out.push([x, y, nx, ny, Math.sqrt(1 - nx * nx)]);
    }
  }
  return out;
}

// ── 그리기 판 ──
function canvas() {
  const px = new Uint8ClampedArray(CW * CH * 4);
  const filled = (x, y) => x >= 0 && y >= 0 && x < CW && y < CH && px[(y * CW + x) * 4 + 3] > 0;
  const set = (x, y, c) => {
    if (x < 0 || y < 0 || x >= CW || y >= CH) return;
    px.set([c[0], c[1], c[2], 255], (y * CW + x) * 4);
  };
  /**
   * 덩어리를 음영으로 칠한다. edge: 둘레 선(빈 곳 쪽은 진한 테두리, 다른 부위 위는 연한 선),
   * max: 가장 밝은 단(4면 반짝임), warm: 살 그늘
   */
  const paint = (pts, base, { edge = true, max = 3, warm = false } = {}) => {
    const t = tones(base, warm);
    if (edge) {
      const inside = new Set(pts.map(([x, y]) => y * CW + x));
      const soft = mix(mul(base, 0.5), OUTLINE, 0.35);
      const marks = [];
      for (const [x, y] of pts) {
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const X = x + dx;
          const Y = y + dy;
          if (!inside.has(Y * CW + X)) marks.push([X, Y, filled(X, Y) ? soft : OUTLINE]);
        }
      }
      for (const [X, Y, c] of marks) set(X, Y, c);
    }
    for (const [x, y, nx, ny, nz] of pts) {
      const n = norm(nx, ny, nz);
      set(x, y, t[Math.min(max, toneOf(n[0] * L[0] + n[1] * L[1] + n[2] * L[2]))]);
    }
  };
  /** 글자 그림 찍기(얼굴 등). pal: 글자 → 색 */
  const stamp = (rows, ox, oy, pal) => rows.forEach((row, y) => [...row].forEach((ch, x) => pal[ch] && set(ox + x, oy + y, pal[ch])));
  return { px, set, paint, stamp, filled };
}

// ── 얼굴 글자 그림: k 속눈썹, I 눈동자, i 눈동자 아래 밝은 쪽, 1 반짝임 ──
const EYE_FRONT = ['.kkk', 'kI1I', 'kIII', '.iIi', '..i.'];
const EYE_FRONT_R = ['kkk.', 'I1Ik', 'IIIk', 'iIi.', '.i..'];
const EYE_SIDE = ['kkk', 'I1I', 'III', 'iIi', '.i.'];

/** 템플릿 줄 길이가 고른지(테스트용) */
export function checkTemplates() {
  const bad = [];
  for (const [name, rows] of Object.entries({ EYE_FRONT, EYE_FRONT_R, EYE_SIDE })) {
    if (rows.some((r) => r.length !== rows[0].length)) bad.push(name);
  }
  return bad;
}

const SKIN = [252, 214, 180];
const LIP = [196, 96, 86];
const LIP_F = [226, 86, 96];
const BLUSH = [255, 150, 150];
const SHOE = [66, 46, 38];
const SOCK = [244, 240, 230];
const WHITE = [248, 245, 236];
const EYE_PAL = { k: [36, 22, 20], I: [40, 26, 22], i: [124, 78, 52], 1: [255, 255, 255] };
const WOOD = [118, 78, 42];
const GUARD = [228, 186, 80];
const BEAD = [212, 150, 70];

// 무기 길이(칸), 바라보는 각도
const WEAPON_LEN = { sword: 22, dagger: 13, staff: 30, fan: 11, spear: 34 };
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
    g.paint(capsule(...at(-7), ...at(tip), 1.2), WOOD);
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
    g.paint(pts, tint);
    for (const [x, y, , , , rib] of pts) if (rib) g.set(x, y, mul(tint, 0.82));
    return;
  }
  g.paint(capsule(...at(-2), ...at(3), 1.1), WOOD);
  g.paint(capsule(hx + c * 3 - s * 3, hy + s * 3 + c * 3, hx + c * 3 + s * 3, hy + s * 3 - c * 3, 1), GUARD, { max: 4 });
  g.paint(capsule(...at(4.5), ...at(len), 1.5, 0.6), tint, { max: 4 });
}

/** 생김새 → 쓰는 색들. 아주 어두운 머리색은 윤기가 보이게 살짝 띄운다 */
function colors(look) {
  const hair = HEX(look.hair ?? '#2b211d');
  return {
    cloth: HEX(look.cloth),
    trim: HEX(look.trim ?? '#c0392b'),
    pants: HEX(look.pants ?? '#e9e2cf'),
    skirt: HEX(look.skirt ?? look.trim ?? '#c0392b'),
    hair: hair.reduce((a, b) => a + b) < 180 ? mix(hair, [86, 70, 92], 0.32) : hair,
    pin: HEX(look.pin ?? '#e8c060'),
    hat: HEX(look.hat?.color ?? '#2a2a2a'),
  };
}

// ── 부위 그리기(옆모습은 왼쪽을 보는 그림으로 그리고 오른쪽은 뒤집는다) ──

/** 바지 다리 하나: 엉덩이 → 발목, 대님, 신 */
function leg(g, col, hx, fx, lift, side) {
  const fy = 71 - lift;
  g.paint(capsule(hx, 52, fx, fy - 5, 4.8, 3.6), col.pants);
  g.paint(capsule(fx, fy - 4, fx, fy - 3.4, 2.9), mix(col.trim, col.pants, 0.25));
  g.paint(ellipsoid(fx - (side ? 1 : 0), fy, side ? 4 : 3.4, 2.4), SHOE, { max: 4 });
}

/** 치마: 가슴 아래에서 넓게 퍼진다. 주름 줄을 넣는다 */
function skirt(g, col, side, step) {
  const sway = side ? [0, -1, 1][step] : 0;
  const pts = side
    ? trunk(41, 72, (y) => 25 - (y - 41) * 0.2 + sway * ((y - 41) / 31), (y) => 39 + (y - 41) * 0.16)
    : trunk(41, 72, (y) => 23 - (y - 41) * 0.24, (y) => 41 + (y - 41) * 0.24);
  g.paint(pts, col.skirt);
  const pleat = mul(col.skirt, 0.84);
  for (const [x, y] of pts) if (y > 46 && y < 72 && (x + (side ? 1 : 0)) % 5 === 0) g.set(x, y, pleat);
}

/** 버선코만 보이는 발(치마 아래) */
function skirtFeet(g, side, step) {
  if (side) {
    g.paint(ellipsoid([25, 22, 28][step], 73, 3.2, 1.7), SOCK);
    return;
  }
  if (step !== 1) g.paint(ellipsoid(28.5, 73, 2.7, 1.6), SOCK);
  if (step !== 2) g.paint(ellipsoid(35.5, 73, 2.7, 1.6), SOCK);
}

/** 팔: 소매(어깨 → 손목, 끝으로 갈수록 넓은 배래), 끝동, 손 */
function arm(g, col, sx, sy, hx, hy, female) {
  g.paint(capsule(sx, sy, hx, hy - 1.5, 2.7, 3.5), col.cloth);
  if (female) g.paint(capsule(hx + (sx - hx) * 0.15, hy - 1.5 + (sy - hy) * 0.15, hx, hy - 1.5, 3.4), col.trim);
  g.paint(ellipsoid(hx, hy + 0.8, 2.2, 2.3), SKIN, { warm: true });
}

/** 머리털 윤기 띠: 머리 위쪽 둥근 띠를 밝게 */
function shine(g, col, pts, cx, cy, r) {
  const hi = mix(col.hair, [255, 250, 240], 0.42);
  for (const [x, y] of pts) {
    const d = Math.hypot(x + 0.5 - cx, (y + 0.5 - cy) * 1.1);
    if (Math.abs(d - r) < 0.9 && x + 0.5 < cx + r * 0.25 && y + 0.5 < cy) g.set(x, y, hi);
  }
}

/** 앞머리 가닥: 이마 위로 들쑥날쑥 내려오는 끝 */
const fringe = (x) => [0, 2, 3, 1, 0, 2, 1, 3][((x % 8) + 8) % 8];

/** 머리털(앞·뒤·옆), 상투·쪽머리 */
function hair(g, col, view, hy, female) {
  if (view === 'up') {
    const pts = ellipsoid(32, hy - 1, 14, 13.5, (x, y) => y < hy + (female ? 11 : 9));
    g.paint(pts, col.hair, { max: 4 });
    shine(g, col, pts, 32, hy - 1, 9);
    if (female) {
      g.paint(ellipsoid(32, hy + 10, 5, 4), col.hair, { max: 4 });
      g.paint(capsule(25.5, hy + 10, 38.5, hy + 10, 0.8), col.pin, { max: 4 });
    }
    return;
  }
  if (view === 'down') {
    const top = hy - 4;
    const line = female
      ? (x, y) => {
        const dx = Math.abs(x + 0.5 - 32);
        // 가운데 가르마에서 양옆으로 둥글게 넘긴 앞머리 + 귀 옆으로 내린 머리
        return y < top + 1 + dx * 0.28 || (dx > 10.5 && y < hy + 9);
      }
      : (x, y) => {
        const dx = Math.abs(x + 0.5 - 32);
        return (y < top + fringe(x) && dx < 11) || (dx >= 11 && y < hy + 5);
      };
    const pts = ellipsoid(32, hy - 1.5, 14.2, 13.5, line);
    g.paint(pts, col.hair, { max: 4 });
    shine(g, col, pts, 32, hy - 1.5, 9.5);
    if (female) for (let y = hy - 12; y < hy - 3; y++) g.set(32, y, mul(col.hair, 0.62)); // 가르마
    return;
  }
  // 옆(왼쪽을 본다): 앞머리와 정수리·뒤통수를 덮는다
  const line = (x, y) => (y < hy - 4 + (x < 26 ? fringe(x) : 0)) || x + 0.5 > 29 + (y - (hy - 4)) * 0.3;
  const pts = ellipsoid(32, hy - 1.5, 14, 13.5, (x, y) => line(x, y) && y < hy + (female ? 11 : 8));
  g.paint(pts, col.hair, { max: 4 });
  shine(g, col, pts, 32, hy - 1.5, 9.5);
  if (female) {
    g.paint(ellipsoid(43, hy + 8, 4.2, 4), col.hair, { max: 4 });
    g.paint(capsule(39, hy + 8, 48, hy + 8, 0.8), col.pin, { max: 4 });
  }
}

/** 얼굴: 큰 눈·눈썹·코·입·볼 */
function face(g, view, hy, female, col) {
  const brow = mul(col.hair, 0.7);
  const nose = tones(SKIN, true)[1];
  const blush = mix(SKIN, BLUSH, 0.55);
  const lip = female ? LIP_F : LIP;
  if (view === 'down') {
    for (const [x, y] of [[23, hy - 1], [24, hy - 2], [25, hy - 2], [38, hy - 2], [39, hy - 2], [40, hy - 1]]) g.set(x, y, brow);
    g.stamp(EYE_FRONT, 22, hy, EYE_PAL);
    g.stamp(EYE_FRONT_R, 38, hy, EYE_PAL);
    if (female) {
      g.set(21, hy, EYE_PAL.k);
      g.set(42, hy, EYE_PAL.k);
    }
    g.set(32, hy + 6, nose);
    for (const x of [21, 22, 23, 40, 41, 42]) g.set(x, hy + 6, blush);
    g.set(31, hy + 9, lip);
    g.set(32, hy + 9, lip);
    if (female) g.set(31, hy + 10, mul(lip, 0.85));
    return;
  }
  // 옆(왼쪽)
  for (const [x, y] of [[20, hy - 2], [21, hy - 2], [22, hy - 1]]) g.set(x, y, brow);
  g.stamp(EYE_SIDE, 20, hy, EYE_PAL);
  for (const x of [22, 23, 24]) g.set(x, hy + 6, blush);
  g.set(19, hy + 9, lip);
  g.set(20, hy + 9, lip);
}

/** 쓰개: 갓·투구·관·두건 */
function hat(g, col, view, hy, kind) {
  const c = col.hat;
  const side = view === 'left';
  const cx = 32;
  if (kind === 'gat') {
    g.paint(trunk(hy - 21, hy - 11, () => cx - 6.5, () => cx + 6.5), c, { max: 4 });
    g.paint(ellipsoid(cx, hy - 21, 6.5, 2), c, { max: 4 });
    g.paint(ellipsoid(cx, hy - 10, 19, side ? 2.4 : 3.2), c, { max: 4 });
    if (view !== 'up') {
      // 갓끈 구슬
      const [x0, x1] = side ? [27, 24] : [20, 24];
      for (let t = 0; t <= 1; t += 0.11) g.set(Math.round(x0 + (x1 - x0) * t), Math.round(hy - 8 + 19 * t), BEAD);
      if (!side) for (let t = 0; t <= 1; t += 0.11) g.set(Math.round(44 + (40 - 44) * t), Math.round(hy - 8 + 19 * t), BEAD);
    }
    return;
  }
  if (kind === 'helm') {
    g.paint(ellipsoid(cx, hy - 3, 15, 13, (x, y) => y < hy - 4), c, { max: 4 });
    if (side) g.paint(capsule(cx + 12, hy - 4, cx + 12.5, hy + 8, 2.2), c);
    else {
      g.paint(capsule(18.5, hy - 4, 18.5, hy + 8, 2.1), c);
      g.paint(capsule(45.5, hy - 4, 45.5, hy + 8, 2.1), c);
    }
    g.paint(capsule(cx - 15, hy - 5, cx + 15, hy - 5, 1.5), mul(c, 0.86), { max: 4 });
    g.paint(ellipsoid(cx, hy - 17, 2.2, 2.2), GUARD, { max: 4 });
    return;
  }
  if (kind === 'crown') {
    g.paint(trunk(hy - 18, hy - 12, () => cx - 7, () => cx + 7), c, { max: 4 });
    for (const dx of [-6, 0, 6]) g.paint(ellipsoid(cx + dx, hy - 19.5, 1.7, 2.1), c, { max: 4 });
    if (view !== 'up') g.paint(ellipsoid(cx, hy - 15, 1.5, 1.5), [214, 48, 64], { max: 4 });
    return;
  }
  if (kind === 'band') {
    if (side) {
      g.paint(capsule(19, hy - 6, 44, hy - 4, 1.5), c);
      g.paint(capsule(44, hy - 4, 48, hy + 5, 1.1), c);
    } else g.paint(capsule(18.5, hy - 5, 45.5, hy - 5, 1.5), c);
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
  const hy = 21 - bob; // 머리 가운데 줄
  const sy = 37 - bob; // 어깨 줄
  const weapon = look.weapon && pose !== 'cast' ? look.weapon : null;

  // 걸을 때 팔 흔들기, 공격할 때 손을 내민다
  const swing = side ? [0, 3, -3][step] : [0, 1, -1][step];
  const fwd = { down: [0, 1], up: [0, -1], left: [-1, 0] }[view];
  const reach = pose === 'attack' ? REACH[phase] : 0;
  const swingSign = view === 'left' || view === 'up' ? -1 : 1;
  const angle = pose === 'attack' ? FACE[view] + swingSign * SWING[phase] : IDLE_ANGLE[view];

  // 손 자리(무기 든 손 = 앞쪽 손)
  let main;
  let off;
  if (side) {
    main = [29 - swing + fwd[0] * reach, 49 - bob];
    off = [35 + swing, 48 - bob];
  } else if (view === 'down') {
    main = [21 + reach * 0.3, 49 - bob - swing + fwd[1] * reach * 0.5];
    off = [43, 49 - bob + swing];
  } else {
    main = [43 - reach * 0.3, 49 - bob - swing];
    off = [21, 49 - bob + swing];
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
    leg(g, col, 33, [32, 36, 30][step], 0, true);
    leg(g, col, 31, [31, 26, 33][step], 0, true);
  } else {
    leg(g, col, 28, 28, step === 1 ? 2 : 0, false);
    leg(g, col, 36, 36, step === 2 ? 2 : 0, false);
  }

  // ── 몸통(저고리) ──
  const top = 33 - bob;
  const bottom = (female ? 42 : 52) - bob;
  const round = (y, a, b) => (y - top < 2 ? [a + 2 - (y - top), b - 2 + (y - top)] : [a, b]);
  if (side) {
    g.paint(trunk(top, bottom, (y) => round(y, 25, 39)[0] - (y - top) * 0.08, (y) => round(y, 25, 39)[1] + (y - top) * 0.06), col.cloth);
    g.paint(capsule(27, top + 1, 28.5, top + 5, 1.1), WHITE, { edge: false });
    g.paint(capsule(25.5, top + 8, 24.5, top + (female ? 17 : 14), 1), col.trim);
  } else {
    g.paint(trunk(top, bottom, (y) => round(y, 23, 41)[0] - (y - top) * 0.12, (y) => round(y, 23, 41)[1] + (y - top) * 0.12), col.cloth);
    if (view === 'down') {
      // 동정(흰 깃)과 고름
      g.paint(capsule(36, top + 0.5, 30, top + 8, 1.2), WHITE, { edge: false });
      g.paint(capsule(30.5, top + 8, 28.5, top + (female ? 18 : 15), 0.9), col.trim);
      g.paint(capsule(31.5, top + 8, 33, top + (female ? 20 : 16), 0.9), col.trim);
      g.paint(ellipsoid(31, top + 8, 1.7, 1.3), col.trim);
    }
  }

  // ── 팔(앞쪽) ──
  if (pose === 'cast' && !side) {
    arm(g, col, 24, sy, 18, 26 - bob, female);
    arm(g, col, 40, sy, 46, 26 - bob, female);
  } else if (pose === 'cast') {
    arm(g, col, 31, sy, 19, 41 - bob, female);
  } else if (side) {
    arm(g, col, 31, sy, main[0], main[1], female);
  } else {
    arm(g, col, 24, sy, view === 'down' ? main[0] : off[0], view === 'down' ? main[1] : off[1], female);
    arm(g, col, 40, sy, view === 'down' ? off[0] : main[0], view === 'down' ? off[1] : main[1], female);
  }

  // ── 머리 ──
  const hk = look.hat?.kind;
  if (!side) {
    g.paint(ellipsoid(18.6, hy + 2, 1.8, 2.7), SKIN, { warm: true });
    g.paint(ellipsoid(45.4, hy + 2, 1.8, 2.7), SKIN, { warm: true });
  }
  if (!female && hk !== 'gat' && hk !== 'helm') {
    g.paint(ellipsoid(32, hy - 15, 3.8, 3.6), col.hair, { max: 4 });
    g.paint(capsule(29, hy - 12.5, 35, hy - 12.5, 1), mul(col.hair, 0.75));
  }
  g.paint(ellipsoid(side ? 31 : 32, hy, 13.5, 13), SKIN, { warm: true });
  if (view !== 'up') face(g, view, hy, female, col);
  hair(g, col, view, hy, female);
  if (side) g.paint(ellipsoid(32.5, hy + 2, 1.7, 2.5), SKIN, { warm: true });
  if (hk) hat(g, col, view, hy, hk);

  // ── 앞쪽 무기 ──
  if (weapon && view !== 'up') {
    drawWeapon(g, main, angle, weapon);
    g.paint(ellipsoid(main[0], main[1] + 0.8, 2.2, 2.3), SKIN, { warm: true });
  }

  if (dir === 'right') {
    const out = new Uint8ClampedArray(g.px.length);
    for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) out.set(g.px.subarray((y * CW + x) * 4, (y * CW + x) * 4 + 4), (y * CW + (CW - 1 - x)) * 4);
    return { w: CW, h: CH, data: out };
  }
  return { w: CW, h: CH, data: g.px };
}
