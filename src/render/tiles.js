import { TILE } from '../config.js';
import { hash2 } from '../core/rng.js';

// 각 타일을 16x16 도트(2px 단위)로 그린다. n(dx, dy)는 이웃 타일 문자.
const P = 2;

function painter(ctx, ox, oy) {
  return (x, y, w, h, color) => {
    ctx.fillStyle = color;
    ctx.fillRect(ox + x * P, oy + y * P, w * P, h * P);
  };
}

function speckle(r, tx, ty, count, colors, salt = 0) {
  for (let i = 0; i < count; i++) {
    const x = Math.floor(hash2(tx, ty, salt + i * 3) * 16);
    const y = Math.floor(hash2(tx, ty, salt + i * 3 + 1) * 16);
    const c = colors[Math.floor(hash2(tx, ty, salt + i * 3 + 2) * colors.length)];
    r(x, y, 1, 1, c);
  }
}

const grass = (r, tx, ty) => {
  r(0, 0, 16, 16, '#4e8a3a');
  speckle(r, tx, ty, 10, ['#5d9c46', '#437a31', '#66a84e']);
};
const dryGrass = (r, tx, ty) => {
  r(0, 0, 16, 16, '#9a9a52');
  speckle(r, tx, ty, 10, ['#a8a85e', '#878745', '#b3b06a']);
};

const darkGrass = (r, tx, ty) => {
  r(0, 0, 16, 16, '#355e2d');
  speckle(r, tx, ty, 10, ['#3f6d35', '#2b4f25', '#4a7a3e']);
};
const snow = (r, tx, ty) => {
  r(0, 0, 16, 16, '#eef3f8');
  speckle(r, tx, ty, 8, ['#dde7f0', '#ffffff', '#cfdbe6']);
};
const GROUNDS = { '.': grass, ':': dryGrass, ';': darkGrass, '*': snow };

/** 나무·바위 밑에 깔 바닥: 이웃 칸의 바닥을 따라간다 */
function groundUnder(n) {
  for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
    const g = GROUNDS[n(dx, dy)];
    if (g) return g;
  }
  return grass;
}

const PAINTERS = {
  '.': grass,
  ':': dryGrass,
  ';': darkGrass,
  '*': snow,
  ',': (r, tx, ty, n) => {
    grass(r, tx, ty, n);
    const colors = ['#f7f1a1', '#f5b7d2', '#ffffff', '#f7c873'];
    for (let i = 0; i < 3; i++) {
      const x = 2 + Math.floor(hash2(tx, ty, 50 + i) * 12);
      const y = 2 + Math.floor(hash2(tx, ty, 60 + i) * 12);
      r(x, y, 1, 1, colors[Math.floor(hash2(tx, ty, 70 + i) * 4)]);
      r(x, y + 1, 1, 1, '#2f6b25');
    }
  },
  '=': (r, tx, ty) => {
    r(0, 0, 16, 16, '#b8955e');
    speckle(r, tx, ty, 9, ['#a7844f', '#c6a46c', '#9b7a48']);
  },
  S: (r, tx, ty) => {
    r(0, 0, 16, 16, '#9a958a');
    r(0, 7, 16, 1, '#7d786e');
    r(hash2(tx, ty, 1) > 0.5 ? 5 : 10, 0, 1, 7, '#7d786e');
    r(hash2(tx, ty, 2) > 0.5 ? 3 : 12, 8, 1, 8, '#7d786e');
    speckle(r, tx, ty, 4, ['#aaa59a']);
  },
  T: (r, tx, ty, n) => {
    const ground = groundUnder(n);
    ground(r, tx, ty);
    if (TALL_TREES) {
      // 잎은 캐릭터와 같은 층에서 따로 그린다: 여기서는 밑동과 그림자만
      r(3, 12, 10, 3, 'rgba(0,0,0,0.25)');
      r(7, 10, 2, 5, '#5b3a1e');
      r(7, 10, 1, 5, '#7a5230');
      return;
    }
    if (ground === snow) {
      // 눈 덮인 소나무
      r(7, 12, 2, 3, '#5b3a1e');
      r(6, 1, 4, 2, '#1d4a3a');
      r(4, 3, 8, 3, '#1d4a3a');
      r(3, 6, 10, 3, '#1d4a3a');
      r(2, 9, 12, 3, '#1d4a3a');
      r(6, 1, 3, 1, '#ffffff');
      r(4, 3, 4, 1, '#ffffff');
      r(3, 6, 5, 1, '#ffffff');
      r(2, 9, 6, 1, '#ffffff');
      return;
    }
    r(7, 11, 2, 4, '#5b3a1e');
    r(3, 3, 10, 8, '#1f5a22');
    r(4, 2, 8, 1, '#1f5a22');
    r(2, 4, 1, 6, '#1f5a22');
    r(13, 4, 1, 6, '#1f5a22');
    r(4, 3, 6, 4, '#2e7a2f');
    r(5, 3, 2, 2, '#3f9441');
    r(4, 11, 8, 1, '#173f18');
  },
  O: (r, tx, ty, n) => {
    groundUnder(n)(r, tx, ty);
    r(3, 5, 10, 9, '#6e6e6e');
    r(4, 4, 8, 1, '#6e6e6e');
    r(4, 5, 5, 3, '#8e8e8e');
    r(10, 10, 3, 4, '#555');
    r(3, 13, 10, 1, '#3d3d3d');
  },
  '~': (r, tx, ty, n) => {
    r(0, 0, 16, 16, '#2f6db5');
    speckle(r, tx, ty, 4, ['#4f8bd0', '#6aa5e0']);
    if (n(0, -1) !== '~') r(0, 0, 16, 2, '#a6d0f5');
    if (n(-1, 0) !== '~') r(0, 0, 1, 16, '#5b8fca');
    if (n(1, 0) !== '~') r(15, 0, 1, 16, '#5b8fca');
  },
  // 굴 모래 바닥(주황빛 흙)
  d: (r, tx, ty) => {
    r(0, 0, 16, 16, '#c98a4b');
    speckle(r, tx, ty, 10, ['#d69a5a', '#b87a3e', '#e0a868', '#a86c34']);
  },
  // 바위기둥: 붉은 갈색 바위 덩어리
  M: (r, tx, ty, n) => {
    r(0, 0, 16, 16, n(0, 1) === 'M' ? '#5a2e1c' : '#c98a4b');
    r(1, 1, 14, 13, '#7a3e24');
    r(2, 2, 11, 5, '#9a5434');
    r(3, 2, 5, 2, '#b8704a');
    r(1, 11, 14, 3, '#4a2416');
    speckle(r, tx, ty, 4, ['#6a3420', '#8a4a2c'], 20);
  },
  // 흉가 마루: 어둡고 낡은 나무판
  g: (r, tx, ty) => {
    r(0, 0, 16, 16, '#3a2c22');
    for (let y = 0; y < 16; y += 4) r(0, y, 16, 1, '#2a1e16');
    r((tx * 5) % 13, 4 * ((ty * 3) % 4) + 1, 3, 1, '#4a3a2c');
    speckle(r, tx, ty, 4, ['#2e221a', '#45362a']);
  },
  // 흉가 벽: 거무튀튀한 흙벽과 썩은 기둥
  N: (r, tx, ty, n) => {
    r(0, 0, 16, 16, '#2a2228');
    r(0, 0, 3, 16, '#1a1418');
    speckle(r, tx, ty, 6, ['#342a30', '#201a1e']);
    if (n(0, 1) !== 'N') {
      r(0, 10, 16, 6, '#4a3a3e');
      r(0, 10, 16, 1, '#5a4a4e');
    }
  },
  c: (r, tx, ty) => {
    r(0, 0, 16, 16, '#5a4a3c');
    speckle(r, tx, ty, 8, ['#4d3f33', '#67574a', '#715f50']);
  },
  X: (r, tx, ty, n) => {
    r(0, 0, 16, 16, '#2b2420');
    speckle(r, tx, ty, 6, ['#3a312b', '#221c18']);
    if (n(0, 1) !== 'X') {
      r(0, 8, 16, 8, '#4a3d33');
      r(0, 8, 16, 1, '#6b5a4b');
      speckle(r, tx, ty, 3, ['#3a3029'], 40);
    }
  },
  W: (r, tx, ty, n) => {
    r(0, 0, 16, 16, '#e8dcc0');
    r(0, 0, 1, 16, '#7a5230');
    r(15, 0, 1, 16, '#7a5230');
    r(0, 7, 16, 1, '#7a5230');
    if (n(0, 1) !== 'W' && n(0, 1) !== 'D') r(0, 14, 16, 2, '#6b6b6b');
    if (n(-1, 0) === 'D' || n(1, 0) === 'D' || hash2(tx, ty, 9) > 0.6) {
      r(5, 2, 6, 4, '#4b3420');
      r(6, 3, 4, 2, '#d8c79a');
      r(8, 3, 1, 2, '#4b3420');
    }
  },
  D: (r) => {
    r(0, 0, 16, 16, '#e8dcc0');
    r(2, 1, 12, 15, '#5b3a1e');
    r(3, 2, 4, 14, '#7a5230');
    r(9, 2, 4, 14, '#7a5230');
    r(7, 8, 2, 2, '#e0b44a');
  },
  R: (r, tx, ty, n) => {
    r(0, 0, 16, 16, '#3d4a5c');
    for (let y = 1; y < 16; y += 3) r(0, y, 16, 1, '#2a3442');
    for (let x = 1; x < 16; x += 4) r(x, 0, 1, 16, '#4c5b70');
    if (n(0, -1) !== 'R') r(0, 0, 16, 2, '#25303d');
    if (n(0, 1) !== 'R') {
      r(0, 13, 16, 3, '#25303d');
      if (n(-1, 0) !== 'R') r(0, 11, 2, 2, '#25303d');
      if (n(1, 0) !== 'R') r(14, 11, 2, 2, '#25303d');
    }
  },
  // 돌담
  Q: (r, tx, ty, n) => {
    r(0, 0, 16, 16, '#7d7468');
    for (let row = 0; row < 4; row++) {
      const off = (row + tx) % 2 ? 0 : 4;
      for (let x = -4 + off; x < 16; x += 8) {
        const shade = hash2(tx * 7 + x, ty * 5 + row, 3) > 0.5 ? '#a39887' : '#948a7a';
        r(Math.max(0, x + 1), row * 4 + 1, Math.min(6, 16 - Math.max(0, x + 1)), 3, shade);
      }
    }
    if (n(0, -1) !== 'Q') r(0, 0, 16, 2, '#5f574c');
    r(0, 15, 16, 1, '#4d463d');
  },
  // 초가지붕
  Y: (r, tx, ty, n) => {
    r(0, 0, 16, 16, '#d8b25a');
    for (let y = 1; y < 16; y += 3) r(0, y, 16, 1, '#b8913f');
    speckle(r, tx, ty, 10, ['#e9c977', '#c49d4a']);
    if (n(0, -1) !== 'Y') {
      r(0, 0, 16, 3, '#c9a24c');
      r(0, 0, 16, 1, '#8a6a2a');
    }
    if (n(0, 1) !== 'Y') {
      r(0, 13, 16, 3, '#a8822f');
      r(0, 15, 16, 1, '#6b4f1c');
    }
    if (n(-1, 0) !== 'Y') r(0, 0, 1, 16, '#8a6a2a');
    if (n(1, 0) !== 'Y') r(15, 0, 1, 16, '#8a6a2a');
  },
  // 대문 기둥(붉은 칠)
  G: (r, tx, ty, n) => {
    groundUnder(n)(r, tx, ty);
    r(5, 4, 6, 12, '#a52a2a');
    r(6, 4, 2, 12, '#c94040');
    r(3, 1, 10, 3, '#3d4a5c');
    r(2, 3, 12, 1, '#25303d');
    r(5, 15, 6, 1, '#5a1515');
  },
  // 장승
  J: (r, tx, ty, n) => {
    groundUnder(n)(r, tx, ty);
    r(5, 1, 6, 14, '#8b5a2b');
    r(5, 1, 6, 2, '#2b2b2b');
    r(6, 4, 1, 1, '#1a1a1a');
    r(9, 4, 1, 1, '#1a1a1a');
    r(6, 5, 4, 1, '#c0392b');
    r(7, 7, 2, 2, '#c0392b');
    r(6, 10, 4, 1, '#1a1a1a');
    r(5, 15, 6, 1, '#4a2f14');
  },
  // 장독
  K: (r, tx, ty, n) => {
    groundUnder(n)(r, tx, ty);
    r(3, 6, 10, 8, '#5a3420');
    r(2, 8, 12, 4, '#5a3420');
    r(4, 4, 8, 2, '#6b3f27');
    r(5, 3, 6, 1, '#3d2214');
    r(4, 7, 3, 3, '#7a4a2e');
    r(3, 14, 10, 1, '#2e1a10');
  },
  // 실내 벽(나무 기둥과 흙벽)
  H: (r, tx, ty, n) => {
    r(0, 0, 16, 16, '#d9c49a');
    r(0, 0, 16, 2, '#6b4423');
    r(0, 14, 16, 2, '#5a3a1e');
    if (tx % 3 === 0) r(0, 0, 2, 16, '#7a5230');
    if (n(0, 1) !== 'H') {
      r(0, 12, 16, 4, '#8b6a42');
      r(0, 15, 16, 1, '#3e2a16');
    }
  },
  // 마루
  P: (r, tx, ty) => {
    r(0, 0, 16, 16, '#b07c46');
    for (let y = 3; y < 16; y += 4) r(0, y, 16, 1, '#8f6034');
    r((ty % 2) * 8 + 4, 0, 1, 16, '#9a6a3a');
    speckle(r, tx, ty, 4, ['#bd8a52', '#a3713e']);
  },
  // 탁자·계산대
  U: (r, tx, ty, n) => {
    PAINTERS.P(r, tx, ty, n);
    r(1, 4, 14, 8, '#5a3420');
    r(1, 4, 14, 2, '#8b5a2b');
    r(2, 12, 2, 3, '#3e2412');
    r(12, 12, 2, 3, '#3e2412');
    if (hash2(tx, ty, 7) > 0.5) r(6, 2, 4, 3, '#e8e2d0');
  },
  // 선반(그릇·약재·옷감)
  V: (r, tx, ty) => {
    r(0, 0, 16, 16, '#5a3a1e');
    r(1, 2, 14, 1, '#8b5a2b');
    r(1, 8, 14, 1, '#8b5a2b');
    const colors = ['#c0392b', '#2e86c1', '#f4d03f', '#27ae60', '#ecf0f1', '#a569bd'];
    for (let i = 0; i < 3; i++) {
      r(2 + i * 4, 3 + (i % 2), 3, 4 - (i % 2), colors[Math.floor(hash2(tx, ty, i) * 6)]);
      r(2 + i * 4, 9 + ((i + 1) % 2), 3, 4 - ((i + 1) % 2), colors[Math.floor(hash2(tx, ty, i + 9) * 6)]);
    }
    r(0, 14, 16, 2, '#3e2412');
  },
  // 화산재 땅
  a: (r, tx, ty) => {
    r(0, 0, 16, 16, '#3a2e2a');
    speckle(r, tx, ty, 9, ['#4a3a34', '#2c2220', '#5a4038']);
  },
  // 용암
  L: (r, tx, ty, n) => {
    r(0, 0, 16, 16, '#d4451f');
    speckle(r, tx, ty, 8, ['#ff7b2e', '#ffb347', '#a8321a']);
    if (n(0, -1) !== 'L') r(0, 0, 16, 2, '#2c2220');
  },
  // 바닷속 모래
  b: (r, tx, ty) => {
    r(0, 0, 16, 16, '#2b6f8f');
    speckle(r, tx, ty, 8, ['#347d9e', '#25607c', '#5fa8c4']);
    if (hash2(tx, ty, 3) > 0.85) r(6, 7, 3, 1, '#8fd3f4');
  },
  // 산호
  C: (r, tx, ty, n) => {
    PAINTERS.b(r, tx, ty, n);
    const c = hash2(tx, ty, 4) > 0.5 ? '#ff7f9f' : '#ffb347';
    r(7, 4, 2, 10, c);
    r(4, 6, 2, 6, c);
    r(10, 5, 2, 7, c);
    r(4, 6, 4, 1, c);
    r(9, 8, 3, 1, c);
    r(5, 13, 7, 1, '#1d4f66');
  },
  // 대나무
  Z: (r, tx, ty, n) => {
    groundUnder(n)(r, tx, ty);
    for (const x of [3, 8, 12]) {
      r(x, 0, 2, 16, '#5a9a3a');
      r(x, 0, 1, 16, '#7cc05a');
      r(x, 4 + (x % 3), 2, 1, '#2f5a1e');
      r(x, 11 - (x % 2), 2, 1, '#2f5a1e');
    }
    r(5, 2, 3, 1, '#4f8a35');
    r(10, 7, 3, 1, '#4f8a35');
  },
  F: (r, tx, ty) => {
    grass(r, tx, ty);
    r(0, 6, 16, 2, '#8b5a2b');
    r(0, 11, 16, 2, '#8b5a2b');
    r(2, 4, 2, 11, '#a0693a');
    r(12, 4, 2, 11, '#a0693a');
  },
  w: (r) => {
    r(0, 0, 16, 16, '#9a958a');
    r(2, 3, 12, 11, '#6e6e6e');
    r(3, 4, 10, 9, '#8e8e8e');
    r(5, 6, 6, 5, '#2f6db5');
    r(6, 7, 3, 1, '#6aa5e0');
    r(2, 1, 1, 3, '#5b3a1e');
    r(13, 1, 1, 3, '#5b3a1e');
    r(2, 0, 12, 1, '#5b3a1e');
  },
};

// 나무를 위쪽 층(캐릭터와 겹치는 층)에서 그릴지
let TALL_TREES = true;
export const setTallTrees = (on) => { TALL_TREES = on; };

const WALLISH = new Set(['W', 'R', 'Y', 'Q', 'X', 'H', 'V', 'G', 'M', 'N']);

/** 맵 전체를 한 장의 캔버스로 미리 그린다. */
export function renderMapCanvas(tiles) {
  const h = tiles.length;
  const w = tiles[0].length;
  const canvas = document.createElement('canvas');
  canvas.width = w * TILE;
  canvas.height = h * TILE;
  const ctx = canvas.getContext('2d');
  for (let ty = 0; ty < h; ty++) {
    for (let tx = 0; tx < w; tx++) {
      const ch = tiles[ty][tx];
      const n = (dx, dy) => tiles[ty + dy]?.[tx + dx] ?? ch;
      (PAINTERS[ch] ?? grass)(painter(ctx, tx * TILE, ty * TILE), tx, ty, n);
    }
  }
  // 벽·지붕 바로 아래 칸에 그늘을 드리워 높이감을 준다
  for (let ty = 1; ty < h; ty++) {
    for (let tx = 0; tx < w; tx++) {
      if (WALLISH.has(tiles[ty][tx]) || !WALLISH.has(tiles[ty - 1][tx])) continue;
      const grad = ctx.createLinearGradient(0, ty * TILE, 0, ty * TILE + 12);
      grad.addColorStop(0, 'rgba(0,0,0,0.35)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(tx * TILE, ty * TILE, TILE, 12);
    }
  }
  return canvas;
}
