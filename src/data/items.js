// type: consume | weapon | armor | helmet | necklace | ring | loot
// tint: 무기 날/보주 색, trim: 갑옷을 입었을 때 옷 테두리 색, gem: 목걸이 구슬 색 (캐릭터 그림에 반영)
export const ITEMS = {
  herb: { name: '약초', icon: '🌿', type: 'consume', restore: { hp: 50 }, price: 12, desc: '체력을 50 회복한다.' },
  bigHerb: { name: '산삼', icon: '🥕', type: 'consume', restore: { hp: 200 }, price: 70, desc: '체력을 200 회복한다.' },
  dew: { name: '이슬', icon: '💧', type: 'consume', restore: { mp: 30 }, price: 15, desc: '마력을 30 회복한다.' },
  bigDew: { name: '감로수', icon: '🍶', type: 'consume', restore: { mp: 120 }, price: 80, desc: '마력을 120 회복한다.' },
  elixir: { name: '영약', icon: '✨', type: 'consume', restore: { hp: 99999, mp: 99999 }, price: 500, desc: '체력과 마력을 모두 회복한다.' },
  returnScroll: { name: '귀환서', icon: '📜', type: 'consume', effect: 'return', price: 40, desc: '청풍촌으로 돌아간다.' },

  woodSword: { name: '목검', icon: '🗡️', type: 'weapon', wtype: 'sword', atk: 3, level: 1, price: 60, tint: '#c8a26a' },
  ironSword: { name: '철검', icon: '🗡️', type: 'weapon', wtype: 'sword', atk: 10, level: 8, price: 600, tint: '#d5dbdb' },
  steelSword: { name: '강철검', icon: '🗡️', type: 'weapon', wtype: 'sword', atk: 18, level: 14, price: 2500, tint: '#eef6ff' },
  thunderSword: { name: '뇌신검', icon: '⚡', type: 'weapon', wtype: 'sword', atk: 48, hp: 80, level: 30, tier: 2, price: 60000, tint: '#ffe066' },
  tortoiseSword: { name: '현무천검', icon: '🐢', type: 'weapon', wtype: 'sword', atk: 72, hp: 150, level: 45, tier: 3, price: 200000, tint: '#7ee0c3' },
  dragonSword: { name: '청룡검', icon: '🐉', type: 'weapon', wtype: 'sword', atk: 32, hp: 50, level: 20, tier: 1, price: 20000, tint: '#5dd6c0' },

  dagger: { name: '단검', icon: '🔪', type: 'weapon', wtype: 'dagger', atk: 3, level: 1, price: 60, tint: '#d5dbdb' },
  ironDagger: { name: '비수', icon: '🔪', type: 'weapon', wtype: 'dagger', atk: 9, level: 8, price: 600, tint: '#e5e8e8' },
  steelDagger: { name: '쌍월도', icon: '🔪', type: 'weapon', wtype: 'dagger', atk: 16, level: 14, price: 2500, tint: '#aed6f1' },
  moonDagger: { name: '월영도', icon: '🌙', type: 'weapon', wtype: 'dagger', atk: 44, crit: 0.05, level: 30, tier: 2, price: 60000, tint: '#c9d6ff' },
  ghostDagger: { name: '귀영비수', icon: '👻', type: 'weapon', wtype: 'dagger', atk: 66, crit: 0.08, level: 45, tier: 3, price: 200000, tint: '#b8a6ff' },
  shadowBlade: { name: '흑풍도', icon: '🌪️', type: 'weapon', wtype: 'dagger', atk: 28, level: 20, tier: 1, price: 20000, tint: '#8e44ad' },

  woodStaff: { name: '나무지팡이', icon: '🪄', type: 'weapon', wtype: 'staff', atk: 1, mag: 4, level: 1, price: 60, tint: '#82e0aa' },
  jadeStaff: { name: '옥지팡이', icon: '🪄', type: 'weapon', wtype: 'staff', atk: 2, mag: 10, level: 8, price: 600, tint: '#48c9b0' },
  spiritStaff: { name: '영혼지팡이', icon: '🪄', type: 'weapon', wtype: 'staff', atk: 3, mag: 18, level: 14, price: 2500, tint: '#a569bd' },
  starStaff: { name: '성수장', icon: '🌟', type: 'weapon', wtype: 'staff', atk: 8, mag: 48, level: 30, tier: 2, price: 60000, tint: '#ffd1f0' },
  taegeukStaff: { name: '태극신장', icon: '☯️', type: 'weapon', wtype: 'staff', atk: 12, mag: 74, level: 45, tier: 3, price: 200000, tint: '#ff5e5e' },
  phoenixStaff: { name: '주작장', icon: '🔥', type: 'weapon', wtype: 'staff', atk: 5, mag: 32, level: 20, tier: 1, price: 20000, tint: '#ff6b3d' },

  paperFan: { name: '한지부채', icon: '🎐', type: 'weapon', wtype: 'fan', atk: 2, mag: 3, level: 1, price: 60, tint: '#fdfefe' },
  craneFan: { name: '학선', icon: '🎐', type: 'weapon', wtype: 'fan', atk: 4, mag: 8, level: 8, price: 600, tint: '#d6eaf8' },
  cloudFan: { name: '운선', icon: '🎐', type: 'weapon', wtype: 'fan', atk: 6, mag: 15, level: 14, price: 2500, tint: '#a9cce3' },
  skyFan: { name: '비천선', icon: '🪶', type: 'weapon', wtype: 'fan', atk: 14, mag: 44, level: 30, tier: 2, price: 60000, tint: '#bff5e6' },
  phoenixFan: { name: '봉황선', icon: '🦚', type: 'weapon', wtype: 'fan', atk: 22, mag: 68, level: 45, tier: 3, price: 200000, tint: '#ffc94d' },
  heavenFan: { name: '천도선', icon: '☁️', type: 'weapon', wtype: 'fan', atk: 10, mag: 28, level: 20, tier: 1, price: 20000, tint: '#f9e79f' },

  cottonRobe: { name: '무명옷', icon: '👘', type: 'armor', def: 2, level: 1, price: 50 },
  leatherArmor: { name: '가죽갑옷', icon: '🥋', type: 'armor', def: 6, level: 6, price: 400, trim: { d: '#6b4423', w: '#e0c08a' } },
  chainArmor: { name: '사슬갑옷', icon: '🥋', type: 'armor', def: 12, hp: 30, level: 12, price: 1800, trim: { d: '#566573', w: '#d5dbdb' } },
  ironArmor: { name: '철갑옷', icon: '🛡️', type: 'armor', def: 20, hp: 60, level: 18, tier: 1, price: 6000, trim: { d: '#2c3e50', w: '#f4d03f' }, shoulder: '#aab7b8' },

  heavenRobe: { name: '천의무봉', icon: '👘', type: 'armor', def: 48, hp: 250, mp: 80, level: 45, tier: 3, price: 150000, trim: { d: '#f4f6ff', w: '#ffd166' }, shoulder: '#ffffff' },
  dragonArmor: { name: '용린갑', icon: '🐲', type: 'armor', def: 32, hp: 120, level: 30, tier: 2, price: 30000, trim: { d: '#1e6b52', w: '#f4d03f' }, shoulder: '#3fa37a' },
  strawHat: { name: '삿갓', icon: '👒', type: 'helmet', def: 1, level: 1, price: 30 },
  leatherCap: { name: '가죽모자', icon: '🧢', type: 'helmet', def: 3, level: 6, price: 250 },
  ironHelm: { name: '철투구', icon: '⛑️', type: 'helmet', def: 7, level: 14, price: 1500 },

  phoenixCrown: { name: '봉황관', icon: '👑', type: 'helmet', def: 18, hp: 80, mp: 40, level: 45, tier: 3, price: 120000 },
  dragonHelm: { name: '용두투구', icon: '🪖', type: 'helmet', def: 12, hp: 40, level: 30, tier: 2, price: 12000 },
  beadNecklace: { name: '나무염주', icon: '📿', type: 'necklace', hp: 20, level: 1, price: 120, gem: '#a0612b' },
  amberNecklace: { name: '호박 목걸이', icon: '📿', type: 'necklace', hp: 50, def: 2, level: 6, price: 600, gem: '#f0a030' },
  pearlNecklace: { name: '진주 목걸이', icon: '📿', type: 'necklace', hp: 80, mp: 40, level: 12, price: 2400, gem: '#fdfefe' },
  dragonPearl: { name: '용주 목걸이', icon: '🟢', type: 'necklace', hp: 260, mp: 100, def: 8, level: 30, tier: 2, price: 40000, gem: '#3fd18a' },
  yeouiNorigae: { name: '여의주 노리개', icon: '🔴', type: 'necklace', hp: 420, mp: 180, def: 14, level: 45, tier: 3, price: 160000, gem: '#ff5e5e' },
  norigae: { name: '청풍 노리개', icon: '🎀', type: 'necklace', hp: 150, mp: 60, def: 4, level: 16, tier: 1, price: 9000, gem: '#5dd6c0' },

  copperRing: { name: '구리 반지', icon: '💍', type: 'ring', atk: 2, level: 3, price: 200 },
  jadeRing: { name: '옥가락지', icon: '💍', type: 'ring', mag: 5, mp: 20, level: 8, price: 800 },
  silverRing: { name: '은가락지', icon: '💍', type: 'ring', atk: 4, crit: 0.03, level: 8, price: 800 },
  goldRing: { name: '금가락지', icon: '💍', type: 'ring', atk: 7, mag: 7, level: 14, price: 3000 },
  blueDragonRing: { name: '청룡 가락지', icon: '💠', type: 'ring', atk: 16, mag: 16, crit: 0.06, level: 30, tier: 2, price: 40000 },
  heavenRing: { name: '천상 가락지', icon: '🌟', type: 'ring', atk: 26, mag: 26, crit: 0.1, level: 45, tier: 3, price: 160000 },
  foxRing: { name: '여우불 가락지', icon: '💎', type: 'ring', atk: 10, mag: 10, crit: 0.05, level: 18, tier: 1, price: 15000 },

  acorn: { name: '도토리', icon: '🌰', type: 'loot', price: 4, desc: '다람쥐가 모아둔 도토리.' },
  rabbitFur: { name: '토끼털', icon: '🧶', type: 'loot', price: 8, desc: '부드러운 토끼털.' },
  foxTail: { name: '여우꼬리', icon: '🦊', type: 'loot', price: 30, desc: '복슬복슬한 여우꼬리.' },
  wolfFang: { name: '늑대이빨', icon: '🦷', type: 'loot', price: 50, desc: '날카로운 늑대이빨.' },
  goblinHorn: { name: '도깨비뿔', icon: '📯', type: 'loot', price: 120, desc: '단단한 도깨비뿔.' },
  boarTusk: { name: '멧돼지 엄니', icon: '🦴', type: 'loot', price: 90, desc: '휘어진 멧돼지 엄니.' },
  whiteFur: { name: '장산범 털', icon: '🤍', type: 'loot', price: 180, desc: '눈처럼 흰 장산범의 털.' },
  ghostBead: { name: '물귀신 구슬', icon: '🫧', type: 'loot', price: 200, desc: '늘 축축한 푸른 구슬.' },
  imugiScale: { name: '이무기 비늘', icon: '🐉', type: 'loot', price: 8000, desc: '용이 되지 못한 이무기의 비늘.' },
  snowPelt: { name: '눈늑대 가죽', icon: '🐺', type: 'loot', price: 300, desc: '서리가 맺힌 흰 가죽.' },
  dueokHorn: { name: '두억시니 뿔', icon: '😈', type: 'loot', price: 500, desc: '검붉은 두억시니의 뿔.' },
  ironScale: { name: '불가사리 쇳조각', icon: '⚙️', type: 'loot', price: 700, desc: '쇠를 먹는 불가사리 몸에서 떨어진 조각.' },
  dragonOrb: { name: '흑룡의 여의주', icon: '⚫', type: 'loot', price: 50000, desc: '흑룡이 품고 있던 검은 여의주.' },
  foxBead: { name: '여우구슬', icon: '🔮', type: 'loot', price: 3000, desc: '구미호가 품고 있던 신비한 구슬.' },
};

export const EQUIP_SLOTS = ['weapon', 'helmet', 'armor', 'necklace', 'ring'];
export const SLOT_LABELS = { weapon: '무기', helmet: '투구', armor: '갑옷', necklace: '목걸이', ring: '반지' };
export const SLOT_ICONS = { weapon: '⚔️', helmet: '🎩', armor: '👕', necklace: '📿', ring: '💍' };
export const STAT_LABELS = { atk: '공격', def: '방어', mag: '술력', hp: '체력', mp: '마력', crit: '치명' };
export const WEAPON_CLASS = { sword: '전사', dagger: '도적', staff: '주술사', fan: '도사' };

export const isStackable = (id) => ['consume', 'loot'].includes(ITEMS[id]?.type);
export const isEquipment = (id) => EQUIP_SLOTS.includes(ITEMS[id]?.type);
export const sellPrice = (id) => Math.floor((ITEMS[id]?.price ?? 0) / 2);

const statValue = (key, v) => (key === 'crit' ? `${Math.round(v * 100)}%` : v);

export function itemStatText(id) {
  const it = ITEMS[id];
  if (!it) return '';
  if (it.desc) return it.desc;
  const parts = Object.keys(STAT_LABELS).filter((k) => it[k]).map((k) => `${STAT_LABELS[k]} +${statValue(k, it[k])}`);
  const who = it.wtype ? ` · ${WEAPON_CLASS[it.wtype]} 전용` : '';
  const tier = it.tier ? ` · ${it.tier}차` : '';
  return `${parts.join(' · ')} (Lv.${it.level}${tier}${who})`;
}
