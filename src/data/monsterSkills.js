// 몬스터가 쓰는 기술. 모두 '예고'가 있어서 보고 피할 수 있다.
//  bolt   일직선으로 날아오는 탄(옆 칸으로 비키면 피한다)
//  slam   자기 둘레를 내려찍기(예고 범위 밖으로 나가면 피한다)
//  zone   플레이어가 있던 자리와 그 주변에 떨어지는 장판
//  cross  십자 모양으로 길게 베기
//  charge 일직선으로 돌진
//  heal   자기 체력 회복(체력이 절반 아래일 때)
//  summon 졸개 부르기
// windup: 예고 시간(ms), cd: 재사용 대기, power: 몬스터 공격력 배율, look: 그림 모양
export const MONSTER_SKILLS = {
  fireball: { kind: 'bolt', name: '불덩이', look: 'fire', color: '#ff7b2e', power: 1.2, range: 6, speed: 8, windup: 550, cd: 3200 },
  iceSpear: { kind: 'bolt', name: '얼음창', look: 'ice', color: '#9fe3ff', power: 1.15, range: 6, speed: 10, windup: 500, cd: 3000 },
  waterBall: { kind: 'bolt', name: '물대포', look: 'water', color: '#4fb3ff', power: 1.05, range: 6, speed: 7, windup: 550, cd: 2800 },
  darkOrb: { kind: 'bolt', name: '혼불', look: 'dark', color: '#b07bff', power: 1.25, range: 7, speed: 6.5, windup: 600, cd: 3400 },
  arrow: { kind: 'bolt', name: '화살', look: 'arrow', color: '#e8d6a8', power: 1, range: 7, speed: 13, windup: 450, cd: 2400 },
  spear: { kind: 'bolt', name: '창 던지기', look: 'spear', color: '#d5dbdb', power: 1.2, range: 5, speed: 11, windup: 500, cd: 3000 },

  slam: { kind: 'slam', name: '내려찍기', look: 'quake', color: '#ffb347', power: 1.6, radius: 1, windup: 900, cd: 6000 },
  quake: { kind: 'slam', name: '땅울림', look: 'quake', color: '#e0a060', power: 1.7, radius: 2, windup: 1100, cd: 7500 },
  frostNova: { kind: 'slam', name: '서리 폭발', look: 'ice', color: '#bfe9ff', power: 1.6, radius: 2, windup: 1000, cd: 7000 },

  meteor: { kind: 'zone', name: '불벼락', look: 'fire', color: '#ff5a1f', power: 1.8, count: 3, windup: 1150, cd: 7000 },
  hail: { kind: 'zone', name: '우박', look: 'ice', color: '#bfe9ff', power: 1.6, count: 4, windup: 1100, cd: 7000 },
  whirlpool: { kind: 'zone', name: '소용돌이', look: 'water', color: '#4fb3ff', power: 1.6, count: 3, windup: 1100, cd: 7000 },
  curseMark: { kind: 'zone', name: '저주 낙인', look: 'dark', color: '#b07bff', power: 1.9, count: 2, windup: 1200, cd: 7500 },

  cross: { kind: 'cross', name: '십자 베기', look: 'slash', color: '#ff6b6b', power: 1.7, length: 4, windup: 950, cd: 7000 },

  pounce: { kind: 'charge', name: '덮치기', look: 'dash', color: '#ffd166', power: 1.3, range: 3, windup: 600, cd: 5000 },
  charge: { kind: 'charge', name: '돌진', look: 'dash', color: '#ff9f43', power: 1.5, range: 5, windup: 700, cd: 6000 },

  regen: { kind: 'heal', name: '기운 회복', look: 'heal', color: '#7dff9b', pct: 0.15, windup: 900, cd: 12000 },
};

// 몬스터별 기술. 보스의 특수 공격(special)은 따로 자기 둘레 장판으로 바뀐다.
export const MONSTER_KITS = {
  fox: ['pounce'],
  wolf: ['charge'],
  goblin: ['slam'],
  boar: ['charge'],
  jangsanbeom: ['charge', 'slam'],
  waterGhost: ['waterBall'],
  snowWolf: ['charge', 'iceSpear'],
  dueok: ['slam', 'darkOrb'],
  bulgasari: ['quake', 'charge'],
  blackDragon: ['darkOrb', 'curseMark', 'cross', { summon: 'dueok', count: 2 }],
  blueGuardian: ['iceSpear', 'hail', 'cross'],
  redGuardian: ['fireball', 'meteor', 'cross'],
  zodiacRat: ['pounce'],
  zodiacOx: ['charge', 'quake'],
  zodiacTiger: ['pounce', 'cross'],
  zodiacGeneral: ['spear', 'cross', 'meteor', { summon: 'zodiacRat', count: 3 }],
  fishSoldier: ['spear'],
  turtleGeneral: ['quake', 'waterBall', 'regen'],
  seaDragon: ['waterBall', 'whirlpool', 'cross', { summon: 'fishSoldier', count: 2 }],
  yeti: ['quake', 'iceSpear'],
  iceSpirit: ['iceSpear', 'frostNova'],
  iceDragon: ['iceSpear', 'hail', 'frostNova', 'cross'],
  waterImp: ['waterBall'],
  redOgre: ['slam', 'charge'],
  eightSerpent: ['darkOrb', 'curseMark', 'cross', 'regen'],
  fireLizard: ['fireball'],
  flameSpirit: ['fireball', 'meteor'],
  firebird: ['fireball', 'meteor', 'cross', { summon: 'flameSpirit', count: 2 }],
  gumiho: ['darkOrb', 'pounce', 'curseMark', 'regen', { summon: 'fox', count: 3 }],
  imugi: ['waterBall', 'whirlpool', 'quake', 'regen'],
  sewerRat: ['pounce'],
  ratKing: ['slam', { summon: 'rat', count: 3 }],
  viper: ['pounce'],
  whiteSnake: ['pounce'],
  greatSnake: ['pounce', 'quake', 'regen'],
  forestPig: ['charge'],
  pigKing: ['charge', 'quake', { summon: 'wildPig', count: 2 }],
  skeletonSword: ['slam'],
  skeletonArcher: ['arrow'],
  skeletonGeneral: ['cross', 'arrow', { summon: 'skeleton', count: 3 }],
  eggGhost: ['curseMark'],
  maidenGhost: ['darkOrb'],
  bachelorGhost: ['darkOrb', 'curseMark'],
  grudgeLord: ['darkOrb', 'curseMark', 'cross', { summon: 'eggGhost', count: 3 }],
};

/** 몬스터 종류의 기술 목록: [{ id, ...정의 }] (졸개 부르기는 id 'summon') */
export function kitOf(type, special) {
  const kit = (MONSTER_KITS[type] ?? []).map((entry) => (typeof entry === 'string'
    ? { id: entry, ...MONSTER_SKILLS[entry] }
    : { id: 'summon', kind: 'summon', name: '졸개 부르기', look: 'summon', color: '#ffe066', minion: entry.summon, count: entry.count, windup: 900, cd: 16000 }));
  if (special) {
    // 보스 특수 공격: 보스 바로 둘레(1칸)는 안전한 도넛 모양. 멀리 피하거나 품으로 파고들면 안 맞는다
    kit.unshift({ id: 'special', kind: 'slam', name: special.name, look: 'nova', color: special.color, power: special.power, radius: Math.min(4, special.radius), safe: 1, windup: 1400, cd: Math.max(5000, special.cd) });
  }
  return kit;
}

/** 원거리로 싸우는(탄을 주로 쓰는) 몬스터: 붙지 않고 줄을 맞춰 쏜다 */
export const isRanged = (type) => {
  const first = MONSTER_KITS[type]?.[0];
  return typeof first === 'string' && MONSTER_SKILLS[first].kind === 'bolt';
};
