// 아이템을 어디서 구하는지: 몬스터 떨굼(맵·확률)과 상점 판매를 데이터에서 찾아 준다.
import { MONSTERS } from './monsters.js';
import { MAP_DEFS } from './maps.js';

/** 몬스터가 나오는 맵 이름들(굴은 '쥐굴 2·3층'처럼 묶는다) */
function mapsOf(type) {
  const names = Object.values(MAP_DEFS).filter((d) => (d.spawns ?? []).some(([t]) => t === type)).map((d) => d.name);
  const grouped = new Map();
  for (const n of names) {
    const m = n.match(/^(.*) (\d+)층$/);
    if (!m) grouped.set(n, null);
    else grouped.set(m[1], [...(grouped.get(m[1]) ?? []), m[2]]);
  }
  return [...grouped].map(([name, floors]) => (floors ? `${name} ${floors.join('·')}층` : name));
}

/**
 * itemId를 얻는 곳 목록. 떨굼 확률이 1 이상이면 그 수만큼 확정으로 떨군다.
 * [{ kind: 'drop', monster, level, boss, maps, chance } | { kind: 'shop', npc, map }]
 */
export function sourcesOf(itemId) {
  const out = [];
  for (const [type, m] of Object.entries(MONSTERS)) {
    for (const [id, chance] of m.drops) {
      if (id !== itemId) continue;
      const maps = mapsOf(type);
      if (maps.length) out.push({ kind: 'drop', monster: m.name, level: m.level, boss: !!m.boss, maps, chance });
    }
  }
  for (const def of Object.values(MAP_DEFS)) {
    for (const npc of def.npcs ?? []) if (npc.shop?.includes(itemId)) out.push({ kind: 'shop', npc: npc.name, map: def.name });
  }
  // 상점 → 잘 나오는 곳(20% 이상) 중 레벨 낮은 곳 → 드물게 나오는 곳
  const tier = (s) => (s.kind === 'shop' ? 0 : s.chance >= 0.2 ? 1 : 2);
  return out.sort((a, b) => tier(a) - tier(b) || (a.level ?? 0) - (b.level ?? 0) || (b.chance ?? 0) - (a.chance ?? 0));
}

const chanceText = (c) => (c >= 1 ? `${Math.floor(c)}개 확정${c % 1 ? ` +${Math.round((c % 1) * 100)}%` : ''}` : `${Math.max(1, Math.round(c * 100))}%`);

/** 짧은 안내 글: "깊은 산의 장산범(Lv22) 35% · …" (max개까지) */
export function sourcesText(itemId, max = 3) {
  const list = sourcesOf(itemId);
  if (!list.length) return '';
  const parts = list.slice(0, max).map((s) => (s.kind === 'shop'
    ? `${s.map} ${s.npc}에게서 구입`
    : `${s.maps.join(', ')}의 ${s.boss ? '👑' : ''}${s.monster}(Lv${s.level}) ${chanceText(s.chance)}`));
  return parts.join(' · ') + (list.length > max ? ` 외 ${list.length - max}곳` : '');
}
