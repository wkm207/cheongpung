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
    drops: [['dueokHorn', 0.35], ['dragonBreath', 0.02], ['elixir', 0.06], ['dragonArmor', 0.01], ['dragonHelm', 0.01], ['dragonPearl', 0.01], ['blueDragonRing', 0.01]],
  },
  bulgasari: {
    name: '불가사리', level: 44, hp: 3600, atk: 140, def: 50, exp: 1700, gold: [180, 320],
    stepMs: 420, aggressive: true, sight: 5, respawnMs: 15000,
    drops: [['ironScale', 0.35], ['dragonBreath', 0.03], ['elixir', 0.08], ['phoenixCrown', 0.006], ['heavenRobe', 0.005], ['yeouiNorigae', 0.005], ['heavenRing', 0.005]],
  },
  gumiho: {
    name: '구미호', level: 20, hp: 3000, atk: 48, def: 16, exp: 2500, gold: [500, 900],
    stepMs: 300, aggressive: true, sight: 7, boss: true, respawnMs: 180000,
    special: { radius: 2, cd: 5000, power: 1.4, name: '여우불', color: '#ff6fb5' },
    drops: [['foxBead', 1], ['dragonBreath', 1], ['guardCharm', 0.5], ['elixir', 0.6], ['ironArmor', 0.2], ['dragonSword', 0.15], ['shadowBlade', 0.15], ['phoenixStaff', 0.15], ['heavenFan', 0.15]],
  },
  imugi: {
    name: '이무기', level: 30, hp: 9000, atk: 85, def: 28, exp: 9000, gold: [2000, 3500],
    stepMs: 360, aggressive: true, sight: 7, boss: true, respawnMs: 240000,
    special: { radius: 3, cd: 4500, power: 1.5, name: '물벼락', color: '#5dade2' },
    drops: [['imugiScale', 1], ['dragonBreath', 1], ['guardCharm', 1], ['elixir', 1], ['thunderSword', 0.2], ['moonDagger', 0.2], ['starStaff', 0.2], ['skyFan', 0.2], ['dragonArmor', 0.25], ['dragonHelm', 0.25]],
  },
  blackDragon: {
    name: '흑룡', level: 50, hp: 30000, atk: 170, def: 55, exp: 40000, gold: [8000, 15000],
    stepMs: 380, aggressive: true, sight: 8, boss: true, respawnMs: 300000,
    special: { radius: 3, cd: 4000, power: 1.6, name: '흑염', color: '#a64dff' },
    drops: [['dragonOrb', 1], ['dragonBreath', 2], ['guardCharm', 1], ['elixir', 1], ['tortoiseSword', 0.15], ['ghostDagger', 0.15], ['taegeukStaff', 0.15], ['phoenixFan', 0.15], ['heavenRobe', 0.2], ['phoenixCrown', 0.2], ['yeouiNorigae', 0.2], ['heavenRing', 0.2], ['highSword55', 0.06], ['highDagger55', 0.06], ['highStaff55', 0.06], ['highFan55', 0.06], ['highArmor55', 0.06]],
  },
  blueGuardian: {
    name: '청룡 수호령', level: 45, hp: 9000, atk: 150, def: 48, exp: 9000, gold: [3000, 5000],
    stepMs: 360, aggressive: true, sight: 7, boss: true, respawnMs: 120000,
    special: { radius: 3, cd: 4500, power: 1.4, name: '청룡의 물결', color: '#5dade2' },
    drops: [['blueScale', 1], ['dragonBreath', 1], ['elixir', 0.5]],
  },
  redGuardian: {
    name: '적룡 수호령', level: 45, hp: 9000, atk: 160, def: 44, exp: 9000, gold: [3000, 5000],
    stepMs: 360, aggressive: true, sight: 7, boss: true, respawnMs: 120000,
    special: { radius: 3, cd: 4500, power: 1.4, name: '적룡의 불길', color: '#ff6a2e' },
    drops: [['redScale', 1], ['dragonBreath', 1], ['elixir', 0.5]],
  },
  zodiacRat: {
    name: '쥐 수호수', level: 55, hp: 4200, atk: 170, def: 60, exp: 2400, gold: [250, 400],
    stepMs: 280, aggressive: true, sight: 6, respawnMs: 12000,
    drops: [['zodiacJade', 0.3], ['elixir', 0.08], ['highSword55', 0.004], ['highNeck55', 0.004], ['dragonBreath', 0.03]],
  },
  zodiacOx: {
    name: '소 수호수', level: 58, hp: 6500, atk: 190, def: 75, exp: 3200, gold: [300, 480],
    stepMs: 420, aggressive: true, sight: 5, respawnMs: 14000,
    drops: [['zodiacJade', 0.35], ['elixir', 0.1], ['highArmor55', 0.004], ['highHelm55', 0.004], ['dragonBreath', 0.03]],
  },
  zodiacTiger: {
    name: '범 수호수', level: 62, hp: 6000, atk: 220, def: 70, exp: 3800, gold: [350, 550],
    stepMs: 300, aggressive: true, sight: 7, respawnMs: 14000,
    drops: [['zodiacJade', 0.35], ['elixir', 0.1], ['highDagger55', 0.004], ['highRing55', 0.004], ['dragonBreath', 0.04]],
  },
  zodiacGeneral: {
    name: '십이지 신장', level: 70, hp: 60000, atk: 260, def: 90, exp: 90000, gold: [20000, 30000],
    stepMs: 380, aggressive: true, sight: 8, boss: true, respawnMs: 300000,
    special: { radius: 3, cd: 4000, power: 1.6, name: '열두 신의 일격', color: '#f4d03f' },
    drops: [['dragonBreath', 3], ['guardCharm', 1], ['highSword65', 0.15], ['highDagger65', 0.15], ['highStaff65', 0.15], ['highFan65', 0.15], ['highArmor65', 0.2]],
  },
  fishSoldier: {
    name: '물고기 병사', level: 66, hp: 7500, atk: 230, def: 80, exp: 4500, gold: [400, 650],
    stepMs: 380, aggressive: true, sight: 6, respawnMs: 12000,
    drops: [['pearlShell', 0.35], ['elixir', 0.1], ['highHelm65', 0.004], ['highNeck65', 0.004], ['dragonBreath', 0.04]],
  },
  turtleGeneral: {
    name: '거북 장군', level: 70, hp: 11000, atk: 240, def: 110, exp: 5600, gold: [450, 700],
    stepMs: 520, aggressive: true, sight: 5, respawnMs: 15000,
    drops: [['pearlShell', 0.4], ['elixir', 0.12], ['highArmor65', 0.004], ['highRing65', 0.004], ['dragonBreath', 0.05]],
  },
  seaDragon: {
    name: '해룡', level: 80, hp: 90000, atk: 300, def: 110, exp: 150000, gold: [30000, 45000],
    stepMs: 360, aggressive: true, sight: 8, boss: true, respawnMs: 300000,
    special: { radius: 4, cd: 4000, power: 1.6, name: '해일', color: '#3fa9f5' },
    drops: [['dragonBreath', 4], ['guardCharm', 1], ['highSword75', 0.15], ['highDagger75', 0.15], ['highStaff75', 0.15], ['highFan75', 0.15], ['highArmor75', 0.2]],
  },
  yeti: {
    name: '설인', level: 76, hp: 13000, atk: 270, def: 100, exp: 6800, gold: [500, 800],
    stepMs: 440, aggressive: true, sight: 6, respawnMs: 14000,
    drops: [['frostCrystal', 0.35], ['elixir', 0.12], ['highHelm75', 0.004], ['highNeck75', 0.004], ['dragonBreath', 0.05]],
  },
  iceSpirit: {
    name: '얼음 정령', level: 80, hp: 10000, atk: 300, def: 85, exp: 7400, gold: [550, 850],
    stepMs: 360, aggressive: true, sight: 7, respawnMs: 14000,
    drops: [['frostCrystal', 0.4], ['elixir', 0.12], ['highRing75', 0.004], ['highArmor75', 0.004], ['dragonBreath', 0.05]],
  },
  iceDragon: {
    name: '빙룡', level: 88, hp: 130000, atk: 340, def: 130, exp: 240000, gold: [45000, 60000],
    stepMs: 360, aggressive: true, sight: 8, boss: true, respawnMs: 300000,
    special: { radius: 4, cd: 3800, power: 1.7, name: '서리 숨결', color: '#bfe3ff' },
    drops: [['dragonBreath', 5], ['guardCharm', 1], ['highSword85', 0.12], ['highDagger85', 0.12], ['highStaff85', 0.12], ['highFan85', 0.12], ['highArmor85', 0.15]],
  },
  waterImp: {
    name: '물요괴', level: 86, hp: 14000, atk: 320, def: 110, exp: 8600, gold: [600, 900],
    stepMs: 340, aggressive: true, sight: 6, respawnMs: 13000,
    drops: [['islandCoin', 0.35], ['elixir', 0.14], ['highHelm85', 0.004], ['highNeck85', 0.004], ['dragonBreath', 0.06]],
  },
  redOgre: {
    name: '붉은 요괴', level: 90, hp: 18000, atk: 350, def: 120, exp: 9800, gold: [650, 1000],
    stepMs: 420, aggressive: true, sight: 6, respawnMs: 15000,
    drops: [['islandCoin', 0.4], ['elixir', 0.15], ['highRing85', 0.004], ['highArmor85', 0.004], ['dragonBreath', 0.06]],
  },
  eightSerpent: {
    name: '여덟머리 큰뱀', level: 99, hp: 220000, atk: 400, def: 150, exp: 500000, gold: [80000, 120000],
    stepMs: 360, aggressive: true, sight: 9, boss: true, respawnMs: 360000,
    special: { radius: 5, cd: 3500, power: 1.8, name: '여덟 갈래 독무', color: '#9b59b6' },
    drops: [['dragonBreath', 8], ['guardCharm', 2], ['highSword85', 0.3], ['highDagger85', 0.3], ['highStaff85', 0.3], ['highFan85', 0.3], ['highArmor85', 0.3], ['highHelm85', 0.3], ['highNeck85', 0.3], ['highRing85', 0.3]],
  },
  fireLizard: {
    name: '불도마뱀', level: 94, hp: 20000, atk: 380, def: 130, exp: 11000, gold: [700, 1100],
    stepMs: 320, aggressive: true, sight: 6, respawnMs: 13000,
    drops: [['emberStone', 0.35], ['elixir', 0.15], ['dragonBreath', 0.06]],
  },
  flameSpirit: {
    name: '화염 정령', level: 97, hp: 17000, atk: 410, def: 110, exp: 12000, gold: [750, 1150],
    stepMs: 300, aggressive: true, sight: 7, respawnMs: 13000,
    drops: [['emberStone', 0.4], ['elixir', 0.15], ['dragonBreath', 0.07]],
  },
  firebird: {
    name: '불새 주작', level: 99, hp: 300000, atk: 440, def: 160, exp: 700000, gold: [100000, 150000],
    stepMs: 280, aggressive: true, sight: 9, boss: true, respawnMs: 420000,
    special: { radius: 5, cd: 3200, power: 1.9, name: '불새의 날갯짓', color: '#ff5a1f' },
    drops: [['firebirdFeather', 1], ['dragonBreath', 10], ['guardCharm', 2], ['highSword85', 0.35], ['highDagger85', 0.35], ['highStaff85', 0.35], ['highFan85', 0.35], ['highArmor85', 0.35], ['highRing85', 0.35]],
  },
};
