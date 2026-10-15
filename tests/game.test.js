import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Game, createPlayer } from '../src/game.js';
import { runCommand } from '../src/core/gm.js';
import { createMonster } from '../src/world/monsters.js';
import { countOf } from '../src/core/inventory.js';
import { validatePlayer, importText, exportText } from '../src/core/save.js';

const tick = (game, ms, step = 16) => {
  for (let t = 0; t < ms; t += step) game.update(step);
};

test('새 캐릭터는 마을에서 체력·마력이 가득 찬 채로 시작한다', () => {
  const game = new Game(createPlayer('용사', 'warrior'));
  const s = game.stats();
  assert.equal(game.mapId, 'village');
  assert.equal(game.player.hp, s.maxHp);
  assert.equal(game.player.mp, s.maxMp);
  assert.equal(game.monsters.length, 0);
  assert.equal(game.npcs.length, 6);
});

test('방향을 누르고 있으면 한 칸씩 걷는다', () => {
  const game = new Game(createPlayer('용사', 'warrior'));
  const startY = game.pe.y;
  game.inputDir = 'down';
  tick(game, 400);
  game.inputDir = null;
  tick(game, 400);
  assert.ok(game.pe.y >= startY + 2, `y=${game.pe.y}`);
  assert.equal(game.pe.moving, false);
});

test('포탈을 밟으면 다른 맵으로 이동한다', () => {
  const game = new Game(createPlayer('용사', 'warrior'));
  game.loadMap('village', 38, 14, 'right');
  game.inputDir = 'right';
  tick(game, 300);
  assert.equal(game.mapId, 'field1');
  assert.ok(game.pe.x >= 2 && game.pe.x <= 4, `x=${game.pe.x}`);
  assert.ok(game.monsters.length > 0);
});

test('몬스터를 때려서 잡으면 경험치·금전을 얻고 리스폰이 예약된다', () => {
  const game = new Game(createPlayer('용사', 'warrior'));
  game.teleport('field1');
  game.monsters = [];
  const m = createMonster(game, 'squirrel', game.pe.x + 1, game.pe.y);
  game.monsters.push(m);
  game.pe.dir = 'right';
  const gold = game.player.gold;
  for (let i = 0; i < 20 && game.monsters.length; i++) {
    game.attack();
    tick(game, 600);
  }
  assert.equal(game.monsters.includes(m), false);
  assert.ok(game.player.exp > 0);
  // 금전은 땅에 떨어지고, 그 칸을 밟아야 들어온다
  const coin = game.groundItems.find((g) => g.id === '__gold');
  assert.ok(coin);
  game.pe.x = coin.x;
  game.pe.y = coin.y;
  game.pickUp();
  assert.ok(game.player.gold > gold);
  assert.ok(game.respawnQueue.length === 0 || game.respawnQueue[0].type === 'squirrel');
});

test('주술사 화염구는 날아가서 적을 맞힌다', () => {
  const game = new Game(createPlayer('술사', 'mage'));
  game.teleport('field1');
  game.monsters = [];
  game.pe.dir = 'right';
  const m = createMonster(game, 'rabbit', game.pe.x + 3, game.pe.y);
  m.nextActAt = 1e12;
  game.monsters.push(m);
  const mp = game.player.mp;
  game.castSlot(0);
  assert.ok(game.player.mp < mp);
  tick(game, 400);
  assert.ok(m.hp < m.maxHp || !game.monsters.includes(m));
});

test('레벨이 모자라면 기술을 쓸 수 없다', () => {
  const game = new Game(createPlayer('용사', 'warrior'));
  const mp = game.player.mp;
  game.castSkillById('whirl');
  assert.equal(game.player.mp, mp);
});

test('체력이 0이 되면 경험치를 잃고 마을에서 부활한다', () => {
  const game = new Game(createPlayer('용사', 'warrior'));
  game.teleport('forest');
  game.setPlayer({ exp: 10 });
  game.damagePlayer(99999);
  assert.equal(game.dead, true);
  assert.equal(game.player.exp, 9);
  tick(game, 2500);
  assert.equal(game.dead, false);
  assert.equal(game.mapId, 'village');
  assert.equal(game.player.hp, game.stats().maxHp);
});

test('상점에서 사고 팔 수 있고 금전이 부족하면 거절된다', () => {
  const game = new Game(createPlayer('용사', 'warrior'));
  game.setPlayer({ gold: 100 });
  assert.equal(game.buy('herb', 5), true);
  assert.equal(game.player.gold, 40);
  assert.equal(game.buy('dragonSword', 1), false);
  const idx = game.player.inv.findIndex((s) => s.id === 'herb');
  const before = countOf(game.player.inv, 'herb');
  game.sellAt(idx, 2);
  assert.equal(countOf(game.player.inv, 'herb'), before - 2);
  assert.equal(game.player.gold, 52);
});

test('장비 착용은 레벨·직업 제한을 지키고 이전 장비는 가방으로 돌아온다', () => {
  const game = new Game(createPlayer('용사', 'warrior'));
  game.giveItem('ironSword', 1);
  game.giveItem('jadeStaff', 1);
  game.equipAt(game.player.inv.findIndex((s) => s.id === 'ironSword'));
  assert.equal(game.player.equip.weapon, 'woodSword');
  game.gmSetLevel(10);
  game.equipAt(game.player.inv.findIndex((s) => s.id === 'ironSword'));
  assert.equal(game.player.equip.weapon, 'ironSword');
  assert.equal(countOf(game.player.inv, 'woodSword'), 1);
  game.equipAt(game.player.inv.findIndex((s) => s.id === 'jadeStaff'));
  assert.equal(game.player.equip.weapon, 'ironSword');
});

test('물약 단축 버튼은 가지고 있는 회복약을 쓴다', () => {
  const game = new Game(createPlayer('용사', 'warrior'));
  game.setPlayer({ hp: 1 });
  const herbs = game.quickCount('hp');
  game.useQuick('hp');
  assert.equal(game.quickCount('hp'), herbs - 1);
  assert.equal(game.player.hp, 51);
});

test('GM 명령으로 레벨·아이템·이동·소환·무적을 다룰 수 있다', () => {
  const game = new Game(createPlayer('운영자', 'priest'));
  runCommand(game, '/레벨 30');
  assert.equal(game.player.level, 30);
  runCommand(game, '/아이템 천도선 1');
  assert.equal(countOf(game.player.inv, 'heavenFan'), 1);
  runCommand(game, '/이동 늑대언덕');
  assert.equal(game.mapId, 'wolfHill');
  const n = game.monsters.length;
  runCommand(game, '/소환 구미호 1');
  assert.equal(game.monsters.length, n + 1);
  runCommand(game, '/무적');
  game.damagePlayer(99999);
  assert.equal(game.dead, false);
  assert.ok(runCommand(game, '/전체처치').includes('처치'));
  assert.equal(game.monsters.length, 0);
  assert.equal(game.respawnQueue.filter((r) => r.type === 'gumiho').length, 0);
  assert.ok(runCommand(game, '/없는거').includes('알 수 없는'));
});

test('저장 데이터는 현재 위치를 담고 다시 불러와도 같은 자리에서 시작한다', () => {
  const game = new Game(createPlayer('용사', 'rogue'));
  game.teleport('forest');
  const restored = new Game(importText(exportText(validatePlayer(game.toSave()))));
  assert.equal(restored.mapId, 'forest');
  assert.equal(restored.pe.x, game.pe.x);
  assert.equal(restored.pe.y, game.pe.y);
});

test('몬스터는 오래 돌아다녀도 벽 속이나 다른 몬스터와 겹치지 않는다', () => {
  const game = new Game(createPlayer('용사', 'warrior'));
  runCommand(game, '/무적');
  game.teleport('forest');
  tick(game, 20000, 50);
  const seen = new Set();
  for (const m of game.monsters) {
    assert.equal(game.isSolid(m.x, m.y), false);
    const key = `${m.x},${m.y}`;
    assert.equal(seen.has(key), false);
    seen.add(key);
  }
});

test('걷는 도중 누른 기술은 버려지지 않고 칸에 도착하면 나간다', () => {
  const game = new Game(createPlayer('술사', 'mage'));
  game.teleport('field1');
  game.monsters = [];
  game.inputDir = 'down';
  game.update(16);
  assert.equal(game.pe.moving, true);
  game.inputDir = null;
  const mp = game.player.mp;
  game.castSlot(0);
  assert.equal(game.player.mp, mp);
  tick(game, 300);
  assert.ok(game.player.mp < mp, '도착 후 화염구가 나가야 함');
});

test('추격을 포기한 몬스터는 집으로 돌아가고 굳지 않는다', () => {
  const game = new Game(createPlayer('용사', 'warrior'));
  game.teleport('wolfHill');
  game.monsters = [];
  const m = createMonster(game, 'wolf', game.pe.x + 20, game.pe.y);
  m.homeX = m.x;
  m.homeY = m.y;
  game.monsters.push(m);
  game.isFree(m.x, m.y);
  m.aggro = true;
  m.homeX += 15;
  tick(game, 100);
  assert.equal(m.aggro, false);
  assert.ok(m.returningUntil > game.now);
  const before = Math.abs(m.x - m.homeX) + Math.abs(m.y - m.homeY);
  tick(game, 4000, 50);
  const after = Math.abs(m.x - m.homeX) + Math.abs(m.y - m.homeY);
  assert.ok(after < before || m.returningUntil === 0, `before=${before} after=${after}`);
});

test('잡은 보스는 맵을 나갔다 들어와도 리젠 시간 전엔 나오지 않는다', () => {
  const game = new Game(createPlayer('운영자', 'warrior'));
  game.teleport('bossLair');
  const boss = game.monsters.find((m) => m.type === 'gumiho');
  assert.ok(boss);
  game.killMonster(boss);
  game.teleport('goblinCave');
  game.teleport('bossLair');
  assert.equal(game.monsters.some((m) => m.type === 'gumiho'), false);
  assert.ok(game.respawnQueue.some((r) => r.type === 'gumiho'));
});

test('마을 안에서는 귀환서가 소모되지 않는다', () => {
  const game = new Game(createPlayer('용사', 'warrior'));
  const before = countOf(game.player.inv, 'returnScroll');
  game.useItemAt(game.player.inv.findIndex((s) => s.id === 'returnScroll'));
  assert.equal(countOf(game.player.inv, 'returnScroll'), before);
});

test('부활 순간의 저장 데이터도 체력이 가득하다', () => {
  const game = new Game(createPlayer('용사', 'warrior'));
  let savedHp = null;
  game.on((type) => { if (type === 'map') savedHp = game.toSave().hp; });
  game.teleport('forest');
  game.damagePlayer(99999);
  tick(game, 2500);
  assert.equal(savedHp, game.stats().maxHp);
});

test('프로토타입 키로 만든 백업·GM 명령은 거부된다', () => {
  const base = createPlayer('용사', 'warrior');
  assert.throws(() => validatePlayer({ ...base, cls: 'constructor' }));
  assert.equal(validatePlayer({ ...base, mapId: 'toString' }).mapId, 'village');
  assert.deepEqual(validatePlayer({ ...base, inv: [{ id: 'constructor', qty: 1 }] }).inv, []);
  const game = new Game(base);
  assert.ok(runCommand(game, '/이동 constructor').includes('찾을 수 없습니다'));
  assert.equal(game.mapId, 'village');
});
