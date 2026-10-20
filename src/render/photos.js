// 실사풍 사람 그림(AI로 그린 그림을 tools/art_import.py 로 다듬은 것, assets/people/)
// 직업·성별마다 여러 생김새가 있고, 플레이어는 그중 하나(player.look)를 고른다. 그림이 없으면 도트 그림을 쓴다.
import { LOOKS, NPC_PHOTOS, MOB_PHOTOS, VIEW_PHOTOS } from '../data/looks.js';
import { isPhoto } from './artmode.js';

const images = new Map();
const portraits = new Map();

/** 이 직업·성별에서 고를 수 있는 생김새 번호들 */
export const looksFor = (cls, gender) => LOOKS[cls]?.[gender === 'f' ? 'f' : 'm'] ?? [];

/** 실제로 쓸 생김새 번호(고른 번호가 없으면 첫 그림, 그림이 아예 없으면 0) */
export function photoLook(cls, gender, look) {
  const list = looksFor(cls, gender);
  return list.includes(look) ? look : list[0] ?? 0;
}

export const photoSrc = (cls, gender, n) => `assets/people/${cls}_${gender === 'f' ? 'f' : 'm'}${n}.png`;

const HAS_NPC = new Set(NPC_PHOTOS);
const HAS_MOB = new Set(MOB_PHOTOS);

/** 몬스터 실사 그림(왼쪽을 보는 그림, 없거나 아직이면 null) */
export function mobPhoto(type) {
  if (!isPhoto() || !HAS_MOB.has(type) || typeof Image === 'undefined') return null;
  const src = `assets/mobs/${type}.png`;
  if (!images.has(src)) {
    const img = new Image();
    img.src = src;
    images.set(src, img);
  }
  const img = images.get(src);
  return img.complete && img.naturalWidth ? img : null;
}

/** 마을 사람 실사 그림(없거나 아직 못 불러왔으면 null) */
export function npcPhoto(look) {
  if (!isPhoto() || !HAS_NPC.has(look) || typeof Image === 'undefined') return null;
  const src = `assets/people/npc_${look}.png`;
  if (!images.has(src)) {
    const img = new Image();
    img.src = src;
    images.set(src, img);
  }
  const img = images.get(src);
  return img.complete && img.naturalWidth ? img : null;
}

const HAS_VIEW = new Set(VIEW_PHOTOS ?? []);

/**
 * 바라보는 쪽에 맞는 그림: 위로 가면 뒷모습(_up), 옆으로 가면 오른쪽을 보는 옆모습(_side, 왼쪽이면 뒤집기),
 * 아래로 가거나 방향 그림이 없으면 앞모습. { img, flip } 또는 null
 */
export function photoView(cls, gender, look, dir) {
  const front = photoOf(cls, gender, look);
  if (!front) return null;
  const base = photoSrc(cls, gender, photoLook(cls, gender, look)).replace(/^assets\/people\/|\.png$/g, '');
  const view = dir === 'up' ? '_up' : dir === 'left' || dir === 'right' ? '_side' : '';
  if (view && HAS_VIEW.has(base + view)) {
    const img = preload(`assets/people/${base}${view}.png`);
    if (img.complete && img.naturalWidth) return { img, flip: dir === 'left' };
  }
  return { img: front, flip: false, front: true };
}

/** 그림 하나를 불러 두기(이미 있으면 그대로) */
function preload(src) {
  if (!images.has(src)) {
    const img = new Image();
    img.src = src;
    images.set(src, img);
  }
  return images.get(src);
}

/** 실사 그림 모드일 때 모든 생김새·마을 사람·몬스터 그림을 미리 불러 둔다(다 불러오면 onDone) */
export function preloadPhotos(onDone) {
  if (typeof Image === 'undefined' || !isPhoto()) return;
  const jobs = [];
  for (const [cls, byG] of Object.entries(LOOKS)) {
    for (const [g, list] of Object.entries(byG)) {
      for (const n of list) {
        jobs.push(preload(photoSrc(cls, g, n)).decode?.().catch(() => {}) ?? Promise.resolve());
        for (const v of ['_up', '_side']) if (HAS_VIEW.has(`${cls}_${g}${n}${v}`)) preload(`assets/people/${cls}_${g}${n}${v}.png`);
      }
    }
  }
  for (const look of HAS_NPC) preload(`assets/people/npc_${look}.png`);
  for (const type of HAS_MOB) preload(`assets/mobs/${type}.png`);
  Promise.all(jobs).then(() => onDone?.());
}

/** 불러온 그림(아직이거나 없으면 null — 불러오기는 시작해 둔다) */
export function photoOf(cls, gender, look) {
  if (!isPhoto() || typeof Image === 'undefined') return null;
  const n = photoLook(cls, gender, look);
  if (!n) return null;
  const src = photoSrc(cls, gender, n);
  if (!images.has(src)) {
    const img = new Image();
    img.src = src;
    images.set(src, img);
  }
  const img = images.get(src);
  return img.complete && img.naturalWidth ? img : null;
}

/**
 * 초상화용 캔버스(논리 32×48, 4배 해상도): 그림을 아래 가운데에 맞춰 넣는다.
 * 위쪽 32×32 를 잘라 쓰는 곳(아래 얼굴 칸)에도 머리·어깨가 오도록 위로 붙인다.
 */
export function photoPortrait(img) {
  if (portraits.has(img)) return portraits.get(img);
  const RES = 4;
  const c = document.createElement('canvas');
  c.width = 32 * RES;
  c.height = 48 * RES;
  const ctx = c.getContext('2d');
  const h = c.height * 0.98;
  const w = (img.width * h) / img.height;
  ctx.drawImage(img, (c.width - w) / 2, c.height * 0.01, w, h);
  c.lw = 32;
  c.lh = 48;
  c.tag = img.gearTag ?? ''; // 장비 입힌 그림이 준비되면 초상화를 다시 그리게
  portraits.set(img, c);
  return c;
}

/** 게임 화면에 그리는 실사 사람 키(게임 좌표, 32 = 한 칸) */
export const PHOTO_H = 44; // 원작처럼 한 칸 반쯤(화면을 넓게 보고 사람은 작게)

/**
 * 발이 (cx, footY)에 닿게 그린다. flip: 좌우 뒤집기, tilt: 기울기(라디안)
 */
/**
 * 걷는 모습: 한 장 그림을 윗몸과 다리로 나눠, 다리 왼쪽·오른쪽 절반을 번갈아 움직인다.
 * view 'front'(앞·뒤): 한쪽 발씩 들어 올린다, 'side'(옆): 앞다리·뒷다리를 반대로 내딛는다.
 * phase 는 걸음 진행(라디안), lean 은 공격 때 앞으로 숙이기(+면 바라보는 쪽)
 */
export function drawWalking(ctx, img, cx, footY, { h = PHOTO_H, flip = false, phase = 0, moving = false, view = 'front', lean = 0, legs = 0.36 } = {}) {
  const w = (img.width * h) / img.height;
  const iw = img.width;
  const ih = img.height;
  const sy = ih * (1 - legs);
  const legH = h * legs;
  const k = w / iw;
  const bob = moving ? -Math.abs(Math.sin(phase)) * 1.6 : 0;
  // 다리가 있는 가로 범위(발 끝 줄 기준). 그 바깥(옆으로 뻗은 칼·지팡이)은 움직이지 않는다
  const [fx0, fx1] = view === 'side' ? feetSpan(img) : [0, iw];
  const mid = (fx0 + fx1) / 2;
  ctx.save();
  ctx.translate(cx, footY);
  if (flip) ctx.scale(-1, 1);
  // 윗몸(숙이기는 아래를 기준으로 기울인다)
  ctx.save();
  ctx.translate(0, -legH + bob);
  if (lean) ctx.transform(1, 0, -lean * (flip ? -1 : 1), 1, 0, 0);
  ctx.drawImage(img, 0, 0, iw, sy + 1, -w / 2, -(h - legH), w, h - legH + 1);
  ctx.restore();
  // 다리 범위 바깥은 윗몸과 함께
  ctx.save();
  ctx.translate(0, -legH + bob * 0.4);
  if (fx0 > 0) ctx.drawImage(img, 0, sy, fx0, ih - sy, -w / 2, 0, fx0 * k, legH);
  if (fx1 < iw) ctx.drawImage(img, fx1, sy, iw - fx1, ih - sy, -w / 2 + fx1 * k, 0, (iw - fx1) * k, legH);
  ctx.restore();
  // 다리: 뒤(왼쪽) 절반·앞(오른쪽) 절반
  for (const [a, b, half] of [[fx0, mid, 0], [mid, fx1, 1]]) {
    if (b <= a) continue;
    const swing = moving ? Math.sin(phase + half * Math.PI) : 0;
    ctx.save();
    ctx.translate(0, -legH + bob * 0.4);
    if (view === 'side') ctx.transform(1, 0, swing * 0.32, 1, 0, 0);
    else ctx.translate(0, -Math.max(0, swing) * 2.2);
    ctx.drawImage(img, a, sy, b - a, ih - sy, -w / 2 + a * k, 0, (b - a) * k, legH);
    ctx.restore();
  }
  ctx.restore();
}

const spans = new Map();

/** 그림 맨 아래쪽(발) 줄들에서 불투명한 가로 범위 [x0, x1] — 조금 넉넉하게 */
function feetSpan(img) {
  if (spans.has(img)) return spans.get(img);
  let span = [0, img.width];
  try {
    const iw = img.width;
    const ih = img.height;
    const c = document.createElement('canvas');
    c.width = iw;
    c.height = ih;
    const g = c.getContext('2d');
    g.drawImage(img, 0, 0);
    const rows = Math.max(2, Math.round(ih * 0.06));
    const d = g.getImageData(0, ih - rows, iw, rows).data;
    let x0 = iw;
    let x1 = 0;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < iw; x++) {
        if (d[(y * iw + x) * 4 + 3] > 40) {
          if (x < x0) x0 = x;
          if (x > x1) x1 = x;
        }
      }
    }
    if (x1 > x0) {
      const pad = (x1 - x0) * 0.15;
      span = [Math.max(0, Math.floor(x0 - pad)), Math.min(iw, Math.ceil(x1 + pad))];
    }
  } catch {
    // 그림을 읽을 수 없으면 전체 폭을 다리로 본다
  }
  spans.set(img, span);
  return span;
}

export function drawPhoto(ctx, img, cx, footY, { h = PHOTO_H, flip = false, tilt = 0 } = {}) {
  const w = (img.width * h) / img.height;
  ctx.save();
  ctx.translate(cx, footY);
  if (tilt) ctx.rotate(tilt);
  if (flip) ctx.scale(-1, 1);
  ctx.drawImage(img, -w / 2, -h, w, h);
  ctx.restore();
}
