import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Game, createPlayer } from '../src/game.js';
import { createMonster } from '../src/world/monsters.js';
import { MONSTERS } from '../src/data/monsters.js';
import { MONSTER_KITS, MONSTER_SKILLS, kitOf } from '../src/data/monsterSkills.js';

const tick = (game, ms, step = 16) => {
  for (let t = 0; t < ms; t += step) game.update(step);
};

/** 빈 들판 한가운데에 몬스터 하나를 세운다 */
function arena(type, dx, dy) {
  const game = new Game(createPlayer('용사', 'warrior'));
  game.gmSetLevel(60);
  game.teleport('field1');
  game.monsters = [];
  // 주변이 비어 있는 칸 찾기
  for (let y = 4; y < game.map.h - 4; y++) {
    for (let x = 4; x < game.map.w - 4; x++) {
      let ok = true;
      for (let yy = -3; yy <= 3 && ok; yy++) for (let xx = -3; xx <= 3 && ok; xx++) if (game.isSolid(x + xx, y + yy) || game.portalAt(x + xx, y + yy)) ok = false;
      if (!ok) continue;
      game.pe.x = game.pe.fromX = x;
      game.pe.y = game.pe.fromY = y;
      const m = createMonster(game, type, x + dx, y + dy);
      m.aggro = true;
      m.nextSkillAt = game.now; // 바로 기술을 쓰게
      game.monsters.push(m);
      return { game, m };
    }
  }
  throw new Error('빈 칸 없음');
}

test('몬스터 기술 목록은 모두 있는 몬스터·기술을 가리킨다', () => {
  for (const [type, kit] of Object.entries(MONSTER_KITS)) {
    assert.ok(MONSTERS[type], type);
    for (const e of kit) {
      if (typeof e === 'string') assert.ok(MONSTER_SKILLS[e], `${type}:${e}`);
      else assert.ok(MONSTERS[e.summon], `${type} 졸개 ${e.summon}`);
    }
  }
  for (const type of Object.keys(MONSTERS)) for (const sk of kitOf(type, MONSTERS[type].special)) assert.ok(sk.windup > 0, `${type}:${sk.id} 예고 없음`);
});

test('내려찍기 장판: 예고 범위 밖으로 나가면 안 맞고, 그대로 있으면 맞는다', () => {
  for (const escape of [true, false]) {
    const { game, m } = arena('goblin', 1, 0);
    m.engagedAt = 0;
    tick(game, 32);
    assert.ok(m.casting, '예고를 시작한다');
    assert.equal(game.hazards.length, 1);
    const hp = game.player.hp;
    if (escape) {
      game.pe.x -= 2; // 예고 범위(둘레 1칸) 밖으로
      game.pe.fromX = game.pe.x;
    }
    tick(game, 1000);
    assert.equal(game.hazards.length, 0, '장판은 터지고 사라진다');
    if (escape) assert.equal(game.player.hp, hp, '피했으면 안 맞는다');
    else assert.ok(game.player.hp < hp, '안 피하면 맞는다');
  }
});

test('날아오는 탄은 옆 칸으로 비키면 피한다', () => {
  const { game, m } = arena('fireLizard', 4, 0);
  tick(game, 32);
  assert.equal(m.casting?.sk.kind, 'bolt');
  tick(game, 600);
  assert.equal(game.enemyShots.length, 1, '불덩이를 쏜다');
  const hp = game.player.hp;
  game.pe.y += 1;
  game.pe.fromY = game.pe.y;
  m.nextSkillAt = 1e12;
  m.attackReadyAt = 1e12;
  tick(game, 1200);
  assert.equal(game.player.hp, hp);
});

test('구르기 중에는 무적이고, 재사용 대기 중엔 다시 못 구른다', () => {
  const { game } = arena('rabbit', 5, 5);
  game.monsters = [];
  game.pe.dir = 'left';
  assert.ok(game.roll());
  assert.ok(game.isDodging());
  const hp = game.player.hp;
  game.damagePlayer(50);
  assert.equal(game.player.hp, hp, '구르는 동안엔 안 맞는다');
  tick(game, 300);
  assert.equal(game.roll(), false, '재사용 대기');
  tick(game, 1200);
  game.damagePlayer(50);
  assert.ok(game.player.hp < hp, '무적은 잠깐뿐');
});

test('회복약은 연달아 마실 수 없다', () => {
  const game = new Game(createPlayer('용사', 'warrior'));
  game.setPlayer({ hp: 1 });
  const before = game.quickCount('hp');
  game.useQuick('hp');
  game.useQuick('hp');
  assert.equal(game.quickCount('hp'), before - 1);
  tick(game, 1100);
  game.useQuick('hp');
  assert.equal(game.quickCount('hp'), before - 2);
});

test('몹몰이: 한 마리를 건드리면 근처 같은 종류도 따라오고, 멀리 끌고 가도 포기하지 않는다', async () => {
  const { provoke } = await import('../src/world/monsters.js');
  const { game, m } = arena('wolf', 3, 0);
  const buddy = createMonster(game, 'wolf', m.x, m.y + 2);
  const stranger = createMonster(game, 'wolf', m.x + 10, m.y);
  game.monsters.push(buddy, stranger);
  m.aggro = false;
  provoke(game, m);
  assert.ok(m.aggro && buddy.aggro, '근처 같은 종류도 따라온다');
  assert.equal(stranger.aggro, false, '멀리 있는 놈은 그대로');
  // 자기 자리에서 20칸 끌려와도 계속 쫓는다
  m.homeX -= 20;
  game.update(16);
  assert.ok(m.aggro);
});

test('죽은 몬스터가 예고해 둔 장판은 사라지고 터지지 않는다', () => {
  const { game, m } = arena('goblin', 1, 0);
  m.engagedAt = 0;
  tick(game, 32);
  assert.ok(m.casting && game.hazards.length === 1, '내려찍기 예고 중');
  game.damageMonster(m, m.hp + 1, false);
  assert.ok(!game.monsters.includes(m), '죽었다');
  const hp = game.player.hp;
  tick(game, 1200);
  assert.equal(game.hazards.length, 0, '장판이 사라진다');
  assert.equal(game.player.hp, hp, '죽은 몬스터의 공격은 들어오지 않는다');
});

test('은신하면 몬스터가 준비하던 장판도 사라진다', () => {
  const { game, m } = arena('goblin', 1, 0);
  m.engagedAt = 0;
  tick(game, 32);
  assert.ok(m.casting);
  game.stealthUntil = game.now + 5000;
  const hp = game.player.hp;
  tick(game, 1200);
  assert.equal(game.hazards.length, 0);
  assert.equal(game.player.hp, hp);
  assert.equal(m.casting, null);
});

test('화면 전체 궁극기는 화면 안의 적을 모두 세 번 때리고, 화면 밖은 안 맞는다', () => {
  for (const [cls, id] of [['warrior', 'heavenquake'], ['rogue', 'bladerain'], ['mage', 'starfall'], ['priest', 'heavenlight']]) {
    const game = new Game(createPlayer('궁극', cls));
    game.gmSetLevel(70);
    game.gmSetTier(3);
    game.gmLearnAll();
    assert.ok(game.player.learned.includes(id), `${cls} ${id} 배움`);
    game.teleport('field1');
    game.monsters = [];
    const near = createMonster(game, 'rabbit', game.pe.x + 6, game.pe.y);
    const far = createMonster(game, 'rabbit', game.pe.x + 15, game.pe.y);
    near.hp = near.maxHp = far.hp = far.maxHp = 1e9;
    near.nextActAt = far.nextActAt = 1e12;
    game.monsters.push(near, far);
    game.player.mp = 1e6;
    game.castSkillById(id);
    assert.ok(game.cooldowns[id] > game.now, `${id} 시전`);
    tick(game, 800);
    assert.ok(near.hp < 1e9, `${id} 가까운 적 맞음`);
    assert.equal(far.hp, 1e9, `${id} 화면 밖은 안 맞음`);
  }
});
