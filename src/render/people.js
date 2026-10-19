// 플레이어·마을 사람을 큰 머리 한복 도트(chibi.js)로 그린다: 장비(옷 색·쓰개·무기)가 그림에 반영된다.
import { chibiFrame, CW, CH, FOOT_ROW, DOT_RES } from './chibi.js';
import { CLASSES } from '../data/classes.js';
import { ITEMS } from '../data/items.js';

const cache = new Map();

// 투구 아이템 → 쓰개 모양·색
const HAT_OF = {
  strawHat: { kind: 'gat', color: '#d9b36a' }, paeraengi: { kind: 'gat', color: '#c8a050' },
  heukrip: { kind: 'gat', color: '#2a2a2a' }, jeonrip: { kind: 'gat', color: '#3a2a2a' },
  headband: { kind: 'band', color: '#e8e2cf' }, leatherCap: { kind: 'helm', color: '#8a5a2a' },
  ironHelm: { kind: 'helm', color: '#aab4bc' }, eagleHelm: { kind: 'helm', color: '#7a6a5a' },
  dragonHelm: { kind: 'helm', color: '#3fa37a' }, phoenixCrown: { kind: 'crown', color: '#f4d03f' },
};
function hatOf(id) {
  if (!id) return null;
  if (HAT_OF[id]) return HAT_OF[id];
  const it = ITEMS[id];
  return it ? { kind: 'crown', color: it.gem ?? (it.level >= 75 ? '#c77dff' : it.level >= 55 ? '#4fc3f7' : '#f4d03f') } : null;
}

/** 플레이어 생김새: 직업 색 + 입은 옷(갑옷 테두리 색) + 쓰개 + 든 무기 */
export function playerLook(player) {
  const c = CLASSES[player.cls].look;
  const armor = ITEMS[player.equip.armor];
  const wpn = ITEMS[player.equip.weapon];
  const female = player.gender === 'f';
  const main = armor?.trim?.d ?? c.body;
  const accent = armor?.trim?.w ?? c.dark;
  const look = female
    ? { female, cloth: armor?.trim ? accent : '#f2e6c8', skirt: main, trim: main }
    : { cloth: main, trim: accent, pants: player.cls === 'rogue' ? '#2c3e50' : '#e9e2cf' };
  return {
    ...look,
    hair: c.hair,
    hat: hatOf(player.equip.helmet),
    weapon: wpn ? { wtype: wpn.wtype, tint: wpn.tint } : null,
  };
}

// 마을 사람 생김새
const NPC = {
  smith: { cloth: '#5d4037', trim: '#3e2723', pants: '#8a8070' },
  forger: { cloth: '#4a3a2a', trim: '#c0392b', pants: '#6a6050', hat: { kind: 'band', color: '#c0392b' } },
  stable: { cloth: '#7a5a34', trim: '#3e2a16', hat: { kind: 'gat', color: '#d9b36a' } },
  ferryman: { cloth: '#3a5a7a', trim: '#1e2f40', hat: { kind: 'gat', color: '#c8a050' } },
  traveler: { cloth: '#8a8f7a', trim: '#4a4a3a', hat: { kind: 'gat', color: '#d9b36a' } },
  chief: { cloth: '#f2efe6', trim: '#1f3a93', hair: '#e8e8e8', hat: { kind: 'gat', color: '#2a2a2a' } },
  master: { cloth: '#f2efe6', trim: '#2b4c7e', hair: '#d9d9d9', hat: { kind: 'gat', color: '#2a2a2a' } },
  guard: { cloth: '#2c3e50', trim: '#c0392b', pants: '#2c3e50', hat: { kind: 'helm', color: '#aab4bc' }, weapon: { wtype: 'spear', tint: '#d5dbdb' } },
  lord: { cloth: '#7b1f1f', trim: '#f4d03f', hat: { kind: 'gat', color: '#2a2a2a' } },
  tailor: { female: true, cloth: '#f2e6c8', skirt: '#c0392b', trim: '#c0392b' },
  herbalist: { female: true, cloth: '#e8efd8', skirt: '#6b7b3a', trim: '#6b7b3a', hair: '#b8b8b8' },
  peddler: { female: true, cloth: '#fbe3ec', skirt: '#e86f9a', trim: '#2e7d5b' },
  innkeeper: { female: true, cloth: '#f2e6c8', skirt: '#d97b4a', trim: '#7b2d26' },
};
export const npcLook = (look) => NPC[look] ?? null;

/** 한 칸 그림(캔버스). res 배로 키워 둔다(초상화용) */
export function personCanvas(look, dir, opts = {}, { res = DOT_RES, padTop = 0 } = {}) {
  const key = `${JSON.stringify(look)}|${dir}|${opts.step ?? 0}|${opts.pose ?? 'stand'}|${opts.phase ?? 0}|${res}|${padTop}`;
  if (cache.has(key)) return cache.get(key);
  const f = chibiFrame(look, dir, opts);
  const src = document.createElement('canvas');
  src.width = CW;
  src.height = CH;
  src.getContext('2d').putImageData(new ImageData(f.data, CW, CH), 0, 0);
  // 그림은 2배 해상도(DOT_RES)라 게임 좌표 크기는 그 절반. res 는 게임 좌표 1칸당 캔버스 픽셀 수
  const lw = CW / DOT_RES;
  const lh = CH / DOT_RES;
  let out = src;
  if (res !== DOT_RES || padTop) {
    out = document.createElement('canvas');
    out.width = lw * res;
    out.height = (lh + padTop) * res;
    const ctx = out.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(src, 0, padTop * res, lw * res, lh * res);
  }
  out.lw = lw;
  out.lh = lh + padTop;
  if (cache.size > 600) cache.clear();
  cache.set(key, out);
  return out;
}

// 원작처럼 사람이 칸보다 크게(게임 좌표로 1.5배 — 3배 해상도 그림이라 그림 한 칸은 0.5)
export const PERSON_SCALE = 1.5 / DOT_RES;

/**
 * 게임 칸(x,y: 32px 칸 왼쪽 위)에 발이 칸 아래쪽에 닿게 그린다. lift 만큼 띄운다.
 * 도트 한 칸이 화면 픽셀 정수배에 가까우면 그 배율로 또렷하게, 아니면 부드럽게 줄여 그린다(어중간한 배율로 도트가 들쭉날쭉하지 않게).
 */
export function drawPerson(ctx, look, dir, opts, x, y, lift = 0) {
  const t = ctx.getTransform();
  const k = Math.hypot(t.a, t.b) || 1;
  const want = PERSON_SCALE * k;
  const crisp = Math.abs(want - Math.round(want)) < 0.2 && want >= 0.8;
  const s = crisp ? Math.round(want) / k : PERSON_SCALE;
  const snap = (v) => Math.round(v * k) / k;
  const smooth = ctx.imageSmoothingEnabled;
  const quality = ctx.imageSmoothingQuality;
  ctx.imageSmoothingEnabled = !crisp;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(personCanvas(look, dir, opts), snap(x + 16 - (CW * s) / 2), snap(y + 31 - FOOT_ROW * s - lift), CW * s, CH * s);
  ctx.imageSmoothingEnabled = smooth;
  ctx.imageSmoothingQuality = quality;
}

/** 걷기 걸음: 서기 0, 걸으면 1·0·2·0 */
export const walkStep = (moving, now, ms = 140) => (moving ? [1, 0, 2, 0][Math.floor(now / ms) % 4] : 0);
