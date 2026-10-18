// 용 무기 각성: 용 무기만 1~10단계로 각성할 수 있고, 단계마다 그 무기의 능력치가 15%씩 오른다.
import { ITEMS } from '../data/items.js';

export const MAX_AWAKEN = 10;
export const AWAKEN_STEP = 0.15;
export const DRAGON_WEAPONS = { warrior: 'dragonFangSword', rogue: 'dragonScaleDagger', mage: 'dragonSongStaff', priest: 'dragonCloudFan' };

export const awakenMult = (stage) => 1 + AWAKEN_STEP * (stage ?? 0);

/** 장비 칸 이름 옆에 붙일 각성 표시(용 무기를 끼고 1단계 이상일 때만) */
export const awakenLabel = (player, slot) =>
  slot === 'weapon' && ITEMS[player.equip.weapon]?.dragon && player.dragonStage ? `🐲각성${player.dragonStage}` : '';

/** 다음 각성에 드는 재료·금전. 용 무기를 끼고 있지 않거나 최대면 null */
export function awakenInfo(player) {
  const id = player.equip.weapon;
  if (!id || !ITEMS[id]?.dragon) return null;
  const stage = player.dragonStage ?? 0;
  if (stage >= MAX_AWAKEN) return null;
  return { stage, next: stage + 1, breath: stage + 1, gold: (stage + 1) * 20000 };
}
