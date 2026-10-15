// 기술 종류(kind)
//  melee      앞의 적 공격 (hits 연타, stun 기절, poison 중독, crit 확정 치명타)
//  projectile 바라보는 방향으로 날아감
//  aoe        내 주변 radius칸 범위 (stun, burn 화상)
//  zone       가장 가까운 적 자리에 범위 공격
//  line       앞쪽 일직선 length칸 관통
//  target     가장 가까운 적 하나 (stun, curse 저주)
//  chain      가장 가까운 적부터 튕기며 연쇄
//  dash       앞으로 돌진해 처음 부딪힌 적 공격
//  blink      가장 가까운 적 등 뒤로 순간이동해 공격
//  multiblink 주변 적 여러 마리 사이를 순간이동하며 공격
//  buff       능력치 강화(stat: atk/def/mag/crit/all)
//  heal       체력 회복 (power×stat + flat, 또는 최대 체력의 pct)
//  hot        일정 시간 동안 매초 회복
//  stealth    은신
//  convert    체력을 마력으로 바꿈
export const SKILLS = {
  // ── 전사 ──
  bash: { name: '강타', icon: '💥', level: 1, mp: 5, cd: 1500, kind: 'melee', power: 2.2, stat: 'atk', desc: '앞의 적을 힘껏 내려친다.' },
  rush: { name: '돌진베기', icon: '🐗', level: 4, mp: 8, cd: 4000, kind: 'dash', range: 4, power: 2.0, stun: 1000, stat: 'atk', desc: '앞으로 최대 4칸 돌진해 처음 부딪힌 적을 베고 1초간 기절시킨다.' },
  whirl: { name: '회전베기', icon: '🌀', level: 8, mp: 12, cd: 4000, kind: 'aoe', radius: 1, power: 1.7, stat: 'atk', color: '#f5f5f5', desc: '주변 1칸의 모든 적을 벤다.' },
  rage: { name: '광폭', icon: '😡', level: 12, mp: 20, cd: 25000, kind: 'buff', buff: { stat: 'atk', mult: 1.5 }, duration: 12000, desc: '12초간 공격력이 50% 오른다.' },
  ironwall: { name: '철벽', icon: '🧱', level: 16, mp: 18, cd: 30000, kind: 'buff', buff: { stat: 'def', mult: 2 }, duration: 12000, desc: '12초간 방어력이 2배가 된다.' },
  quake: { name: '지진격', icon: '⛰️', level: 20, mp: 28, cd: 9000, kind: 'aoe', radius: 2, power: 2.5, stun: 1500, stat: 'atk', color: '#d4a76a', visual: 'quake', desc: '땅을 내리쳐 주변 2칸의 적을 치고 1.5초간 기절시킨다.' },
  bloodwind: { name: '혈풍참', icon: '🩸', level: 25, mp: 35, cd: 7000, kind: 'line', length: 5, power: 3.2, stat: 'atk', color: '#ff5e5e', desc: '앞쪽 5칸을 일직선으로 베어 가른다.' },
  undying: { name: '불굴', icon: '❤️', level: 30, mp: 40, cd: 60000, kind: 'heal', pct: 0.5, desc: '최대 체력의 50%를 단숨에 회복한다.' },

  // ── 도적 ──
  double: { name: '연속베기', icon: '⚔️', level: 1, mp: 4, cd: 1200, kind: 'melee', power: 1.3, hits: 2, stat: 'atk', desc: '앞의 적을 두 번 벤다.' },
  throw: { name: '표창', icon: '✴️', level: 4, mp: 6, cd: 1800, kind: 'projectile', range: 6, power: 1.8, stat: 'atk', color: '#d0d3d4', visual: 'star', desc: '바라보는 방향으로 표창을 던진다.' },
  phantom: { name: '풍영보', icon: '👣', level: 8, mp: 12, cd: 5000, kind: 'blink', range: 6, power: 2.4, crit: true, stat: 'atk', desc: '바람처럼 사라져 6칸 안 가장 가까운 적의 등 뒤에 나타나 급소를 찌른다.' },
  venom: { name: '독칼', icon: '🧪', level: 12, mp: 10, cd: 3000, kind: 'melee', power: 1.4, poison: { power: 0.5, duration: 6000 }, stat: 'atk', desc: '독 바른 칼로 베어 6초간 중독시킨다.' },
  stealth: { name: '은신', icon: '🌑', level: 16, mp: 18, cd: 20000, kind: 'stealth', duration: 8000, desc: '8초간 모습을 감춘다. 적이 쫓아오지 않고, 은신 중 첫 공격은 2배 치명타가 된다.' },
  frenzy: { name: '난도질', icon: '🔪', level: 20, mp: 22, cd: 6000, kind: 'melee', power: 0.9, hits: 5, stat: 'atk', desc: '눈에 보이지 않는 속도로 다섯 번 벤다.' },
  shadowkill: { name: '암영살', icon: '🌘', level: 25, mp: 35, cd: 12000, kind: 'multiblink', count: 4, range: 5, power: 2.2, stat: 'atk', desc: '그림자가 되어 주변 적 4마리 사이를 넘나들며 벤다.' },
  vital: { name: '급소찌르기', icon: '🎯', level: 30, mp: 40, cd: 15000, kind: 'melee', power: 5.0, stun: 2000, crit: true, stat: 'atk', desc: '급소를 정확히 찔러 큰 피해를 주고 2초간 기절시킨다.' },

  // ── 주술사 ──
  fire: { name: '화염구', icon: '☄️', level: 1, mp: 6, cd: 900, kind: 'projectile', range: 7, power: 2.0, stat: 'mag', magic: true, color: '#ff8c2e', desc: '불덩이를 날려 처음 맞는 적을 태운다.' },
  ice: { name: '빙결진', icon: '❄️', level: 4, mp: 14, cd: 5000, kind: 'aoe', radius: 2, power: 1.3, stat: 'mag', magic: true, stun: 2000, color: '#85c1e9', visual: 'ice', desc: '주변 2칸의 적을 얼려 2초간 묶는다.' },
  chain: { name: '연쇄번개', icon: '🌩️', level: 8, mp: 14, cd: 3000, kind: 'chain', range: 6, jumps: 3, jumpRange: 3, power: 1.8, falloff: 0.8, stat: 'mag', magic: true, color: '#aee1ff', desc: '번개가 가까운 적부터 최대 4마리까지 튕겨 다닌다.' },
  curse: { name: '저주', icon: '💀', level: 12, mp: 12, cd: 6000, kind: 'target', range: 6, power: 0.6, curse: 10000, stat: 'mag', magic: true, color: '#b06ad9', desc: '10초간 적의 방어력을 절반으로 낮추고 받는 피해를 30% 늘린다.' },
  firezone: { name: '화염진', icon: '🔥', level: 16, mp: 22, cd: 5000, kind: 'zone', range: 6, radius: 1, power: 2.8, stat: 'mag', magic: true, color: '#ff7b2e', visual: 'pillar', desc: '가장 가까운 적 자리에 불기둥을 세워 주변까지 태운다.' },
  blaze: { name: '폭염', icon: '🌋', level: 20, mp: 30, cd: 8000, kind: 'aoe', radius: 3, power: 2.6, stat: 'mag', magic: true, burn: { power: 0.4, duration: 4000 }, color: '#e74c3c', desc: '주변 3칸을 불바다로 만들고 4초간 화상을 입힌다.' },
  manaflow: { name: '기공환원', icon: '🔄', level: 25, mp: 0, cd: 20000, kind: 'convert', hpPct: 0.3, desc: '현재 체력의 30%를 마력으로 바꾼다.' },
  doom: { name: '천벌', icon: '🌠', level: 30, mp: 60, cd: 20000, kind: 'aoe', radius: 4, power: 3.6, burn: { power: 0.6, duration: 5000 }, stat: 'mag', magic: true, color: '#ff3b3b', visual: 'meteor', desc: '하늘에서 불벼락을 떨어뜨려 주변 4칸을 쓸어버린다.' },

  // ── 도사 ──
  heal: { name: '치유', icon: '💚', level: 1, mp: 8, cd: 2500, kind: 'heal', power: 3.0, flat: 20, stat: 'mag', desc: '자신의 체력을 회복한다.' },
  thunder: { name: '뇌격', icon: '⚡', level: 4, mp: 9, cd: 1600, kind: 'target', range: 5, power: 1.9, stat: 'mag', magic: true, color: '#f4d03f', visual: 'bolt', desc: '5칸 안의 가장 가까운 적에게 벼락을 내린다.' },
  shield: { name: '보호막', icon: '🛡️', level: 8, mp: 15, cd: 25000, kind: 'buff', buff: { stat: 'def', mult: 1.8 }, duration: 15000, desc: '15초간 방어력이 80% 오른다.' },
  paralyze: { name: '마비술', icon: '💫', level: 12, mp: 12, cd: 6000, kind: 'target', range: 6, power: 0.5, stun: 4000, stat: 'mag', magic: true, color: '#f9e79f', desc: '적을 4초간 꼼짝 못 하게 묶는다.' },
  regen: { name: '재생술', icon: '🍀', level: 16, mp: 20, cd: 20000, kind: 'hot', pct: 0.05, duration: 10000, desc: '10초간 매초 최대 체력의 5%를 회복한다.' },
  purify: { name: '정화진', icon: '🔆', level: 20, mp: 26, cd: 7000, kind: 'aoe', radius: 2, power: 2.4, stat: 'mag', magic: true, color: '#fff3a0', visual: 'holy', desc: '신성한 빛으로 주변 2칸의 적을 태운다.' },
  greatheal: { name: '대회복', icon: '💖', level: 25, mp: 35, cd: 40000, kind: 'heal', pct: 1.0, desc: '체력을 모두 회복한다.' },
  divine: { name: '신령강림', icon: '🌟', level: 30, mp: 50, cd: 60000, kind: 'buff', buff: { stat: 'all', mult: 1.4 }, duration: 20000, desc: '20초간 공격·방어·술력이 모두 40% 오른다.' },

  // ── 승급 기술 (tier: 필요한 승급 차수) ──
  swordwave: { name: '검기', icon: '🌊', level: 15, tier: 1, mp: 16, cd: 2500, kind: 'projectile', range: 6, power: 2.6, stat: 'atk', color: '#d6f0ff', visual: 'wave', desc: '칼을 휘둘러 날카로운 검기를 날린다.' },
  roar: { name: '포효', icon: '🦁', level: 22, tier: 1, mp: 24, cd: 15000, kind: 'aoe', radius: 3, power: 0.8, stun: 2500, stat: 'atk', color: '#ffe6a0', desc: '크게 포효해 주변 3칸의 적을 2.5초간 얼어붙게 한다.' },
  skybreak: { name: '파천일격', icon: '🗡️', level: 30, tier: 2, mp: 40, cd: 12000, kind: 'melee', power: 6.0, stun: 1500, crit: true, stat: 'atk', desc: '하늘을 가르는 일격. 반드시 치명타가 된다.' },
  bladestorm: { name: '난무', icon: '🌪️', level: 38, tier: 2, mp: 45, cd: 9000, kind: 'aoe', radius: 2, power: 1.5, hits: 3, stat: 'atk', color: '#ffffff', desc: '칼날 폭풍으로 주변 2칸의 적을 세 번 벤다.' },
  swordsaint: { name: '검성강림', icon: '⚜️', level: 45, tier: 3, mp: 60, cd: 60000, kind: 'buff', buff: { stat: 'all', mult: 1.6 }, duration: 25000, desc: '25초간 공격·방어·술력이 60% 오른다.' },
  earthsplit: { name: '천지분열', icon: '💢', level: 55, tier: 3, mp: 80, cd: 15000, kind: 'line', length: 8, power: 6.5, stun: 1500, stat: 'atk', color: '#ffb347', visual: 'quake', desc: '땅을 쪼개 앞쪽 8칸의 적을 모두 베고 기절시킨다.' },

  stars: { name: '연환표창', icon: '💫', level: 15, tier: 1, mp: 16, cd: 3000, kind: 'multitarget', count: 3, range: 6, power: 1.7, stat: 'atk', color: '#d0d3d4', desc: '표창 세 개를 연달아 던져 가까운 적 3마리를 맞힌다.' },
  poisonmist: { name: '독무', icon: '☁️', level: 22, tier: 1, mp: 24, cd: 10000, kind: 'aoe', radius: 2, power: 0.6, poison: { power: 0.6, duration: 8000 }, stat: 'atk', color: '#8be36b', desc: '독안개를 퍼뜨려 주변 2칸의 적을 8초간 중독시킨다.' },
  clone: { name: '그림자분신', icon: '👥', level: 30, tier: 2, mp: 35, cd: 40000, kind: 'buff', buff: { stat: 'crit', add: 0.5 }, duration: 15000, desc: '분신을 만들어 15초간 치명타 확률이 50% 오른다.' },
  bloodmoon: { name: '혈월참', icon: '🌕', level: 38, tier: 2, mp: 50, cd: 14000, kind: 'multiblink', count: 6, range: 6, power: 2.6, stat: 'atk', desc: '붉은 달빛 아래 주변 적 6마리를 순식간에 벤다.' },
  shadowcut: { name: '절영', icon: '⚫', level: 45, tier: 3, mp: 60, cd: 10000, kind: 'blink', range: 8, power: 7.0, crit: true, stat: 'atk', desc: '그림자마저 끊어 내는 일격. 8칸 안 적의 등 뒤에서 치명타를 꽂는다.' },
  deathnet: { name: '천라지망', icon: '🕸️', level: 55, tier: 3, mp: 85, cd: 18000, kind: 'aoe', radius: 4, power: 3.5, poison: { power: 1.0, duration: 8000 }, stat: 'atk', color: '#9b59b6', desc: '하늘과 땅에 그물을 쳐 주변 4칸의 적을 베고 중독시킨다.' },

  icespear: { name: '빙창', icon: '🧊', level: 15, tier: 1, mp: 18, cd: 3000, kind: 'line', length: 6, power: 2.8, stun: 1000, stat: 'mag', magic: true, color: '#9fe3ff', desc: '얼음 창을 꿰뚫어 앞쪽 6칸의 적을 얼린다.' },
  thundercloud: { name: '뇌운', icon: '⛈️', level: 22, tier: 1, mp: 26, cd: 6000, kind: 'zone', range: 7, radius: 2, power: 2.6, stat: 'mag', magic: true, color: '#c9e7ff', visual: 'storm', desc: '가장 가까운 적 위에 먹구름을 불러 주변 2칸에 벼락을 친다.' },
  firedragon: { name: '화룡', icon: '🐲', level: 30, tier: 2, mp: 45, cd: 8000, kind: 'line', length: 8, power: 3.8, burn: { power: 0.7, duration: 5000 }, stat: 'mag', magic: true, color: '#ff6a2e', desc: '불의 용이 앞쪽 8칸을 휩쓸고 화상을 남긴다.' },
  timestop: { name: '시공정지', icon: '⏳', level: 38, tier: 2, mp: 50, cd: 30000, kind: 'aoe', radius: 4, power: 0.5, stun: 3500, stat: 'mag', magic: true, color: '#d7c6ff', visual: 'ice', desc: '주변 4칸의 시간을 멈춰 적을 3.5초간 묶는다.' },
  overflow: { name: '마력폭주', icon: '🔮', level: 45, tier: 3, mp: 60, cd: 60000, kind: 'buff', buff: { stat: 'mag', mult: 1.8 }, duration: 20000, desc: '20초간 술력이 80% 오른다.' },
  skythunder: { name: '멸천뢰', icon: '🌩️', level: 55, tier: 3, mp: 90, cd: 18000, kind: 'multitarget', count: 8, range: 7, power: 4.5, stat: 'mag', magic: true, color: '#fff27a', desc: '하늘이 무너지는 벼락이 주변 적 8마리에게 떨어진다.' },

  drain: { name: '정기흡수', icon: '🩸', level: 15, tier: 1, mp: 14, cd: 2500, kind: 'target', range: 6, power: 2.2, lifesteal: 0.5, stat: 'mag', magic: true, color: '#ff8fb1', desc: '적의 정기를 빨아들여 준 피해의 절반만큼 체력을 회복한다.' },
  rainbolt: { name: '뇌우', icon: '🌧️', level: 22, tier: 1, mp: 24, cd: 5000, kind: 'multitarget', count: 4, range: 6, power: 2.0, stat: 'mag', magic: true, color: '#f4d03f', desc: '번개비를 내려 가까운 적 4마리를 친다.' },
  guardian: { name: '수호령', icon: '👼', level: 30, tier: 2, mp: 40, cd: 120000, kind: 'guardian', duration: 60000, desc: '60초 동안 쓰러지면 수호령이 체력 50%로 되살려 준다.' },
  judgement: { name: '천벌진', icon: '✴️', level: 38, tier: 2, mp: 45, cd: 9000, kind: 'aoe', radius: 3, power: 3.0, stun: 1000, stat: 'mag', magic: true, color: '#fff3a0', visual: 'holy', desc: '신성한 진을 펼쳐 주변 3칸의 적을 태우고 기절시킨다.' },
  immortal: { name: '신선강림', icon: '🕊️', level: 45, tier: 3, mp: 60, cd: 60000, kind: 'buff', buff: { stat: 'all', mult: 1.5 }, duration: 25000, desc: '25초간 공격·방어·술력이 50% 오른다.' },
  heavenbolt: { name: '천뢰', icon: '⚡', level: 55, tier: 3, mp: 90, cd: 18000, kind: 'aoe', radius: 4, power: 4.2, stat: 'mag', magic: true, color: '#fff27a', visual: 'storm', desc: '하늘의 벼락을 불러 주변 4칸을 모두 내리친다.' },

  // ── 추가 기술 ──
  flamedance: { name: '열풍검무', icon: '💃', level: 34, tier: 2, mp: 42, cd: 10000, kind: 'aoe', radius: 2, power: 1.25, hits: 4, stat: 'atk', color: '#ff9a4d', desc: '불꽃처럼 휘몰아치는 칼춤으로 주변 2칸의 적을 네 번 벤다.' },
  lastresort: { name: '결사일격', icon: '🩸', level: 50, tier: 3, mp: 30, cd: 30000, kind: 'sacrifice', hpPct: 0.4, ratio: 4, desc: '지금 체력의 40%를 바쳐, 바친 체력의 4배만큼 앞의 적에게 피해를 준다.' },
  darkdance: { name: '흑풍검무', icon: '🌀', level: 34, tier: 2, mp: 40, cd: 9000, kind: 'aoe', radius: 2, power: 1.0, hits: 5, stat: 'atk', color: '#8e7cc3', desc: '검은 바람처럼 휘도는 칼춤으로 주변 2칸의 적을 다섯 번 벤다.' },
  gale: { name: '질풍보', icon: '💨', level: 10, mp: 10, cd: 4000, kind: 'leap', range: 5, desc: '바라보는 쪽으로 바람처럼 최대 5칸 도약한다(장애물을 넘어 빈 칸에 내려선다).' },
  karma: { name: '업화', icon: '🔥', level: 50, tier: 3, mp: 85, cd: 22000, kind: 'aoe', radius: 5, power: 4.6, burn: { power: 0.8, duration: 6000 }, stat: 'mag', magic: true, color: '#ff4500', visual: 'meteor', desc: '지옥의 불길을 불러 주변 5칸을 불태우고 오래 타는 화상을 남긴다.' },
  // ── 화면 전체 궁극기(3차·Lv70): 화면 안의 모든 적에게 세 번 내리꽂힌다 ──
  heavenquake: { name: '천지개벽', icon: '🌋', level: 70, tier: 3, mp: 150, cd: 40000, kind: 'screen', hits: 3, power: 2.6, stun: 1200, stat: 'atk', color: '#ffb347', visual: 'quake', desc: '하늘과 땅을 뒤엎어 화면 안의 모든 적을 세 번 내려치고 잠깐 기절시킨다.' },
  bladerain: { name: '만검우', icon: '🗡️', level: 70, tier: 3, mp: 150, cd: 40000, kind: 'screen', hits: 3, power: 2.8, stat: 'atk', color: '#c9d6ff', visual: 'blades', desc: '하늘에서 만 자루 칼날이 비처럼 쏟아져 화면 안의 모든 적을 세 번 벤다.' },
  starfall: { name: '유성낙하', icon: '☄️', level: 70, tier: 3, mp: 160, cd: 40000, kind: 'screen', hits: 3, power: 3.0, burn: { power: 0.8, duration: 6000 }, stat: 'mag', magic: true, color: '#ff6b2e', visual: 'meteor', desc: '유성우를 불러 화면 안의 모든 적에게 세 번 떨어뜨리고 불태운다.' },
  heavenlight: { name: '천상광휘', icon: '🌞', level: 70, tier: 3, mp: 160, cd: 40000, kind: 'screen', hits: 3, power: 2.7, healPct: 0.25, stat: 'mag', magic: true, color: '#fff3a0', visual: 'holy', desc: '하늘빛 기둥으로 화면 안의 모든 적을 세 번 내려치고, 내 체력을 25% 되찾는다.' },
  revival: { name: '회생술', icon: '🕯️', level: 35, tier: 2, mp: 0, cd: 300000, kind: 'passive', desc: '[패시브] 쓰러지면 그 자리에서 체력 30%로 되살아난다(5분에 한 번, 마력 절반 소모).' },
};

// 마법창 칸: a~t(20칸). 앞의 10칸(a~j)이 숫자 단축키 1,2,…,9,0에 연결된다.
export const SKILL_SLOTS = 20;
export const HOTKEY_SLOTS = 10;
export const SPELL_LETTERS = 'abcdefghijklmnopqrst';
export const hotkeyLabel = (i) => (i < HOTKEY_SLOTS ? String((i + 1) % 10) : '');

export const KIND_LABELS = {
  melee: '근접', projectile: '원거리', aoe: '주변 범위', zone: '지정 범위', line: '일직선', target: '단일', chain: '연쇄',
  dash: '돌진', blink: '순간이동', multiblink: '순간이동 연타', multitarget: '다중', buff: '강화', heal: '회복', hot: '지속 회복',
  stealth: '은신', convert: '전환', guardian: '부활', sacrifice: '결사', leap: '도약', passive: '패시브', screen: '화면 전체',
};

/** 배우는 데 드는 금전 (1레벨 기술은 무료) */
export const learnCost = (sk) => (sk.level <= 1 ? 0 : Math.round(sk.level * sk.level * 12 * (1 + (sk.tier ?? 0))));
