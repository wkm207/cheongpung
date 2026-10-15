import { randInt } from './rng.js';

export const CRIT_MULT = 1.8;

/** 플레이어가 몬스터에게 주는 피해. 술법(magic)은 방어력 영향을 덜 받는다. */
export function rollDamage({ power, attackStat, defense, crit = 0, magic = false }, rng = Math.random) {
  const variance = 0.85 + rng() * 0.3;
  const reduced = attackStat * power * variance - defense * (magic ? 0.25 : 0.5);
  const isCrit = rng() < crit;
  const dmg = Math.max(1, Math.round(reduced * (isCrit ? CRIT_MULT : 1)));
  return { dmg, isCrit };
}

/** 몬스터가 플레이어에게 주는 피해. */
export function monsterDamage(atk, defense, power = 1, rng = Math.random) {
  const variance = 0.85 + rng() * 0.3;
  return Math.max(1, Math.round(atk * power * variance - defense * 0.4));
}

export function rollDrops(drops, rng = Math.random) {
  return drops.filter(([, chance]) => rng() < chance).map(([id]) => id);
}

export function rollGold([min, max], rng = Math.random) {
  return randInt(rng, min, max);
}
