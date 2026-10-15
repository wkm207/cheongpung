import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MAP_DEFS, getTiles } from '../src/data/maps.js';
import { SOLID } from '../src/world/mapgen.js';
import { MONSTERS } from '../src/data/monsters.js';
import { ITEMS } from '../src/data/items.js';
import { CLASSES } from '../src/data/classes.js';
import { SKILLS } from '../src/data/skills.js';
import { RESPAWN_POINT } from '../src/config.js';

function reachable(tiles, sx, sy) {
  const h = tiles.length;
  const w = tiles[0].length;
  const seen = new Set([`${sx},${sy}`]);
  const queue = [[sx, sy]];
  while (queue.length) {
    const [x, y] = queue.pop();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx;
      const ny = y + dy;
      const key = `${nx},${ny}`;
      if (nx < 0 || ny < 0 || nx >= w || ny >= h || seen.has(key) || SOLID.has(tiles[ny][nx])) continue;
      seen.add(key);
      queue.push([nx, ny]);
    }
  }
  return seen;
}

const walkable = (tiles, x, y) => tiles[y]?.[x] !== undefined && !SOLID.has(tiles[y][x]);
const inPortal = (def, x, y) => def.portals.some((p) => x >= p.x && x < p.x + p.w && y >= p.y && y < p.y + p.h);

for (const [id, def] of Object.entries(MAP_DEFS)) {
  test(`${def.name}: 크기와 모든 포탈·도착 지점이 서로 이어져 있다`, () => {
    const tiles = getTiles(id);
    assert.equal(tiles.length, def.h);
    assert.ok(tiles.every((row) => row.length === def.w));

    const firstPortal = def.portals[0];
    const seen = reachable(tiles, firstPortal.x, firstPortal.y);
    for (const p of def.portals) {
      for (let y = p.y; y < p.y + p.h; y++) {
        for (let x = p.x; x < p.x + p.w; x++) assert.ok(seen.has(`${x},${y}`), `포탈 칸 (${x},${y}) 도달 불가`);
      }
      const target = MAP_DEFS[p.to];
      assert.ok(target, `${p.to} 맵 없음`);
      const tt = getTiles(p.to);
      assert.ok(walkable(tt, p.tx, p.ty), `${p.to}의 도착 지점 (${p.tx},${p.ty})이 막혀 있음`);
      assert.ok(!inPortal(target, p.tx, p.ty), `${p.to}의 도착 지점이 포탈 위라 왕복 이동이 반복됨`);
    }
    for (const n of def.npcs ?? []) {
      assert.ok(walkable(tiles, n.x, n.y), `${n.name} 자리가 막혀 있음`);
      const neighbors = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => seen.has(`${n.x + dx},${n.y + dy}`));
      assert.ok(neighbors.length > 0, `${n.name}에게 다가갈 수 없음`);
      for (const itemId of n.shop ?? []) assert.ok(ITEMS[itemId], `상점 아이템 ${itemId} 없음`);
    }
    for (const [type] of def.spawns) assert.ok(MONSTERS[type], `몬스터 ${type} 없음`);
  });
}

test('부활 지점은 마을 안 걸을 수 있는 칸이다', () => {
  assert.ok(walkable(getTiles(RESPAWN_POINT.mapId), RESPAWN_POINT.x, RESPAWN_POINT.y));
});

test('데이터 참조가 모두 유효하다', () => {
  for (const m of Object.values(MONSTERS)) for (const [itemId] of m.drops) assert.ok(ITEMS[itemId], itemId);
  for (const c of Object.values(CLASSES)) {
    assert.equal(ITEMS[c.startWeapon].wtype, c.weapon);
    for (const s of c.skills) assert.ok(SKILLS[s], s);
  }
});
