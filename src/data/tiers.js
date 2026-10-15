// 승급(전직). tier 0 = 기본 직업
export const TIER_TITLES = {
  warrior: ['전사', '검객', '무장', '검성'],
  rogue: ['도적', '협객', '자객', '암왕'],
  mage: ['주술사', '술객', '대주술사', '천기술사'],
  priest: ['도사', '도인', '진인', '신선'],
};

// 승급하면 기본(레벨) 능력치에 곱해지는 배율
export const TIER_MULT = [1, 1.15, 1.3, 1.5];

// 다음 차수로 승급하는 조건과 기념 보상
export const ADVANCEMENTS = [
  {
    tier: 1, level: 15, gold: 2000,
    items: [['foxTail', 10]],
    reward: { warrior: 'dragonSword', rogue: 'shadowBlade', mage: 'phoenixStaff', priest: 'heavenFan' },
    speech: '여우의 날렵함을 몸에 익혔구나. 이제 한 단계 위의 길을 걷거라.',
  },
  {
    tier: 2, level: 30, gold: 20000,
    items: [['goblinHorn', 10], ['whiteFur', 5]],
    reward: { warrior: 'thunderSword', rogue: 'moonDagger', mage: 'starStaff', priest: 'skyFan' },
    speech: '도깨비와 장산범을 넘어선 자, 이제 한 고을을 지킬 그릇이 되었다.',
  },
  {
    tier: 3, level: 45, gold: 100000,
    items: [['imugiScale', 1], ['dueokHorn', 10], ['blueScale', 1], ['redScale', 1]],
    reward: { warrior: 'tortoiseSword', rogue: 'ghostDagger', mage: 'taegeukStaff', priest: 'phoenixFan' },
    speech: '이무기의 비늘까지 거둔 자여... 그대는 이제 전설의 경지에 올랐다.',
  },
];

export const titleOf = (cls, tier = 0) => TIER_TITLES[cls][tier] ?? TIER_TITLES[cls][0];
export const nextAdvancement = (tier = 0) => ADVANCEMENTS.find((a) => a.tier === tier + 1) ?? null;
