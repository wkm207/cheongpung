// 실사 맵: AI로 그린 바닥 무늬(assets/terrain)를 지형마다 깔고 경계를 부드럽게 섞은 뒤,
// 집·울타리·바위·꽃·장독·우물(assets/objects)을 얹는다. 벽·실내 같은 나머지 칸은 밑그림(base)을 그대로 쓴다.
import { TILE } from '../config.js';
import { hash2 } from '../core/rng.js';
import { TERRAIN_FILES, OBJECT_FILES } from '../data/looks.js';

const tex = {};
const obj = {};
let ready = false;
export const photoMapReady = () => ready;

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
  S: 'stone', w: 'stone', '*': 'snow', d: 'sand', b: 'sand', c: 'cave', a: 'cave', '~': 'water',
};
// 위에 놓이는 것들(나무·바위·울타리·집 등)은 주변 바닥을 따라간다
const OVERLAY = new Set(['T', 'O', 'f', 'K', 'R', 'Y', 'W', 'D', 'J', 'G', 'Z', 'Q']);
// 아래에서 위로 덮는 순서(뒤에 오는 것이 위)
const ORDER = ['grass', 'dark', 'sand', 'snow', 'dirt', 'stone', 'cave', 'water'];
// 무늬 한 장이 덮는 크기(게임 좌표): 몇 칸마다 되풀이되는지
const REPEAT = { grass: 5, dark: 5, dirt: 4, stone: 3, snow: 5, sand: 5, cave: 4, water: 5 };

function kindAt(tiles, x, y) {
  const ch = tiles[y]?.[x];
  if (KIND_OF[ch]) return KIND_OF[ch];
  if (!OVERLAY.has(ch)) return null;
  for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [-1, -1], [1, -1], [-1, 1]]) {
    const k = KIND_OF[tiles[y + dy]?.[x + dx]];
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
      if (edge && kind !== 'stone') {
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
  lc.filter = `blur(${kind === 'stone' ? 1 : 3}px)`;
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
      layKind(ctx, tiles, kinds.map((r) => r.map((k) => (k ? 'grass' : null))), 'grass', w, h);
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
      else if (kinds[ty][tx] === 'grass' && ch === '.' && hash2(tx, ty, 12) < 0.035) stand(ctx, 'bush', tx, ty, 26, 2);
    }
  }
  drawHouses(ctx, tiles);
  return canvas;
}

// 나무 종류 → 그림
const TREE_OF = { green: 'tree', blossom: 'blossom', pine: 'pine', snow: 'snowpine', dry: 'deadtree' };

/** 실사 나무(캐릭터와 같은 층에서 그린다). 준비 전이면 null. lw·lh 는 게임 좌표 크기 */
export function photoTree(kind, variant) {
  if (!ready) return null;
  const name = kind === 'green' && variant === 3 ? 'blossom' : TREE_OF[kind] ?? 'tree';
  const im = obj[name];
  if (!im) return null;
  const lh = 78 + (variant % 3) * 6;
  return { img: im, lw: (im.width * lh) / im.height, lh };
}
