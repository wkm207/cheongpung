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

const renderer = new Renderer($('#game'));
const hud = new Hud();
const minimap = new Minimap($('#minimap'));
const chatInput = $('#chat-input');
let game = null;
let slot = 0;
let lastSaveAt = 0;

const saveNow = () => (game ? writeSave(game.toSave(), slot) : false);

function applySettings(settings) {
  document.body.classList.toggle('control-dpad', settings.control === 'dpad');
  document.body.classList.toggle('control-joystick', settings.control === 'joystick');
  document.body.classList.toggle('minimap-off', !settings.minimap);
  minimap.visible = settings.minimap;
  input.setMode(settings.control);
}

function toggleMinimap() {
  applySettings(updateSettings({ minimap: !getSettings().minimap }));
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
  deleteSave: (i) => deleteSave(i),
  importText,
  onStart: (data, i) => startGame(data.newName ? createPlayer(data.newName, data.cls, data.gender) : data, i),
});

const input = new Input({
  moveZone: $('#move-zone'),
  dpad: $('#dpad'),
  joyBase: $('#joy-base'),
  joyKnob: $('#joy-knob'),
  canvas: $('#game'),
  attackBtn: $('#btn-attack'),
  actions: {
    attack: () => game?.attack(),
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
    toggleMinimap,
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
  sidebar.setActive(playing && sidebar.fits(), playing ? game : null);
  updateInsets();
}

function updateInsets() {
  renderer.bottomInset = $('#console').hidden ? 0 : $('#console').offsetHeight;
  renderer.rightInset = sidebar.active ? $('#sidebar').offsetWidth : 0;
}

function startGame(player, i) {
  slot = i;
  game = new Game(player);
  game.on(onGameEvent);
  game.log(`${player.name}님, 청풍록에 오신 것을 환영합니다.`, '#ffd166');
  if (player.level === 1 && player.exp === 0) game.log('촌장(머리 위 !)에게 말을 걸어 첫 부탁을 받아 보세요.', '#ffe9a8');
  title.hide();
  setPlaying(true);
  saveNow();
  lastSaveAt = performance.now();
}

function backToTitle() {
  saveNow();
  game = null;
  setPlaying(false);
  title.show();
}

for (const btn of $$('.hotbar [data-slot]')) {
  btn.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    game?.castSlot(Number(btn.dataset.slot));
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

let last = performance.now();
function frame(ts) {
  // 예외가 나도 루프가 멈추지 않도록 다음 프레임을 먼저 예약한다
  requestAnimationFrame(frame);
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
      saveNow();
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
  saveNow();
});
window.addEventListener('pagehide', saveNow);
document.addEventListener('gesturestart', (e) => e.preventDefault());
document.addEventListener('pointerdown', unlockAudio);
document.addEventListener('keydown', unlockAudio);

navigator.storage?.persist?.().catch(() => {});
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
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
$('#minimap-toggle').addEventListener('click', toggleMinimap);
$('#ride-toggle').addEventListener('click', () => game?.toggleRide());
$('#minimap').addEventListener('click', toggleMinimap);

applySettings(getSettings());
setPlaying(false);
title.show();
requestAnimationFrame(frame);
