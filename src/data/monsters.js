export const MONSTERS = {
  squirrel: {
    name: '다람쥐', level: 1, hp: 18, atk: 4, def: 0, exp: 6, gold: [1, 3],
    stepMs: 520, aggressive: false, respawnMs: 8000,
    drops: [['acorn', 0.5], ['herb', 0.08]],
  },
  rabbit: {
    name: '토끼', level: 2, hp: 30, atk: 5, def: 1, exp: 10, gold: [2, 5],
    stepMs: 450, aggressive: false, respawnMs: 8000,
    drops: [['rabbitFur', 0.5], ['herb', 0.12], ['dew', 0.06], ['strawHat', 0.02], ['headband', 0.02], ['rabbitFoot', 0.02]],
  },
  fox: {
    flee: 0.2,
    name: '여우', level: 5, hp: 75, atk: 11, def: 3, exp: 28, gold: [5, 12],
    stepMs: 380, aggressive: true, sight: 4, respawnMs: 10000,
    drops: [['foxTail', 0.35], ['herb', 0.15], ['dew', 0.12], ['ironDagger', 0.015], ['jadeStaff', 0.01], ['leatherCap', 0.02], ['luckyPouch', 0.03], ['bambooFan', 0.015], ['boneDagger', 0.015], ['rabbitFoot', 0.02]],
  },
  wolf: {
    name: '늑대', level: 9, hp: 150, atk: 19, def: 6, exp: 60, gold: [10, 22],
    stepMs: 330, aggressive: true, sight: 5, respawnMs: 12000,
    drops: [['wolfFang', 0.35], ['bigHerb', 0.1], ['leatherArmor', 0.02], ['ironSword', 0.015], ['craneFan', 0.015], ['hunterVest', 0.02], ['bronzeSword', 0.015], ['pineStaff', 0.015], ['boneNecklace', 0.02], ['wolfFangNecklace', 0.03]],
  },
  goblin: {
    name: '도깨비', level: 13, hp: 300, atk: 30, def: 10, exp: 130, gold: [20, 45],
    stepMs: 400, aggressive: true, sight: 5, respawnMs: 15000,
    drops: [['goblinHorn', 0.3], ['bigHerb', 0.15], ['bigDew', 0.12], ['ironHelm', 0.03], ['chainArmor', 0.02], ['steelSword', 0.01], ['steelDagger', 0.01], ['spiritStaff', 0.01], ['cloudFan', 0.01], ['spiritBell', 0.02], ['paperCharm', 0.03], ['leatherShield', 0.02], ['paeraengi', 0.02], ['goblinRing', 0.025]],
  },
  boar: {
    name: '멧돼지', level: 16, hp: 520, atk: 40, def: 14, exp: 230, gold: [30, 60],
    stepMs: 340, aggressive: true, sight: 4, respawnMs: 12000,
    drops: [['boarTusk', 0.35], ['bigHerb', 0.15], ['bigDew', 0.1], ['pearlNecklace', 0.015], ['silverRing', 0.02], ['jadeRing', 0.02], ['ironShield', 0.015], ['incensePouch', 0.02], ['ironRing', 0.03], ['boarTuskCharm', 0.02]],
  },
  jangsanbeom: {
    name: '장산범', level: 22, hp: 900, atk: 58, def: 20, exp: 420, gold: [50, 90],
    stepMs: 290, aggressive: true, sight: 6, respawnMs: 14000,
    drops: [['whiteFur', 0.35], ['bigHerb', 0.2], ['elixir', 0.03], ['goldRing', 0.02], ['dragonHelm', 0.01], ['norigae', 0.008], ['tigerClaw', 0.03], ['tigerToothNecklace', 0.02], ['jeonrip', 0.02], ['hwando', 0.01], ['peacockFan', 0.01], ['eagleFeather', 0.015]],
  },
  waterGhost: {
    name: '물귀신', level: 24, hp: 800, atk: 62, def: 16, exp: 450, gold: [50, 100],
    stepMs: 420, aggressive: true, sight: 5, respawnMs: 14000,
    drops: [['ghostBead', 0.35], ['bigDew', 0.25], ['elixir', 0.04], ['pearlNecklace', 0.03], ['dragonArmor', 0.008], ['bronzeMirror', 0.02], ['jadeNecklace', 0.02], ['sapphireRing', 0.015], ['skullStaff', 0.01], ['poisonDagger', 0.01]],
  },
  snowWolf: {
    name: '눈늑대', level: 32, hp: 1500, atk: 90, def: 30, exp: 700, gold: [80, 140],
    stepMs: 300, aggressive: true, sight: 6, respawnMs: 12000,
    drops: [['snowPelt', 0.35], ['bigHerb', 0.25], ['bigDew', 0.2], ['elixir', 0.04], ['dragonPearl', 0.008], ['blueDragonRing', 0.008], ['moonstoneRing', 0.01], ['eagleHelm', 0.01], ['cloudRobe', 0.008], ['snowFlowerFan', 0.01], ['frostRing', 0.015], ['frostNecklace', 0.015], ['iceJade', 0.015]],
  },
  dueok: {
    name: '두억시니', level: 38, hp: 2400, atk: 115, def: 36, exp: 1100, gold: [120, 220],
    stepMs: 380, aggressive: true, sight: 5, respawnMs: 15000,
    drops: [['dueokHorn', 0.35], ['dragonBreath', 0.02], ['elixir', 0.06], ['dragonArmor', 0.01], ['dragonHelm', 0.01], ['dragonPearl', 0.01], ['blueDragonRing', 0.01], ['thunderCharm', 0.012], ['ghostFaceShield', 0.01], ['obsidianRing', 0.02], ['moonlightSword', 0.006], ['blackNightDagger', 0.006], ['moonlightStaff', 0.006], ['moonlightFan', 0.006], ['eagleFeather', 0.015]],
  },
  bulgasari: {
    name: '불가사리', level: 44, hp: 3600, atk: 140, def: 50, exp: 1700, gold: [180, 320],
    stepMs: 420, aggressive: true, sight: 5, respawnMs: 15000,
    drops: [['ironScale', 0.35], ['dragonBreath', 0.03], ['elixir', 0.08], ['phoenixCrown', 0.006], ['heavenRobe', 0.005], ['yeouiNorigae', 0.005], ['heavenRing', 0.005], ['jadeTablet', 0.01], ['blackTortoiseShield', 0.006], ['foxTailCharm', 0.004], ['whiteTigerRing', 0.008], ['moonNorigae', 0.01]],
  },
  gumiho: {
    name: '구미호', level: 20, hp: 3000, atk: 48, def: 16, exp: 2500, gold: [500, 900],
    stepMs: 300, aggressive: true, sight: 7, boss: true, respawnMs: 180000,
    special: { radius: 2, cd: 5000, power: 1.4, name: '여우불', color: '#ff6fb5' },
    drops: [['foxBead', 1], ['dragonBreath', 1], ['guardCharm', 0.5], ['elixir', 0.6], ['ironArmor', 0.2], ['dragonSword', 0.15], ['shadowBlade', 0.15], ['phoenixStaff', 0.15], ['heavenFan', 0.15], ['turtleShield', 0.2], ['tigerClaw', 0.2], ['foxRing', 0.15]],
  },
  imugi: {
    name: '이무기', level: 30, hp: 9000, atk: 85, def: 28, exp: 9000, gold: [2000, 3500],
    stepMs: 360, aggressive: true, sight: 7, boss: true, respawnMs: 240000,
    special: { radius: 3, cd: 4500, power: 1.5, name: '물벼락', color: '#5dade2' },
    drops: [['imugiScale', 1], ['dragonBreath', 1], ['guardCharm', 1], ['elixir', 1], ['thunderSword', 0.2], ['moonDagger', 0.2], ['starStaff', 0.2], ['skyFan', 0.2], ['dragonArmor', 0.25], ['dragonHelm', 0.25], ['ghostFaceShield', 0.2], ['whiteTigerRing', 0.15], ['moonlightSword', 0.12], ['blackNightDagger', 0.12], ['moonlightStaff', 0.12], ['moonlightFan', 0.12]],
  },
  blackDragon: {
    name: '흑룡', level: 50, hp: 30000, atk: 170, def: 55, exp: 40000, gold: [8000, 15000],
    stepMs: 380, aggressive: true, sight: 8, boss: true, respawnMs: 300000,
    special: { radius: 3, cd: 4000, power: 1.6, name: '흑염', color: '#a64dff' },
    drops: [['dragonOrb', 1], ['dragonBreath', 2], ['guardCharm', 1], ['elixir', 1], ['tortoiseSword', 0.15], ['ghostDagger', 0.15], ['taegeukStaff', 0.15], ['phoenixFan', 0.15], ['heavenRobe', 0.2], ['phoenixCrown', 0.2], ['yeouiNorigae', 0.2], ['heavenRing', 0.2], ['highSword55', 0.06], ['highDagger55', 0.06], ['highStaff55', 0.06], ['highFan55', 0.06], ['highArmor55', 0.06], ['blackTortoiseShield', 0.2], ['foxTailCharm', 0.2], ['highShield55', 0.06], ['highAux55', 0.06], ['blackDragonRing', 0.1], ['dragonScaleCharm', 0.1]],
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
    drops: [['zodiacJade', 0.3], ['elixir', 0.08], ['highSword55', 0.004], ['highNeck55', 0.004], ['dragonBreath', 0.03], ['zodiacCharm', 0.01]],
  },
  zodiacOx: {
    name: '소 수호수', level: 58, hp: 6500, atk: 190, def: 75, exp: 3200, gold: [300, 480],
    stepMs: 420, aggressive: true, sight: 5, respawnMs: 14000,
    drops: [['zodiacJade', 0.35], ['elixir', 0.1], ['highArmor55', 0.004], ['highHelm55', 0.004], ['dragonBreath', 0.03], ['highShield55', 0.004], ['zodiacCharm', 0.01]],
  },
  zodiacTiger: {
    name: '범 수호수', level: 62, hp: 6000, atk: 220, def: 70, exp: 3800, gold: [350, 550],
    stepMs: 300, aggressive: true, sight: 7, respawnMs: 14000,
    drops: [['zodiacJade', 0.35], ['elixir', 0.1], ['highDagger55', 0.004], ['highRing55', 0.004], ['dragonBreath', 0.04], ['highAux55', 0.004], ['zodiacCharm', 0.01]],
  },
  zodiacGeneral: {
    name: '십이지 신장', level: 70, hp: 60000, atk: 260, def: 90, exp: 90000, gold: [20000, 30000],
    stepMs: 380, aggressive: true, sight: 8, boss: true, respawnMs: 300000,
    special: { radius: 3, cd: 4000, power: 1.6, name: '열두 신의 일격', color: '#f4d03f' },
    drops: [['dragonBreath', 3], ['guardCharm', 1], ['highSword65', 0.15], ['highDagger65', 0.15], ['highStaff65', 0.15], ['highFan65', 0.15], ['highArmor65', 0.2], ['highShield65', 0.15], ['highAux65', 0.15], ['zodiacRing', 0.12], ['zodiacCharm', 0.12]],
  },
  fishSoldier: {
    name: '물고기 병사', level: 66, hp: 7500, atk: 230, def: 80, exp: 4500, gold: [400, 650],
    stepMs: 380, aggressive: true, sight: 6, respawnMs: 12000,
    drops: [['pearlShell', 0.35], ['elixir', 0.1], ['highHelm65', 0.004], ['highNeck65', 0.004], ['dragonBreath', 0.04], ['highShield65', 0.004]],
  },
  turtleGeneral: {
    name: '거북 장군', level: 70, hp: 11000, atk: 240, def: 110, exp: 5600, gold: [450, 700],
    stepMs: 520, aggressive: true, sight: 5, respawnMs: 15000,
    drops: [['pearlShell', 0.4], ['elixir', 0.12], ['highArmor65', 0.004], ['highRing65', 0.004], ['dragonBreath', 0.05], ['highAux65', 0.004], ['turtleShellCharm', 0.012]],
  },
  seaDragon: {
    name: '해룡', level: 80, hp: 90000, atk: 300, def: 110, exp: 150000, gold: [30000, 45000],
    stepMs: 360, aggressive: true, sight: 8, boss: true, respawnMs: 300000,
    special: { radius: 4, cd: 4000, power: 1.6, name: '해일', color: '#3fa9f5' },
    drops: [['dragonBreath', 4], ['guardCharm', 1], ['highSword75', 0.15], ['highDagger75', 0.15], ['highStaff75', 0.15], ['highFan75', 0.15], ['highArmor75', 0.2], ['highShield75', 0.15], ['highAux75', 0.15], ['seaPearlRing', 0.12]],
  },
  yeti: {
    name: '설인', level: 76, hp: 13000, atk: 270, def: 100, exp: 6800, gold: [500, 800],
    stepMs: 440, aggressive: true, sight: 6, respawnMs: 14000,
    drops: [['frostCrystal', 0.35], ['elixir', 0.12], ['highHelm75', 0.004], ['highNeck75', 0.004], ['dragonBreath', 0.05], ['highShield75', 0.004]],
  },
  iceSpirit: {
    name: '얼음 정령', level: 80, hp: 10000, atk: 300, def: 85, exp: 7400, gold: [550, 850],
    stepMs: 360, aggressive: true, sight: 7, respawnMs: 14000,
    drops: [['frostCrystal', 0.4], ['elixir', 0.12], ['highRing75', 0.004], ['highArmor75', 0.004], ['dragonBreath', 0.05], ['highAux75', 0.004], ['iceHeartNecklace', 0.008]],
  },
  iceDragon: {
    name: '빙룡', level: 88, hp: 130000, atk: 340, def: 130, exp: 240000, gold: [45000, 60000],
    stepMs: 360, aggressive: true, sight: 8, boss: true, respawnMs: 300000,
    special: { radius: 4, cd: 3800, power: 1.7, name: '서리 숨결', color: '#bfe3ff' },
    drops: [['dragonBreath', 5], ['guardCharm', 1], ['highSword85', 0.12], ['highDagger85', 0.12], ['highStaff85', 0.12], ['highFan85', 0.12], ['highArmor85', 0.15], ['highShield85', 0.12], ['highAux85', 0.12], ['iceHeartNecklace', 0.12]],
  },
  waterImp: {
    name: '물요괴', level: 86, hp: 14000, atk: 320, def: 110, exp: 8600, gold: [600, 900],
    stepMs: 340, aggressive: true, sight: 6, respawnMs: 13000,
    drops: [['islandCoin', 0.35], ['elixir', 0.14], ['highHelm85', 0.004], ['highNeck85', 0.004], ['dragonBreath', 0.06], ['highShield85', 0.004]],
  },
  redOgre: {
    name: '붉은 요괴', level: 90, hp: 18000, atk: 350, def: 120, exp: 9800, gold: [650, 1000],
    stepMs: 420, aggressive: true, sight: 6, respawnMs: 15000,
    drops: [['islandCoin', 0.4], ['elixir', 0.15], ['highRing85', 0.004], ['highArmor85', 0.004], ['dragonBreath', 0.06], ['highAux85', 0.004]],
  },
  eightSerpent: {
    name: '여덟머리 큰뱀', level: 99, hp: 220000, atk: 400, def: 150, exp: 500000, gold: [80000, 120000],
    stepMs: 360, aggressive: true, sight: 9, boss: true, respawnMs: 360000,
    special: { radius: 5, cd: 3500, power: 1.8, name: '여덟 갈래 독무', color: '#9b59b6' },
    drops: [['dragonBreath', 8], ['guardCharm', 2], ['highSword85', 0.3], ['highDagger85', 0.3], ['highStaff85', 0.3], ['highFan85', 0.3], ['highArmor85', 0.3], ['highHelm85', 0.3], ['highNeck85', 0.3], ['highRing85', 0.3], ['highShield85', 0.3], ['highAux85', 0.3]],
  },
  fireLizard: {
    name: '불도마뱀', level: 94, hp: 20000, atk: 380, def: 130, exp: 11000, gold: [700, 1100],
    stepMs: 320, aggressive: true, sight: 6, respawnMs: 13000,
    drops: [['emberStone', 0.35], ['elixir', 0.15], ['dragonBreath', 0.06]],
  },
  flameSpirit: {
    name: '화염 정령', level: 97, hp: 17000, atk: 410, def: 110, exp: 12000, gold: [750, 1150],
    stepMs: 300, aggressive: true, sight: 7, respawnMs: 13000,
    drops: [['emberStone', 0.4], ['elixir', 0.15], ['dragonBreath', 0.07], ['flameNorigae', 0.005]],
  },
  firebird: {
    name: '불새 주작', level: 99, hp: 300000, atk: 440, def: 160, exp: 700000, gold: [100000, 150000],
    stepMs: 280, aggressive: true, sight: 9, boss: true, respawnMs: 420000,
    special: { radius: 5, cd: 3200, power: 1.9, name: '불새의 날갯짓', color: '#ff5a1f' },
    drops: [['firebirdFeather', 1], ['dragonBreath', 10], ['jujakSword', 0.12], ['jujakDagger', 0.12], ['jujakStaff', 0.12], ['jujakFan', 0.12], ['guardCharm', 2], ['highSword85', 0.35], ['highDagger85', 0.35], ['highStaff85', 0.35], ['highFan85', 0.35], ['highArmor85', 0.35], ['highRing85', 0.35], ['flameNorigae', 0.1], ['firebirdFeatherCharm', 0.06]],
  },
  // ── 쥐굴(Lv5~14) ──
  rat: {
    name: '쥐', level: 5, hp: 70, atk: 10, def: 2, exp: 26, gold: [4, 10],
    stepMs: 360, aggressive: false, respawnMs: 8000, taunts: ['찍찍!', '찍!'],
    drops: [['ratMeat', 0.4], ['herb', 0.12], ['luckyPouch', 0.01]],
  },
  bigRat: {
    name: '큰쥐', level: 7, hp: 110, atk: 14, def: 4, exp: 40, gold: [6, 14],
    stepMs: 360, aggressive: false, respawnMs: 8000, taunts: ['찌이익!'],
    drops: [['ratMeat', 0.45], ['dew', 0.1]],
  },
  bat: {
    name: '박쥐', level: 9, hp: 140, atk: 18, def: 5, exp: 55, gold: [8, 18],
    stepMs: 260, aggressive: true, sight: 5, respawnMs: 9000, flee: 0.25,
    drops: [['batWing', 0.35], ['herb', 0.15], ['paperCharm', 0.02], ['amethystRing', 0.02]],
  },
  sewerRat: {
    name: '시궁쥐', level: 11, hp: 220, atk: 24, def: 8, exp: 90, gold: [12, 26],
    stepMs: 320, aggressive: true, sight: 4, respawnMs: 9000, taunts: ['찍찍찍!!'],
    drops: [['ratMeat', 0.4], ['bigHerb', 0.1], ['returnScroll', 0.03]],
  },
  ratKing: {
    name: '쥐대왕', level: 14, hp: 2200, atk: 38, def: 12, exp: 1600, gold: [300, 600],
    stepMs: 320, aggressive: true, sight: 7, boss: true, respawnMs: 150000, taunts: ['내 굴에서 썩 나가라, 찍!'],
    drops: [['guardCharm', 0.3], ['elixir', 0.4], ['leatherCap', 0.3], ['ironDagger', 0.2], ['jadeStaff', 0.2], ['ironSword', 0.2], ['craneFan', 0.2], ['woodShield', 0.3], ['luckyPouch', 0.3], ['bronzeSword', 0.2], ['boneDagger', 0.2], ['pineStaff', 0.2], ['bambooFan', 0.2]],
  },
  // ── 뱀굴(Lv12~22) ──
  snake: {
    name: '뱀', level: 12, hp: 260, atk: 27, def: 8, exp: 110, gold: [14, 30],
    stepMs: 420, aggressive: false, respawnMs: 9000, taunts: ['쉬이익...'],
    drops: [['snakeMeat', 0.4], ['bigHerb', 0.08], ['snakeShed', 0.03]],
  },
  viper: {
    name: '독사', level: 15, hp: 420, atk: 36, def: 12, exp: 190, gold: [20, 40],
    stepMs: 360, aggressive: true, sight: 4, respawnMs: 10000, taunts: ['쉬익!'],
    drops: [['snakeMeat', 0.45], ['bigHerb', 0.12], ['bigDew', 0.08], ['poisonDagger', 0.01], ['snakeEyeRing', 0.02]],
  },
  whiteSnake: {
    name: '흰뱀', level: 18, hp: 650, atk: 46, def: 16, exp: 300, gold: [60, 120],
    stepMs: 340, aggressive: true, sight: 5, respawnMs: 11000,
    drops: [['snakeMeat', 0.35], ['silverRing', 0.02], ['returnScroll', 0.04], ['sapphireRing', 0.01], ['monkRobe', 0.015], ['snakeEyeRing', 0.02], ['snakeShed', 0.02]],
  },
  greatSnake: {
    name: '대구렁이', level: 22, hp: 6000, atk: 64, def: 22, exp: 5000, gold: [800, 1400],
    stepMs: 380, aggressive: true, sight: 7, boss: true, respawnMs: 180000, taunts: ['백 년 묵은 이 몸을 깨우다니...'],
    drops: [['snakeSpirit', 1], ['elixir', 0.6], ['guardCharm', 0.4], ['chainArmor', 0.3], ['dragonHelm', 0.1], ['goldRing', 0.2], ['scaleArmor', 0.3], ['rubyRing', 0.2], ['mirrorShield', 0.2], ['snakeScaleNecklace', 0.15], ['snakeEyeRing', 0.1]],
  },
  // ── 돼지굴(Lv25~45): 고기를 팔아 돈을 벌기 좋은 곳 ──
  wildPig: {
    name: '산돼지', level: 26, hp: 1100, atk: 70, def: 24, exp: 520, gold: [80, 140],
    stepMs: 340, aggressive: false, respawnMs: 10000, taunts: ['꿀꿀!'],
    drops: [['pigMeat', 0.5], ['bigHerb', 0.15], ['hwando', 0.01], ['rubyRing', 0.01], ['heukrip', 0.01], ['vajraBeads', 0.015], ['boarTuskCharm', 0.02]],
  },
  forestPig: {
    name: '숲돼지', level: 34, hp: 1900, atk: 98, def: 32, exp: 900, gold: [120, 200],
    stepMs: 260, aggressive: true, sight: 5, respawnMs: 11000, taunts: ['꾸에에엑!'],
    drops: [['forestPigMeat', 0.5], ['bigDew', 0.15], ['elixir', 0.03], ['blackIronSword', 0.01], ['twinFang', 0.01], ['thunderStaff', 0.01], ['snowFlowerFan', 0.01], ['vajraBeads', 0.015]],
  },
  pigKing: {
    name: '돼지대왕', level: 42, hp: 16000, atk: 135, def: 45, exp: 14000, gold: [3000, 5000],
    stepMs: 320, aggressive: true, sight: 8, boss: true, respawnMs: 180000, taunts: ['내 새끼들을 건드린 놈이 누구냐!'],
    drops: [['elixir', 1], ['guardCharm', 0.5], ['ironArmor', 0.3], ['dragonArmor', 0.15], ['dragonBreath', 0.5], ['turtleShield', 0.3], ['moonstoneRing', 0.2], ['thunderCharm', 0.2], ['boarKingNecklace', 0.15], ['vajraBeads', 0.1]],
  },
  // ── 해골굴(Lv55~75) ──
  skeleton: {
    name: '해골', level: 56, hp: 5000, atk: 180, def: 65, exp: 2600, gold: [250, 420],
    stepMs: 420, aggressive: false, respawnMs: 11000, taunts: ['달그락달그락...'],
    drops: [['amber', 0.3], ['elixir', 0.08], ['skullRing', 0.008]],
  },
  skeletonSword: {
    name: '해골 검사', level: 62, hp: 6500, atk: 215, def: 75, exp: 3500, gold: [320, 520],
    stepMs: 340, aggressive: true, sight: 6, respawnMs: 12000, taunts: ['산 자의 냄새다!', '뼈가 시리구나...'],
    drops: [['amber', 0.3], ['elixir', 0.1], ['highSword55', 0.004], ['highDagger55', 0.004], ['dragonBreath', 0.03], ['skullRing', 0.012]],
  },
  skeletonArcher: {
    name: '해골 궁수', level: 66, hp: 5200, atk: 225, def: 60, exp: 3800, gold: [350, 560],
    stepMs: 360, aggressive: true, sight: 7, respawnMs: 12000, taunts: ['내 화살을 피해 보아라!'],
    drops: [['amber', 0.3], ['darkAmber', 0.05], ['highStaff55', 0.004], ['highFan55', 0.004], ['dragonBreath', 0.03], ['skullBeads', 0.012]],
  },
  skeletonGeneral: {
    name: '해골 장군', level: 74, hp: 80000, atk: 280, def: 100, exp: 120000, gold: [25000, 40000],
    stepMs: 360, aggressive: true, sight: 9, boss: true, respawnMs: 300000, taunts: ['나의 군대여, 일어나라!'],
    special: { radius: 3, cd: 8000, power: 1.7, name: '백골 진동', color: '#e8e2d0' },
    drops: [['darkAmber', 1], ['dragonBreath', 3], ['guardCharm', 1], ['highSword65', 0.15], ['highDagger65', 0.15], ['highStaff65', 0.15], ['highFan65', 0.15], ['highHelm65', 0.2], ['highShield65', 0.2], ['skullRing', 0.1], ['skullBeads', 0.1]],
  },
  // ── 흉가(Lv90~99): 우리 옛이야기의 귀신들 ──
  eggGhost: {
    name: '달걀귀신', level: 90, hp: 16000, atk: 340, def: 110, exp: 9500, gold: [650, 1000],
    stepMs: 380, aggressive: true, sight: 6, respawnMs: 12000, taunts: ['...........'],
    drops: [['amber', 0.4], ['darkAmber', 0.12], ['elixir', 0.15], ['dragonBreath', 0.06]],
  },
  maidenGhost: {
    name: '처녀귀신', level: 93, hp: 15000, atk: 365, def: 100, exp: 10500, gold: [700, 1050],
    stepMs: 340, aggressive: true, sight: 7, respawnMs: 12000, taunts: ['내 한을 풀어다오...', '흐흐흐흑...'],
    drops: [['amber', 0.4], ['darkAmber', 0.15], ['elixir', 0.15], ['highNeck85', 0.004], ['dragonBreath', 0.06], ['highAux85', 0.004], ['grudgeRing', 0.004]],
  },
  bachelorGhost: {
    name: '몽달귀신', level: 95, hp: 19000, atk: 380, def: 125, exp: 11500, gold: [750, 1100],
    stepMs: 320, aggressive: true, sight: 7, respawnMs: 12000, taunts: ['장가도 못 가고 죽었으니 원통하다!'],
    drops: [['amber', 0.4], ['darkAmber', 0.15], ['elixir', 0.15], ['highRing85', 0.004], ['dragonBreath', 0.07], ['grudgeRing', 0.004]],
  },
  grudgeLord: {
    name: '원귀 대감', level: 99, hp: 260000, atk: 430, def: 150, exp: 600000, gold: [90000, 130000],
    stepMs: 340, aggressive: true, sight: 9, boss: true, respawnMs: 360000, taunts: ['감히 내 집에 발을 들이다니!'],
    special: { radius: 4, cd: 9000, power: 1.8, name: '원한의 울부짖음', color: '#b07bff' },
    drops: [['darkAmber', 3], ['dragonBreath', 8], ['guardCharm', 2], ['highSword85', 0.25], ['highDagger85', 0.25], ['highStaff85', 0.25], ['highFan85', 0.25], ['highArmor85', 0.25], ['highHelm85', 0.25], ['highNeck85', 0.25], ['highShield85', 0.25], ['highAux85', 0.25], ['grudgeRing', 0.1]],
  },
};
