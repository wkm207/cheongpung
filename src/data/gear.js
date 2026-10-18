// 더 많은 장비: 방패·보조(2칸)·반지·투구·목걸이·갑옷, 직업별 중간 무기. items.js 의 ITEMS 에 합쳐진다.
// 능력치는 같은 레벨대 기존 장비와 맞춘다(용 무기·승급 보상보다 약하게).
export const MORE_GEAR = {
  // ── 방패: 모든 직업 ──
  woodShield: { name: '나무 방패', icon: '🛡️', type: 'shield', def: 2, level: 3, price: 150 },
  leatherShield: { name: '가죽 방패', icon: '🛡️', type: 'shield', def: 4, hp: 15, level: 8, price: 700 },
  ironShield: { name: '철 방패', icon: '🛡️', type: 'shield', def: 7, hp: 30, level: 14, price: 2400 },
  mirrorShield: { name: '구리거울 방패', icon: '🪞', type: 'shield', def: 4, mag: 6, mp: 40, level: 16, price: 3600 },
  turtleShield: { name: '거북등 방패', icon: '🐢', type: 'shield', def: 12, hp: 60, level: 20, tier: 1, price: 16000 },
  ghostFaceShield: { name: '귀면 방패', icon: '👹', type: 'shield', def: 18, hp: 100, atk: 4, level: 30, tier: 2, price: 45000 },
  blackTortoiseShield: { name: '현무 방패', icon: '🐢', type: 'shield', def: 26, hp: 180, mp: 40, level: 45, tier: 3, price: 150000 },

  // ── 보조: 두 칸에 하나씩 ──
  luckyPouch: { name: '복주머니', icon: '👛', type: 'aux', hp: 15, level: 1, price: 100 },
  paperCharm: { name: '종이 부적', icon: '🧧', type: 'aux', def: 2, mp: 10, level: 5, price: 300 },
  gourdBottle: { name: '호리병', icon: '🏺', type: 'aux', mag: 2, mp: 40, level: 10, price: 1200 },
  spiritBell: { name: '방울', icon: '🔔', type: 'aux', atk: 3, crit: 0.02, level: 12, price: 1500 },
  incensePouch: { name: '향낭', icon: '🎒', type: 'aux', hp: 60, def: 3, level: 16, price: 3000 },
  tigerClaw: { name: '범 발톱', icon: '🐾', type: 'aux', atk: 8, crit: 0.03, level: 22, price: 9000 },
  bronzeMirror: { name: '청동 거울', icon: '🪞', type: 'aux', mag: 9, mcrit: 0.03, level: 26, price: 12000 },
  thunderCharm: { name: '뇌전 부적', icon: '⚡', type: 'aux', atk: 8, mag: 8, cdr: 0.03, level: 32, price: 25000 },
  jadeTablet: { name: '옥패', icon: '🟩', type: 'aux', hp: 150, mp: 80, def: 6, level: 40, price: 50000 },
  foxTailCharm: { name: '구미호 꼬리 장식', icon: '🦊', type: 'aux', atk: 14, mag: 14, crit: 0.05, level: 45, tier: 3, price: 120000 },

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

  // ── 갑옷 ──
  hunterVest: { name: '사냥꾼 조끼', icon: '🦺', type: 'armor', def: 5, atk: 2, level: 8, price: 600, trim: { d: '#5a4a2a', w: '#c8a26a' } },
  monkRobe: { name: '승복', icon: '👘', type: 'armor', def: 8, mag: 4, mp: 40, level: 16, price: 3500, trim: { d: '#7a7a7a', w: '#e0dcd0' } },
  scaleArmor: { name: '비늘갑옷', icon: '🥋', type: 'armor', def: 18, hp: 50, level: 22, price: 9000, trim: { d: '#3a5a4a', w: '#a8c8b0' } },
  cloudRobe: { name: '구름 도포', icon: '☁️', type: 'armor', def: 24, hp: 90, mp: 70, mag: 6, level: 35, price: 30000, trim: { d: '#e8eef8', w: '#7a9ac8' } },

  // ── 직업별 중간 무기(Lv4 · Lv18 · Lv24 · Lv38 2차) ──
  bronzeSword: { name: '청동검', icon: '🗡️', type: 'weapon', wtype: 'sword', atk: 6, level: 4, price: 250, tint: '#c8913a' },
  hwando: { name: '환도', icon: '🗡️', type: 'weapon', wtype: 'sword', atk: 24, level: 18, price: 6000, tint: '#e0e6ea' },
  blackIronSword: { name: '흑철 대검', icon: '🗡️', type: 'weapon', wtype: 'sword', atk: 30, hp: 30, level: 24, price: 12000, tint: '#4a4f55' },
  moonlightSword: { name: '월광검', icon: '🌙', type: 'weapon', wtype: 'sword', atk: 56, hp: 100, level: 38, tier: 2, price: 90000, tint: '#d8e4ff' },
  boneDagger: { name: '뼈단도', icon: '🔪', type: 'weapon', wtype: 'dagger', atk: 6, level: 4, price: 250, tint: '#e8e0d0' },
  poisonDagger: { name: '독비수', icon: '🔪', type: 'weapon', wtype: 'dagger', atk: 21, crit: 0.04, level: 18, price: 6000, tint: '#6ad07a' },
  twinFang: { name: '쌍아도', icon: '🔪', type: 'weapon', wtype: 'dagger', atk: 28, crit: 0.05, level: 24, price: 12000, tint: '#c0c8d0' },
  blackNightDagger: { name: '흑야도', icon: '🌑', type: 'weapon', wtype: 'dagger', atk: 52, crit: 0.07, level: 38, tier: 2, price: 90000, tint: '#3a2a5a' },
  pineStaff: { name: '소나무 지팡이', icon: '🪄', type: 'weapon', wtype: 'staff', atk: 1, mag: 7, level: 4, price: 250, tint: '#6aa84f' },
  skullStaff: { name: '해골 지팡이', icon: '💀', type: 'weapon', wtype: 'staff', atk: 4, mag: 24, level: 18, price: 6000, tint: '#e8e0d0' },
  thunderStaff: { name: '뇌정장', icon: '⚡', type: 'weapon', wtype: 'staff', atk: 5, mag: 30, mp: 30, level: 24, price: 12000, tint: '#ffe066' },
  moonlightStaff: { name: '월광장', icon: '🌙', type: 'weapon', wtype: 'staff', atk: 10, mag: 58, level: 38, tier: 2, price: 90000, tint: '#d8e4ff' },
  bambooFan: { name: '대나무 부채', icon: '🎐', type: 'weapon', wtype: 'fan', atk: 3, mag: 5, level: 4, price: 250, tint: '#a8c870' },
  peacockFan: { name: '공작선', icon: '🦚', type: 'weapon', wtype: 'fan', atk: 8, mag: 20, level: 18, price: 6000, tint: '#3ab0a0' },
  snowFlowerFan: { name: '설화선', icon: '❄️', type: 'weapon', wtype: 'fan', atk: 10, mag: 26, mp: 30, level: 24, price: 12000, tint: '#e0f4ff' },
  moonlightFan: { name: '월광선', icon: '🌙', type: 'weapon', wtype: 'fan', atk: 18, mag: 54, level: 38, tier: 2, price: 90000, tint: '#d8e4ff' },
};
