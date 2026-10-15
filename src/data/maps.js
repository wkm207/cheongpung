import { buildVillage, buildField, buildCave, buildRoom, buildCastle } from '../world/mapgen.js';

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
      { x: 0, y: 14, w: 1, h: 2, to: 'castle', tx: 36, ty: 14 },
      { x: 7, y: 8, w: 1, h: 1, to: 'smithy', tx: 5, ty: 6, door: true },
      { x: 29, y: 8, w: 1, h: 1, to: 'tailorShop', tx: 5, ty: 6, door: true },
      { x: 7, y: 24, w: 1, h: 1, to: 'pharmacy', tx: 5, ty: 6, door: true },
      { x: 29, y: 24, w: 1, h: 1, to: 'chiefHouse', tx: 5, ty: 6, door: true },
      { x: 15, y: 24, w: 1, h: 1, to: 'tavern', tx: 6, ty: 7, door: true },
    ],
    npcs: [
      {
        id: 'peddler', name: '방물장수 꽃분이', x: 23, y: 12, look: 'peddler',
        lines: ['어머, 손님! 고운 장신구 구경하고 가세요~', '목걸이 하나, 가락지 하나면 몸도 마음도 든든하답니다.'],
        shop: ['beadNecklace', 'amberNecklace', 'pearlNecklace', 'copperRing', 'jadeRing', 'silverRing'],
      },
      {
        id: 'forger', name: '명장 해림', x: 12, y: 13, look: 'forger', forge: true,
        lines: ['쇠는 불에 달궈야 강해지고, 사람은 고생을 해야 강해지는 법이지.', '최고의 장비를 원하나? 아니면 지금 장비를 더 단단히 벼려 줄까?'],
        shop: ['highSword55', 'highDagger55', 'highStaff55', 'highFan55', 'highArmor55', 'highHelm55', 'highNeck55', 'highRing55',
          'highSword65', 'highDagger65', 'highStaff65', 'highFan65', 'highArmor65', 'highHelm65', 'highNeck65', 'highRing65',
          'highSword75', 'highDagger75', 'highStaff75', 'highFan75', 'highArmor75', 'highHelm75', 'highNeck75', 'highRing75',
          'highSword85', 'highDagger85', 'highStaff85', 'highFan85', 'highArmor85', 'highHelm85', 'highNeck85', 'highRing85'],
      },
      {
        id: 'master', name: '사범 청운', x: 22, y: 17, look: 'master', advance: true,
        lines: ['수련은 끝이 없는 법. 때가 되면 내게 오너라, 한 단계 높은 길을 열어 주마.'],
      },
      {
        id: 'stable', name: '마구간지기 덕배', x: 35, y: 18, look: 'stable',
        lines: ['튼튼한 말 한 필 있으면 먼 길도 금방이지! R키나 [말] 버튼으로 타고 내리면 된다네.'],
        shop: ['horseTicket'],
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
  smithy: {
    name: '대장간',
    w: 12, h: 9, indoor: true, safe: true,
    build: buildRoom,
    furniture: [['V', 1, 2, 10, 1], ['U', 3, 3, 2, 1], ['U', 7, 3, 2, 1], ['K', 9, 5]],
    portals: [{ x: 5, y: 8, w: 2, h: 1, to: 'village', tx: 7, ty: 9 }],
    npcs: [
        {
          id: 'smith', name: '대장장이 무쇠', x: 6, y: 3, look: 'smith',
          lines: ['어서 오게! 쇠는 두드릴수록 단단해지는 법이지.', '좋은 무기가 있어야 사냥도 수월하다네. 하나 골라 보게.'],
          shop: ['woodSword', 'ironSword', 'steelSword', 'dagger', 'ironDagger', 'nightBlade', 'steelDagger', 'blackCloudBlade', 'woodStaff', 'jadeStaff', 'spiritStaff', 'paperFan', 'craneFan', 'cloudFan'],
        },
    ],
    spawns: [],
  },
  tailorShop: {
    name: '포목점',
    w: 12, h: 9, indoor: true, safe: true,
    build: buildRoom,
    furniture: [['V', 1, 2, 10, 1], ['U', 3, 3, 2, 1], ['U', 7, 3, 2, 1], ['U', 1, 5, 1, 2]],
    portals: [{ x: 5, y: 8, w: 2, h: 1, to: 'village', tx: 29, ty: 9 }],
    npcs: [
        {
          id: 'tailor', name: '포목점 비단', x: 6, y: 3, look: 'tailor',
          lines: ['곱게 지은 옷 한 벌이 목숨을 살리기도 한답니다.', '갑옷과 투구를 보고 가세요.'],
          shop: ['cottonRobe', 'leatherArmor', 'blueRobe', 'pinkJeogori', 'chainArmor', 'blackPlate', 'silverPlate', 'ironArmor', 'dragonRobe', 'phoenixDress', 'strawHat', 'leatherCap', 'ironHelm'],
        },
    ],
    spawns: [],
  },
  pharmacy: {
    name: '약방',
    w: 12, h: 9, indoor: true, safe: true,
    build: buildRoom,
    furniture: [['V', 1, 2, 10, 1], ['U', 3, 3, 2, 1], ['U', 7, 3, 2, 1], ['K', 1, 6], ['K', 10, 6]],
    portals: [{ x: 5, y: 8, w: 2, h: 1, to: 'village', tx: 7, ty: 25 }],
    npcs: [
        {
          id: 'herbalist', name: '약방 할멈', x: 6, y: 3, look: 'herbalist',
          lines: ['아이고, 또 다쳐서 왔누?', '사냥 나가기 전에 약초랑 이슬은 넉넉히 챙기게나.'],
          shop: ['herb', 'bigHerb', 'dew', 'bigDew', 'returnScroll', 'guardCharm'],
        },
    ],
    spawns: [],
  },
  chiefHouse: {
    name: '촌장 댁',
    w: 12, h: 9, indoor: true, safe: true,
    build: buildRoom,
    furniture: [['V', 1, 2, 3, 1], ['V', 8, 2, 3, 1], ['U', 4, 4, 1, 1], ['U', 7, 4, 1, 1]],
    portals: [{ x: 5, y: 8, w: 2, h: 1, to: 'village', tx: 29, ty: 25 }],
    npcs: [
        {
          id: 'chief', name: '촌장', x: 6, y: 3, look: 'chief', quests: true,
          lines: [
            '청풍촌에 온 것을 환영하네, 젊은이.',
            '동쪽 토끼 들판에서 다람쥐와 토끼를 잡으며 실력을 쌓게. 그 너머엔 늑대 언덕이 있지.',
            '북쪽 여우 숲의 여우는 사람을 보면 먼저 덤벼드니 조심하게.',
            '숲 깊은 곳 도깨비 굴 너머에는... 구미호가 산다는 소문이 있다네.',
          ],
        },
    ],
    spawns: [],
  },
  tavern: {
    name: '주막',
    w: 14, h: 10, indoor: true, safe: true,
    build: buildRoom,
    furniture: [['V', 1, 2, 12, 1], ['U', 4, 3, 2, 1], ['U', 8, 3, 2, 1], ['U', 2, 6, 2, 1], ['U', 10, 6, 2, 1], ['K', 12, 3]],
    portals: [{ x: 6, y: 9, w: 2, h: 1, to: 'village', tx: 15, ty: 25 }],
    npcs: [
      {
        id: 'innkeeper', name: '주모 연화', x: 7, y: 3, look: 'innkeeper', inn: true,
        lines: ['어서 오시오! 뜨끈한 국밥 한 그릇 하고 가시구려.', '먼 길 왔으면 한숨 자고 가요. 잠자리도 깨끗하다오.'],
        shop: ['tteok', 'gukbap', 'makgeolli', 'herb', 'dew', 'returnScroll'],
      },
      {
        id: 'traveler', name: '떠돌이 나그네', x: 3, y: 7, look: 'traveler',
        lines: ['서쪽 문 너머 청풍성에 성주님이 계시다오. 실력 있는 무사를 찾는다더군.', '상인 앞에서 "약초 10개 사자" 하고 말만 하면 물건을 내준다지. 편하지 않소?', '깊은 산 너머엔 이무기가, 설원 너머엔 흑룡이 산다는 소문이오.'],
      },
    ],
    spawns: [],
  },
  castle: {
    name: '청풍성',
    w: 40, h: 30, seed: 19, safe: true,
    build: buildCastle,
    portals: [
      { x: 39, y: 14, w: 1, h: 2, to: 'village', tx: 2, ty: 14 },
      { x: 19, y: 8, w: 2, h: 1, to: 'palace', tx: 9, ty: 9, door: true },
    ],
    npcs: [
      { id: 'gateguard1', name: '성문 수문장', x: 35, y: 12, look: 'guard', lines: ['청풍성에 온 것을 환영하오. 대전은 북쪽 큰 건물이오.'] },
      { id: 'gateguard2', name: '성문 수문장', x: 35, y: 17, look: 'guard', lines: ['성주님께서 실력 있는 무사를 찾고 계시오.'] },
      { id: 'palaceguard', name: '대전 호위무사', x: 17, y: 10, look: 'guard', lines: ['대전 안에서는 예를 갖추시오.'] },
      {
        id: 'ferryman', name: '뱃사공 막쇠', x: 24, y: 20, look: 'ferryman',
        lines: ['어디로 모셔다 드릴까? 뱃삯만 내면 먼 곳도 금방이지!'],
        travel: [
          { to: 'trainingBlue', level: 40, cost: 3000 },
          { to: 'trainingRed', level: 40, cost: 3000 },
          { to: 'zodiacTemple', level: 55, cost: 6000 },
          { to: 'dragonPalace', level: 65, cost: 12000 },
          { to: 'northFortress', level: 75, cost: 20000 },
          { to: 'eastIsland', level: 85, cost: 40000 },
        ],
      },
    ],
    spawns: [],
  },
  palace: {
    name: '청풍성 대전',
    w: 20, h: 12, indoor: true, safe: true,
    build: buildRoom,
    furniture: [['V', 1, 2, 18, 1], ['U', 7, 3, 2, 1], ['U', 11, 3, 2, 1], ['U', 2, 5, 1, 4], ['U', 17, 5, 1, 4]],
    portals: [{ x: 9, y: 11, w: 2, h: 1, to: 'castle', tx: 19, ty: 10 }],
    npcs: [
      {
        id: 'lord', name: '성주 윤휘', x: 10, y: 3, look: 'lord', quests: true,
        lines: ['그대가 요즘 고을에서 이름을 떨친다는 무사인가.', '이 땅의 평화를 위해 그대의 힘을 빌려 주게.'],
      },
      { id: 'royalguard1', name: '금위 무사', x: 4, y: 4, look: 'guard', lines: ['성주님을 뵙거든 고개를 숙이시오.'] },
      { id: 'royalguard2', name: '금위 무사', x: 15, y: 4, look: 'guard', lines: ['……'] },
    ],
    spawns: [],
  },
  trainingBlue: {
    name: '청룡 수련굴', w: 26, h: 22, seed: 141, fill: 0.36, floor: 'b', wall: 'X',
    build: buildCave,
    portals: [{ x: 12, y: 21, w: 2, h: 1, to: 'castle', tx: 24, ty: 21 }],
    spawns: [['blueGuardian', 1], ['fishSoldier', 3]],
  },
  trainingRed: {
    name: '적룡 수련굴', w: 26, h: 22, seed: 151, fill: 0.36,
    build: buildCave,
    portals: [{ x: 12, y: 21, w: 2, h: 1, to: 'castle', tx: 24, ty: 21 }],
    spawns: [['redGuardian', 1], ['bulgasari', 3]],
  },
  zodiacTemple: {
    name: '십이지 신전', w: 50, h: 42, seed: 161, fill: 0.4, floor: 'S', wall: 'X',
    build: buildCave,
    portals: [{ x: 24, y: 41, w: 2, h: 1, to: 'castle', tx: 24, ty: 21 }],
    spawns: [['zodiacRat', 8], ['zodiacOx', 6], ['zodiacTiger', 6], ['zodiacGeneral', 1]],
  },
  dragonPalace: {
    name: '용궁', w: 48, h: 40, seed: 171, density: 0.1, ground: 'b', obstacles: ['C', 'C', 'O'],
    build: buildField,
    portals: [{ x: 23, y: 39, w: 2, h: 1, to: 'castle', tx: 24, ty: 21 }],
    spawns: [['fishSoldier', 10], ['turtleGeneral', 7], ['seaDragon', 1]],
  },
  northFortress: {
    name: '북방 산성', w: 48, h: 40, seed: 181, density: 0.08, ground: '*', obstacles: ['Q', 'T', 'O'],
    build: buildField,
    portals: [{ x: 23, y: 39, w: 2, h: 1, to: 'castle', tx: 24, ty: 21 }],
    spawns: [['yeti', 9], ['iceSpirit', 8], ['iceDragon', 1]],
  },
  eastIsland: {
    name: '동쪽 섬나라', w: 48, h: 40, seed: 191, density: 0.14, ground: ';', obstacles: ['Z', 'Z', 'T', '~'],
    build: buildField,
    portals: [{ x: 23, y: 39, w: 2, h: 1, to: 'castle', tx: 24, ty: 21 }],
    spawns: [['waterImp', 10], ['redOgre', 8], ['eightSerpent', 1]],
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
