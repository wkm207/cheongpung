// 장비 강화(+1~+10): 장비 칸에 붙는 강화라서, 장비를 바꿔 껴도 수치가 그대로 남는다.
import { ITEMS } from '../data/items.js';

export const MAX_ENHANCE = 10;
export const ENHANCE_STEP = 0.08; // 한 단계마다 장비 능력치 +8%
// 다음 단계 성공 확률(+1 → 100%, … +10 → 30%)
const RATES = [1, 1, 0.95, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3];
const SLOT_COST = { weapon: 1.5, armor: 1.2, helmet: 1, shield: 1, necklace: 1, ring: 1, ring2: 1, aux: 1, aux2: 1 };

export const emptyEnhance = () => ({ weapon: 0, helmet: 0, armor: 0, shield: 0, necklace: 0, ring: 0, ring2: 0, aux: 0, aux2: 0 });

/** 다음 강화의 비용·확률. 장비가 없거나 이미 최대면 null */
export function enhanceInfo(player, slot) {
  const plus = player.enhance?.[slot] ?? 0;
  const id = player.equip[slot];
  if (!id || plus >= MAX_ENHANCE) return null;
  const level = ITEMS[id].level ?? 1;
  const cost = Math.round((plus + 1) ** 2 * (500 + level * 120) * SLOT_COST[slot]);
  return { plus, next: plus + 1, cost, rate: RATES[plus] };
}

export const enhanceMult = (plus) => 1 + ENHANCE_STEP * (plus ?? 0);
