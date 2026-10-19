// 더 많은 장비: 방패·보조(2칸)·반지·투구·목걸이·갑옷, 직업별 중간 무기. items.js 의 ITEMS 에 합쳐진다.
// 능력치는 같은 레벨대 기존 장비와 맞춘다(용 무기·승급 보상보다 약하게).
export const MORE_GEAR = {
  // ── 방패: 모든 직업 ──
  woodShield: { name: '등패', icon: '🛡️', type: 'shield', def: 2, level: 3, price: 150 },
  leatherShield: { name: '피패', icon: '🛡️', type: 'shield', def: 4, hp: 15, level: 8, price: 700 },
  ironShield: { name: '철패', icon: '🛡️', type: 'shield', def: 7, hp: 30, level: 14, price: 2400 },
  mirrorShield: { name: '동경패', icon: '🪞', type: 'shield', def: 4, mag: 6, mp: 40, level: 16, price: 3600 },
  turtleShield: { name: '귀갑패', icon: '🐢', type: 'shield', def: 12, hp: 60, level: 20, tier: 1, price: 16000 },
  ghostFaceShield: { name: '귀면패', icon: '👹', type: 'shield', def: 18, hp: 100, atk: 4, level: 30, tier: 2, price: 45000 },
  blackTortoiseShield: { name: '현무패', icon: '🐢', type: 'shield', def: 26, hp: 180, mp: 40, level: 45, tier: 3, price: 150000 },

  // ── 보조: 두 칸에 하나씩 ──
  luckyPouch: { name: '복주머니', icon: '👛', type: 'aux', hp: 15, level: 1, price: 100 },
  paperCharm: { name: '황지부', icon: '🧧', type: 'aux', def: 2, mp: 10, level: 5, price: 300 },
  gourdBottle: { name: '호리병', icon: '🏺', type: 'aux', mag: 2, mp: 40, level: 10, price: 1200 },
  spiritBell: { name: '신령 방울', icon: '🔔', type: 'aux', atk: 3, crit: 0.02, level: 12, price: 1500 },
  incensePouch: { name: '향낭', icon: '🎒', type: 'aux', hp: 60, def: 3, level: 16, price: 3000 },
  tigerClaw: { name: '호랑이 발톱', icon: '🐾', type: 'aux', atk: 8, crit: 0.03, level: 22, price: 9000 },
  bronzeMirror: { name: '청동 거울', icon: '🪞', type: 'aux', mag: 9, mcrit: 0.03, level: 26, price: 12000 },
  thunderCharm: { name: '뇌전 부적', icon: '⚡', type: 'aux', atk: 8, mag: 8, cdr: 0.03, level: 32, price: 25000 },
  jadeTablet: { name: '옥패', icon: '🟩', type: 'aux', hp: 150, mp: 80, def: 6, level: 40, price: 50000 },
  foxTailCharm: { name: '구미호 꼬리', icon: '🦊', type: 'aux', atk: 14, mag: 14, crit: 0.05, level: 45, tier: 3, price: 120000 },

  // ── 반지 ──
  ironRing: { name: '쇠가락지', icon: '💍', type: 'ring', def: 3, level: 5, price: 300 },
  rubyRing: { name: '홍옥 가락지', icon: '💍', type: 'ring', atk: 5, hp: 80, level: 18, price: 6000 },
  obsidianRing: { name: '흑요석 가락지', icon: '💍', type: 'ring', atk: 9, pen: 0.04, level: 24, price: 14000 },
  sapphireRing: { name: '청옥 가락지', icon: '💍', type: 'ring', mag: 10, mcrit: 0.03, level: 24, price: 14000 },
  moonstoneRing: { name: '월장석 가락지', icon: '💍', type: 'ring', mag: 14, mp: 100, cdr: 0.03, level: 36, price: 35000 },
  whiteTigerRing: { name: '백호 가락지', icon: '🐯', type: 'ring', atk: 18, crit: 0.06, level: 38, tier: 2, price: 45000 },

  // ── 투구 ──
  headband: { name: '두건', icon: '🧣', type: 'helmet', def: 2, hp: 10, level: 3, price: 120 },
  paeraengi: { name: '패랭이', icon: '👒', type: 'helmet', def: 4, mp: 15, level: 10, price: 800 },
  jeonrip: { name: '전립', icon: '🎩', type: 'helmet', def: 9, hp: 30, level: 18, price: 5000 },
  heukrip: { name: '흑립', icon: '🎩', type: 'helmet', def: 8, mag: 6, mp: 40, level: 24, price: 9000 },
  eagleHelm: { name: '매깃 투구', icon: '🪖', type: 'helmet', def: 15, hp: 60, atk: 4, level: 36, price: 30000 },

  // ── 목걸이 ──
  boneNecklace: { name: '뼈 목걸이', icon: '📿', type: 'necklace', atk: 2, hp: 10, level: 4, price: 250, gem: '#e8e0d0' },
  tigerToothNecklace: { name: '범이빨 목걸이', icon: '📿', type: 'necklace', atk: 6, hp: 60, level: 20, price: 7000, gem: '#f5f0e0' },
  jadeNecklace: { name: '비취 목걸이', icon: '📿', type: 'necklace', mag: 6, mp: 80, level: 24, price: 12000, gem: '#3fd18a' },
  moonNorigae: { name: '달빛 노리개', icon: '🌙', type: 'necklace', hp: 200, mp: 100, def: 6, cdr: 0.02, level: 36, price: 32000, gem: '#c9d6ff' },

  // ── 더 많은 장신구: 레벨대마다 쓰임이 다른 것(공격·술력·체력·치명·관통·쿨감)을 고루. 대부분 그 지역 몬스터가 떨군다 ──
  grassRing: { name: '풀꽃 가락지', icon: '💍', type: 'ring', hp: 12, mp: 6, level: 1, price: 60 },
  amethystRing: { name: '자수정 가락지', icon: '💍', type: 'ring', mag: 6, mp: 30, level: 11, price: 1800 },
  goblinRing: { name: '도깨비 가락지', icon: '💍', type: 'ring', atk: 6, hp: 40, crit: 0.02, level: 13, price: 3500 },
  snakeEyeRing: { name: '뱀눈 가락지', icon: '💍', type: 'ring', atk: 5, pen: 0.03, level: 15, price: 4000 },
  frostRing: { name: '서리 가락지', icon: '💍', type: 'ring', mag: 13, mp: 60, mcrit: 0.03, level: 32, price: 26000 },
  blackDragonRing: { name: '흑룡 가락지', icon: '💍', type: 'ring', atk: 24, def: 10, hp: 150, pen: 0.05, level: 50, tier: 2, price: 120000 },
  skullRing: { name: '해골 가락지', icon: '💀', type: 'ring', atk: 40, crit: 0.04, pen: 0.07, level: 58, tier: 3, price: 280000 },
  zodiacRing: { name: '십이지 가락지', icon: '💍', type: 'ring', atk: 38, mag: 38, cdr: 0.05, level: 68, tier: 3, price: 650000 },
  seaPearlRing: { name: '해룡 진주 가락지', icon: '💍', type: 'ring', mag: 70, mp: 300, mcrit: 0.06, level: 80, tier: 3, price: 1800000 },
  grudgeRing: { name: '원귀 가락지', icon: '👻', type: 'ring', atk: 80, mag: 80, crit: 0.12, pen: 0.08, level: 95, tier: 3, price: 6000000 },

  wolfFangNecklace: { name: '늑대이빨 목걸이', icon: '📿', type: 'necklace', atk: 4, hp: 30, level: 9, price: 1200, gem: '#f0ead8' },
  knotNorigae: { name: '매듭 노리개', icon: '🎀', type: 'necklace', mag: 3, mp: 50, level: 10, price: 1500, gem: '#e05a7a' },
  snakeScaleNecklace: { name: '뱀비늘 목걸이', icon: '📿', type: 'necklace', def: 5, hp: 90, level: 18, price: 5000, gem: '#6aa84f' },
  vajraBeads: { name: '금강 염주', icon: '📿', type: 'necklace', hp: 160, mp: 60, def: 8, level: 28, price: 22000, gem: '#8a5a2a' },
  frostNecklace: { name: '빙정 목걸이', icon: '❄️', type: 'necklace', mag: 10, mp: 130, mcrit: 0.02, level: 34, price: 30000, gem: '#bfe8ff' },
  boarKingNecklace: { name: '돼지대왕 엄니 목걸이', icon: '📿', type: 'necklace', atk: 12, hp: 260, def: 8, level: 42, price: 60000, gem: '#f4ecd8' },
  skullBeads: { name: '해골 염주', icon: '📿', type: 'necklace', atk: 22, mag: 22, hp: 400, pen: 0.04, level: 62, tier: 3, price: 380000, gem: '#e8e0d0' },
  iceHeartNecklace: { name: '빙심 목걸이', icon: '❄️', type: 'necklace', mag: 40, hp: 400, mp: 500, mcrit: 0.05, level: 82, tier: 3, price: 2200000, gem: '#9fdcff' },
  flameNorigae: { name: '화염 노리개', icon: '🔥', type: 'necklace', atk: 40, mag: 40, hp: 900, mp: 400, def: 30, level: 96, tier: 3, price: 7000000, gem: '#ff6a2a' },

  woodTag: { name: '나무패', icon: '🪵', type: 'aux', def: 1, hp: 20, level: 3, price: 150 },
  rabbitFoot: { name: '토끼발', icon: '🐇', type: 'aux', hp: 10, crit: 0.02, level: 6, price: 600 },
  snakeShed: { name: '뱀 허물', icon: '🐍', type: 'aux', def: 3, mp: 30, pen: 0.02, level: 14, price: 2500 },
  boarTuskCharm: { name: '엄니 부적', icon: '🐗', type: 'aux', atk: 6, hp: 50, level: 19, price: 6000 },
  eagleFeather: { name: '수리 깃', icon: '🪶', type: 'aux', atk: 8, crit: 0.03, cdr: 0.02, level: 28, price: 18000 },
  iceJade: { name: '빙옥', icon: '🧊', type: 'aux', mag: 12, mp: 70, mcrit: 0.03, level: 36, price: 32000 },
  dragonScaleCharm: { name: '흑룡 역린', icon: '🐉', type: 'aux', atk: 14, def: 10, hp: 150, cdr: 0.03, level: 50, tier: 2, price: 120000 },
  zodiacCharm: { name: '십이지 부적', icon: '🧧', type: 'aux', atk: 20, mag: 20, def: 10, cdr: 0.04, level: 60, tier: 3, price: 320000 },
  turtleShellCharm: { name: '거북 등딱지', icon: '🐢', type: 'aux', def: 30, hp: 500, level: 70, tier: 3, price: 700000 },
  firebirdFeatherCharm: { name: '주작 깃 부적', icon: '🔥', type: 'aux', atk: 50, mag: 50, crit: 0.08, mcrit: 0.06, cdr: 0.08, level: 97, tier: 3, price: 8000000 },

  // ── 갑옷 ──
  hunterVest: { name: '사냥꾼 배자', icon: '🦺', type: 'armor', def: 5, atk: 2, level: 8, price: 600, trim: { d: '#5a4a2a', w: '#c8a26a' } },
  monkRobe: { name: '승복', icon: '👘', type: 'armor', def: 8, mag: 4, mp: 40, level: 16, price: 3500, trim: { d: '#7a7a7a', w: '#e0dcd0' } },
  scaleArmor: { name: '어린갑', icon: '🥋', type: 'armor', def: 18, hp: 50, level: 22, price: 9000, trim: { d: '#3a5a4a', w: '#a8c8b0' } },
  cloudRobe: { name: '운문 도포', icon: '☁️', type: 'armor', def: 24, hp: 90, mp: 70, mag: 6, level: 35, price: 30000, trim: { d: '#e8eef8', w: '#7a9ac8' } },

  // ── 직업별 중간 무기(Lv4 · Lv18 · Lv24 · Lv38 2차) ──
  bronzeSword: { name: '청동검', icon: '🗡️', type: 'weapon', wtype: 'sword', atk: 6, level: 4, price: 250, tint: '#c8913a' },
  hwando: { name: '환도', icon: '🗡️', type: 'weapon', wtype: 'sword', atk: 24, level: 18, price: 6000, tint: '#e0e6ea' },
  blackIronSword: { name: '흑철대검', icon: '🗡️', type: 'weapon', wtype: 'sword', atk: 30, hp: 30, level: 24, price: 12000, tint: '#4a4f55' },
  moonlightSword: { name: '월광검', icon: '🌙', type: 'weapon', wtype: 'sword', atk: 56, hp: 100, level: 38, tier: 2, price: 90000, tint: '#d8e4ff' },
  boneDagger: { name: '골도', icon: '🔪', type: 'weapon', wtype: 'dagger', atk: 6, level: 4, price: 250, tint: '#e8e0d0' },
  poisonDagger: { name: '독비수', icon: '🔪', type: 'weapon', wtype: 'dagger', atk: 21, crit: 0.04, level: 18, price: 6000, tint: '#6ad07a' },
  twinFang: { name: '쌍아도', icon: '🔪', type: 'weapon', wtype: 'dagger', atk: 28, crit: 0.05, level: 24, price: 12000, tint: '#c0c8d0' },
  blackNightDagger: { name: '흑야도', icon: '🌑', type: 'weapon', wtype: 'dagger', atk: 52, crit: 0.07, level: 38, tier: 2, price: 90000, tint: '#3a2a5a' },
  pineStaff: { name: '송목장', icon: '🪄', type: 'weapon', wtype: 'staff', atk: 1, mag: 7, level: 4, price: 250, tint: '#6aa84f' },
  skullStaff: { name: '백골장', icon: '💀', type: 'weapon', wtype: 'staff', atk: 4, mag: 24, level: 18, price: 6000, tint: '#e8e0d0' },
  thunderStaff: { name: '뇌정장', icon: '⚡', type: 'weapon', wtype: 'staff', atk: 5, mag: 30, mp: 30, level: 24, price: 12000, tint: '#ffe066' },
  moonlightStaff: { name: '월광장', icon: '🌙', type: 'weapon', wtype: 'staff', atk: 10, mag: 58, level: 38, tier: 2, price: 90000, tint: '#d8e4ff' },
  bambooFan: { name: '죽선', icon: '🎐', type: 'weapon', wtype: 'fan', atk: 3, mag: 5, level: 4, price: 250, tint: '#a8c870' },
  peacockFan: { name: '공작선', icon: '🦚', type: 'weapon', wtype: 'fan', atk: 8, mag: 20, level: 18, price: 6000, tint: '#3ab0a0' },
  snowFlowerFan: { name: '설화선', icon: '❄️', type: 'weapon', wtype: 'fan', atk: 10, mag: 26, mp: 30, level: 24, price: 12000, tint: '#e0f4ff' },
  moonlightFan: { name: '월광선', icon: '🌙', type: 'weapon', wtype: 'fan', atk: 18, mag: 54, level: 38, tier: 2, price: 90000, tint: '#d8e4ff' },
};
