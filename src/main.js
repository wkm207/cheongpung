import { isClassic, setClassic, isNinja, setNinja } from './render/artmode.js';
import { loadNinja } from './render/ninja.js';
import { loadFx } from './render/fxdots.js';
import { Game, createPlayer } from './game.js';
import { Renderer } from './render/renderer.js';
import { Input } from './ui/input.js';
import { Hud } from './ui/hud.js';
import { Panels } from './ui/panels.js';
import { Title } from './ui/title.js';
import { Minimap } from './ui/minimap.js';
import { Sidebar, SIDE_TABS } from './ui/sidebar.js';
import { $, $$ } from './ui/dom.js';
import { getSettings, updateSettings } from './ui/settings.js';
import { playSfx, unlockAudio } from './ui/sfx.js';
import { bgm } from './ui/bgm.js';
import { MAP_TRACK } from './core/music.js';
import { MONSTERS } from './data/monsters.js';
import { listSaves, isCorrupt, writeSave, deleteSave, importText } from './core/save.js';
import { runCommand } from './core/gm.js';
import { parseTrade, findItemByName } from './core/chatTrade.js';
import { ITEMS } from './data/items.js';
import { AUTOSAVE_MS } from './config.js';
import { FIREBASE_CONFIG } from './firebase-config.js';
import { createCloud } from './core/cloud.js';
import { CloudSync } from './core/sync.js';
import { preloadPhotos } from './render/photos.js';

const renderer = new Renderer($('#game'));
const hud = new Hud();
const minimap = new Minimap($('#minimap'));
const chatInput = $('#chat-input');
let game = null;
let slot = 0;
let lastSaveAt = 0;
let warnedConflict = false;   // 이번 판에서 '다른 기기 저장' 안내를 했는지

// 로그인했으면 서버에도 올린다(설정값이 비어 있으면 아무것도 하지 않는다)
const sync = new CloudSync(createCloud(FIREBASE_CONFIG));
const saveNow = () => (game ? writeSave(game.toSave(), slot) : false);
/** 자동 저장 + 서버에는 가끔(force 면 바로) 올린다 */
function saveAndSync(force = false) {
  const ok = saveNow();
  if (ok && game) (force ? sync.flush(slot) : sync.noteSaved(slot)).catch(() => {});
  return ok;
}

function applySettings(settings) {
  const classic = settings.graphics !== 'smooth';
  const ninja = settings.graphics === 'ninja';
  if (classic !== isClassic() || ninja !== isNinja()) {
    setClassic(classic);
    setNinja(ninja);
    renderer.mapId = null;
    renderer.resize();
    hud.portraitKey = '';
    sidebar.dollKey = '';
  }
  document.body.classList.toggle('classic', classic);
  document.body.classList.toggle('control-dpad', settings.control === 'dpad');
  document.body.classList.toggle('control-joystick', settings.control === 'joystick');
  document.body.classList.toggle('minimap-off', !settings.minimap);
  minimap.visible = settings.minimap;
  input.setMode(settings.control);
}

/** 대화창 입력: /로 시작하면 운영자 명령, 아니면 머리 위 말풍선과 대화창에 말한다. */
function submitChat(text) {
  const msg = text.trim();
  if (!game || !msg) return;
  if (msg.startsWith('/')) {
    for (const line of runCommand(game, msg).split(/\n/)) game.log(`[GM] ${line}`, '#ffd166');
    panels.refresh();
    return;
  }
  game.say(msg);
  game.log(`${game.player.name}: ${msg}`, '#ffffff');
  tradeByChat(msg);
}

/** 상인 3칸 안에서 "약초 10개 사자" / "도토리 팔자"처럼 말하면 거래한다. */
function tradeByChat(msg) {
  const trade = parseTrade(msg);
  if (!trade) return;
  const near = game.npcs
    .filter((n) => n.shop && Math.abs(n.x - game.pe.x) + Math.abs(n.y - game.pe.y) <= 3)
    .sort((a, b) => Math.abs(a.x - game.pe.x) + Math.abs(a.y - game.pe.y) - (Math.abs(b.x - game.pe.x) + Math.abs(b.y - game.pe.y)))[0];
  if (!near) {
    game.log('주변에 물건을 사고팔 상인이 없습니다.', '#bbb');
    return;
  }
  if (trade.verb === 'buy') {
    const id = findItemByName(near.shop, trade.name);
    if (!id) {
      game.npcSay(near, `${trade.name}? 그런 물건은 없는데...`);
      return;
    }
    if (game.buy(id, trade.qty)) game.npcSay(near, `${ITEMS[id].name} ${trade.qty}개, 여기 있네!`);
    else game.npcSay(near, '돈이 모자라거나 가방이 꽉 찼구먼.');
    return;
  }
  const ids = game.player.inv.map((s) => s.id);
  const id = findItemByName(ids, trade.name);
  if (!id) {
    game.npcSay(near, `${trade.name}은(는) 안 가지고 있잖나.`);
    return;
  }
  const index = game.player.inv.findIndex((s) => s.id === id);
  game.sellAt(index, trade.qty);
  game.npcSay(near, '좋은 물건이군, 잘 쓰겠네.');
}

const panels = new Panels($('#panel-layer'), $('#panel'), {
  getGame: () => game,
  getSettings,
  onOpen: () => input.release(),
  onSave: saveNow,
  onLoadPlayer: (player) => startGame(player, slot),
  onTitle: () => backToTitle(),
  onClick: () => playSfx('click'),
  onCast: (id) => game?.castSkillById(id),
  onSetting: (key, value) => {
    const patch = key === 'sound' || key === 'music' ? { [key]: value === 'true' } : { [key]: value };
    applySettings(updateSettings(patch));
  },
});

const sidebar = new Sidebar({
  getGame: () => game,
  getSettings,
  onSave: saveNow,
  onLoadPlayer: (player) => startGame(player, slot),
  onTitle: () => backToTitle(),
  onClick: () => playSfx('click'),
  onCast: (id) => game?.castSkillById(id),
  onSetting: () => {},
});

const title = new Title($('#title'), {
  listSaves: () => listSaves(),
  isCorrupt: (i) => isCorrupt(i),
  deleteSave: (i) => {
    const ok = deleteSave(i);
    if (sync.loggedIn) sync.syncAll().catch(() => {});
    return ok;
  },
  importText,
  account: sync,
  onStart: (data, i) => startGame(data.newName ? createPlayer(data.newName, data.cls, data.gender, data.look) : data, i),
});

const input = new Input({
  moveZone: $('#move-zone'),
  dpad: $('#dpad'),
  joyBase: $('#joy-base'),
  joyKnob: $('#joy-knob'),
  canvas: $('#game'),
  attackBtn: $('#btn-attack'),
  rollBtn: $('#btn-roll'),
  actions: {
    attack: () => game?.attack(),
    roll: () => game?.roll(),
    skill: (i) => game?.castSlot(i),
    quick: (kind) => game?.useQuick(kind),
    tap: (x, y) => {
      if (!game || panels.isOpen) return;
      const t = renderer.screenToTile(x, y);
      game.tapTile(t.x, t.y);
    },
    openPanel: (kind) => openPanel(kind),
    closePanel: () => panels.close(),
    panelAdvance: () => panels.advanceKey(),
    isPaused: () => !game || panels.isOpen,
    keyboardUsed: () => document.body.classList.add('has-keyboard'),
    focusChat: () => {
      if (!game || panels.isOpen) return;
      chatInput.focus();
    },
    openMap: () => (panels.isOpen && panels.kind === 'worldmap' ? panels.close() : openPanel('worldmap')),
    toggleRide: () => game?.toggleRide(),
    spellLetter: (letter) => {
      const target = panels.kind === 'spells' ? panels : sidebar.active && sidebar.panels.kind === 'spells' ? sidebar.panels : null;
      return !!target && target.spellLetter('abcdefghijklmnopqrst'.indexOf(letter));
    },
  },
});

/** 넓은 화면이면 상태·가방·마법·기술·퀘스트는 오른쪽 상태창 탭으로, 나머지는 가운데 창으로 */
function openPanel(kind) {
  if (!game) return;
  if (sidebar.active && SIDE_TABS.has(kind)) {
    panels.close();
    sidebar.open(kind);
    return;
  }
  if (panels.kind === kind) panels.close();
  else panels.open(kind);
}

function updateLayout() {
  sidebar.setActive(sidebar.fits(), game);
  updateInsets();
}

function onGameEvent(type, data) {
  if (type === 'talk') panels.open('dialog', data);
  else if (type === 'openPanel') openPanel(data);
  else if (type === 'sfx') playSfx(data);
  else if (type === 'inventory' || type === 'quest' || type === 'levelup') {
    panels.refresh();
    sidebar.refresh();
  }
  else if (type === 'levelup' || type === 'map') saveNow();
}

function setPlaying(playing) {
  for (const id of ['#topbar', '#controls', '#console']) $(id).hidden = !playing;
  document.body.classList.toggle('playing', playing);
  sidebar.setActive(playing && sidebar.fits(), playing ? game : null);
  updateInsets();
}

function updateInsets() {
  renderer.bottomInset = $('#console').hidden ? 0 : $('#console').offsetHeight;
  renderer.rightInset = sidebar.active ? $('#sidebar').offsetWidth : 0;
}

function startGame(player, i) {
  slot = i;
  warnedConflict = false;
  game = new Game(player);
  game.on(onGameEvent);
  game.log(`${player.name}님, Country of Wind에 오신 것을 환영합니다.`, '#ffd166');
  if (player.level === 1 && player.exp === 0) game.log('촌장(머리 위 !)에게 말을 걸어 첫 부탁을 받아 보세요.', '#ffe9a8');
  title.hide();
  setPlaying(true);
  saveNow();
  lastSaveAt = performance.now();
}

function backToTitle() {
  saveAndSync(true);
  game = null;
  setPlaying(false);
  title.show();
}

// 단축 칸: 짧게 누르면 마법을 쓰고, 꾹 누르거나 끌면 다른 칸으로 옮길 수 있다
const DRAG_PX = 10;
const HOLD_MS = 380;
let slotDrag = null;
function endSlotGhost() {
  slotDrag?.ghost?.remove();
  for (const b of $$('.hotbar [data-slot]')) b.classList.remove('drop-target', 'dragging');
}
function slotUnder(x, y) {
  return document.elementFromPoint(x, y)?.closest('.hotbar [data-slot]') ?? null;
}
for (const btn of $$('.hotbar [data-slot]')) {
  btn.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    try {
      btn.setPointerCapture(e.pointerId);
    } catch {
      // 캡처를 못 해도 끌기는 버튼 위 이벤트로 이어진다
    }
    slotDrag = { btn, from: Number(btn.dataset.slot), x: e.clientX, y: e.clientY, at: performance.now(), ghost: null };
  });
  btn.addEventListener('pointermove', (e) => {
    if (!slotDrag || slotDrag.btn !== btn) return;
    const moved = Math.hypot(e.clientX - slotDrag.x, e.clientY - slotDrag.y) > DRAG_PX;
    const held = performance.now() - slotDrag.at > HOLD_MS;
    if (!slotDrag.ghost && (moved || held) && game?.player.skillSlots[slotDrag.from]) {
      const ghost = btn.cloneNode(true);
      ghost.classList.add('slot-ghost');
      document.body.append(ghost);
      slotDrag.ghost = ghost;
      btn.classList.add('dragging');
    }
    if (!slotDrag.ghost) return;
    slotDrag.ghost.style.left = `${e.clientX}px`;
    slotDrag.ghost.style.top = `${e.clientY}px`;
    const over = slotUnder(e.clientX, e.clientY);
    for (const b of $$('.hotbar [data-slot]')) b.classList.toggle('drop-target', b === over && b !== btn);
  });
  btn.addEventListener('pointerup', (e) => {
    if (!slotDrag || slotDrag.btn !== btn) return;
    const drag = slotDrag;
    slotDrag = null;
    if (drag.ghost) {
      drag.ghost.remove();
      endSlotGhost();
      const over = slotUnder(e.clientX, e.clientY);
      if (over && over !== btn) game?.swapSlots(drag.from, Number(over.dataset.slot));
      return;
    }
    if (performance.now() - drag.at < HOLD_MS) game?.castSlot(drag.from);
  });
  btn.addEventListener('pointercancel', () => {
    endSlotGhost();
    slotDrag = null;
  });
}
for (const btn of $$('[data-quick]')) {
  btn.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    game?.useQuick(btn.dataset.quick);
  });
}
for (const btn of $$('[data-open]')) {
  btn.addEventListener('click', () => {
    playSfx('click');
    openPanel(btn.dataset.open);
  });
}

// 그리는 간격: 120Hz 화면에서도 1초에 60번만, 가운데 창이 열려 게임이 멈춘 동안은 1초에 10번만(배터리·발열 줄이기)
const MIN_FRAME_MS = 10;
const PAUSED_FRAME_MS = 100;
let last = performance.now();
function frame(ts) {
  // 예외가 나도 루프가 멈추지 않도록 다음 프레임을 먼저 예약한다
  requestAnimationFrame(frame);
  if (ts - last < (game && panels.isOpen ? PAUSED_FRAME_MS : MIN_FRAME_MS)) return;
  const dt = Math.min(50, ts - last);
  last = ts;
  if (game) {
    if (panels.isOpen) game.inputDir = null;
    else {
      input.update(game);
      game.update(dt);
    }
    hud.update(game, ts);
    minimap.update(game, ts);
    sidebar.update(game);
    if (ts - lastSaveAt > AUTOSAVE_MS) {
      saveAndSync();
      lastSaveAt = ts;
    }
  }
  renderer.render(game, ts);
  bgm.play(musicFor(game));
}

/** 지금 들려줄 곡: 타이틀 → 맵별 곡, 보스가 덤벼들면 보스 곡 */
function musicFor(g) {
  if (!g) return 'title';
  if (g.monsters.some((m) => MONSTERS[m.type].boss && m.aggro)) return 'boss';
  return MAP_TRACK[g.mapId] ?? 'field';
}

window.addEventListener('resize', () => {
  renderer.resize();
  updateLayout();
});
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'hidden') return;
  input.release();
  saveAndSync(true);
});
window.addEventListener('pagehide', () => saveAndSync(true));
// 비행기 모드가 풀리면 밀린 저장을 올린다
window.addEventListener('online', () => sync.reconnect(game ? slot : null).catch(() => {}));
// 다른 기기에서 지금 하는 캐릭터를 더 진행했으면 알려 준다(덮어쓰지 않고 타이틀에서 고르게 한다)
sync.onChange(() => {
  if (!game || !sync.conflicts[slot] || warnedConflict) return;
  warnedConflict = true;
  game.log('다른 기기에서 이 캐릭터를 따로 진행한 저장이 서버에 있습니다. 타이틀로 나가면 어느 쪽을 쓸지 고를 수 있어요.', '#ffb199');
});
document.addEventListener('gesturestart', (e) => e.preventDefault());
document.addEventListener('pointerdown', unlockAudio);
document.addEventListener('keydown', unlockAudio);

navigator.storage?.persist?.().catch(() => {});
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
  // 새 버전이 설치되면(이미 실행 중인 게임이 있으면) 한 번 새로 고쳐 바로 바꾼다
  let reloaded = false;
  const hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || reloaded || game) return;
    reloaded = true;
    location.reload();
  });
}

// 개발 확인용: 주소 끝에 ?debug 를 붙였을 때만 콘솔에서 게임 상태를 볼 수 있다
if (new URLSearchParams(location.search).has('debug')) window.cheongpung = { game: () => game, panels, renderer };

// 터치가 전혀 없는 기기(PC)만 터치용 이동·공격 버튼을 숨기고 단축키를 보여 준다
// (트랙패드를 붙인 아이패드처럼 터치도 되는 기기는 터치 버튼을 그대로 둔다)
if (matchMedia('(hover: hover) and (pointer: fine)').matches && !matchMedia('(any-pointer: coarse)').matches) {
  document.body.classList.add('desktop');
}

$('#chat-form').addEventListener('submit', (e) => {
  e.preventDefault();
  submitChat(chatInput.value);
  chatInput.value = '';
  chatInput.blur();
});
chatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    chatInput.value = '';
    chatInput.blur();
  }
});
$('#minimap-toggle').addEventListener('click', () => openPanel('worldmap'));
$('#ride-toggle').addEventListener('click', () => game?.toggleRide());
$('#minimap').addEventListener('click', () => openPanel('worldmap'));

applySettings(getSettings());
// 새 도트 타일 그림을 불러오면 맵을 다시 그린다
loadNinja().then(() => { renderer.mapId = null; });
// 실사 생김새 그림을 미리 불러 두고, 다 오면 타이틀 그림을 다시 그린다
preloadPhotos(() => { if (!$('#title').hidden) title.render(); });
loadFx();
setPlaying(false);
title.show();
sync.reconnect().catch(() => {});
requestAnimationFrame(frame);
