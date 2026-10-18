import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeStats, slotMult } from '../src/core/stats.js';
import { itemStatText } from '../src/data/items.js';

const warrior = (dragonStage, enhance = {}) => ({
  cls: 'warrior', level: 40, tier: 1, equip: { weapon: 'dragonFangSword' }, enhance, alloc: {}, dragonStage,
});

test('용 무기 각성 단계마다 실제 공격·체력이 오른다', () => {
  const s0 = computeStats(warrior(0));
  const s5 = computeStats(warrior(5));
  assert.equal(s5.atk - s0.atk, 30); // 용아검 공격 40 × 15% × 5
  assert.ok(s5.maxHp > s0.maxHp);
});

test('slotMult: 각성·강화 배율은 용 무기 칸에만, 곱해서', () => {
  assert.equal(slotMult(warrior(0), 'weapon'), 1);
  assert.equal(slotMult(warrior(2), 'weapon'), 1.3);
  assert.equal(slotMult(warrior(0), 'armor'), 1);
  const ironSword = { ...warrior(4), equip: { weapon: 'ironSword' } };
  assert.equal(slotMult(ironSword, 'weapon'), 1);
});

test('itemStatText 에 배율을 주면 각성된 수치로 보인다(퍼센트 수치는 그대로)', () => {
  assert.match(itemStatText('dragonFangSword'), /공격 \+40/);
  assert.match(itemStatText('dragonFangSword', 1.3), /공격 \+52/);
  assert.match(itemStatText('dragonScaleDagger', 2), /치명 \+6%/);
});
