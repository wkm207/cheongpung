// 도트 그림을 부드럽게: 도트 격자를 Scale2x(EPX) 알고리즘으로 두 번 키워 계단 모서리를 둥글리고,
// 위는 밝게·아래는 어둡게 빛을 얹어 입체감을 준다. 결과 그림은 HI배 해상도로 만들어
// 화면에서는 원래 크기(lw×lh)로 그린다.

export const HI = 2;

/** imageData를 도트(dot px) 한 칸씩 읽어 32비트 색 배열로 */
function readDots(ctx, w, h, dot) {
  const src = ctx.getImageData(0, 0, w, h).data;
  const dw = Math.floor(w / dot);
  const dh = Math.floor(h / dot);
  const out = new Uint32Array(dw * dh);
  const off = dot > 1 ? Math.floor(dot / 2) : 0;
  for (let y = 0; y < dh; y++) {
    for (let x = 0; x < dw; x++) {
      const i = ((y * dot + off) * w + (x * dot + off)) * 4;
      out[y * dw + x] = ((src[i + 3] << 24) | (src[i + 2] << 16) | (src[i + 1] << 8) | src[i]) >>> 0;
    }
  }
  return { data: out, w: dw, h: dh };
}

/** Scale2x(EPX): 한 칸을 2×2로 나누며 이웃이 같은 쪽으로 모서리를 채운다 */
export function scale2x({ data, w, h }) {
  const W = w * 2;
  const out = new Uint32Array(W * h * 2);
  const at = (x, y) => data[Math.min(h - 1, Math.max(0, y)) * w + Math.min(w - 1, Math.max(0, x))];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const p = data[y * w + x];
      const a = at(x, y - 1);
      const b = at(x + 1, y);
      const c = at(x - 1, y);
      const d = at(x, y + 1);
      let e0 = p;
      let e1 = p;
      let e2 = p;
      let e3 = p;
      if (a !== d && c !== b) {
        if (c === a) e0 = a;
        if (a === b) e1 = b;
        if (c === d) e2 = c;
        if (d === b) e3 = d;
      }
      const o = y * 2 * W + x * 2;
      out[o] = e0;
      out[o + 1] = e1;
      out[o + W] = e2;
      out[o + W + 1] = e3;
    }
  }
  return { data: out, w: W, h: h * 2 };
}

function toCanvas({ data, w, h }) {
  const c = Object.assign(document.createElement('canvas'), { width: w, height: h });
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(w, h);
  new Uint32Array(img.data.buffer).set(data);
  ctx.putImageData(img, 0, 0);
  return c;
}

/** 위에서 내려오는 빛: 윗부분은 따뜻하게 밝히고 아랫부분은 그늘지게 */
function shade(ctx, w, h, strength = 1) {
  ctx.save();
  ctx.globalCompositeOperation = 'source-atop';
  const g = ctx.createLinearGradient(0, 0, w * 0.3, h);
  g.addColorStop(0, `rgba(255, 246, 220, ${0.16 * strength})`);
  g.addColorStop(0.45, 'rgba(255, 255, 255, 0)');
  g.addColorStop(1, `rgba(20, 12, 40, ${0.26 * strength})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

/** 도트 스프라이트(dot px = 도트 한 칸)를 부드러운 고해상도 그림으로 바꾼다 */
export function smoothSprite(src, dot = 2) {
  const w = src.width;
  const h = src.height;
  const dots = readDots(src.getContext('2d', { willReadFrequently: true }), w, h, dot);
  const big = toCanvas(scale2x(scale2x(dots)));
  const out = Object.assign(document.createElement('canvas'), { width: w * HI, height: h * HI });
  const ctx = out.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(big, 0, 0, out.width, out.height);
  shade(ctx, out.width, out.height);
  out.lw = w;
  out.lh = h;
  return out;
}

/** 맵 전체: 도트 격자를 Scale2x로 둥글리고(크기는 그대로) 살짝 번지게 해 붓으로 칠한 듯이 */
export function smoothMap(src, dot = 2) {
  const w = src.width;
  const h = src.height;
  const ctx = src.getContext('2d', { willReadFrequently: true });
  const dots = readDots(ctx, w, h, dot);
  const up = scale2x(dots); // 도트 1칸 = 2픽셀이므로 크기가 원래와 같다
  // 가벼운 번짐: 가운데 4 + 상하좌우 1씩
  const img = ctx.createImageData(up.w, up.h);
  const px = new Uint8ClampedArray(new Uint32Array(up.data).buffer);
  const out = img.data;
  const W = up.w;
  for (let y = 0; y < up.h; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      const l = (y * W + Math.max(0, x - 1)) * 4;
      const r = (y * W + Math.min(W - 1, x + 1)) * 4;
      const u = (Math.max(0, y - 1) * W + x) * 4;
      const d = (Math.min(up.h - 1, y + 1) * W + x) * 4;
      for (let k = 0; k < 3; k++) out[i + k] = (px[i + k] * 4 + px[l + k] + px[r + k] + px[u + k] + px[d + k]) >> 3;
      out[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return src;
}
