import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Game, createPlayer } from '../src/game.js';
import { createMonster } from '../src/world/monsters.js';
import { josa } from '../src/core/josa.js';
import { compareEquip, autoEquip, canEquip, isUpgrade } from '../src/core/equip.js';
import { validatePlayer, importText, exportText, listSaves, writeSave, deleteSave, isCorrupt } from '../src/core/save.js';
import { countOf } from '../src/core/inventory.js';
import { CLASSES } from '../src/data/classes.js';
import { SKILLS } from '../src/data/skills.js';
import { ITEMS } from '../src/data/items.js';
import { QUEST_CHAINS } from '../src/data/quests.js';
import { ADVANCEMENTS } from '../src/data/tiers.js';
import { MONSTERS } from '../src/data/monsters.js';
import { MONSTER_ART } from '../src/render/sprites.js';
import { BODY, LEGS } from '../src/render/characters.js';

const tick = (game, ms, step = 16) => {
  for (let t = 0; t < ms; t += step) game.update(step);
};

test('조사는 받침에 따라 자연스럽게 붙는다', () => {
  assert.equal(josa('약초', '을/를'), '약초를');
  assert.equal(josa('청룡검', '을/를'), '청룡검을');
  assert.equal(josa('검객', '이/가'), '검객이');
  assert.equal(josa('도사', '이/가'), '도사가');
  assert.equal(josa('청풍촌', '으로/로'), '청풍촌으로');
  assert.equal(josa('여우 숲', '으로/로'), '여우 숲으로');
  assert.equal(josa('굴', '으로/로'), '굴로');
});

test('장비 비교는 바뀌는 능력치만 보여 주고, 자동 착용은 더 좋은 것만 낀다', () => {
  const p = { ...createPlayer('용사', 'warrior'), level: 16 };
  const cmp = compareEquip(p, 'steelSword');
  assert.equal(cmp.slot, 'weapon');
  assert.deepEqual(cmp.rows.map((r) => [r.key, r.diff]), [['atk', 15]]);
  const withGear = { ...p, inv: [...p.inv, { id: 'ironSword', qty: 1 }, { id: 'steelSword', qty: 1 }, { id: 'jadeStaff', qty: 1 }, { id: 'copperRing', qty: 1 }] };
  const { player, equipped } = autoEquip(withGear);
  assert.equal(player.equip.weapon, 'steelSword');
  assert.equal(player.equip.ring, 'copperRing');
  assert.ok(!equipped.includes('jadeStaff'));
  assert.equal(countOf(player.inv, 'woodSword'), 1, '벗은 목검은 가방으로');
  assert.equal(isUpgrade(player, 'ironSword'), false);
});

test('승급 장비는 차수가 모자라면 착용할 수 없다', () => {
  const p = { ...createPlayer('용사', 'warrior'), level: 50 };
  assert.equal(canEquip(p, 'dragonSword').ok, false);
  assert.match(canEquip(p, 'dragonSword').reason, /1차 승급/);
  assert.equal(canEquip({ ...p, tier: 1 }, 'dragonSword').ok, true);
  assert.equal(canEquip({ ...p, tier: 2 }, 'tortoiseSword').ok, false);
});

test('기술은 레벨이 되면 금전을 내고 직접 배우고, 빈 슬롯에 들어간다', () => {
  const game = new Game(createPlayer('용사', 'warrior'));
  assert.deepEqual(game.player.learned, ['bash']);
  assert.equal(game.canLearn('rush').ok, false);
  game.gmSetLevel(5);
  assert.equal(game.player.learned.includes('rush'), false, '자동으로 배우지 않는다');
  game.setPlayer({ gold: 10000 });
  assert.equal(game.learnSkill('rush'), true);
  assert.ok(game.player.gold < 10000);
  assert.equal(game.player.skillSlots[1], 'rush');
  assert.equal(game.canLearn('swordwave').ok, false, '승급 기술은 승급 전엔 못 배운다');
});

test('배우지 않은 기술은 쓸 수 없고 배운 기술만 슬롯에 넣을 수 있다', () => {
  const game = new Game(createPlayer('술사', 'mage'));
  game.gmSetLevel(10);
  const mp = game.player.mp;
  game.castSkillById('chain');
  assert.equal(game.player.mp, mp);
  const saved = validatePlayer({ ...game.toSave(), skillSlots: ['fire', 'chain', 'nope', null, null] });
  assert.equal(saved.skillSlots[0], 'fire');
  assert.ok(saved.learned.every((id) => saved.skillSlots.includes(id)), '배운 마법은 모두 칸에 들어간다');
});

test('승급: 조건을 채우면 차수가 오르고 능력치와 기념 무기를 받는다', () => {
  const game = new Game(createPlayer('용사', 'warrior'));
  game.gmSetLevel(15);
  assert.equal(game.advanceInfo().ok, false);
  game.giveItem('foxTail', 10);
  game.setPlayer({ gold: 5000 });
  const atk = game.stats().atk;
  assert.equal(game.advance(), true);
  assert.equal(game.player.tier, 1);
  assert.equal(game.title(), '검객');
  assert.ok(game.stats().atk > atk);
  assert.equal(countOf(game.player.inv, 'foxTail'), 0);
  assert.equal(countOf(game.player.inv, 'dragonSword'), 1);
  assert.match(game.canLearn('swordwave').reason, /금전/, '승급 뒤에는 금전만 있으면 배울 수 있다');
  game.setPlayer({ gold: 100000 });
  assert.equal(game.canLearn('swordwave').ok, true);
});

test('NPC마다 퀘스트가 따로 진행되고 수집 퀘스트는 완료 시 재료를 가져간다', () => {
  const game = new Game(createPlayer('용사', 'rogue'));
  game.acceptQuest('herbalist');
  game.giveItem('acorn', 12);
  assert.equal(game.questInfo('herbalist').state, 'ready');
  assert.equal(game.questInfo('chief').state, 'offer');
  assert.equal(game.completeQuest('herbalist'), true);
  assert.equal(countOf(game.player.inv, 'acorn'), 2);
  assert.equal(game.player.quests.herbalist.id, 'h2');
});

test('직업별 보상과 반복 퀘스트', () => {
  const game = new Game(createPlayer('술사', 'mage'));
  game.setPlayer({ quests: { ...game.player.quests, peddler: { id: 'p1', accepted: true, kills: 0 }, herbalist: { id: 'h4', accepted: true, kills: 0 } } });
  game.giveItem('rabbitFur', 8);
  game.giveItem('acorn', 15);
  game.completeQuest('peddler');
  assert.equal(countOf(game.player.inv, 'jadeRing'), 1, '술사는 옥가락지');
  game.completeQuest('herbalist');
  assert.equal(game.player.quests.herbalist.id, 'h4', '반복 퀘스트는 다시 받을 수 있다');
});

test('몬스터는 옆에 붙어도 바로 때리지 않아서 한 칸 물러나면 피할 수 있다', () => {
  const game = new Game(createPlayer('용사', 'warrior'));
  game.teleport('forest');
  game.monsters = [];
  const m = createMonster(game, 'fox', game.pe.x + 1, game.pe.y);
  m.aggro = true;
  game.monsters.push(m);
  const hp = game.player.hp;
  tick(game, 400);
  assert.equal(game.player.hp, hp, '0.4초 안에는 아직 안 맞는다');
  tick(game, 1000);
  assert.ok(game.player.hp < hp, '뜸을 들인 뒤에는 공격한다');
});

test('마주 오는 몬스터와 칸을 바꿔도 마법이 빗나가지 않는다', () => {
  const game = new Game(createPlayer('술사', 'mage'));
  game.teleport('field1');
  game.monsters = [];
  game.pe.dir = 'right';
  const m = createMonster(game, 'rabbit', game.pe.x + 2, game.pe.y);
  m.nextActAt = 1e12;
  game.monsters.push(m);
  game.castSlot(0);
  // 화염구가 한 칸 나가는 순간 토끼가 플레이어 쪽으로 한 칸 다가온다(서로 칸을 바꾼다)
  tick(game, 60);
  m.fromX = m.x;
  m.fromY = m.y;
  m.x -= 1;
  m.stepT = 0;
  m.moving = true;
  tick(game, 300);
  assert.ok(m.hp < m.maxHp || !game.monsters.includes(m), '마법이 맞아야 한다');
});

test('예전 저장(퀘스트·기술 배우기 이전)도 안전하게 불러온다', () => {
  const old = { name: '옛캐릭', cls: 'priest', level: 12, exp: 0, gold: 10, hp: 10, mp: 10, inv: [], equip: { weapon: 'paperFan', armor: 'cottonRobe' }, mapId: 'village', x: 19, y: 17 };
  const p = importText(exportText(old));
  assert.equal(p.tier, 0);
  assert.ok(p.learned.includes('heal') && p.learned.includes('paralyze'));
  assert.equal(p.quests.chief.id, 'c1');
  assert.equal(p.equip.ring, null);
});

test('데이터: 모든 기술·승급·퀘스트·몬스터·도트가 서로 맞물린다', () => {
  for (const c of Object.values(CLASSES)) {
    assert.ok(c.skills.length >= 14 && c.skills.length <= 20, `${c.name} 기술 ${c.skills.length}개`);
    for (const id of c.skills) assert.ok(SKILLS[id], id);
  }
  for (const a of ADVANCEMENTS) {
    for (const [id] of a.items) assert.ok(ITEMS[id], id);
    for (const id of Object.values(a.reward)) assert.equal(ITEMS[id].tier, a.tier, id);
  }
  for (const [npc, list] of Object.entries(QUEST_CHAINS)) {
    for (const q of list) {
      const table = q.goal.type === 'kill' ? MONSTERS : ITEMS;
      assert.ok(table[q.goal.target], `${npc}:${q.id}`);
      for (const [id] of q.reward.items) assert.ok(ITEMS[id], id);
      for (const id of Object.values(q.reward.byClass ?? {})) assert.ok(ITEMS[id], id);
    }
  }
  for (const rows of [...Object.values(BODY), ...LEGS.front, ...LEGS.side, ...Object.values(MONSTER_ART)]) {
    for (const r of rows) assert.equal(r.length, 16, r);
  }
});

test('숫자 뒤 조사도 읽는 소리대로 붙는다', () => {
  assert.equal(josa('레벨 10', '이/가'), '레벨 10이');
  assert.equal(josa('레벨 12', '이/가'), '레벨 12가');
  assert.equal(josa('3', '을/를'), '3을');
  assert.equal(josa('7', '으로/로'), '7로');
});

test('저장소 접근이 막힌 환경에서도 예외 없이 동작한다', () => {
  const blocked = { getItem() { throw new Error('SecurityError'); }, setItem() { throw new Error('SecurityError'); }, removeItem() { throw new Error('SecurityError'); } };
  assert.deepEqual(listSaves(blocked), [null, null, null, null]);
  assert.equal(writeSave(createPlayer('a', 'warrior'), 0, blocked), false);
  assert.equal(deleteSave(0, blocked), false);
});

test('손상된 슬롯은 빈 슬롯과 구분된다', () => {
  const store = new Map([['cheongpung-save-v1-slot1', '{broken']]);
  const storage = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, v), removeItem: (k) => store.delete(k) };
  assert.equal(isCorrupt(0, storage), false);
  assert.equal(isCorrupt(1, storage), true);
});

test('편집된 백업의 체력·장비·기술은 규칙에 맞게 고쳐진다', () => {
  const base = createPlayer('용사', 'warrior');
  const p = validatePlayer({ ...base, hp: 99999, equip: { ...base.equip, weapon: 'tortoiseSword', ring: 'heavenRing' }, learned: ['bash', 'earthsplit', 'vital'] });
  assert.ok(p.hp <= 200);
  assert.equal(p.equip.weapon, null);
  assert.equal(p.equip.ring, null);
  assert.equal(countOf(p.inv, 'tortoiseSword'), 1, '못 끼는 장비는 가방으로');
  assert.deepEqual(p.learned, ['bash']);
});

test('쓰러진 채 저장하면 마을에서 체력이 가득한 상태로 이어진다', () => {
  const game = new Game(createPlayer('용사', 'warrior'));
  game.teleport('forest');
  game.damagePlayer(99999);
  const saved = game.toSave();
  assert.equal(saved.mapId, 'village');
  assert.equal(saved.hp, game.stats().maxHp);
});

test('기절이 풀린 몬스터는 공격 준비를 처음부터 다시 한다', () => {
  const game = new Game(createPlayer('용사', 'warrior'));
  game.teleport('forest');
  game.monsters = [];
  const m = createMonster(game, 'fox', game.pe.x + 1, game.pe.y);
  m.aggro = true;
  game.monsters.push(m);
  tick(game, 600);
  m.stunUntil = game.now + 500;
  tick(game, 520);
  const hp = game.player.hp;
  tick(game, 300);
  assert.equal(game.player.hp, hp, '기절 직후 바로 때리지 않는다');
});

test('승급할 때 이미 배운 기술은 다시 안내하지 않는다', () => {
  const game = new Game(createPlayer('용사', 'warrior'));
  game.gmSetLevel(15);
  game.giveItem('foxTail', 10);
  game.setPlayer({ gold: 5000 });
  game.advance();
  assert.ok(!game.messages.some((m) => m.text.includes('[강타]') && m.text.includes('배울 수 있습니다')));
});


test('배경음악: 모든 곡이 정해진 음계 안의 음으로 늘 똑같이 만들어진다', async () => {
  const { TRACKS, MAP_TRACK, SCALES, makeSong } = await import('../src/core/music.js');
  const { MAP_DEFS } = await import('../src/data/maps.js');
  for (const id of Object.keys(MAP_DEFS)) assert.ok(TRACKS[MAP_TRACK[id]], `${id} 곡 없음`);
  for (const [name, def] of Object.entries(TRACKS)) {
    const a = makeSong(def);
    assert.deepEqual(a, makeSong(def), `${name} 곡이 매번 같아야 함`);
    assert.equal(a.steps, def.meter * 8);
    for (const n of a.notes) {
      assert.ok(n.step >= 0 && n.step < a.steps, name);
      assert.ok(n.midi >= 20 && n.midi <= 100, `${name} 음 높이 ${n.midi}`);
      const pc = (((n.midi - def.root) % 12) + 12) % 12;
      assert.ok(SCALES[def.scale].includes(pc) || n.inst === 'bass', `${name} 음계 밖 음 ${n.midi}`);
    }
  }
});

test('고급 장비(Lv55~85)와 강화: 3차 이후에도 장비가 레벨을 따라간다', async () => {
  const { HIGH_GEAR } = await import('../src/data/items.js');
  assert.equal(HIGH_GEAR.length, 32);
  const sword85 = ITEMS.highSword85;
  assert.ok(sword85.atk > ITEMS.tortoiseSword.atk * 2.5);
  const game = new Game(createPlayer('용사', 'warrior'));
  game.gmSetLevel(85); game.gmSetTier(3);
  game.giveItem('highSword85', 1);
  game.equipAt(game.player.inv.findIndex((s) => s.id === 'highSword85'));
  assert.equal(game.player.equip.weapon, 'highSword85');
  const atk = game.stats().atk;
  game.setPlayer({ gold: 1e9 });
  assert.equal(game.enhance('weapon', () => 0), true);
  assert.equal(game.player.enhance.weapon, 1);
  assert.ok(game.stats().atk > atk);
  game.setPlayer({ enhance: { ...game.player.enhance, weapon: 8 } });
  assert.equal(game.enhance('weapon', () => 0.999), false, '실패하면 단계는 그대로');
  assert.equal(game.player.enhance.weapon, 8);
  const back = validatePlayer(importText(exportText(game.toSave())));
  assert.equal(back.enhance.weapon, 8);
});

test('집 문으로 들어가면 실내로, 나오면 문 앞으로 돌아온다', () => {
  const game = new Game(createPlayer('용사', 'warrior'));
  game.loadMap('village', 7, 9, 'up');
  game.inputDir = 'up';
  tick(game, 400);
  assert.equal(game.mapId, 'smithy');
  assert.ok(game.npcs.some((n) => n.id === 'smith'));
  game.inputDir = 'down';
  tick(game, 1500);
  assert.equal(game.mapId, 'village');
  assert.deepEqual([game.pe.x, game.pe.y >= 9], [7, true]);
});

test('주막에서 쉬면 금전을 내고 체력·마력이 가득 찬다', () => {
  const game = new Game(createPlayer('용사', 'warrior'));
  game.teleport('tavern');
  game.setPlayer({ hp: 1, mp: 0, gold: 1000 });
  assert.equal(game.rest(), true);
  assert.equal(game.player.hp, game.stats().maxHp);
  assert.ok(game.player.gold < 1000);
});

test('말로 사고팔기: 문장에서 물건·개수·사기/팔기를 읽는다', async () => {
  const { parseTrade, findItemByName } = await import('../src/core/chatTrade.js');
  assert.deepEqual(parseTrade('약초 10개 사자'), { verb: 'buy', name: '약초', qty: 10 });
  assert.deepEqual(parseTrade('산삼 사자'), { verb: 'buy', name: '산삼', qty: 1 });
  assert.deepEqual(parseTrade('도토리 5개 팔자'), { verb: 'sell', name: '도토리', qty: 5 });
  assert.equal(parseTrade('안녕하세요'), null);
  assert.equal(findItemByName(['herb', 'bigHerb', 'dew'], '약초'), 'herb');
  assert.equal(findItemByName(['herb', 'bigHerb', 'dew'], '산'), 'bigHerb');
});

test('성주의 왕실 퀘스트도 진행된다', () => {
  const game = new Game(createPlayer('용사', 'warrior'));
  assert.equal(game.questInfo('lord').state, 'offer');
  game.acceptQuest('lord');
  for (let i = 0; i < 20; i++) game.countQuestKill('goblin');
  assert.equal(game.questInfo('lord').state, 'ready');
  assert.equal(game.completeQuest('lord'), true);
  assert.equal(game.player.quests.lord.id, 'l2');
});

test('용 무기: 1차 승급 후 받고, 용의 숨결로 각성하면 무기가 강해진다', () => {
  const game = new Game(createPlayer('용사', 'warrior'));
  assert.equal(game.claimDragonWeapon(), false, '승급 전에는 못 받는다');
  game.gmSetLevel(25); game.gmSetTier(1);
  assert.equal(game.claimDragonWeapon(), true);
  assert.equal(game.claimDragonWeapon(), false, '한 번만 받는다');
  game.equipAt(game.player.inv.findIndex((s) => s.id === 'dragonFangSword'));
  const atk = game.stats().atk;
  game.giveItem('dragonBreath', 10);
  game.setPlayer({ gold: 1e7 });
  assert.equal(game.awaken(), true);
  assert.equal(game.player.dragonStage, 1);
  assert.ok(game.stats().atk > atk);
  assert.equal(countOf(game.player.inv, 'dragonBreath'), 9);
});

test('수호부적이 있으면 쓰러져도 경험치를 잃지 않고 부적이 사라진다', () => {
  const game = new Game(createPlayer('용사', 'warrior'));
  game.teleport('forest');
  game.setPlayer({ exp: 100 });
  game.giveItem('guardCharm', 1);
  game.damagePlayer(99999);
  assert.equal(game.player.exp, 100);
  assert.equal(countOf(game.player.inv, 'guardCharm'), 0);
});

test('말 증서가 있으면 말을 타고 더 빨리 달린다, 실내에선 내린다', () => {
  const game = new Game(createPlayer('용사', 'warrior'));
  game.toggleRide();
  assert.ok(!game.riding);
  game.giveItem('horseTicket', 1);
  game.toggleRide();
  assert.ok(game.riding);
  game.teleport('tavern');
  assert.ok(!game.riding);
});

test('뱃사공: 레벨·뱃삯이 되면 먼 지역으로 가고, 지역 출구는 청풍성으로 이어진다', () => {
  const game = new Game(createPlayer('용사', 'warrior'));
  const route = { to: 'dragonPalace', level: 65, cost: 12000 };
  assert.equal(game.voyage(route), false, '레벨 부족');
  game.gmSetLevel(70);
  game.setPlayer({ gold: 20000 });
  assert.equal(game.voyage(route), true);
  assert.equal(game.mapId, 'dragonPalace');
  assert.equal(game.player.gold, 8000);
  assert.ok(game.monsters.some((m) => m.type === 'seaDragon'));
});

test('바닥에 떨어진 돈도 그릴 수 있다(그리기 오류로 캐릭터가 사라지지 않음)', async () => {
  const { Renderer } = await import('../src/render/renderer.js');
  const { GOLD_ID } = await import('../src/game.js');
  const ctx = new Proxy({}, { get: (t, k) => (k in t ? t[k] : () => {}), set: (t, k, v) => { t[k] = v; return true; } });
  const fake = { now: 0, groundItems: [{ id: GOLD_ID, qty: 10, x: 1, y: 1, spawnAt: 0, expiresAt: 60000 }, { id: 'herb', qty: 1, x: 2, y: 1, spawnAt: 0, expiresAt: 60000 }] };
  assert.doesNotThrow(() => Renderer.prototype.drawGroundItems.call({}, ctx, fake));
});
