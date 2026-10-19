// 입체 도트 그리기 도구: 타원체·캡슐·몸통 같은 둥근 덩어리를 픽셀 판에 찍고, 왼쪽 위 빛으로 음영을 넣는다.
// 사람(chibi.js)과 몬스터(mobdots.js)가 같이 쓴다. 캔버스 없이 RGBA 배열만 다루므로 노드에서도 돈다.

export const HEX = (h) => {
  const x = h.length === 4 ? [...h.slice(1)].map((c) => c + c).join('') : h.slice(1, 7);
  return [parseInt(x.slice(0, 2), 16), parseInt(x.slice(2, 4), 16), parseInt(x.slice(4, 6), 16)];
};
export const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
export const mul = (a, k) => a.map((v) => Math.max(0, Math.min(255, Math.round(v * k))));

// 빛: 왼쪽 위 앞에서
const L = (() => {
  const v = [-0.5, -0.6, 0.8];
  const n = Math.hypot(...v);
  return v.map((x) => x / n);
})();
const COOL = [58, 50, 92];
const WARM_SHADOW = [176, 96, 84];
const WARM = [255, 248, 232];
export const OUTLINE = [32, 22, 20];

/** 바탕색 → 음영 여섯 단(짙은 그늘 … 반짝임). warm: 살처럼 그늘을 붉게 */
export function tones(base, warm = false) {
  const sh = warm ? WARM_SHADOW : COOL;
  return [
    mix(mul(base, 0.58), sh, 0.28), mix(mul(base, 0.72), sh, 0.18), mix(mul(base, 0.86), sh, 0.08),
    base, mix(mul(base, 1.05), WARM, 0.14), mix(mul(base, 1.1), WARM, 0.45),
  ];
}
// 4×4 바이어 무늬: 음영 경계를 점점이 섞어 부드럽게
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => v / 16 - 0.5);
const toneOf = (lit) => (lit < -0.05 ? 0 : lit < 0.18 ? 1 : lit < 0.42 ? 2 : lit < 0.7 ? 3 : lit < 0.9 ? 4 : 5);

function norm(nx, ny, nz) {
  const n = Math.hypot(nx, ny, nz) || 1;
  return [nx / n, ny / n, nz / n];
}

/** 타원체(clip(x,y) 로 일부만) */
export function ellipsoid(cx, cy, rx, ry, clip) {
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
export function capsule(x0, y0, x1, y1, r0, r1 = r0) {
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
export function trunk(y0, y1, xl, xr) {
  const out = [];
  for (let y = Math.round(y0); y <= Math.round(y1); y++) {
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

/** w×h 픽셀 판 */
export function dotCanvas(W, H) {
  const px = new Uint8ClampedArray(W * H * 4);
  const filled = (x, y) => x >= 0 && y >= 0 && x < W && y < H && px[(y * W + x) * 4 + 3] > 0;
  const set = (x, y, c) => {
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    px.set([c[0], c[1], c[2], 255], (y * W + x) * 4);
  };
  /**
   * 덩어리를 음영으로 칠한다. edge: 둘레 선(빈 곳 쪽은 진한 테두리, 다른 부위 위는 연한 선),
   * max: 가장 밝은 단(5면 반짝임), warm: 살 그늘, dither: 음영 경계를 점점이 섞기, outline: 바깥 테두리 색
   */
  const paint = (pts, base, { edge = true, max = 4, warm = false, dither = true, outline = OUTLINE } = {}) => {
    const t = tones(base, warm);
    if (edge) {
      const inside = new Set(pts.map(([x, y]) => y * W + x));
      const soft = mix(mul(base, 0.55), OUTLINE, 0.3);
      const marks = [];
      for (const [x, y] of pts) {
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const X = x + dx;
          const Y = y + dy;
          if (!inside.has(Y * W + X)) marks.push([X, Y, filled(X, Y) ? soft : outline]);
        }
      }
      for (const [X, Y, c] of marks) set(X, Y, c);
    }
    for (const [x, y, nx, ny, nz] of pts) {
      const n = norm(nx, ny, nz);
      const lit = n[0] * L[0] + n[1] * L[1] + n[2] * L[2] + (dither ? BAYER[(y & 3) * 4 + (x & 3)] * 0.16 : 0);
      set(x, y, t[Math.min(max, toneOf(lit))]);
    }
  };
  /** 글자 그림 찍기(얼굴 등). pal: 글자 → 색 */
  const stamp = (rows, ox, oy, pal) => rows.forEach((row, y) => [...row].forEach((ch, x) => pal[ch] && set(ox + x, oy + y, pal[ch])));
  /** 좌우 뒤집은 사본 */
  const mirrored = () => {
    const out = new Uint8ClampedArray(px.length);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) out.set(px.subarray((y * W + x) * 4, (y * W + x) * 4 + 4), (y * W + (W - 1 - x)) * 4);
    return out;
  };
  return { px, set, paint, stamp, filled, mirrored, W, H };
}
