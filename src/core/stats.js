import { CLASSES } from '../data/classes.js';
import { ITEMS, PCT_STATS } from '../data/items.js';
import { MAX_LEVEL, DEATH_EXP_PENALTY } from '../config.js';
import { TIER_MULT } from '../data/tiers.js';
import { enhanceMult } from './enhance.js';
import { awakenMult } from './dragon.js';

const STAT_KEYS = ['hp', 'mp', 'atk', 'def', 'mag'];

export function expToNext(level) {
  return Math.round(20 * Math.pow(level, 1.8));
}

/** 레벨과 승급 차수로 정해지는 기본 능력치 */
export function baseStats(cls, level, tier = 0) {
  const c = CLASSES[cls];
  const mult = TIER_MULT[tier] ?? 1;
  return Object.fromEntries(STAT_KEYS.map((k) => [k, Math.round((c.base[k] + c.growth[k] * (level - 1)) * mult)]));
}

/** 장비 칸의 능력치 배율: 강화 × (용 무기면) 각성 */
export function slotMult(player, slot) {
  const it = ITEMS[player.equip[slot]];
  return enhanceMult(player.enhance?.[slot]) * (slot === 'weapon' && it?.dragon ? awakenMult(player.dragonStage) : 1);
}

export function equipBonus(equip, enhance = {}, dragonStage = 0) {
  const keys = [...STAT_KEYS, ...PCT_STATS];
  const bonus = Object.fromEntries(keys.map((k) => [k, 0]));
  for (const [slot, id] of Object.entries(equip)) {
    const it = id && ITEMS[id];
    if (!it) continue;
    const mult = slotMult({ equip, enhance, dragonStage }, slot);
    for (const k of keys) bonus[k] += PCT_STATS.includes(k) ? (it[k] ?? 0) : Math.round((it[k] ?? 0) * mult);
  }
  return bonus;
}

/** 버프는 { stat, mult?, add?, until } 형태. 만료된 버프는 무시한다. */
export function computeStats(player, buffs = [], now = 0) {
  const base = baseStats(player.cls, player.level, player.tier ?? 0);
  const bonus = equipBonus(player.equip, player.enhance, player.dragonStage);
  const mult = { atk: 1, def: 1, mag: 1 };
  let critAdd = 0;
  for (const b of buffs) {
    if (b.until <= now) continue;
    if (b.stat === 'crit') critAdd += b.add;
    else if (b.stat === 'all') for (const k of Object.keys(mult)) mult[k] *= b.mult;
    else mult[b.stat] *= b.mult;
  }
  // 능력치 분배: 힘 → 공격+2, 지력 → 술력+2·마력+4, 체력 → 체력+14·방어+0.5, 민첩 → 치명+0.4%·방어+1
  const a = player.alloc ?? {};
  const str = a.str ?? 0;
  const int = a.int ?? 0;
  const con = a.con ?? 0;
  const dex = a.dex ?? 0;
  return {
    maxHp: base.hp + bonus.hp + con * 14 + (player.bonusHp ?? 0),
    maxMp: base.mp + bonus.mp + int * 4 + (player.bonusMp ?? 0),
    atk: Math.round((base.atk + bonus.atk + str * 2) * mult.atk),
    def: Math.round((base.def + bonus.def + dex + con * 0.5) * mult.def),
    mag: Math.round((base.mag + bonus.mag + int * 2) * mult.mag * (1 + bonus.magPct)),
    crit: Math.min(0.9, CLASSES[player.cls].crit + bonus.crit + critAdd + dex * 0.004),
    mcrit: Math.min(0.6, bonus.mcrit),
    dmgPct: bonus.dmgPct,
    pen: Math.min(0.8, bonus.pen),
    cdr: Math.min(0.5, bonus.cdr),
  };
}

export function gainExp(player, amount) {
  let { level, exp } = player;
  exp += amount;
  let levelsGained = 0;
  while (level < MAX_LEVEL && exp >= expToNext(level)) {
    exp -= expToNext(level);
    level += 1;
    levelsGained += 1;
  }
  if (level >= MAX_LEVEL) exp = 0;
  return { player: { ...player, level, exp }, levelsGained };
}

export function withLevel(player, level) {
  const clamped = Math.max(1, Math.min(MAX_LEVEL, Math.floor(level)));
  return { ...player, level: clamped, exp: 0 };
}

export function withDeathPenalty(player) {
  return { ...player, exp: Math.floor(player.exp * (1 - DEATH_EXP_PENALTY)) };
}
