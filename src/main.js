import { Game, createPlayer } from './game.js';
import { Renderer } from './render/renderer.js';
import { Input } from './ui/input.js';
import { Hud } from './ui/hud.js';
import { Panels } from './ui/panels.js';
import { Title } from './ui/title.js';
import { Minimap } from './ui/minimap.js';
import { $, $$ } from './ui/dom.js';
import { getSettings, updateSettings } from './ui/settings.js';
import { playSfx, unlockAudio } from './ui/sfx.js';
import { bgm } from './ui/bgm.js';
import { MAP_TRACK } from './core/music.js';
import { MONSTERS } from './data/monsters.js';
import { listSaves, isCorrupt, writeSave, deleteSave, importText } from './core/save.js';
import { runCommand } from './core/gm.js';
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

const title = new Title($('#title'), {
  listSaves: () => listSaves(),
  isCorrupt: (i) => isCorrupt(i),
  deleteSave: (i) => deleteSave(i),
  importText,
  onStart: (data, i) => startGame(data.newName ? createPlayer(data.newName, data.cls) : data, i),
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
    openPanel: (kind) => {
      if (!game) return;
      if (panels.kind === kind) panels.close();
      else panels.open(kind);
    },
    closePanel: () => panels.close(),
    isPaused: () => !game || panels.isOpen,
    keyboardUsed: () => document.body.classList.add('has-keyboard'),
    focusChat: () => {
      if (!game || panels.isOpen) return;
      chatInput.focus();
    },
    toggleMinimap,
    spellLetter: (letter) => panels.kind === 'spells' && panels.spellLetter('abcdefghijklmn'.indexOf(letter)),
  },
});

function onGameEvent(type, data) {
  if (type === 'talk') panels.open('dialog', data);
  else if (type === 'openPanel') panels.open(data);
  else if (type === 'sfx') playSfx(data);
  else if (type === 'inventory' || type === 'quest') panels.refresh();
  else if (type === 'levelup' || type === 'map') saveNow();
}

function setPlaying(playing) {
  for (const id of ['#topbar', '#controls', '#console']) $(id).hidden = !playing;
  updateInsets();
}

function updateInsets() {
  renderer.bottomInset = $('#console').hidden ? 0 : $('#console').offsetHeight;
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
    panels.open(btn.dataset.open);
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
  updateInsets();
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
$('#minimap').addEventListener('click', toggleMinimap);

applySettings(getSettings());
setPlaying(false);
title.show();
requestAnimationFrame(frame);
