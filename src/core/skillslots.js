import { CLASSES } from '../data/classes.js';
import { SKILLS, SKILL_SLOTS } from '../data/skills.js';

/** 레벨·승급 차수로 배울 수 있게 된 기술 목록(배웠는지와 무관) */
export function unlockedSkills(cls, level, tier = 0) {
  return CLASSES[cls].skills.filter((id) => SKILLS[id].level <= level && (SKILLS[id].tier ?? 0) <= tier);
}

/** 처음 시작할 때 아는 기술(1레벨 기술) */
export function starterSkills(cls) {
  return CLASSES[cls].skills.filter((id) => SKILLS[id].level <= 1);
}

export function defaultSlots(learned) {
  return Array.from({ length: SKILL_SLOTS }, (_, i) => learned[i] ?? null);
}

/** 새로 배운 기술을 빈 슬롯에 넣는다. */
export function slotNewSkill(slots, id) {
  if (slots.includes(id)) return slots;
  const empty = slots.indexOf(null);
  if (empty === -1) return slots;
  return slots.map((s, i) => (i === empty ? id : s));
}

/** slotIndex에 기술을 넣는다. 다른 슬롯에 있던 기술이면 자리를 맞바꾼다. */
export function assignSlot(slots, slotIndex, id) {
  const next = [...slots];
  const from = next.indexOf(id);
  const prev = next[slotIndex];
  next[slotIndex] = id;
  if (from >= 0 && from !== slotIndex) next[from] = prev;
  return next;
}

export function sanitizeLearned(raw, cls, level, tier) {
  // 예전 저장(배우기 기능 이전)은 레벨에 맞는 기술을 모두 배운 것으로 본다
  const allowed = unlockedSkills(cls, level, tier);
  const list = Array.isArray(raw) ? raw.filter((id) => typeof id === 'string' && allowed.includes(id)) : allowed;
  return [...new Set([...starterSkills(cls), ...list])];
}

export function sanitizeSlots(raw, learned) {
  if (!Array.isArray(raw)) return defaultSlots(learned);
  const seen = new Set();
  let slots = Array.from({ length: SKILL_SLOTS }, (_, i) => {
    const id = raw[i];
    if (typeof id !== 'string' || !learned.includes(id) || seen.has(id)) return null;
    seen.add(id);
    return id;
  });
  // 배웠는데 칸이 없는 마법은 빈 칸에 차례로 넣고, 사이사이 빈 칸은 당겨 a, b, c… 에 빈틈없이
  for (const id of learned) slots = slotNewSkill(slots, id);
  const filled = slots.filter(Boolean);
  return Array.from({ length: SKILL_SLOTS }, (_, i) => filled[i] ?? null);
}
