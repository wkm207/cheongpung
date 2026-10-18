// 어명 사냥: 성주가 내 레벨에 맞는 몬스터를 정해 주고, 다 잡아 오면 그 몬스터 경험치의 10배를 내린다.
import { MONSTERS } from '../data/monsters.js';
import { MAP_DEFS } from '../data/maps.js';

export const ROYAL_COUNT = 20;
export const ROYAL_EXP_MULT = 10;

/** 맵에 실제로 나오는 보통 몬스터(보스 제외) */
function huntable() {
  const types = new Set();
  for (const def of Object.values(MAP_DEFS)) for (const [t] of def.spawns ?? []) if (!MONSTERS[t].boss) types.add(t);
  return [...types];
}

/** 레벨에 맞는 어명 후보: 내 레벨 -12 ~ +2. 없으면 레벨이 가장 가까운 몬스터 */
export function royalCandidates(level) {
  const all = huntable();
  const fit = all.filter((t) => MONSTERS[t].level >= level - 12 && MONSTERS[t].level <= level + 2);
  if (fit.length) return fit;
  const best = Math.min(...all.map((t) => Math.abs(MONSTERS[t].level - level)));
  return all.filter((t) => Math.abs(MONSTERS[t].level - level) === best);
}

export function newRoyalOrder(level, rng = Math.random) {
  const list = royalCandidates(level);
  return { type: list[Math.floor(rng() * list.length)], need: ROYAL_COUNT, have: 0 };
}

export const royalReward = (order) => MONSTERS[order.type].exp * order.need * ROYAL_EXP_MULT;

/** 저장본 검사: 이상하면 null */
export function validateRoyal(raw) {
  if (!raw || typeof raw !== 'object' || !MONSTERS[raw.type] || MONSTERS[raw.type].boss) return null;
  const need = Number.isInteger(raw.need) && raw.need > 0 && raw.need <= 100 ? raw.need : ROYAL_COUNT;
  const have = Number.isInteger(raw.have) && raw.have >= 0 ? Math.min(raw.have, need) : 0;
  return { type: raw.type, need, have };
}
