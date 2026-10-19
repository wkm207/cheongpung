// 아이템 → 실사 아이콘(assets/icons/{묶음}_{번호}.png). 묶음 그림은 art/PROMPTS.md 의 순서대로 16칸.
// 무기·옷·목걸이·반지는 레벨 순으로 고르게 나눠 주고, 생김새가 분명한 것은 하나하나 정해 둔다.
import { ITEMS } from './items.js';

// 하나하나 정한 것
const FIXED = {
  // 소모품: 약초 산삼 이슬병 꿀단지 약상자 대추그릇 떡 국밥 술병 두루마리 …
  herb: 'potion_1', bigHerb: 'potion_2', dew: 'potion_3', bigDew: 'potion_14', elixir: 'potion_5',
  tteok: 'potion_15', gukbap: 'potion_8', makgeolli: 'potion_9', returnScroll: 'potion_10',
  // 전리품
  acorn: 'loot_1', rabbitFur: 'loot_2', foxTail: 'loot_3', wolfFang: 'loot_4', goblinHorn: 'loot_5', dueokHorn: 'loot_5',
  boarTusk: 'loot_6', whiteFur: 'loot_7', snowPelt: 'loot_7', ghostBead: 'loot_8', snakeSpirit: 'loot_8',
  imugiScale: 'loot_9', blueScale: 'loot_9', redScale: 'loot_9', frostCrystal: 'loot_9', dragonOrb: 'loot_10',
  amber: 'loot_11', darkAmber: 'loot_11', emberStone: 'loot_11', ratMeat: 'loot_12', snakeMeat: 'loot_12', pigMeat: 'loot_12',
  forestPigMeat: 'loot_12', batWing: 'loot_13', ironScale: 'loot_15', dragonBreath: 'loot_16', foxBead: 'loot_16',
  firebirdFeather: 'fan_16', guardCharm: 'charm_2', zodiacJade: 'charm_8', islandCoin: 'charm_15', pearlShell: 'jewelry_3',
  horseTicket: 'potion_16',
  // 신물 무기는 불꽃 그림
  jujakSword: 'sword_14', jujakFan: 'fan_16',
  // 쓰개: 삿갓 · 검은 갓 · 두건 · 가죽모자 · 투구들 · 관
  strawHat: 'helmet_1', jeonrip: 'helmet_2', heukrip: 'helmet_3', headband: 'helmet_4', paeraengi: 'helmet_5',
  leatherCap: 'helmet_6', ironHelm: 'helmet_8', eagleHelm: 'helmet_10', dragonHelm: 'helmet_12',
  highHelm55: 'helmet_13', highHelm65: 'helmet_14', highHelm75: 'helmet_11', phoenixCrown: 'helmet_15', highHelm85: 'helmet_16',
  // 방패
  woodShield: 'shield_1', leatherShield: 'shield_2', ironShield: 'shield_6', mirrorShield: 'shield_11', turtleShield: 'shield_9',
  ghostFaceShield: 'shield_13', blackTortoiseShield: 'shield_14', highShield55: 'shield_12', highShield65: 'shield_7',
  highShield75: 'shield_15', highShield85: 'shield_16',
  // 보조
  luckyPouch: 'charm_1', paperCharm: 'charm_2', gourdBottle: 'charm_3', spiritBell: 'charm_4', incensePouch: 'charm_5',
  tigerClaw: 'charm_6', bronzeMirror: 'charm_7', thunderCharm: 'charm_12', jadeTablet: 'charm_8', foxTailCharm: 'charm_9',
  highAux55: 'charm_11', highAux65: 'charm_13', highAux75: 'charm_14', highAux85: 'charm_16',
};

// 레벨 순으로 고르게 나눠 줄 무리: [고르는 조건, 묶음, 쓸 번호들]
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const SPREAD = [
  [(it) => it.wtype === 'sword', 'sword', range(1, 16)],
  [(it) => it.wtype === 'dagger', 'dagger', range(1, 16)],
  [(it) => it.wtype === 'staff', 'staff', range(1, 16)],
  [(it) => it.wtype === 'fan', 'fan', range(1, 16)],
  [(it) => it.type === 'armor', 'armor', range(1, 16)],
  [(it) => it.type === 'necklace', 'jewelry', range(1, 8)],
  [(it) => it.type === 'ring', 'jewelry', range(9, 16)],
];

const strength = ([, it]) => (it.level ?? 0) * 10 + (it.tier ?? 0) + (it.price ?? 0) / 1e9;

function build() {
  const art = { ...FIXED };
  for (const [match, group, nums] of SPREAD) {
    const list = Object.entries(ITEMS).filter(([id, it]) => match(it) && !art[id]).sort((a, b) => strength(a) - strength(b));
    const taken = new Set(Object.values(art).filter((v) => v.startsWith(`${group}_`)).map((v) => Number(v.split('_')[1])));
    const free = nums.filter((n) => !taken.has(n));
    const pool = free.length >= list.length ? free : nums;
    list.forEach(([id], i) => {
      const k = list.length > 1 ? Math.round((i * (pool.length - 1)) / (list.length - 1)) : 0;
      art[id] = `${group}_${pool[k]}`;
    });
  }
  return art;
}

/** 아이템 id → 아이콘 이름(예: 'sword_3'). 정하지 않은 것은 없음 */
export const ITEM_ART = build();
