// 그래픽 방식: 'classic'(원작풍 도트) 또는 'smooth'(매끈한 고해상도 그림).
// 원작풍은 같은 벡터 그림을 1배 크기로 그린 뒤 반투명 가장자리를 잘라 또렷한 도트로 만들고 진한 외곽선을 두른다.

let classic = true;
let ninja = true;
let photo = false;
export const isClassic = () => classic;
/** 새 타일(닌자 어드벤처) 그림을 쓰는가 */
export const isNinja = () => ninja;
export function setClassic(on) {
  classic = !!on;
}
export function setNinja(on) {
  ninja = !!on;
}
/** 실사 그림(AI로 그린 사람·몬스터·아이템·맵)을 쓰는가 — 새 도트 위에 얹는 선택 사항 */
export const isPhoto = () => photo;
export function setPhoto(on) {
  photo = !!on;
}

const OUTLINE = [28, 18, 12];
const ALPHA_CUT = 100;

/** w×h 논리 크기의 그림을 원작풍 도트 캔버스로. draw(ctx)는 1배 좌표로 그린다. */
export function dotify(w, h, draw) {
  const c = Object.assign(document.createElement('canvas'), { width: w, height: h, lw: w, lh: h });
  const ctx = c.getContext('2d', { willReadFrequently: true });
  draw(ctx);
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  const solid = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const a = d[i * 4 + 3];
    if (a >= ALPHA_CUT) {
      // 반투명 가장자리는 진하게 메워 또렷하게
      const k = 255 / a;
      d[i * 4] = Math.min(255, d[i * 4] * k);
      d[i * 4 + 1] = Math.min(255, d[i * 4 + 1] * k);
      d[i * 4 + 2] = Math.min(255, d[i * 4 + 2] * k);
      d[i * 4 + 3] = 255;
      solid[i] = 1;
    } else {
      d[i * 4 + 3] = 0;
    }
  }
  // 바깥 테두리 한 칸을 진한 외곽선으로(이미 어두운 가장자리 옆은 건너뛴다)
  const bright = (i) => d[i * 4] + d[i * 4 + 1] + d[i * 4 + 2] > 150;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (solid[i]) continue;
      const near = [x > 0 && i - 1, x < w - 1 && i + 1, y > 0 && i - w, y < h - 1 && i + w].filter((n) => n !== false && solid[n]);
      if (!near.length || !near.some(bright)) continue;
      d[i * 4] = OUTLINE[0];
      d[i * 4 + 1] = OUTLINE[1];
      d[i * 4 + 2] = OUTLINE[2];
      d[i * 4 + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return c;
}
