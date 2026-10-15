import { buildVillage, buildField, buildCave } from '../world/mapgen.js';

// 포탈: (x, y, w, h) 영역에 들어서면 to 맵의 (tx, ty)로 이동
export const MAP_DEFS = {
  village: {
    name: '청풍촌',
    w: 40, h: 30, seed: 7,
    build: buildVillage,
    safe: true,
    portals: [
      { x: 39, y: 14, w: 1, h: 2, to: 'field1', tx: 2, ty: 14 },
      { x: 19, y: 0, w: 2, h: 1, to: 'forest', tx: 19, ty: 37 },
    ],
    npcs: [
      {
        id: 'smith', name: '대장장이 무쇠', x: 7, y: 9, look: 'smith',
        lines: ['어서 오게! 쇠는 두드릴수록 단단해지는 법이지.', '좋은 무기가 있어야 사냥도 수월하다네. 하나 골라 보게.'],
        shop: ['woodSword', 'ironSword', 'steelSword', 'dagger', 'ironDagger', 'steelDagger', 'woodStaff', 'jadeStaff', 'spiritStaff', 'paperFan', 'craneFan', 'cloudFan'],
      },
      {
        id: 'tailor', name: '포목점 비단', x: 29, y: 9, look: 'tailor',
        lines: ['곱게 지은 옷 한 벌이 목숨을 살리기도 한답니다.', '갑옷과 투구를 보고 가세요.'],
        shop: ['cottonRobe', 'leatherArmor', 'chainArmor', 'ironArmor', 'strawHat', 'leatherCap', 'ironHelm'],
      },
      {
        id: 'herbalist', name: '약방 할멈', x: 7, y: 25, look: 'herbalist',
        lines: ['아이고, 또 다쳐서 왔누?', '사냥 나가기 전에 약초랑 이슬은 넉넉히 챙기게나.'],
        shop: ['herb', 'bigHerb', 'dew', 'bigDew', 'returnScroll'],
      },
      {
        id: 'chief', name: '촌장', x: 29, y: 25, look: 'chief', quests: true,
        lines: [
          '청풍촌에 온 것을 환영하네, 젊은이.',
          '동쪽 토끼 들판에서 다람쥐와 토끼를 잡으며 실력을 쌓게. 그 너머엔 늑대 언덕이 있지.',
          '북쪽 여우 숲의 여우는 사람을 보면 먼저 덤벼드니 조심하게.',
          '숲 깊은 곳 도깨비 굴 너머에는... 구미호가 산다는 소문이 있다네.',
        ],
      },
      {
        id: 'peddler', name: '방물장수 꽃분이', x: 23, y: 12, look: 'peddler',
        lines: ['어머, 손님! 고운 장신구 구경하고 가세요~', '목걸이 하나, 가락지 하나면 몸도 마음도 든든하답니다.'],
        shop: ['beadNecklace', 'amberNecklace', 'pearlNecklace', 'copperRing', 'jadeRing', 'silverRing'],
      },
      {
        id: 'master', name: '사범 청운', x: 22, y: 17, look: 'master', advance: true,
        lines: ['수련은 끝이 없는 법. 때가 되면 내게 오너라, 한 단계 높은 길을 열어 주마.'],
      },
      {
        id: 'guard', name: '포졸 돌쇠', x: 36, y: 12, look: 'guard',
        lines: ['동쪽 문을 나서면 토끼 들판이오. 처음이면 거기서 몸을 푸시오.', '북쪽 문 밖 여우 숲은 여우가 먼저 덤비니 각오하시오.'],
      },
      {
        id: 'cat', name: '나비', x: 17, y: 16, look: 'cat', wander: true,
        lines: ['야옹~', '(꼬리를 살랑살랑 흔든다)', '(발라당 누워 배를 보여 준다)'],
      },
    ],
    spawns: [],
  },
  field1: {
    name: '토끼 들판',
    w: 44, h: 32, seed: 11, density: 0.07, obstacles: ['T', 'O'],
    build: buildField,
    portals: [
      { x: 0, y: 14, w: 1, h: 2, to: 'village', tx: 37, ty: 14 },
      { x: 43, y: 16, w: 1, h: 2, to: 'wolfHill', tx: 2, ty: 16 },
    ],
    spawns: [['squirrel', 10], ['rabbit', 10]],
  },
  forest: {
    name: '여우 숲',
    w: 40, h: 40, seed: 23, density: 0.16, obstacles: ['T'],
    build: buildField,
    portals: [
      { x: 19, y: 39, w: 2, h: 1, to: 'village', tx: 19, ty: 2 },
      { x: 19, y: 0, w: 2, h: 1, to: 'goblinCave', tx: 23, ty: 37 },
    ],
    spawns: [['rabbit', 5], ['fox', 12]],
  },
  wolfHill: {
    name: '늑대 언덕',
    w: 44, h: 34, seed: 37, density: 0.09, ground: ':', obstacles: ['O', 'O', 'T'],
    build: buildField,
    portals: [
      { x: 0, y: 16, w: 1, h: 2, to: 'field1', tx: 41, ty: 16 },
      { x: 43, y: 16, w: 1, h: 2, to: 'deepMountain', tx: 2, ty: 16 },
    ],
    spawns: [['fox', 5], ['wolf', 12]],
  },
  deepMountain: {
    name: '깊은 산',
    w: 46, h: 36, seed: 61, density: 0.15, ground: ';', obstacles: ['T', 'T', 'O'],
    build: buildField,
    portals: [
      { x: 0, y: 16, w: 1, h: 2, to: 'wolfHill', tx: 41, ty: 16 },
      { x: 22, y: 0, w: 2, h: 1, to: 'imugiSwamp', tx: 15, ty: 23 },
    ],
    spawns: [['boar', 10], ['jangsanbeom', 6]],
  },
  imugiSwamp: {
    name: '이무기 늪',
    w: 32, h: 26, seed: 83, density: 0.1, ground: ';', obstacles: ['~', '~', 'T'],
    build: buildField,
    portals: [
      { x: 15, y: 25, w: 2, h: 1, to: 'deepMountain', tx: 22, ty: 2 },
      { x: 31, y: 12, w: 1, h: 2, to: 'snowPass', tx: 2, ty: 18 },
    ],
    spawns: [['imugi', 1], ['waterGhost', 7]],
  },
  snowPass: {
    name: '설원 고개',
    w: 46, h: 38, seed: 97, density: 0.1, ground: '*', obstacles: ['T', 'O', 'T'],
    build: buildField,
    portals: [
      { x: 0, y: 18, w: 1, h: 2, to: 'imugiSwamp', tx: 29, ty: 12 },
      { x: 22, y: 0, w: 2, h: 1, to: 'dragonCave', tx: 25, ty: 37 },
    ],
    spawns: [['snowWolf', 12], ['dueok', 7]],
  },
  dragonCave: {
    name: '흑룡 동굴',
    w: 52, h: 40, seed: 131, fill: 0.42,
    build: buildCave,
    portals: [
      { x: 25, y: 39, w: 2, h: 1, to: 'snowPass', tx: 22, ty: 2 },
    ],
    spawns: [['bulgasari', 14], ['blackDragon', 1]],
  },
  goblinCave: {
    name: '도깨비 굴',
    w: 48, h: 40, seed: 51,
    build: buildCave,
    portals: [
      { x: 23, y: 39, w: 2, h: 1, to: 'forest', tx: 19, ty: 2 },
      { x: 23, y: 0, w: 2, h: 1, to: 'bossLair', tx: 11, ty: 17 },
    ],
    spawns: [['goblin', 16]],
  },
  bossLair: {
    name: '구미호 굴',
    w: 24, h: 20, seed: 77, fill: 0.38,
    build: buildCave,
    portals: [
      { x: 11, y: 19, w: 2, h: 1, to: 'goblinCave', tx: 23, ty: 2 },
    ],
    spawns: [['gumiho', 1], ['goblin', 3]],
  },
};

const cache = new Map();

/** 맵 타일(2차원 배열)을 만들어 캐시한다. 같은 시드라 항상 같은 지형이 나온다. */
export function getTiles(mapId) {
  if (!cache.has(mapId)) {
    const def = MAP_DEFS[mapId];
    cache.set(mapId, def.build({ ...def, npcs: def.npcs ?? [] }));
  }
  return cache.get(mapId);
}
