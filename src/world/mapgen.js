import { mulberry32, randInt } from '../core/rng.js';

// 지나갈 수 없는 타일
// Q 돌담, Y 초가지붕, G 대문 기둥, J 장승, K 장독, H 실내 벽, U 탁자·계산대, V 선반 (D 문은 지나갈 수 있다)
export const SOLID = new Set(['T', 'O', '~', 'X', 'W', 'R', 'F', 'w', 'Q', 'Y', 'G', 'J', 'K', 'H', 'U', 'V', 'C', 'Z', 'L', 'M', 'N', 'f']);

const grid = (w, h, ch) => Array.from({ length: h }, () => Array(w).fill(ch));
const inInterior = (g, x, y) => x >= 1 && y >= 1 && y < g.length - 1 && x < g[0].length - 1;

function fillRect(g, x, y, w, h, ch) {
  for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) g[j][i] = ch;
}

function border(g, ch) {
  const h = g.length;
  const w = g[0].length;
  for (let x = 0; x < w; x++) { g[0][x] = ch; g[h - 1][x] = ch; }
  for (let y = 0; y < h; y++) { g[y][0] = ch; g[y][w - 1] = ch; }
}

/** 2칸 폭 통로를 L자로 판다. 가장자리(테두리)는 건드리지 않는다. */
function carvePath(g, from, to, verticalFirst, ch) {
  const carve = (x, y) => {
    for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
      if (inInterior(g, x + dx, y + dy)) g[y + dy][x + dx] = ch;
    }
  };
  let { x, y } = from;
  const stepX = () => { while (x !== to.x) { carve(x, y); x += Math.sign(to.x - x); } };
  const stepY = () => { while (y !== to.y) { carve(x, y); y += Math.sign(to.y - y); } };
  if (verticalFirst) { stepY(); stepX(); } else { stepX(); stepY(); }
  carve(x, y);
}

function carvePortals(g, portals, ch) {
  const h = g.length;
  const w = g[0].length;
  const center = { x: w >> 1, y: h >> 1 };
  for (const p of portals) {
    fillRect(g, p.x, p.y, p.w, p.h, ch);
    const vertical = p.y === 0 || p.y + p.h === h;
    carvePath(g, { x: p.x, y: p.y }, center, vertical, ch);
  }
}

/** (sx, sy)에서 닿지 않는 빈 칸을 모두 막아 고립된 공간을 없앤다. */
export function fillUnreachable(g, sx, sy, wallCh) {
  const h = g.length;
  const w = g[0].length;
  const seen = grid(w, h, false);
  const queue = [[sx, sy]];
  seen[sy][sx] = true;
  while (queue.length) {
    const [x, y] = queue.pop();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= w || ny >= h || seen[ny][nx] || SOLID.has(g[ny][nx])) continue;
      seen[ny][nx] = true;
      queue.push([nx, ny]);
    }
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!seen[y][x] && !SOLID.has(g[y][x])) g[y][x] = wallCh;
    }
  }
  return g;
}

export function buildField({ w, h, seed, density, ground = '.', obstacles = ['T'], portals }) {
  const rng = mulberry32(seed);
  const g = grid(w, h, ground);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const r = rng();
      if (r < density) g[y][x] = obstacles[Math.floor(rng() * obstacles.length)];
      else if (r < density + 0.05 && ground === '.') g[y][x] = ','; // 꽃은 일반 풀밭에만
    }
  }
  // 작은 연못 몇 개
  const ponds = randInt(rng, 0, 2);
  for (let i = 0; i < ponds; i++) {
    fillRect(g, randInt(rng, 3, w - 9), randInt(rng, 3, h - 7), randInt(rng, 3, 5), randInt(rng, 2, 3), '~');
  }
  border(g, 'T');
  carvePortals(g, portals, ground);
  return fillUnreachable(g, w >> 1, h >> 1, 'T');
}

/** 원작 사냥터처럼: 넓은 흙마당을 물길이 둘러싸고, 출구 쪽만 흙다리로 이어진다. 돌·덤불은 드문드문 */
export function buildHunt({ w, h, seed, portals, ground = 'u', rim = 2, rocks = 0.012 }) {
  const rng = mulberry32(seed);
  const g = grid(w, h, ground);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const edge = x <= rim || y <= rim || x >= w - 1 - rim || y >= h - 1 - rim;
      if (edge) g[y][x] = '~';
      else if (rng() < rocks) g[y][x] = 'O';
    }
  }
  border(g, '~');
  carvePortals(g, portals, ground);
  return fillUnreachable(g, w >> 1, h >> 1, '~');
}

export function buildCave({ w, h, seed, fill = 0.45, portals, floor = 'c', wall = 'X' }) {
  const rng = mulberry32(seed);
  let g = grid(w, h, wall);
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) g[y][x] = rng() < fill ? wall : floor;
  for (let iter = 0; iter < 4; iter++) {
    const next = grid(w, h, wall);
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        let walls = 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (g[y + dy][x + dx] === wall) walls++;
        next[y][x] = walls >= 5 ? wall : floor;
      }
    }
    g = next;
  }
  fillRect(g, (w >> 1) - 2, (h >> 1) - 2, 5, 5, floor);
  carvePortals(g, portals, floor);
  return fillUnreachable(g, w >> 1, h >> 1, wall);
}

/**
 * 층으로 된 굴: 바닥에 바위기둥이 줄지어 서 있고(사이로 몹이 돌아다닌다), 군데군데 바위 무더기가 있다.
 * floor/wall 로 모래굴·흉가 같은 분위기를 바꾼다.
 */
export function buildDen({ w, h, seed, portals, floor = 'd', wall = 'M', pillarGap = 5, rubble = 0.04 }) {
  const rng = mulberry32(seed);
  const g = grid(w, h, floor);
  for (let y = 3; y < h - 3; y += pillarGap) {
    for (let x = 3; x < w - 3; x += pillarGap) {
      const px = x + Math.floor(rng() * 2);
      const py = y + Math.floor(rng() * 2);
      fillRect(g, px, py, rng() < 0.5 ? 2 : 1, 2, wall);
    }
  }
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) if (rng() < rubble) g[y][x] = wall;
  border(g, wall);
  fillRect(g, (w >> 1) - 2, (h >> 1) - 2, 5, 5, floor);
  carvePortals(g, portals, floor);
  return fillUnreachable(g, w >> 1, h >> 1, wall);
}

/** 가장자리 출입구에 붉은 기둥과 장승을 세운다(집 문 포탈은 건너뛴다). */
function decorateGates(g, portals) {
  const h = g.length;
  const w = g[0].length;
  for (const p of portals) {
    if (p.door) continue;
    fillRect(g, p.x, p.y, p.w, p.h, '=');
    if (p.w === 1) {
      const inward = p.x === 0 ? 2 : -2;
      g[p.y - 1][p.x] = 'G';
      g[p.y + p.h][p.x] = 'G';
      g[p.y - 2][p.x + inward] = 'J';
      g[p.y + p.h + 1][p.x + inward] = 'J';
    } else {
      const inward = p.y === 0 ? 2 : -2;
      g[p.y][p.x - 1] = 'G';
      g[p.y][p.x + p.w] = 'G';
      if (p.y + inward >= 0 && p.y + inward < h) {
        g[p.y + inward][Math.max(1, p.x - 2)] = 'J';
        g[p.y + inward][Math.min(w - 2, p.x + p.w + 1)] = 'J';
      }
    }
  }
}

/** 실내: 둘레는 벽, 뒷벽은 두 줄(벽면이 보이게), 바닥은 마루. 가구는 layout에서 칠한다. */
export function buildRoom({ w, h, portals, furniture = [] }) {
  const g = grid(w, h, 'P');
  border(g, 'H');
  fillRect(g, 0, 1, w, 1, 'H');
  for (const [ch, x, y, fw = 1, fh = 1] of furniture) fillRect(g, x, y, fw, fh, ch);
  for (const p of portals) fillRect(g, p.x, p.y, p.w, p.h, 'D');
  return g;
}

/** 성: 성벽으로 둘러싸인 돌마당과 가운데 대전, 연못과 나무 */
export function buildCastle({ w, h, seed, portals, npcs }) {
  const rng = mulberry32(seed);
  const g = grid(w, h, '.');
  fillRect(g, 7, 9, w - 14, h - 13, 'S');
  fillRect(g, 20, 9, w - 21, 2, '=');
  fillRect(g, 31, 14, w - 32, 2, '=');
  fillRect(g, 13, 3, 14, 3, 'R');
  fillRect(g, 13, 6, 14, 3, 'W');
  g[8][19] = 'D';
  g[8][20] = 'D';
  for (const [hx, hy] of [[3, 12], [31, 20]]) {
    house(g, hx, hy, 'R');
  }
  fillRect(g, 3, 22, 4, 3, '~');
  for (const [kx, ky] of [[9, 9], [10, 9], [29, 9], [30, 9]]) g[ky][kx] = 'K';
  const nearNpc = (x, y) => npcs.some((n) => Math.abs(n.x - x) + Math.abs(n.y - y) <= 2);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      if (g[y][x] !== '.' || nearNpc(x, y)) continue;
      const r = rng();
      if (r < 0.05) g[y][x] = 'T';
      else if (r < 0.1) g[y][x] = ',';
    }
  }
  border(g, 'Q');
  decorateGates(g, portals);
  return fillUnreachable(g, 20, 15, 'T');
}

/** 집: (x,y)부터 6×5 터의 아래쪽 가운데에 4×3(지붕 2줄 + 벽 1줄). 문은 늘 (x+2, y+4) */
function house(g, x, y, roof = 'R') {
  fillRect(g, x + 1, y + 2, 4, 2, roof);
  fillRect(g, x + 1, y + 4, 4, 1, 'W');
  g[y + 4][x + 2] = 'D';
}

export function buildVillage({ w, h, seed, portals, npcs }) {
  const rng = mulberry32(seed);
  // 바닥은 주황빛 흙, 그 위에 풀밭이 군데군데(원작 마을 느낌)
  const g = grid(w, h, 'u');
  for (let i = 0; i < 16; i++) {
    const cx = 2 + Math.floor(rng() * (w - 4));
    const cy = 2 + Math.floor(rng() * (h - 4));
    const r = 2 + Math.floor(rng() * 3);
    for (let y = cy - r; y <= cy + r; y++) {
      for (let x = cx - r; x <= cx + r; x++) {
        if (y > 0 && x > 0 && y < h - 1 && x < w - 1 && (x - cx) ** 2 + (y - cy) ** 2 <= r * r + rng() * 2) g[y][x] = '.';
      }
    }
  }
  fillRect(g, 1, 14, w - 2, 2, '=');
  fillRect(g, 19, 1, 2, 13, '=');
  fillRect(g, 14, 11, 12, 8, '='); // 다져진 흙마당
  // 기와집(R)과 초가집(Y)
  for (const [hx, hy, roof] of [[5, 4, 'R'], [27, 4, 'R'], [5, 20, 'Y'], [27, 20, 'R'], [13, 20, 'Y'], [33, 3, 'Y']]) house(g, hx, hy, roof);
  fillRect(g, 7, 10, 1, 4, '=');
  fillRect(g, 29, 10, 1, 4, '=');
  fillRect(g, 33, 9, 4, 3, '~');
  g[12][16] = 'w';
  fillRect(g, 22, 25, 4, 1, 'F');
  // 장독대
  for (const [jx, jy] of [[11, 7], [12, 7], [33, 22], [34, 22], [3, 22], [20, 22]]) g[jy][jx] = 'K';
  // 꽃밭
  for (const [fx, fy] of [[14, 10], [15, 10], [24, 10], [25, 10], [14, 19], [15, 19], [24, 19], [25, 19]]) g[fy][fx] = ',';

  // NPC 주변과 집 문 앞은 나무로 막지 않는다
  const keepClear = [...npcs, ...portals.filter((p) => p.door).map((p) => ({ x: p.x, y: p.y + 1 }))];
  const nearNpc = (x, y) => keepClear.some((n) => Math.abs(n.x - x) + Math.abs(n.y - y) <= 2);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      if ((g[y][x] !== '.' && g[y][x] !== 'u') || nearNpc(x, y)) continue;
      const r = rng();
      if (r < 0.06 && g[y][x] === '.') g[y][x] = 'T';
      else if (r < 0.06 && g[y][x] === '.') g[y][x] = ',';
    }
  }
  border(g, 'f');
  decorateGates(g, portals);
  return fillUnreachable(g, 19, 17, 'T');
}
