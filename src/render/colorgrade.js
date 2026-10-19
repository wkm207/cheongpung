// 원작풍 색감: 바닥의 맑은 초록은 누런 올리브빛 풀색으로, 나무·덤불은 짙은 초록으로 옮긴다(나머지 색은 그대로).
const GREEN_FROM = 65;
const GREEN_TO = 170;

function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return [h * 60, s, l];
}

function hslToRgb(h, s, l) {
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
}

/**
 * 한 색. mode 'ground': 누런 풀빛(색상 62~92°), 채도 살짝 낮춤
 *        mode 'foliage': 짙은 초록(색상 95~120°), 어둡게 — 원작의 둥근 덤불처럼
 */
export function gradeColor(r, g, b, mode = 'ground') {
  const [h, s, l] = rgbToHsl(r, g, b);
  if (s < 0.12 || h < GREEN_FROM || h > GREEN_TO) return [r, g, b];
  if (mode === 'foliage') return hslToRgb(95 + (h - GREEN_FROM) * 0.25, Math.min(1, s * 1.05), l * 0.6);
  return hslToRgb(62 + (h - GREEN_FROM) * 0.3, s * 0.88, l * 0.97);
}

/** RGBA 배열 전체에 적용(같은 색은 한 번만 계산) */
export function gradePixels(data, mode = 'ground') {
  const memo = new Map();
  for (let i = 0; i < data.length; i += 4) {
    if (!data[i + 3]) continue;
    const key = (data[i] << 16) | (data[i + 1] << 8) | data[i + 2];
    let c = memo.get(key);
    if (!c) {
      c = gradeColor(data[i], data[i + 1], data[i + 2], mode);
      memo.set(key, c);
    }
    data[i] = c[0];
    data[i + 1] = c[1];
    data[i + 2] = c[2];
  }
  return data;
}
