import { test } from 'node:test';
import assert from 'node:assert/strict';
import { expToNext, computeStats, gainExp, withLevel, withDeathPenalty } from '../src/core/stats.js';
import { rollDamage, monsterDamage, rollDrops } from '../src/core/combat.js';
import { addItem, removeAt, countOf, canAdd } from '../src/core/inventory.js';
import { validatePlayer, exportText, importText, loadSave, writeSave, listSaves, deleteSave } from '../src/core/save.js';
import { parseCommand, resolveItem, resolveMap, resolveMonster, resolveClass } from '../src/core/gm.js';
import { INVENTORY_SIZE, MAX_LEVEL } from '../src/config.js';

const basePlayer = () => ({
  name: '테스터', cls: 'warrior', level: 1, exp: 0, gold: 0, hp: 10, mp: 5,
  inv: [], equip: { weapon: 'woodSword', armor: 'cottonRobe', helmet: null },
  mapId: 'village', x: 19, y: 17, dir: 'down', playMs: 0, gm: { god: false, speed: 1 },
});

test('경험치 요구량은 레벨이 오를수록 커진다', () => {
  for (let lv = 1; lv < 50; lv++) assert.ok(expToNext(lv + 1) > expToNext(lv));
  assert.equal(expToNext(1), 20);
});

test('장비와 버프가 능력치에 반영된다', () => {
  const p = basePlayer();
  const s = computeStats(p);
  assert.equal(s.atk, 9 + 3);
  assert.equal(s.def, 4 + 2);
  const buffed = computeStats(p, [{ stat: 'atk', mult: 1.5, until: 100 }, { stat: 'crit', add: 0.3, until: 100 }], 50);
  assert.equal(buffed.atk, 18);
  assert.ok(Math.abs(buffed.crit - 0.35) < 1e-9);
  const expired = computeStats(p, [{ stat: 'atk', mult: 1.5, until: 100 }], 200);
  assert.equal(expired.atk, 12);
});

test('경험치를 얻으면 여러 레벨을 한 번에 오를 수 있고 원본은 그대로다', () => {
  const p = basePlayer();
  const { player, levelsGained } = gainExp(p, expToNext(1) + expToNext(2) + 5);
  assert.equal(levelsGained, 2);
  assert.equal(player.level, 3);
  assert.equal(player.exp, 5);
  assert.equal(p.level, 1);
});

test('최대 레벨을 넘지 않는다', () => {
  const { player } = gainExp(withLevel(basePlayer(), MAX_LEVEL - 1), 1e12);
  assert.equal(player.level, MAX_LEVEL);
  assert.equal(withLevel(basePlayer(), 500).level, MAX_LEVEL);
  assert.equal(withLevel(basePlayer(), -3).level, 1);
});

test('사망 시 현재 경험치의 10%를 잃는다', () => {
  assert.equal(withDeathPenalty({ ...basePlayer(), exp: 100 }).exp, 90);
});

test('피해량은 최소 1이고 치명타는 더 아프다', () => {
  const low = () => 0;
  assert.equal(rollDamage({ power: 1, attackStat: 1, defense: 999 }, low).dmg, 1);
  const normal = rollDamage({ power: 1, attackStat: 100, defense: 0, crit: 0 }, () => 0.5);
  const crit = rollDamage({ power: 1, attackStat: 100, defense: 0, crit: 1 }, () => 0.5);
  assert.ok(crit.isCrit && !normal.isCrit);
  assert.ok(crit.dmg > normal.dmg);
  assert.equal(monsterDamage(5, 1000, 1, low), 1);
});

test('드롭 확률표대로 아이템이 떨어진다', () => {
  assert.deepEqual(rollDrops([['a', 0.5], ['b', 0.1]], () => 0.3), ['a']);
  assert.deepEqual(rollDrops([['a', 0.5]], () => 0.9), []);
});

test('소모품은 99개까지 쌓이고 장비는 한 칸씩 차지한다', () => {
  let { inv, leftover } = addItem([], 'herb', 150);
  assert.equal(leftover, 0);
  assert.deepEqual(inv, [{ id: 'herb', qty: 99 }, { id: 'herb', qty: 51 }]);
  ({ inv } = addItem(inv, 'ironSword', 2));
  assert.equal(inv.length, 4);
  assert.equal(countOf(inv, 'herb'), 150);
});

test('가방이 가득 차면 남은 개수를 돌려준다', () => {
  const { inv } = addItem([], 'ironSword', INVENTORY_SIZE);
  assert.equal(inv.length, INVENTORY_SIZE);
  assert.equal(addItem(inv, 'herb', 3).leftover, 3);
  assert.equal(canAdd(inv, 'herb'), false);
});

test('아이템 제거는 원본을 바꾸지 않는다', () => {
  const inv = [{ id: 'herb', qty: 3 }, { id: 'dew', qty: 1 }];
  const less = removeAt(inv, 0, 1);
  assert.equal(less[0].qty, 2);
  assert.equal(inv[0].qty, 3);
  assert.deepEqual(removeAt(inv, 1), [{ id: 'herb', qty: 3 }]);
  assert.equal(addItem(inv, 'nope', 1).inv, inv);
});

test('백업 내보내기 → 불러오기 왕복이 같은 캐릭터를 만든다', () => {
  const p = { ...basePlayer(), level: 12, gold: 777, inv: [{ id: 'herb', qty: 4 }] };
  const back = importText(exportText(p));
  assert.equal(back.level, 12);
  assert.equal(back.gold, 777);
  assert.deepEqual(back.inv, [{ id: 'herb', qty: 4 }]);
});

test('잘못된 백업은 거부하거나 안전하게 고친다', () => {
  assert.throws(() => importText('{}'));
  assert.throws(() => importText('not json'));
  assert.throws(() => validatePlayer({ ...basePlayer(), cls: 'hacker' }));
  const fixed = validatePlayer({
    ...basePlayer(),
    inv: [{ id: 'herb', qty: 500 }, { id: 'fake', qty: 1 }, null],
    equip: { weapon: 'herb', armor: 'cottonRobe' },
    mapId: 'nowhere',
    gold: -50,
  });
  assert.deepEqual(fixed.inv, [{ id: 'herb', qty: 99 }]);
  assert.equal(fixed.equip.weapon, null);
  assert.equal(fixed.equip.helmet, null);
  assert.equal(fixed.mapId, 'village');
  assert.equal(fixed.gold, 0);
});

test('저장 슬롯 4칸에 따로 쓰고 읽고 지울 수 있다', () => {
  const store = new Map();
  const storage = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, v), removeItem: (k) => store.delete(k) };
  assert.equal(loadSave(0, storage), null);
  assert.equal(writeSave(basePlayer(), 0, storage), true);
  assert.equal(writeSave({ ...basePlayer(), name: '둘째' }, 2, storage), true);
  assert.deepEqual(listSaves(storage).map((p) => p?.name ?? null), ['테스터', null, '둘째', null]);
  deleteSave(0, storage);
  assert.equal(loadSave(0, storage), null);
  const broken = { setItem: () => { throw new Error('quota'); } };
  assert.equal(writeSave(basePlayer(), 0, broken), false);
});

test('슬롯 이전의 단일 저장은 빈 슬롯으로 옮겨진다', () => {
  const store = new Map([['cheongpung-save-v1', exportText({ ...basePlayer(), name: '옛캐릭' })]]);
  const storage = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, v), removeItem: (k) => store.delete(k) };
  assert.equal(loadSave(0, storage).name, '옛캐릭');
  assert.equal(store.has('cheongpung-save-v1'), false);
});

test('GM 명령어는 한글/영문 별칭과 이름 검색을 지원한다', () => {
  assert.deepEqual(parseCommand('/레벨 30'), { cmd: 'level', head: '레벨', args: ['30'] });
  assert.equal(parseCommand('TP forest').cmd, 'tp');
  assert.equal(parseCommand('/없는명령').cmd, null);
  assert.equal(parseCommand('   '), null);
  assert.equal(resolveItem('청룡검'), 'dragonSword');
  assert.equal(resolveItem('ironSword'), 'ironSword');
  assert.equal(resolveItem('산'), 'bigHerb');
  assert.equal(resolveMap('여우숲'), 'forest');
  assert.equal(resolveMonster('구미호'), 'gumiho');
  assert.equal(resolveClass('도사'), 'priest');
  assert.equal(resolveItem('없는물건'), null);
});
