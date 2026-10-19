// 'Ninja Adventure' 타일(CC0, pixel-boy & AAA)로 맵을 그린다. 원본 16px 칸을 2배(32px = 게임 한 칸)로 찍는다.
// 바닥(풀·흙·눈·모래·굴), 물 웅덩이, 절벽 벽, 나무, 꽃·덤불·바위를 맡고, 나머지(집·실내 등)는 기존 그림을 쓴다.
import { TILE } from '../config.js';
import { hash2 } from '../core/rng.js';
import { gradePixels } from './colorgrade.js';

const FILES = {
  floor: 'assets/ninja/Floor.png',
  nature: 'assets/ninja/Nature.png',
  water: 'assets/ninja/Water.png',
  relief: 'assets/ninja/Relief.png',
  house: 'assets/ninja/House.png',
};
const atlas = {};
let ready = false;
// 풀이 든 시트는 원작풍 누런 올리브빛, 나무·덤불 시트는 짙은 초록으로 색을 옮겨 둔다
const GRADED = new Map([['floor', 'ground'], ['relief', 'ground'], ['nature', 'foliage']]);
function graded(img, mode) {
  const c = document.createElement('canvas');
  c.width = img.width;
  c.height = img.height;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, c.width, c.height);
  gradePixels(data.data, mode);
  ctx.putImageData(data, 0, 0);
  return c;
}
export const ninjaReady = () => ready;

export function loadNinja() {
  if (typeof Image === 'undefined') return Promise.resolve(false);
  const jobs = Object.entries(FILES).map(([key, src]) => new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      atlas[key] = GRADED.has(key) ? graded(img, GRADED.get(key)) : img;
      resolve();
    };
    img.onerror = () => resolve();
    img.src = src;
  }));
  return Promise.all(jobs).then(() => {
    ready = Object.keys(FILES).every((k) => atlas[k]);
    return ready;
  });
}

const S = 16; // 원본 칸 크기

/** 원본 (col,row) 칸을 게임 칸 크기로 찍는다 */
function put(ctx, sheet, col, row, x, y, w = 1, h = 1) {
  ctx.drawImage(atlas[sheet], col * S, row * S, w * S, h * S, x, y, w * TILE, h * TILE);
}

// ── 바닥 ───────────────────────────────────────────────
// [시트, 바탕 칸, 장식 칸들]
const GROUND = {
  grass: ['floor', [0, 12], [[1, 12], [2, 12], [3, 12], [4, 12]]],
  dark: ['floor', [11, 12], [[12, 12], [13, 12], [14, 12], [15, 12]]],
  snow: ['floor', [0, 19], [[1, 19], [2, 19], [3, 19], [4, 19]]],
  sand: ['floor', [0, 5], [[1, 5], [2, 5], [3, 5], [4, 5]]],
  cave: ['floor', [11, 19], [[12, 19], [13, 19], [14, 19], [15, 19]]],
};
const GROUND_OF = { '.': 'grass', ',': 'grass', ':': 'grass', ';': 'dark', '*': 'snow', d: 'sand', c: 'cave' };
// 위에 놓이는 것들(나무·바위·울타리 등)은 주변 바닥을 따라간다
const OVERLAY = new Set(['T', 'O', 'f', 'K', 'R', 'Y', 'W', 'D']);
const HOUSE_CH = new Set(['R', 'Y', 'W', 'D']);

function groundAt(tiles, x, y) {
  const ch = tiles[y]?.[x];
  if (GROUND_OF[ch]) return GROUND_OF[ch];
  if (OVERLAY.has(ch) || ch === 'u' || ch === '=' || ch === '~') {
    for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [-1, -1]]) {
      const g = GROUND_OF[tiles[y + dy]?.[x + dx]];
      if (g) return g;
    }
    return 'grass';
  }
  return null;
}

function drawGround(ctx, kind, tx, ty) {
  const [sheet, base, deco] = GROUND[kind];
  const x = tx * TILE;
  const y = ty * TILE;
  const v = hash2(tx, ty, 5);
  if (v < 0.16) {
    const [c, r] = deco[Math.floor(hash2(tx, ty, 6) * deco.length)];
    put(ctx, sheet, c, r, x, y);
  } else put(ctx, sheet, base[0], base[1], x, y);
}

/**
 * 이어 붙는 조각 고르기(3×3 판 + 한 줄 띠 + 안쪽 모서리).
 * same(dx,dy): 그 칸도 같은 지형인가. p: { c, r } 3×3 판의 왼쪽 위, strip: 띠 위치, inner: 안쪽 모서리 판 왼쪽 위
 */
function pickAuto(same, p) {
  const n = same(0, -1);
  const s = same(0, 1);
  const w = same(-1, 0);
  const e = same(1, 0);
  if (!w && !e && !n && !s) return p.single;
  if (!w && !e) return [p.vcol, p.r + (!n ? 0 : !s ? 2 : 1)];
  if (!n && !s) return [p.c + (!w ? 0 : !e ? 2 : 1), p.hrow];
  const col = p.c + (!w ? 0 : !e ? 2 : 1);
  const row = p.r + (!n ? 0 : !s ? 2 : 1);
  if (col === p.c + 1 && row === p.r + 1 && p.inner) {
    // 사방이 같은데 대각선만 비었으면 안쪽 모서리
    if (!same(1, 1)) return [p.inner[0], p.inner[1]];
    if (!same(-1, 1)) return [p.inner[0] + 1, p.inner[1]];
    if (!same(1, -1)) return [p.inner[0], p.inner[1] + 1];
    if (!same(-1, -1)) return [p.inner[0] + 1, p.inner[1] + 1];
  }
  return [col, row];
}

// 흙길(풀밭 위): Floor 시트. 어두운 풀밭이면 11칸 오른쪽 판
const DIRT = (off) => ({ c: off, r: 7, vcol: off + 3, hrow: 10, single: [off + 3, 10], inner: [off + 5, 8] });
// 물 웅덩이(풀밭 위): Water 시트
const POND = { c: 0, r: 6, vcol: 3, hrow: 9, single: [1, 9], inner: [5, 7] };
// 절벽 벽(위는 평평한 땅, 아래쪽은 절벽 면): Relief 시트 — 주황(굴), 회색(바위)
const CLIFF = (top) => ({ c: 1, r: top, vcol: 0, hrow: top + 2, single: [0, top + 2], inner: null });

const DIRT_CH = new Set(['u', '=']);
const WALL_SHEET = { M: 5, X: 0, N: 0 };

/** 기존 그림(base) 위에 닌자 타일을 덧그린 맵 캔버스 */
export function renderNinjaMap(tiles, base) {
  const h = tiles.length;
  const w = tiles[0].length;
  const canvas = Object.assign(document.createElement('canvas'), { width: w * TILE, height: h * TILE });
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(base, 0, 0);
  const at = (x, y) => tiles[Math.max(0, Math.min(h - 1, y))][Math.max(0, Math.min(w - 1, x))];
  for (let ty = 0; ty < h; ty++) {
    for (let tx = 0; tx < w; tx++) {
      const ch = tiles[ty][tx];
      const x = tx * TILE;
      const y = ty * TILE;
      const ground = groundAt(tiles, tx, ty);
      if (ground) drawGround(ctx, ground, tx, ty);
      if (DIRT_CH.has(ch)) {
        const dark = ground === 'dark';
        const same = (dx, dy) => !GROUND_OF[at(tx + dx, ty + dy)] && !OVERLAY.has(at(tx + dx, ty + dy)) && at(tx + dx, ty + dy) !== '~';
        const [c, r] = pickAuto(same, DIRT(dark ? 11 : 0));
        put(ctx, 'floor', c, r, x, y);
      } else if (ch === '~') {
        const water = (dx, dy) => at(tx + dx, ty + dy) === '~';
        if (!water(0, -1) && !water(0, 1) && !water(-1, 0) && !water(1, 0)) {
          // 한 칸짜리 웅덩이: 가로 띠의 왼쪽 끝 반쪽 + 오른쪽 끝 반쪽을 붙여 둥글게
          ctx.drawImage(atlas.water, 0, 9 * S, S / 2, S, x, y, TILE / 2, TILE);
          ctx.drawImage(atlas.water, 2 * S + S / 2, 9 * S, S / 2, S, x + TILE / 2, y, TILE / 2, TILE);
        } else {
          const [c, r] = pickAuto(water, POND);
          put(ctx, 'water', c, r, x, y);
        }
      } else if (WALL_SHEET[ch] !== undefined) {
        const top = WALL_SHEET[ch];
        const [c, r] = pickAuto((dx, dy) => at(tx + dx, ty + dy) === ch, CLIFF(top));
        put(ctx, 'relief', c, r, x, y);
      }
      // 울타리: 가로로 이어지면 말뚝 울타리, 세로로 이어지면 기둥
      if (ch === 'f') {
        const vertical = at(tx, ty - 1) === 'f' && at(tx, ty + 1) === 'f' && at(tx - 1, ty) !== 'f' && at(tx + 1, ty) !== 'f';
        put(ctx, 'house', 11, vertical ? 6 : 5, x, y);
      }
      // 장독(항아리)
      if (ch === 'K') put(ctx, 'nature', hash2(tx, ty, 14) < 0.5 ? 1 : 2, 13, x, y);
      // 장식: 꽃밭·바위
      if (ch === ',') {
        const flowers = [[0, 11], [1, 11], [6, 11], [3, 11], [2, 11]];
        const [c, r] = flowers[Math.floor(hash2(tx, ty, 8) * flowers.length)];
        put(ctx, 'nature', c, r, x, y);
      } else if (ch === 'O') {
        const rocks = ground === 'snow' ? [[5, 12], [3, 12]] : [[8, 12], [7, 12], [4, 12]];
        const [c, r] = rocks[Math.floor(hash2(tx, ty, 9) * rocks.length)];
        put(ctx, 'nature', c, r, x, y);
      } else if (ground === 'grass' && ch === '.' && hash2(tx, ty, 12) < 0.04) {
        // 풀밭 군데군데 덤불
        const bushes = [[0, 10], [1, 10], [2, 10], [6, 10], [10, 10]];
        const [c, r] = bushes[Math.floor(hash2(tx, ty, 13) * bushes.length)];
        put(ctx, 'nature', c, r, x, y);
      }
    }
  }
  drawHouses(ctx, tiles);
  return canvas;
}

/** 4×3 집터에 완성형 집 그림(기와집·초가)을 얹는다 */
function drawHouses(ctx, tiles) {
  const h = tiles.length;
  const w = tiles[0].length;
  const seen = new Set();
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!HOUSE_CH.has(tiles[y][x]) || seen.has(`${x},${y}`)) continue;
      // 이어진 덩어리의 테두리 상자
      const stack = [[x, y]];
      let minX = x;
      let maxX = x;
      let minY = y;
      let maxY = y;
      let thatch = 0;
      while (stack.length) {
        const [cx, cy] = stack.pop();
        const k = `${cx},${cy}`;
        if (seen.has(k) || !HOUSE_CH.has(tiles[cy]?.[cx])) continue;
        seen.add(k);
        if (tiles[cy][cx] === 'Y') thatch++;
        minX = Math.min(minX, cx);
        maxX = Math.max(maxX, cx);
        minY = Math.min(minY, cy);
        maxY = Math.max(maxY, cy);
        stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
      }
      if (maxX - minX + 1 === 4 && maxY - minY + 1 === 3) {
        // 기와지붕(R)은 붉은 기와집, 초가(Y)는 짚지붕 집
        put(ctx, 'house', thatch ? 4 : 12, 0, minX * TILE, minY * TILE, 4, 3);
      }
    }
  }
}

// ── 나무(2×2칸, 캐릭터와 같은 층에서 그린다) ─────────────────
const TREES = {
  green: [[0, 0], [16, 0], [18, 0], [6, 0]],
  blossom: [[14, 0]],
  pine: [[2, 0]],
  snow: [[8, 0], [10, 0]],
  dry: [[4, 0]],
};
const treeCache = new Map();

/** 닌자 나무 그림(64×64, lw·lh 포함). 준비 전이면 null */
export function ninjaTree(kind, variant) {
  if (!ready) return null;
  // 꽃나무는 드물게(variant 3)
  const list = kind === 'green' && variant === 3 ? TREES.blossom : TREES[kind] ?? TREES.green;
  const [c, r] = list[variant % list.length];
  const key = `${c},${r}`;
  if (!treeCache.has(key)) {
    const cv = Object.assign(document.createElement('canvas'), { width: 64, height: 64, lw: 64, lh: 64 });
    const ctx = cv.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(atlas.nature, c * S, r * S, 32, 32, 0, 0, 64, 64);
    treeCache.set(key, cv);
  }
  return treeCache.get(key);
}
