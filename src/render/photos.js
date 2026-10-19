// 실사풍 사람 그림(AI로 그린 그림을 tools/art_import.py 로 다듬은 것, assets/people/)
// 직업·성별마다 여러 생김새가 있고, 플레이어는 그중 하나(player.look)를 고른다. 그림이 없으면 도트 그림을 쓴다.
import { LOOKS, NPC_PHOTOS, MOB_PHOTOS } from '../data/looks.js';
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
      for (const n of list) jobs.push(preload(photoSrc(cls, g, n)).decode?.().catch(() => {}) ?? Promise.resolve());
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
  portraits.set(img, c);
  return c;
}

/** 게임 화면에 그리는 실사 사람 키(게임 좌표, 32 = 한 칸) */
export const PHOTO_H = 58;

/**
 * 발이 (cx, footY)에 닿게 그린다. flip: 좌우 뒤집기, tilt: 기울기(라디안)
 */
export function drawPhoto(ctx, img, cx, footY, { h = PHOTO_H, flip = false, tilt = 0 } = {}) {
  const w = (img.width * h) / img.height;
  ctx.save();
  ctx.translate(cx, footY);
  if (tilt) ctx.rotate(tilt);
  if (flip) ctx.scale(-1, 1);
  ctx.drawImage(img, -w / 2, -h, w, h);
  ctx.restore();
}
