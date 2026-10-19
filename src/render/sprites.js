// 16x16 도트를 문자열로 정의하고 팔레트로 색을 입힌다. '.'은 투명.
// 모든 그림은 이 프로젝트에서 새로 그린 오리지널이다.
import { isClassic, isNinja, dotify } from './artmode.js';
import { personCanvas, playerLook } from './people.js';
import { photoOf, photoPortrait } from './photos.js';
import { CLASSES } from '../data/classes.js';
import { ITEMS } from '../data/items.js';
import { drawCharacter, CHAR_W, CHAR_H } from './characters.js';


import { BEAST_ART } from './beasts.js';

export const MONSTER_LOOK = {
  squirrel: { art: 'squirrel', pal: { k: '#2b1a10', b: '#a0612b', T: '#c47a3a', w: '#f0d9b5', e: '#111', p: '#f5a6b8' } },
  rabbit: { art: 'rabbit', pal: { k: '#3a3a3a', w: '#f4f4f4', p: '#f5a6b8', e: '#c0392b' } },
  fox: { art: 'canine', pal: { k: '#3b1d0b', o: '#e0782a', l: '#fbe3c6', e: '#111', n: '#111', t: '#ffffff' } },
  wolf: { art: 'canine', pal: { k: '#1f2326', o: '#7f8c8d', l: '#d5dbdb', e: '#f1c40f', n: '#111', t: '#bdc3c7' } },
  goblin: { art: 'goblin', pal: { k: '#14212b', g: '#3f7fbf', y: '#f4d03f', e: '#fff', w: '#fff', c: '#7b4a21', f: '#e5a33b', s: '#3b2a12' } },
  boar: { art: 'boar', pal: { k: '#1e130b', b: '#6e4a2e', e: '#ff4d4d', w: '#f4ecd8', n: '#c48a6a' } },
  jangsanbeom: { art: 'canine', pal: { k: '#3a3a44', o: '#f2f2f7', l: '#ffffff', e: '#59d9ff', n: '#555', t: '#d9d9e8' } },
  waterGhost: { art: 'ghost', alpha: 0.85, pal: { k: '#18303f', h: '#1b2b36', w: '#d8f3ff', e: '#0b4f6c', m: '#5c7f99', b: '#8fd3f4' } },
  snowWolf: { art: 'canine', pal: { k: '#2c3e50', o: '#e8f4ff', l: '#ffffff', e: '#3fa9f5', n: '#34495e', t: '#bfe3ff' } },
  dueok: { art: 'goblin', pal: { k: '#1a0b0b', g: '#a83232', y: '#f0e6d2', e: '#ffe066', w: '#fff', c: '#3b2a1a', f: '#2c2c2c', s: '#7a1f1f' } },
  bulgasari: { art: 'boar', pal: { k: '#15181c', b: '#6c7a89', e: '#ff8c1a', w: '#d5dbdb', n: '#95a5a6' } },
  blackDragon: { art: 'serpent', scale: 2, pal: { k: '#0b0612', g: '#2b1b3d', y: '#a64dff', e: '#ff3b3b', n: '#120a1c' } },
  blueGuardian: { art: 'serpent', scale: 2, pal: { k: '#0b2a3f', g: '#2e86c1', y: '#aee1ff', e: '#ffffff', n: '#0b2a3f' } },
  redGuardian: { art: 'serpent', scale: 2, pal: { k: '#3f0b0b', g: '#c0392b', y: '#ffb347', e: '#ffffff', n: '#3f0b0b' } },
  zodiacRat: { art: 'squirrel', pal: { k: '#1c1c22', b: '#7f8590', T: '#9aa0aa', w: '#e5e7ea', e: '#ff4d4d', p: '#f5a6b8' } },
  zodiacOx: { art: 'boar', pal: { k: '#140d08', b: '#4a2f1c', e: '#f4d03f', w: '#f4ecd8', n: '#8b5a2b' } },
  zodiacTiger: { art: 'canine', pal: { k: '#1a1208', o: '#e8a33a', l: '#fff3d6', e: '#3fd18a', n: '#111', t: '#111111' } },
  zodiacGeneral: { art: 'goblin', scale: 2, pal: { k: '#2a1f08', g: '#c9a24c', y: '#ffffff', e: '#fff', w: '#fff', c: '#8b5a2b', f: '#7b1f1f', s: '#f4d03f' } },
  fishSoldier: { art: 'goblin', pal: { k: '#0b2a33', g: '#3fb0a6', y: '#ffd166', e: '#fff', w: '#fff', c: '#c9d6df', f: '#2e86c1', s: '#1b4f72' } },
  turtleGeneral: { art: 'boar', pal: { k: '#0e2116', b: '#3f7a4a', e: '#ffd166', w: '#d8e8c0', n: '#8fbf6a' } },
  seaDragon: { art: 'serpent', scale: 2, pal: { k: '#04212f', g: '#1f8fbf', y: '#bff5ff', e: '#ffdd33', n: '#04212f' } },
  yeti: { art: 'goblin', pal: { k: '#2c3e50', g: '#eef3f8', y: '#9fb3c8', e: '#3fa9f5', w: '#fff', c: '#9fb3c8', f: '#cfdbe6', s: '#aab7b8' } },
  iceSpirit: { art: 'ghost', alpha: 0.85, pal: { k: '#1c3a52', h: '#6fb6e6', w: '#f0fbff', e: '#1c5a8a', m: '#6fb6e6', b: '#bfe3ff' } },
  iceDragon: { art: 'serpent', scale: 2, pal: { k: '#1c2f40', g: '#cfe8f7', y: '#ffffff', e: '#3fa9f5', n: '#1c2f40' } },
  waterImp: { art: 'goblin', pal: { k: '#0f2410', g: '#4f9a4a', y: '#d9e88a', e: '#fff', w: '#fff', c: '#6b8e23', f: '#2e5a2a', s: '#1e3a1a' } },
  redOgre: { art: 'goblin', pal: { k: '#200808', g: '#d4453a', y: '#f4ecd8', e: '#ffe066', w: '#fff', c: '#2c2c2c', f: '#f4d03f', s: '#7a1f1f' } },
  eightSerpent: { art: 'serpent', scale: 2, pal: { k: '#1a0a24', g: '#6c3483', y: '#d2b4de', e: '#ff3b3b', n: '#1a0a24' } },
  fireLizard: { art: 'canine', pal: { k: '#2a0a04', o: '#d4451f', l: '#ffb347', e: '#ffe066', n: '#111', t: '#ffd84d' } },
  flameSpirit: { art: 'ghost', alpha: 0.9, pal: { k: '#4a1404', h: '#ff7b2e', w: '#fff1c2', e: '#c0392b', m: '#ff7b2e', b: '#ffb347' } },
  firebird: { art: 'bird', scale: 3, pal: { k: '#3a0a04', y: '#ffd84d', e: '#111111', r: '#e8341c', o: '#ff9a2e' } },
  gumiho: { art: 'canine', scale: 2, tails: true, pal: { k: '#4a2340', o: '#fdf2f8', l: '#ffffff', e: '#e0218a', n: '#7a2a5a', t: '#ff8cc6' } },
  rat: { art: 'rat', pal: { k: '#2a2420', b: '#8a7f74', w: '#d9cfc4', e: '#111', p: '#f5a6b8' } },
  bigRat: { art: 'rat', pal: { k: '#2a2420', b: '#6e6258', w: '#c9bdb0', e: '#111', p: '#f5a6b8' } },
  bat: { art: 'bat', pal: { k: '#1a1020', b: '#4a3a5c', w: '#7a5a8c', e: '#ff4d4d' } },
  sewerRat: { art: 'rat', pal: { k: '#1c2418', b: '#5a6b48', w: '#a8b890', e: '#ffdd33', p: '#c9a0a0' } },
  ratKing: { art: 'rat', scale: 2, pal: { k: '#2a1a10', b: '#7a5a3a', w: '#e0c8a8', e: '#ff3b3b', p: '#f5a6b8', c: '#f4d03f' } },
  snake: { art: 'serpent', pal: { k: '#14240c', g: '#5a8a3a', y: '#d9e88a', e: '#111111', n: '#14240c' } },
  viper: { art: 'serpent', pal: { k: '#241008', g: '#8a4a2a', y: '#e0b070', e: '#ffdd33', n: '#241008' } },
  whiteSnake: { art: 'serpent', pal: { k: '#3a3a44', g: '#eef0f4', y: '#ffffff', e: '#e0218a', n: '#3a3a44' } },
  greatSnake: { art: 'serpent', scale: 2, pal: { k: '#0e1a0a', g: '#3a5a2a', y: '#c8d890', e: '#ffcc00', n: '#0e1a0a' } },
  wildPig: { art: 'boar', pal: { k: '#2a140e', b: '#a8645a', e: '#2b1d14', w: '#f4ecd8', n: '#f0a0a0' } },
  forestPig: { art: 'boar', pal: { k: '#1a140a', b: '#5a4a2a', e: '#ff4d4d', w: '#f4ecd8', n: '#c48a6a' } },
  pigKing: { art: 'boar', scale: 2, pal: { k: '#2a0a0a', b: '#c0392b', e: '#ffe066', w: '#fff3c0', n: '#ff9a8a' } },
  skeleton: { art: 'skeleton', pal: { k: '#2a2620', b: '#e8e2d0', e: '#1a1410', c: '#7a6a5a' } },
  skeletonSword: { art: 'skeleton', pal: { k: '#2a2620', b: '#ddd6c0', e: '#ff3b3b', c: '#aab7b8', w: 'sword' } },
  skeletonArcher: { art: 'skeleton', pal: { k: '#2a2620', b: '#d6ccb4', e: '#59d9ff', c: '#8b5a2b', w: 'bow' } },
  skeletonGeneral: { art: 'skeleton', scale: 2, pal: { k: '#1a1410', b: '#f0ead8', e: '#ff3b3b', c: '#c0392b', w: 'sword', h: '#f4d03f' } },
  eggGhost: { art: 'egg', alpha: 0.92, pal: { k: '#5a5a66', b: '#fbfaf4', w: '#ffffff' } },
  maidenGhost: { art: 'ghost', alpha: 0.88, pal: { k: '#1a1a22', h: '#0d0d12', w: '#eef2f8', e: '#3a0a0a', m: '#a01818', b: '#f4f6fa' } },
  bachelorGhost: { art: 'ghost', alpha: 0.88, pal: { k: '#14202c', h: '#1a1a1a', w: '#e0eaf0', e: '#0a1a2a', m: '#5a7f99', b: '#8fb3c8' } },
  grudgeLord: { art: 'ghost', scale: 2, alpha: 0.9, pal: { k: '#1a0a24', h: '#111111', w: '#e8e0f0', e: '#ff3b3b', m: '#5a0a0a', b: '#4a2a6c' } },
  imugi: { art: 'serpent', scale: 2, pal: { k: '#0e2a1e', g: '#2e8b57', y: '#d9e88a', e: '#ffdd33', n: '#103020' } },
};

const NPC_LOOK = {
  smith: { body: '#5d4037', dark: '#3e2723', hair: '#111111', skin: '#d9a77a' },
  tailor: { body: '#c0392b', dark: '#7b241c', hair: '#2c1a0e', skin: '#f5cba7' },
  herbalist: { body: '#6b7b3a', dark: '#3f4a1f', hair: '#c8c8c8', skin: '#e8c39e' },
  chief: { body: '#1f3a93', dark: '#13235a', hair: '#f2f2f2', skin: '#e8c39e', hat: 'gat' },
  peddler: { body: '#e86f9a', dark: '#2e7d5b', hair: '#2c1a0e', skin: '#fbd7bd' },
  guard: { body: '#2c3e50', dark: '#c0392b', hair: '#111111', skin: '#e8c39e', hat: 'guard' },
  master: { body: '#f2efe6', dark: '#2b4c7e', hair: '#d9d9d9', skin: '#e8c39e', hat: 'gat' },
  forger: { body: '#4a3a2a', dark: '#c0392b', hair: '#2a1a10', skin: '#c98d5e' },
  innkeeper: { body: '#d97b4a', dark: '#7b2d26', hair: '#1c1008', skin: '#f5cba7' },
  traveler: { body: '#8a8f7a', dark: '#4a4a3a', hair: '#3a2a1a', skin: '#d9a77a', hat: 'strawHat' },
  lord: { body: '#7b1f1f', dark: '#f4d03f', hair: '#111111', skin: '#e8c39e', hat: 'gat' },
  stable: { body: '#7a5a34', dark: '#3e2a16', hair: '#2a1a10', skin: '#d9a77a', hat: 'strawHat' },
  ferryman: { body: '#3a5a7a', dark: '#1e2f40', hair: '#2a1a10', skin: '#c98d5e', hat: 'strawHat' },
};

const CHAR_RES = 3; // 사람 캐릭터는 3배 해상도 벡터 그림

const cache = new Map();

function makeCanvas(w, h) {
  return Object.assign(document.createElement('canvas'), { width: w, height: h });
}




// 벡터로 그리는 그림: 고해상도 캔버스에 배율을 걸고 논리 좌표로 그린다
// 원작풍이면 1배 크기 도트로, 아니면 고해상도로 그려 둔다(방식마다 따로 저장)
function cachedVector(key, w, h, res, draw) {
  const full = `${isClassic() ? 'px' : 'hd'}:${key}`;
  if (!cache.has(full)) {
    if (isClassic()) {
      cache.set(full, dotify(w, h, draw));
    } else {
      const c = Object.assign(makeCanvas(w * res, h * res), { lw: w, lh: h });
      const ctx = c.getContext('2d');
      ctx.scale(res, res);
      draw(ctx);
      cache.set(full, c);
    }
  }
  return cache.get(full);
}

/** 사람 캐릭터(32×48): 성별·자세·장비가 반영된다. pose: stand | walk | cast | attack */
function characterSprite(keyBase, look, { gender = 'm', dir = 'down', pose = 'stand', blink = false, equip = {}, seated = false } = {}) {
  const key = `${keyBase}:${gender}:${dir}:${pose}:${blink ? 1 : 0}:${seated ? 1 : 0}:${equip.weapon}:${equip.helmet}:${equip.armor}:${equip.necklace}`;
  return cachedVector(key, CHAR_W, CHAR_H, CHAR_RES, (ctx) => drawCharacter(ctx, { look, gender, dir, pose, blink, equip, items: ITEMS, seated }));
}

export function playerSprite(cls, opts = {}) {
  return characterSprite(`p-${cls}`, CLASSES[cls].look, opts);
}

const FEMALE_NPC = new Set(['tailor', 'herbalist', 'peddler', 'innkeeper']);

export function npcSprite(look, dir, blink = false) {
  if (look === 'cat') return cachedVector('n-cat', 32, 32, CHAR_RES, (ctx) => BEAST_ART.cat(ctx, { k: '#3b2410', o: '#f0a24a', w: '#fff3e0', e: '#2b2b2b', n: '#f78fb3', p: '#ffb3c6' }));
  return characterSprite(`n-${look}`, NPC_LOOK[look], { gender: FEMALE_NPC.has(look) ? 'f' : 'm', dir, blink });
}

/** 아홉 꼬리: 끝으로 갈수록 가늘어지는 곡선 꼬리(벡터, 논리 좌표) */
function drawTails(ctx, size, pal) {
  const cx = size * 0.72;
  const cy = size * 0.58;
  const len = size * 0.42;
  for (let i = 0; i < 9; i++) {
    const a = -Math.PI * 0.95 + (i / 8) * Math.PI * 0.9;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(a);
    const g = ctx.createLinearGradient(0, 0, len, 0);
    g.addColorStop(0, pal.o);
    g.addColorStop(0.7, pal.l ?? pal.o);
    g.addColorStop(1, pal.t);
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.07);
    ctx.quadraticCurveTo(len * 0.6, -size * 0.13, len, 0);
    ctx.quadraticCurveTo(len * 0.6, size * 0.1, 0, size * 0.07);
    ctx.closePath();
    ctx.fillStyle = g;
    ctx.fill();
    ctx.lineWidth = size * 0.02;
    ctx.strokeStyle = pal.k;
    ctx.stroke();
    ctx.restore();
  }
}

// 원작처럼 몬스터는 사람보다 크게: 작은 짐승(쥐·토끼·다람쥐·고양이)만 제 크기
const SMALL_ARTS = new Set(['squirrel', 'rabbit', 'rat', 'cat', 'bat']);
export function monsterScale(type) {
  const look = MONSTER_LOOK[type];
  return look.scale ?? (SMALL_ARTS.has(look.art) ? 1 : 1.3);
}

/** 몬스터 스프라이트(왼쪽을 보는 그림). 보스는 크게 그린다. */
export function monsterSprite(type) {
  const look = MONSTER_LOOK[type];
  const scale = monsterScale(type);
  const size = Math.round(32 * scale);
  return cachedVector(`m-${type}`, size, size, CHAR_RES, (ctx) => {
    ctx.scale(size / 32, size / 32);
    ctx.lineJoin = 'round';
    if (look.tails) drawTails(ctx, 32, look.pal);
    ctx.globalAlpha = look.alpha ?? 1;
    BEAST_ART[look.art](ctx, look.pal);
  });
}

/** 캐릭터 고르는 화면·초상화용 정면 그림 */
export function portraitSprite(cls, equip = {}, gender = 'm', look = 0) {
  // 새 도트 모드: 고른 생김새의 실사 그림이 있으면 그것, 없으면 게임 속과 같은 도트
  const photo = isNinja() && photoOf(cls, gender, look);
  if (photo) return photoPortrait(photo);
  if (isNinja()) return personCanvas(playerLook({ cls, equip, gender }), 'down', {}, { res: 6, padTop: 8 });
  return playerSprite(cls, { gender, dir: 'down', equip });
}
