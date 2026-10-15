export const MONSTERS = {
  squirrel: {
    name: '다람쥐', level: 1, hp: 18, atk: 4, def: 0, exp: 6, gold: [1, 3],
    stepMs: 520, aggressive: false, respawnMs: 8000,
    drops: [['acorn', 0.5], ['herb', 0.08]],
  },
  rabbit: {
    name: '토끼', level: 2, hp: 30, atk: 5, def: 1, exp: 10, gold: [2, 5],
    stepMs: 450, aggressive: false, respawnMs: 8000,
    drops: [['rabbitFur', 0.5], ['herb', 0.12], ['dew', 0.06], ['strawHat', 0.02]],
  },
  fox: {
    name: '여우', level: 5, hp: 75, atk: 11, def: 3, exp: 28, gold: [5, 12],
    stepMs: 380, aggressive: true, sight: 4, respawnMs: 10000,
    drops: [['foxTail', 0.35], ['herb', 0.15], ['dew', 0.12], ['ironDagger', 0.015], ['jadeStaff', 0.01], ['leatherCap', 0.02]],
  },
  wolf: {
    name: '늑대', level: 9, hp: 150, atk: 19, def: 6, exp: 60, gold: [10, 22],
    stepMs: 330, aggressive: true, sight: 5, respawnMs: 12000,
    drops: [['wolfFang', 0.35], ['bigHerb', 0.1], ['leatherArmor', 0.02], ['ironSword', 0.015], ['craneFan', 0.015]],
  },
  goblin: {
    name: '도깨비', level: 13, hp: 300, atk: 30, def: 10, exp: 130, gold: [20, 45],
    stepMs: 400, aggressive: true, sight: 5, respawnMs: 15000,
    drops: [['goblinHorn', 0.3], ['bigHerb', 0.15], ['bigDew', 0.12], ['ironHelm', 0.03], ['chainArmor', 0.02], ['steelSword', 0.01], ['steelDagger', 0.01], ['spiritStaff', 0.01], ['cloudFan', 0.01]],
  },
  boar: {
    name: '멧돼지', level: 16, hp: 520, atk: 40, def: 14, exp: 230, gold: [30, 60],
    stepMs: 340, aggressive: true, sight: 4, respawnMs: 12000,
    drops: [['boarTusk', 0.35], ['bigHerb', 0.15], ['bigDew', 0.1], ['pearlNecklace', 0.015], ['silverRing', 0.02], ['jadeRing', 0.02]],
  },
  jangsanbeom: {
    name: '장산범', level: 22, hp: 900, atk: 58, def: 20, exp: 420, gold: [50, 90],
    stepMs: 290, aggressive: true, sight: 6, respawnMs: 14000,
    drops: [['whiteFur', 0.35], ['bigHerb', 0.2], ['elixir', 0.03], ['goldRing', 0.02], ['dragonHelm', 0.01], ['norigae', 0.008]],
  },
  waterGhost: {
    name: '물귀신', level: 24, hp: 800, atk: 62, def: 16, exp: 450, gold: [50, 100],
    stepMs: 420, aggressive: true, sight: 5, respawnMs: 14000,
    drops: [['ghostBead', 0.35], ['bigDew', 0.25], ['elixir', 0.04], ['pearlNecklace', 0.03], ['dragonArmor', 0.008]],
  },
  snowWolf: {
    name: '눈늑대', level: 32, hp: 1500, atk: 90, def: 30, exp: 700, gold: [80, 140],
    stepMs: 300, aggressive: true, sight: 6, respawnMs: 12000,
    drops: [['snowPelt', 0.35], ['bigHerb', 0.25], ['bigDew', 0.2], ['elixir', 0.04], ['dragonPearl', 0.008], ['blueDragonRing', 0.008]],
  },
  dueok: {
    name: '두억시니', level: 38, hp: 2400, atk: 115, def: 36, exp: 1100, gold: [120, 220],
    stepMs: 380, aggressive: true, sight: 5, respawnMs: 15000,
    drops: [['dueokHorn', 0.35], ['elixir', 0.06], ['dragonArmor', 0.01], ['dragonHelm', 0.01], ['dragonPearl', 0.01], ['blueDragonRing', 0.01]],
  },
  bulgasari: {
    name: '불가사리', level: 44, hp: 3600, atk: 140, def: 50, exp: 1700, gold: [180, 320],
    stepMs: 420, aggressive: true, sight: 5, respawnMs: 15000,
    drops: [['ironScale', 0.35], ['elixir', 0.08], ['phoenixCrown', 0.006], ['heavenRobe', 0.005], ['yeouiNorigae', 0.005], ['heavenRing', 0.005]],
  },
  gumiho: {
    name: '구미호', level: 20, hp: 3000, atk: 48, def: 16, exp: 2500, gold: [500, 900],
    stepMs: 300, aggressive: true, sight: 7, boss: true, respawnMs: 180000,
    special: { radius: 2, cd: 5000, power: 1.4, name: '여우불', color: '#ff6fb5' },
    drops: [['foxBead', 1], ['elixir', 0.6], ['ironArmor', 0.2], ['dragonSword', 0.15], ['shadowBlade', 0.15], ['phoenixStaff', 0.15], ['heavenFan', 0.15]],
  },
  imugi: {
    name: '이무기', level: 30, hp: 9000, atk: 85, def: 28, exp: 9000, gold: [2000, 3500],
    stepMs: 360, aggressive: true, sight: 7, boss: true, respawnMs: 240000,
    special: { radius: 3, cd: 4500, power: 1.5, name: '물벼락', color: '#5dade2' },
    drops: [['imugiScale', 1], ['elixir', 1], ['thunderSword', 0.2], ['moonDagger', 0.2], ['starStaff', 0.2], ['skyFan', 0.2], ['dragonArmor', 0.25], ['dragonHelm', 0.25]],
  },
  blackDragon: {
    name: '흑룡', level: 50, hp: 30000, atk: 170, def: 55, exp: 40000, gold: [8000, 15000],
    stepMs: 380, aggressive: true, sight: 8, boss: true, respawnMs: 300000,
    special: { radius: 3, cd: 4000, power: 1.6, name: '흑염', color: '#a64dff' },
    drops: [['dragonOrb', 1], ['elixir', 1], ['tortoiseSword', 0.15], ['ghostDagger', 0.15], ['taegeukStaff', 0.15], ['phoenixFan', 0.15], ['heavenRobe', 0.2], ['phoenixCrown', 0.2], ['yeouiNorigae', 0.2], ['heavenRing', 0.2]],
  },
};
