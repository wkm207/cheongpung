// 16x16 도트를 문자열로 정의하고 팔레트로 색을 입힌다. '.'은 투명.
// 모든 그림은 이 프로젝트에서 새로 그린 오리지널이다.
import { CLASSES } from '../data/classes.js';
import { ITEMS } from '../data/items.js';
import { drawCharacter, CHAR_W, CHAR_H } from './characters.js';

const PX = 2; // 도트 1칸 = 2픽셀 (타일 32px)

export const MONSTER_ART = {
  squirrel: [
    '................',
    '................',
    '..........kkk...',
    '.........kTTTk..',
    '..kk....kTTTTTk.',
    '.kbbk...kTTTTTk.',
    'kbebbk..kTTTTk..',
    'kbpbbbk..kTTTk..',
    '.kbbbbbkkTTTk...',
    '..kbwbbbbTTk....',
    '..kbwwbbbbk.....',
    '..kbwwbbbbk.....',
    '...kbbbbbk......',
    '...kbk.kbk......',
    '...kk...kk......',
    '................',
  ],
  rabbit: [
    '....kk.kk.......',
    '...kwwkwwk......',
    '...kwpkwpk......',
    '...kwpkwpk......',
    '...kwwkwwk......',
    '..kwwwwwwk......',
    '.kwewwwwwwk.....',
    '.kwpwwwwwwwkkk..',
    '..kwwwwwwwwwwwk.',
    '...kwwwwwwwwwwk.',
    '...kwwwwwwwwwwk.',
    '....kwwwwwwwwwk.',
    '....kwwkkkwwwk..',
    '....kwk...kwk...',
    '....kk.....kk...',
    '................',
  ],
  canine: [
    '................',
    '................',
    '..k..k..........',
    '.kok.kok.....kk.',
    '.kooookok...kotk',
    'kooeoooook..kotk',
    'knoooooook.kook.',
    '.kllooooookkook.',
    '..kllooooooook..',
    '...kooooooooook.',
    '...kloooooooolk.',
    '...klooooooollk.',
    '....kok.kkkok...',
    '....kok....kok..',
    '....kk.....kk...',
    '................',
  ],
  goblin: [
    '.......yy.......',
    '......kyyk......',
    '.....kggggk.....',
    '....kggggggk....',
    '....kgegegk.....',
    '....kggggggk....',
    '....kgkwwkgk..c.',
    '.....kggggk..cc.',
    '...kkggggggkkcc.',
    '..kggkggggkggkc.',
    '..kgk.kffffk.kg.',
    '..kk..kfsfsfk.k.',
    '.....kffffffk...',
    '.....kggkkggk...',
    '.....kgk..kgk...',
    '.....kk....kk...',
  ],
  boar: [
    '................',
    '................',
    '................',
    '.....kk..kk.....',
    '....kbbkkbbkkk..',
    '...kbbbbbbbbbbk.',
    '..kbebbbbbbbbbbk',
    '.kwbbbbbbbbbbbbk',
    'knnwbbbbbbbbbbbk',
    'knnkbbbbbbbbbbk.',
    '.kk.kbbbbbbbbk..',
    '.....kbk..kbk...',
    '.....kbk..kbk...',
    '.....kk....kk...',
    '................',
    '................',
  ],
  ghost: [
    '.....kkkkkk.....',
    '....khhhhhhk....',
    '...khhhhhhhhk...',
    '...khwwwwwwhk...',
    '...khweewewhk...',
    '...khwwwwwwhk...',
    '...khwwmmwwhk...',
    '..khhwwwwwwhhk..',
    '..khhbbbbbbhhk..',
    '..khbbbbbbbbhk..',
    '.khhbbbbbbbbhhk.',
    '.khbbbbbbbbbbhk.',
    '.kbbbbbbbbbbbbk.',
    '..kbbk.kbbk.kbk.',
    '...kk...kk...k..',
    '................',
  ],
  serpent: [
    '................',
    '..kkkk..........',
    '.kggggk.........',
    'kgeggggk........',
    'kggggggk........',
    'knggggk.........',
    '.kkggk..........',
    '...kggk....kkk..',
    '...kgyyk..kgggk.',
    '....kgyyk.kgyyk.',
    '....kgyyykkgyyk.',
    '.....kgyyyggyk..',
    '......kgyyyyk...',
    '.......kkkkk....',
    '................',
    '................',
  ],
  cat: [
    '................',
    '................',
    '................',
    '.k.k............',
    'kokok...........',
    'koooook.........',
    'koeooek......k..',
    'kopnpok.....kok.',
    '.kooook....kok..',
    '..kooookkkkok...',
    '..koowwooooook..',
    '..koowwooooook..',
    '..kooooooooook..',
    '...kok.kok.kok..',
    '...kk..kk..kk...',
    '................',
  ],
};

const MONSTER_LOOK = {
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
  gumiho: { art: 'canine', scale: 2, tails: true, pal: { k: '#4a2340', o: '#fdf2f8', l: '#ffffff', e: '#e0218a', n: '#7a2a5a', t: '#ff8cc6' } },
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
};

const cache = new Map();

function makeCanvas(w, h) {
  return Object.assign(document.createElement('canvas'), { width: w, height: h });
}

export function drawPixelRows(ctx, rows, pal, ox = 0, oy = 0, px = PX) {
  rows.forEach((row, y) => {
    for (let x = 0; x < 16; x++) {
      const color = pal[row[x]];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(ox + x * px, oy + y * px, px, px);
    }
  });
}

function cached(key, w, h, draw) {
  if (!cache.has(key)) {
    const c = makeCanvas(w, h);
    draw(c.getContext('2d'));
    cache.set(key, c);
  }
  return cache.get(key);
}


/** 사람 캐릭터(32×48): 성별·자세·장비가 반영된다. pose: stand | walk | cast | attack */
function characterSprite(keyBase, look, { gender = 'm', dir = 'down', pose = 'stand', blink = false, equip = {} } = {}) {
  const key = `${keyBase}:${gender}:${dir}:${pose}:${blink ? 1 : 0}:${equip.weapon}:${equip.helmet}:${equip.armor}:${equip.necklace}`;
  return cached(key, CHAR_W, CHAR_H, (ctx) => drawCharacter(ctx, { look, gender, dir, pose, blink, equip, items: ITEMS }));
}

export function playerSprite(cls, opts = {}) {
  return characterSprite(`p-${cls}`, CLASSES[cls].look, opts);
}

const FEMALE_NPC = new Set(['tailor', 'herbalist', 'peddler', 'innkeeper']);

export function npcSprite(look, dir, blink = false) {
  if (look === 'cat') return cached('n-cat', 32, 32, (ctx) => drawPixelRows(ctx, MONSTER_ART.cat, { k: '#3b2410', o: '#f0a24a', w: '#fff3e0', e: '#2b2b2b', n: '#f78fb3', p: '#ffb3c6' }));
  return characterSprite(`n-${look}`, NPC_LOOK[look], { gender: FEMALE_NPC.has(look) ? 'f' : 'm', dir, blink });
}

function drawTails(ctx, size, pal) {
  const cx = size * 0.72;
  const cy = size * 0.55;
  for (let i = 0; i < 9; i++) {
    const a = -Math.PI * 0.95 + (i / 8) * Math.PI * 0.9;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(a);
    ctx.fillStyle = pal.k;
    ctx.fillRect(0, -5, size * 0.42, 10);
    ctx.fillStyle = pal.o;
    ctx.fillRect(2, -3, size * 0.38, 6);
    ctx.fillStyle = pal.t;
    ctx.fillRect(size * 0.3, -3, size * 0.1, 6);
    ctx.restore();
  }
}

/** 몬스터 스프라이트(왼쪽을 보는 그림). 보스는 크게 그린다. */
export function monsterSprite(type) {
  const look = MONSTER_LOOK[type];
  const scale = look.scale ?? 1;
  const size = 32 * scale;
  return cached(`m-${type}`, size, size, (ctx) => {
    if (look.tails) drawTails(ctx, size, look.pal);
    ctx.globalAlpha = look.alpha ?? 1;
    drawPixelRows(ctx, MONSTER_ART[look.art], look.pal, 0, 0, PX * scale);
  });
}

export function monsterScale(type) {
  return MONSTER_LOOK[type].scale ?? 1;
}

/** 캐릭터 고르는 화면·초상화용 정면 그림 */
export function portraitSprite(cls, equip = {}, gender = 'm') {
  return playerSprite(cls, { gender, dir: 'down', equip });
}
