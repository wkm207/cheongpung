import { SAVE_KEY, INVENTORY_SIZE, STACK_MAX, MAX_LEVEL, RESPAWN_POINT } from '../config.js';
import { CLASSES } from '../data/classes.js';
import { ITEMS, EQUIP_SLOTS, isStackable, slotType } from '../data/items.js';
import { MAP_DEFS } from '../data/maps.js';
import { QUEST_CHAINS, newQuestState } from '../data/quests.js';
import { sanitizeSlots, sanitizeLearned } from './skillslots.js';
import { computeStats } from './stats.js';
import { canEquip } from './equip.js';
import { addItem } from './inventory.js';
import { emptyEnhance, MAX_ENHANCE } from './enhance.js';
import { validateRoyal } from './royal.js';

const SAVE_FORMAT = 'cheongpung-save';

/** 저장소 자체에 접근이 막힌 환경(쿠키 차단 등)에서도 예외 없이 null */
function store() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

const isInt = (v) => Number.isInteger(v);
// 'constructor' 같은 프로토타입 키가 검증을 통과하지 않도록 자기 키만 인정한다
const has = (table, key) => typeof key === 'string' && Object.hasOwn(table, key);
const isNum = (v) => typeof v === 'number' && Number.isFinite(v);

/** 외부(로컬 저장소, 붙여넣은 백업)에서 들어온 데이터를 검증해 안전한 플레이어 객체로 만든다. */
export function validatePlayer(raw) {
  if (!raw || typeof raw !== 'object') throw new Error('캐릭터 정보가 없습니다.');
  const name = typeof raw.name === 'string' ? raw.name.trim().slice(0, 12) : '';
  if (!name) throw new Error('이름이 올바르지 않습니다.');
  if (!has(CLASSES, raw.cls)) throw new Error('직업 정보가 올바르지 않습니다.');
  if (!isInt(raw.level) || raw.level < 1 || raw.level > MAX_LEVEL) throw new Error('레벨이 올바르지 않습니다.');
  if (!Array.isArray(raw.inv)) throw new Error('가방 정보가 올바르지 않습니다.');

  const inv = raw.inv
    .filter((s) => s && has(ITEMS, s.id) && isInt(s.qty) && s.qty > 0)
    .slice(0, INVENTORY_SIZE)
    .map((s) => ({ id: s.id, qty: isStackable(s.id) ? Math.min(s.qty, STACK_MAX) : 1 }));

  const equip = {};
  for (const slot of EQUIP_SLOTS) {
    const id = raw.equip?.[slot];
    equip[slot] = has(ITEMS, id) && ITEMS[id].type === slotType(slot) ? id : null;
  }

  const onValidMap = has(MAP_DEFS, raw.mapId) && isInt(raw.x) && isInt(raw.y);
  const tier = isInt(raw.tier) && raw.tier >= 0 && raw.tier <= 3 ? raw.tier : 0;
  const learned = sanitizeLearned(raw.learned, raw.cls, raw.level, tier);
  // 직업·레벨·승급 제한에 안 맞는 장비는 가방으로 돌린다(자리가 없으면 버린다)
  let bag = inv;
  const probe = { cls: raw.cls, level: raw.level, tier };
  for (const slot of EQUIP_SLOTS) {
    if (equip[slot] && !canEquip(probe, equip[slot]).ok) {
      bag = addItem(bag, equip[slot], 1).inv;
      equip[slot] = null;
    }
  }
  const enhance = Object.fromEntries(Object.keys(emptyEnhance()).map((k) => {
    const v = raw.enhance?.[k];
    return [k, isInt(v) && v >= 0 && v <= MAX_ENHANCE ? v : 0];
  }));
  const alloc = Object.fromEntries(['str', 'dex', 'int', 'con'].map((k) => [k, isInt(raw.alloc?.[k]) && raw.alloc[k] >= 0 ? raw.alloc[k] : 0]));
  const spent = Object.values(alloc).reduce((x, y) => x + y, 0);
  const budget = (raw.level - 1) * 3;
  // 예전 저장(능력치 분배 이전)은 그동안 받았어야 할 점수를 한꺼번에 준다
  const statPoints = isInt(raw.statPoints) && raw.statPoints >= 0 ? Math.min(raw.statPoints, Math.max(0, budget - spent)) : Math.max(0, budget - spent);
  const fairAlloc = spent <= budget ? alloc : { str: 0, dex: 0, int: 0, con: 0 };
  const bonusHp = isInt(raw.bonusHp) && raw.bonusHp >= 0 ? raw.bonusHp : 0;
  const bonusMp = isInt(raw.bonusMp) && raw.bonusMp >= 0 ? raw.bonusMp : 0;
  const max = computeStats({ cls: raw.cls, level: raw.level, tier, equip, enhance, alloc: fairAlloc, bonusHp, bonusMp });
  return {
    name,
    cls: raw.cls,
    gender: raw.gender === 'f' ? 'f' : 'm',
    level: raw.level,
    exp: isNum(raw.exp) && raw.exp >= 0 ? Math.floor(raw.exp) : 0,
    gold: isNum(raw.gold) && raw.gold >= 0 ? Math.floor(raw.gold) : 0,
    hp: isNum(raw.hp) && raw.hp > 0 ? Math.min(max.maxHp, Math.floor(raw.hp)) : 1,
    mp: isNum(raw.mp) && raw.mp >= 0 ? Math.min(max.maxMp, Math.floor(raw.mp)) : 0,
    inv: bag,
    equip,
    mapId: onValidMap ? raw.mapId : RESPAWN_POINT.mapId,
    x: onValidMap ? raw.x : RESPAWN_POINT.x,
    y: onValidMap ? raw.y : RESPAWN_POINT.y,
    dir: ['up', 'down', 'left', 'right'].includes(raw.dir) ? raw.dir : 'down',
    playMs: isNum(raw.playMs) && raw.playMs >= 0 ? raw.playMs : 0,
    gm: { god: raw.gm?.god === true, speed: [1, 2, 3].includes(raw.gm?.speed) ? raw.gm.speed : 1 },
    quests: validateQuests(raw.quests),
    tier,
    enhance,
    dragonStage: isInt(raw.dragonStage) && raw.dragonStage >= 0 && raw.dragonStage <= 10 ? raw.dragonStage : 0,
    dragonClaimed: raw.dragonClaimed === true,
    royal: validateRoyal(raw.royal),
    statPoints: spent <= budget ? statPoints : budget,
    alloc: fairAlloc,
    bonusHp,
    bonusMp,
    learned,
    skillSlots: sanitizeSlots(raw.skillSlots, learned),
  };
}

function validateQuests(raw) {
  const fresh = newQuestState();
  if (!raw || typeof raw !== 'object') return fresh;
  return Object.fromEntries(Object.entries(fresh).map(([npc, def]) => {
    const q = raw[npc];
    if (!q || typeof q !== 'object') return [npc, def];
    if (q.id === null) return [npc, { id: null, accepted: false, kills: 0 }];
    if (!QUEST_CHAINS[npc].some((x) => x.id === q.id)) return [npc, def];
    return [npc, { id: q.id, accepted: q.accepted === true, kills: isInt(q.kills) && q.kills >= 0 ? q.kills : 0 }];
  }));
}

export function exportText(player) {
  return JSON.stringify({ format: SAVE_FORMAT, version: 1, savedAt: new Date().toISOString(), player });
}

export function importText(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('백업 내용을 읽을 수 없습니다. 복사한 글자가 모두 붙여넣어졌는지 확인해 주세요.');
  }
  if (data?.format !== SAVE_FORMAT) throw new Error('Country of Wind 백업 데이터가 아닙니다.');
  return validatePlayer(data.player);
}

export const SAVE_SLOTS = 4;
const slotKey = (slot) => `${SAVE_KEY}-slot${slot}`;

/** 슬롯이 생기기 전의 저장(하나짜리)을 빈 슬롯으로 옮긴다. */
function migrateLegacy(storage) {
  try {
    const legacy = storage?.getItem(SAVE_KEY);
    if (!legacy) return;
    for (let slot = 0; slot < SAVE_SLOTS; slot++) {
      if (storage.getItem(slotKey(slot))) continue;
      storage.setItem(slotKey(slot), legacy);
      storage.removeItem(SAVE_KEY);
      return;
    }
  } catch {
    // 저장소를 못 쓰는 환경이면 옮기지 않는다
  }
}

export function loadSave(slot = 0, storage = store()) {
  migrateLegacy(storage);
  try {
    const text = storage?.getItem(slotKey(slot));
    return text ? importText(text) : null;
  } catch {
    return null;
  }
}

/** 슬롯에 글자는 있는데 읽을 수 없으면(손상) true */
export function isCorrupt(slot, storage = store()) {
  try {
    const text = storage?.getItem(slotKey(slot));
    if (!text) return false;
    importText(text);
    return false;
  } catch {
    return true;
  }
}

/** 슬롯 4칸의 캐릭터(없으면 null) */
export function listSaves(storage = store()) {
  return Array.from({ length: SAVE_SLOTS }, (_, slot) => loadSave(slot, storage));
}

/** 성공하면 true. 저장 공간이 막힌 경우(사생활 보호 모드 등) false. */
export function writeSave(player, slot = 0, storage = store()) {
  try {
    storage.setItem(slotKey(slot), exportText(player));
    return true;
  } catch {
    return false;
  }
}

export function deleteSave(slot, storage = store()) {
  try {
    storage.removeItem(slotKey(slot));
    return true;
  } catch {
    return false;
  }
}

/** 슬롯의 저장 글자 그대로(없거나 못 읽으면 null). 서버와 맞출 때 쓴다. */
export function readSlotText(slot, storage = store()) {
  migrateLegacy(storage);
  try {
    return storage?.getItem(slotKey(slot)) ?? null;
  } catch {
    return null;
  }
}

/** 서버에서 받은 저장 글자를 슬롯에 그대로 넣는다(null 이면 비운다). 검증된 글자만 넣을 것. */
export function writeSlotText(slot, text, storage = store()) {
  try {
    if (text === null) storage.removeItem(slotKey(slot));
    else storage.setItem(slotKey(slot), text);
    return true;
  } catch {
    return false;
  }
}
