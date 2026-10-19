// 실사 맵: AI로 그린 바닥 무늬(assets/terrain)를 지형마다 깔고 경계를 부드럽게 섞은 뒤,
// 집·울타리·바위·꽃·장독·우물(assets/objects)을 얹는다. 벽·실내 같은 나머지 칸은 밑그림(base)을 그대로 쓴다.
import { TILE } from '../config.js';
import { hash2 } from '../core/rng.js';
import { TERRAIN_FILES, OBJECT_FILES } from '../data/looks.js';
import { isPhoto } from './artmode.js';

const tex = {};
const obj = {};
let ready = false;
export const photoMapReady = () => ready && isPhoto();

export function loadPhotoMap() {
  if (typeof Image === 'undefined' || !TERRAIN_FILES.includes('grass')) return Promise.resolve(false);
  const load = (src, into, key) => new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      into[key] = img;
      resolve();
    };
    img.onerror = () => resolve();
    img.src = src;
  });
  return Promise.all([
    ...TERRAIN_FILES.map((n) => load(`assets/terrain/${n}.png`, tex, n)),
    ...OBJECT_FILES.map((n) => load(`assets/objects/${n}.png`, obj, n)),
  ]).then(() => {
    ready = !!tex.grass;
    return ready;
  });
}

// 칸 글자 → 바닥 무늬
const KIND_OF = {
  '.': 'grass', ',': 'grass', ':': 'grass', F: 'grass', ';': 'dark', u: 'dirt', '=': 'dirt',
  S: 'stone', w: 'stone', '*': 'snow', d: 'sand', b: 'sand', c: 'cave', a: 'ash', '~': 'water',
  P: 'maru', U: 'maru', V: 'maru', g: 'oldfloor', L: 'lava',
};
// 그림이 아직 없을 때 대신 쓸 바닥
const FALLBACK = { ash: 'cave', maru: null, oldfloor: null, lava: null };
// 벽: 칸을 무늬로 채우고 위는 밝게, 아래(벽면)는 그늘지게
const WALL_OF = { X: 'rockwall', M: 'redrock', Q: 'stonewall', N: 'mudwall', H: 'indoorwall' };
// 위에 놓이는 것들(나무·바위·울타리·집 등)은 주변 바닥을 따라간다
const OVERLAY = new Set(['T', 'O', 'f', 'K', 'R', 'Y', 'W', 'D', 'J', 'G', 'Z', 'Q', 'C']);
// 아래에서 위로 덮는 순서(뒤에 오는 것이 위)
const ORDER = ['grass', 'dark', 'sand', 'snow', 'dirt', 'stone', 'cave', 'ash', 'maru', 'oldfloor', 'water', 'lava'];
// 무늬 한 장이 덮는 크기(게임 좌표): 몇 칸마다 되풀이되는지
const REPEAT = {
  grass: 5, dark: 5, dirt: 4, stone: 3, snow: 5, sand: 5, cave: 4, water: 5, ash: 4, maru: 3, oldfloor: 3, lava: 4,
  rockwall: 3, redrock: 3, stonewall: 2, mudwall: 3, indoorwall: 2,
};
// 반듯한 경계로 깔 것(나무 마루·돌바닥·벽)
const HARD = new Set(['stone', 'maru', 'oldfloor', 'rockwall', 'redrock', 'stonewall', 'mudwall', 'indoorwall']);

/** 그림이 있는 바닥만(없으면 대신할 바닥, 그것도 없으면 null) */
function usable(kind) {
  if (!kind || tex[kind]) return kind;
  return FALLBACK[kind] && tex[FALLBACK[kind]] ? FALLBACK[kind] : null;
}

function kindAt(tiles, x, y) {
  const ch = tiles[y]?.[x];
  if (KIND_OF[ch]) return usable(KIND_OF[ch]);
  if (!OVERLAY.has(ch)) return null;
  for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [-1, -1], [1, -1], [-1, 1]]) {
    const k = usable(KIND_OF[tiles[y + dy]?.[x + dx]]);
    if (k && k !== 'water') return k;
  }
  return 'grass';
}

const patterns = new Map();
function patternFor(ctx, kind) {
  if (!patterns.has(kind)) {
    const size = REPEAT[kind] * TILE;
    const c = Object.assign(document.createElement('canvas'), { width: size, height: size });
    c.getContext('2d').drawImage(tex[kind], 0, 0, size, size);
    patterns.set(kind, c);
  }
  return ctx.createPattern(patterns.get(kind), 'repeat');
}

/**
 * 지형 하나를 부드러운 가장자리로 깐다: 칸마다 1픽셀인 작은 판을 키워(번지게) 가림막으로 쓴다.
 * 가장자리는 칸 경계에서 반 칸 안팎으로 섞이고, 칸마다 조금씩 흔들어 반듯한 네모가 덜 보이게 한다.
 */
function layKind(ctx, tiles, kinds, kind, w, h) {
  // 무늬 그림이 없는 지형은 건너뛴다(밑그림이 그대로 보인다) — 없는 그림을 그리려다 멈추지 않게
  if (!tex[kind]) return;
  const R = 4; // 한 칸을 4×4 로 나눠 가장자리를 들쭉날쭉하게
  const small = Object.assign(document.createElement('canvas'), { width: w * R, height: h * R });
  const sc = small.getContext('2d');
  const img = sc.createImageData(w * R, h * R);
  let any = false;
  for (let y = 0; y < h * R; y++) {
    for (let x = 0; x < w * R; x++) {
      const tx = Math.floor(x / R);
      const ty = Math.floor(y / R);
      let on = kinds[ty][tx] === kind;
      // 경계 근처 작은 칸은 이웃 지형 쪽으로 조금 먹어 들어가거나 물러난다
      const edge = x % R === 0 || x % R === R - 1 || y % R === 0 || y % R === R - 1;
      if (edge && !HARD.has(kind)) {
        const nx = tx + (x % R === 0 ? -1 : x % R === R - 1 ? 1 : 0);
        const ny = ty + (y % R === 0 ? -1 : y % R === R - 1 ? 1 : 0);
        const other = kinds[ny]?.[nx];
        if (other !== undefined && other !== kinds[ty][tx]) {
          const flip = hash2(x, y, 31) < 0.35;
          if (flip) on = other === kind;
        }
      }
      if (on) {
        any = true;
        img.data[(y * w * R + x) * 4 + 3] = 255;
      }
    }
  }
  if (!any) return;
  sc.putImageData(img, 0, 0);
  const layer = Object.assign(document.createElement('canvas'), { width: w * TILE, height: h * TILE });
  const lc = layer.getContext('2d');
  lc.fillStyle = patternFor(lc, kind);
  lc.fillRect(0, 0, layer.width, layer.height);
  lc.globalCompositeOperation = 'destination-in';
  lc.imageSmoothingEnabled = true;
  lc.imageSmoothingQuality = 'high';
  lc.filter = `blur(${HARD.has(kind) ? 0.6 : 3}px)`;
  lc.drawImage(small, 0, 0, layer.width, layer.height);
  lc.filter = 'none';
  // 물가는 살짝 어둡게(물이 땅보다 낮아 보이게)
  if (kind === 'water') {
    lc.globalCompositeOperation = 'source-atop';
    lc.fillStyle = 'rgba(0, 30, 40, 0.12)';
    lc.fillRect(0, 0, layer.width, layer.height);
  }
  ctx.drawImage(layer, 0, 0);
}

/** 벽 칸: 무늬로 채우고, 위가 트인 쪽은 밝은 윗면, 아래가 트인 쪽은 그늘진 벽면으로 높이를 낸다 */
function drawWalls(ctx, tiles, w, h) {
  const kinds = tiles.map((row) => [...row].map((ch) => (WALL_OF[ch] && tex[WALL_OF[ch]] ? WALL_OF[ch] : null)));
  for (const kind of new Set(kinds.flat().filter(Boolean))) layKind(ctx, tiles, kinds, kind, w, h);
  for (let ty = 0; ty < h; ty++) {
    for (let tx = 0; tx < w; tx++) {
      if (!kinds[ty][tx]) continue;
      const x = tx * TILE;
      const y = ty * TILE;
      if (!kinds[ty + 1]?.[tx]) {
        // 아래가 트였으면 벽면: 아래로 갈수록 어둡게 + 바닥에 드리운 그림자
        const g = ctx.createLinearGradient(0, y + TILE * 0.35, 0, y + TILE);
        g.addColorStop(0, 'rgba(0, 0, 0, 0)');
        g.addColorStop(1, 'rgba(0, 0, 0, 0.45)');
        ctx.fillStyle = g;
        ctx.fillRect(x, y + TILE * 0.35, TILE, TILE * 0.65);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
        ctx.fillRect(x, y + TILE, TILE, 6);
      }
      if (!kinds[ty - 1]?.[tx]) {
        ctx.fillStyle = 'rgba(255, 245, 220, 0.16)';
        ctx.fillRect(x, y, TILE, 4);
      }
      if (!kinds[ty][tx - 1]) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
        ctx.fillRect(x, y, 2, TILE);
      }
      if (!kinds[ty][tx + 1]) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
        ctx.fillRect(x + TILE - 2, y, 2, TILE);
      }
    }
  }
}

/** 물건을 칸 (tx,ty) 바닥 가운데에 크기 size(긴 쪽)로 세운다 */
function stand(ctx, name, tx, ty, size, dy = 0) {
  const im = obj[name];
  if (!im) return;
  const k = size / Math.max(im.width, im.height);
  const w = im.width * k;
  const h = im.height * k;
  ctx.drawImage(im, tx * TILE + TILE / 2 - w / 2, ty * TILE + TILE - h + dy, w, h);
}

const HOUSE_CH = new Set(['R', 'Y', 'W', 'D']);

/** 드나드는 문: 나무 문틀과 어두운 문간, 돌 디딤돌 */
function drawDoor(ctx, tx, ty) {
  const x = tx * TILE + 6;
  const y = ty * TILE + 4;
  const w = TILE - 12;
  const h = TILE - 6;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.fillRect(x - 2, y + h - 2, w + 4, 4);
  ctx.fillStyle = '#5a3a1e';
  ctx.fillRect(x - 2, y - 3, w + 4, h + 3);
  ctx.fillStyle = '#2a1a10';
  ctx.fillRect(x + 1, y + 1, w - 2, h - 3);
  // 문살 빛(안쪽이 보이는 듯)
  ctx.fillStyle = 'rgba(255, 210, 140, 0.25)';
  ctx.fillRect(x + 3, y + 3, w - 6, h * 0.45);
  ctx.strokeStyle = '#8a5a2e';
  ctx.lineWidth = 1;
  ctx.strokeRect(x - 1.5, y - 2.5, w + 3, h + 2);
  ctx.fillStyle = '#a8a29a';
  ctx.fillRect(x - 3, y + h - 2, w + 6, 3);
}

/** 4×3 집터마다 실사 집(초가·기와집)을 얹는다 */
function drawHouses(ctx, tiles) {
  const h = tiles.length;
  const w = tiles[0].length;
  const seen = new Set();
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!HOUSE_CH.has(tiles[y][x]) || seen.has(`${x},${y}`)) continue;
      const stack = [[x, y]];
      let [minX, maxX, minY, maxY, thatch] = [x, x, y, y, 0];
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
      const im = obj[thatch ? 'thatch' : 'tilehouse'];
      if (!im || maxX - minX + 1 < 3) continue;
      // 집터 폭에 맞추고 바닥을 집터 아래쪽에 붙인다(지붕이 위로 조금 넘쳐도 된다)
      const bw = (maxX - minX + 1) * TILE + 8;
      const bh = (im.height * bw) / im.width;
      ctx.drawImage(im, minX * TILE - 4, (maxY + 1) * TILE - bh + 2, bw, bh);
      // 집 그림의 문 위치와 실제 드나드는 칸(D)이 달라서, 드나드는 칸에 문을 또렷하게 그린다
      for (let dy = minY; dy <= maxY; dy++) {
        for (let dx = minX; dx <= maxX; dx++) if (tiles[dy][dx] === 'D') drawDoor(ctx, dx, dy);
      }
    }
  }
}

/** 밑그림(base) 위에 실사 바닥·물건을 얹은 맵 캔버스 */
export function renderPhotoMap(tiles, base) {
  const h = tiles.length;
  const w = tiles[0].length;
  const canvas = Object.assign(document.createElement('canvas'), { width: w * TILE, height: h * TILE });
  const ctx = canvas.getContext('2d');
  ctx.drawImage(base, 0, 0);
  const kinds = tiles.map((row, y) => [...row].map((_, x) => kindAt(tiles, x, y)));
  // 바닥이 있는 칸은 먼저 풀밭으로 덮어 밑그림 도트가 비치지 않게
  for (const kind of ORDER) {
    if (kind === 'grass') {
      const any = kinds.some((r) => r.some(Boolean));
      if (!any) continue;
      // 실내 마루 밑에는 풀을 깔지 않는다
      layKind(ctx, tiles, kinds.map((r) => r.map((k) => (k && k !== 'maru' && k !== 'oldfloor' ? 'grass' : null))), 'grass', w, h);
    } else layKind(ctx, tiles, kinds, kind, w, h);
  }
  for (let ty = 0; ty < h; ty++) {
    for (let tx = 0; tx < w; tx++) {
      const ch = tiles[ty][tx];
      if (ch === ',') stand(ctx, 'flowers', tx, ty, 30, 2);
      else if (ch === 'O') stand(ctx, 'rock', tx, ty, 30, 1);
      else if (ch === 'K') stand(ctx, 'jar', tx, ty, 26);
      else if (ch === 'w') stand(ctx, 'well', tx, ty, 34, 2);
      else if (ch === 'f') stand(ctx, 'fence', tx, ty, 36, 0);
      else if (ch === 'U') stand(ctx, 'table', tx, ty, 34, 1);
      else if (ch === 'V') stand(ctx, 'shelf', tx, ty, 36, 0);
      else if (ch === 'Z') stand(ctx, 'bamboo', tx, ty, 44, 0);
      else if (ch === 'G') stand(ctx, 'gatepost', tx, ty, 44, 0);
      else if (ch === 'J') stand(ctx, 'jangseung', tx, ty, 40, 0);
      else if (ch === 'C') stand(ctx, 'coral', tx, ty, 30, 1);
      else if (kinds[ty][tx] === 'grass' && ch === '.' && hash2(tx, ty, 12) < 0.035) stand(ctx, 'bush', tx, ty, 26, 2);
    }
  }
  drawWalls(ctx, tiles, w, h);
  drawHouses(ctx, tiles);
  return canvas;
}

/** 불러온 물건·바닥 그림(지도 창에서 쓴다, 없으면 null) */
export const photoObject = (name) => (ready && isPhoto() ? obj[name] ?? null : null);
export const photoTexture = (name) => (ready && isPhoto() ? tex[name] ?? null : null);

// 나무 종류 → 그림
const TREE_OF = { green: 'tree', blossom: 'blossom', pine: 'pine', snow: 'snowpine', dry: 'deadtree' };

/** 실사 나무(캐릭터와 같은 층에서 그린다). 준비 전이면 null. lw·lh 는 게임 좌표 크기 */
export function photoTree(kind, variant) {
  if (!ready || !isPhoto()) return null;
  const name = kind === 'green' && variant === 3 ? 'blossom' : TREE_OF[kind] ?? 'tree';
  const im = obj[name];
  if (!im) return null;
  const lh = 78 + (variant % 3) * 6;
  return { img: im, lw: (im.width * lh) / im.height, lh };
}
