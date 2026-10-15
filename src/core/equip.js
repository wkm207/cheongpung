import { ITEMS, isEquipment, WEAPON_CLASS } from '../data/items.js';
import { CLASSES } from '../data/classes.js';
import { computeStats } from './stats.js';
import { addItem, removeAt } from './inventory.js';

export const COMPARE_KEYS = [
  ['atk', '공격'], ['def', '방어'], ['mag', '술력'], ['maxHp', '체력'], ['maxMp', '마력'], ['crit', '치명'],
];

// 직업별로 어떤 능력치를 더 중요하게 볼지(‘더 좋은 장비’ 판단용)
const WEIGHTS = {
  warrior: { atk: 1.5, mag: 0 },
  rogue: { atk: 1.5, mag: 0 },
  mage: { atk: 0.3, mag: 1.5 },
  priest: { atk: 0.5, mag: 1.5 },
};

export function formatStat(key, value) {
  return key === 'crit' ? `${Math.round(value * 100)}%` : String(value);
}

export function canEquip(player, id) {
  const it = ITEMS[id];
  if (!it || !isEquipment(id)) return { ok: false, reason: '장비가 아닙니다.' };
  if (it.wtype && it.wtype !== CLASSES[player.cls].weapon) return { ok: false, reason: `${WEAPON_CLASS[it.wtype]} 전용 무기입니다.` };
  if (it.gender && it.gender !== (player.gender ?? 'm')) return { ok: false, reason: `${it.gender === 'f' ? '여성' : '남성'} 전용 옷입니다.` };
  if ((it.tier ?? 0) > (player.tier ?? 0)) return { ok: false, reason: `${it.tier}차 승급 후 착용할 수 있습니다.` };
  if (player.level < it.level) return { ok: false, reason: `레벨 ${it.level}부터 착용할 수 있습니다.` };
  return { ok: true, reason: '' };
}

/** 두 능력치 사이에서 바뀐 항목만 [{ key, label, before, after, diff }]로 돌려준다. */
export function statDiff(before, after) {
  return COMPARE_KEYS
    .map(([key, label]) => ({ key, label, before: before[key], after: after[key], diff: after[key] - before[key] }))
    .filter((r) => Math.abs(r.diff) > 1e-9);
}

export function withEquip(player, slot, id) {
  return { ...player, equip: { ...player.equip, [slot]: id } };
}

/** id를 끼면 능력치가 어떻게 바뀌는지 */
export function compareEquip(player, id) {
  const slot = ITEMS[id].type;
  return {
    slot,
    current: player.equip[slot],
    rows: statDiff(computeStats(player), computeStats(withEquip(player, slot, id))),
  };
}

/** slot을 벗으면 능력치가 어떻게 바뀌는지 */
export function compareUnequip(player, slot) {
  return statDiff(computeStats(player), computeStats(withEquip(player, slot, null)));
}

function score(cls, s) {
  const w = WEIGHTS[cls];
  return s.atk * w.atk + s.mag * w.mag + s.def + s.maxHp * 0.1 + s.maxMp * 0.05 + s.crit * 150;
}

/** 지금 장비 대비 얼마나 좋아지는지(0 이하면 좋아지지 않음). 착용할 수 없으면 0. */
export function upgradeGain(player, id) {
  if (!canEquip(player, id).ok) return 0;
  const slot = ITEMS[id].type;
  if (player.equip[slot] === id) return 0;
  return score(player.cls, computeStats(withEquip(player, slot, id))) - score(player.cls, computeStats(player));
}

export const isUpgrade = (player, id) => upgradeGain(player, id) > 1e-6;

/** 가방 index의 장비를 낀 새 플레이어(벗은 장비는 가방으로) */
export function equipFromInventory(player, index) {
  const slotItem = player.inv[index];
  const slot = ITEMS[slotItem.id].type;
  const prev = player.equip[slot];
  let inv = removeAt(player.inv, index);
  if (prev) inv = addItem(inv, prev, 1).inv;
  return { ...withEquip(player, slot, slotItem.id), inv };
}

/** 가방에서 더 좋은 장비를 골라 모두 낀 결과와 바뀐 아이템 목록 */
export function autoEquip(player) {
  let p = player;
  const equipped = [];
  for (let guard = 0; guard < 12; guard++) {
    let best = null;
    p.inv.forEach((s, i) => {
      const gain = upgradeGain(p, s.id);
      if (gain > 1e-6 && (!best || gain > best.gain)) best = { i, gain, id: s.id };
    });
    if (!best) break;
    p = equipFromInventory(p, best.i);
    equipped.push(best.id);
  }
  return { player: p, equipped };
}

export function upgradeCount(player) {
  const bestBySlot = new Set();
  for (const s of player.inv) if (isUpgrade(player, s.id)) bestBySlot.add(ITEMS[s.id].type);
  return bestBySlot.size;
}
