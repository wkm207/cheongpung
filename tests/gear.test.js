import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPlayer } from '../src/game.js';
import { ITEMS, EQUIP_SLOTS, isEquipment, slotType } from '../src/data/items.js';
import { sourcesOf } from '../src/data/sources.js';
import { targetSlot, equipFromInventory, autoEquip, upgradeGain } from '../src/core/equip.js';
import { validatePlayer } from '../src/core/save.js';

const fresh = () => ({ ...createPlayer('시험', 'warrior'), level: 30, tier: 2 });

test('장비 칸 9개: 반지·보조는 두 칸', () => {
  assert.equal(EQUIP_SLOTS.length, 9);
  assert.deepEqual(EQUIP_SLOTS.filter((s) => slotType(s) === 'ring'), ['ring', 'ring2']);
  assert.deepEqual(EQUIP_SLOTS.filter((s) => slotType(s) === 'aux'), ['aux', 'aux2']);
  assert.ok(isEquipment('woodShield') && isEquipment('luckyPouch'));
});

test('반지 두 개: 빈 칸부터 끼고, 다 차면 약한 쪽을 바꾼다', () => {
  let p = { ...fresh(), inv: [{ id: 'copperRing', qty: 1 }, { id: 'goldRing', qty: 1 }, { id: 'rubyRing', qty: 1 }] };
  p = equipFromInventory(p, 0);
  assert.equal(p.equip.ring, 'copperRing');
  p = equipFromInventory(p, 0);
  assert.equal(p.equip.ring2, 'goldRing');
  assert.equal(targetSlot(p, 'rubyRing'), 'ring'); // 구리 반지가 더 약하다
  p = equipFromInventory(p, 0);
  assert.equal(p.equip.ring, 'rubyRing');
  assert.equal(p.equip.ring2, 'goldRing');
  assert.ok(p.inv.some((s) => s.id === 'copperRing'));
});

test('같은 반지 두 개도 낄 수 있다', () => {
  const p = { ...fresh(), equip: { ...fresh().equip, ring: 'goldRing' }, inv: [{ id: 'goldRing', qty: 1 }] };
  assert.ok(upgradeGain(p, 'goldRing') > 0);
});

test('더 좋은 장비 한 번에: 반지 두 칸과 보조 두 칸, 방패까지 채운다', () => {
  const inv = ['goldRing', 'silverRing', 'luckyPouch', 'spiritBell', 'ironShield'].map((id) => ({ id, qty: 1 }));
  const { player } = autoEquip({ ...fresh(), inv });
  for (const slot of ['ring', 'ring2', 'aux', 'aux2', 'shield']) assert.ok(player.equip[slot], slot);
  assert.equal(player.inv.length, 0);
});

test('옛 저장(칸 5개)도 불러오고 새 칸은 비어 있다', () => {
  const old = { ...fresh(), equip: { weapon: 'woodSword', helmet: null, armor: 'cottonRobe', necklace: null, ring: 'copperRing' } };
  const p = validatePlayer(JSON.parse(JSON.stringify(old)));
  assert.equal(p.equip.ring, 'copperRing');
  for (const slot of ['shield', 'ring2', 'aux', 'aux2']) assert.equal(p.equip[slot], null);
});

test('용 무기(사범에게 받음) 말고 모든 장비는 구하는 곳이 있다', () => {
  const none = Object.keys(ITEMS).filter((id) => isEquipment(id) && !ITEMS[id].dragon && !sourcesOf(id).length);
  assert.deepEqual(none, []);
});
