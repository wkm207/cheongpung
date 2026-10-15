const KEY_DIRS = {
  ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
};
export const KEY_PANELS = { KeyI: 'inventory', KeyK: 'skills', KeyC: 'character', KeyL: 'quests', KeyM: 'menu', KeyG: 'gm', Backquote: 'gm' };
const SLOT_KEYS = ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9', 'Digit0'];
const NUMPAD_KEYS = ['Numpad1', 'Numpad2', 'Numpad3', 'Numpad4', 'Numpad5', 'Numpad6', 'Numpad7', 'Numpad8', 'Numpad9', 'Numpad0'];
const SPELL_WINDOW_KEYS = ['Equal', 'NumpadAdd'];
const DEADZONE = 12;
const JOY_RADIUS = 44;

const isTyping = (e) => ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target?.tagName);

function dirFromVector(dx, dy, deadzone) {
  if (Math.hypot(dx, dy) < deadzone) return null;
  if (Math.abs(dx) > Math.abs(dy)) return dx < 0 ? 'left' : 'right';
  return dy < 0 ? 'up' : 'down';
}

/** 키보드·방향 버튼(D-패드)·조이스틱·공격 버튼 입력을 모아 매 프레임 게임에 전달한다. */
export class Input {
  constructor({ moveZone, dpad, joyBase, joyKnob, canvas, attackBtn, rollBtn, actions }) {
    this.actions = actions;
    this.dpad = dpad;
    this.joyBase = joyBase;
    this.joyKnob = joyKnob;
    this.mode = 'dpad';
    this.keyStack = [];
    this.touchDir = null;
    this.pointer = null;
    this.attackHeld = false;

    window.addEventListener('keydown', (e) => this.onKeyDown(e));
    window.addEventListener('keyup', (e) => this.onKeyUp(e));
    window.addEventListener('blur', () => this.release());

    moveZone.addEventListener('pointerdown', (e) => this.onMoveStart(e));
    moveZone.addEventListener('pointermove', (e) => this.onMove(e));
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
      moveZone.addEventListener(type, (e) => this.onMoveEnd(e));
    }

    rollBtn?.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      actions.roll();
    });
    attackBtn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this.attackHeld = true;
      actions.attack();
    });
    for (const type of ['pointerup', 'pointercancel', 'pointerleave']) {
      attackBtn.addEventListener(type, () => { this.attackHeld = false; });
    }

    canvas.addEventListener('pointerdown', (e) => actions.tap(e.clientX, e.clientY));
  }

  setMode(mode) {
    this.mode = mode;
    this.release();
  }

  onKeyDown(e) {
    if (isTyping(e) || e.metaKey || e.ctrlKey || e.altKey) return;
    this.actions.keyboardUsed();
    if (e.code === 'Escape') {
      this.actions.closePanel();
      return;
    }
    if ((e.code === 'Space' || e.code === 'Enter' || e.code === 'NumpadEnter') && this.actions.panelAdvance()) {
      e.preventDefault();
      return;
    }
    // 마법창이 열려 있으면 알파벳은 마법 순서 바꾸기에 쓴다
    if (/^Key[A-T]$/.test(e.code) && this.actions.spellLetter(e.code.slice(3).toLowerCase())) {
      e.preventDefault();
      return;
    }
    if (SPELL_WINDOW_KEYS.includes(e.code) && !e.repeat) {
      e.preventDefault();
      this.actions.openPanel('spells');
      return;
    }
    if (KEY_PANELS[e.code] && !e.repeat) {
      this.actions.openPanel(KEY_PANELS[e.code]);
      return;
    }
    if (e.code === 'Enter' || e.code === 'NumpadEnter') {
      e.preventDefault();
      this.release();
      this.actions.focusChat();
      return;
    }
    if (e.code === 'KeyR' && !e.repeat && !this.actions.isPaused()) {
      this.actions.toggleRide();
      return;
    }
    if ((e.code === 'ShiftLeft' || e.code === 'ShiftRight') && !e.repeat && !this.actions.isPaused()) {
      this.actions.roll();
      return;
    }
    if (e.code === 'KeyN' && !e.repeat) {
      this.actions.openMap();
      return;
    }
    if (this.actions.isPaused()) return;
    const dir = KEY_DIRS[e.code];
    if (dir) {
      e.preventDefault();
      if (!this.keyStack.includes(dir)) this.keyStack = [...this.keyStack, dir];
      return;
    }
    if (e.repeat) return;
    const slot = Math.max(SLOT_KEYS.indexOf(e.code), NUMPAD_KEYS.indexOf(e.code));
    if (slot >= 0) this.actions.skill(slot);
    else if (e.code === 'Space') {
      e.preventDefault();
      this.attackHeld = true;
      this.actions.attack();
    } else if (e.code === 'KeyQ') this.actions.quick('hp');
    else if (e.code === 'KeyE') this.actions.quick('mp');
  }

  onKeyUp(e) {
    const dir = KEY_DIRS[e.code];
    if (dir) this.keyStack = this.keyStack.filter((d) => d !== dir);
    if (e.code === 'Space') this.attackHeld = false;
  }

  onMoveStart(e) {
    if (this.pointer !== null) return;
    e.preventDefault();
    this.pointer = e.pointerId;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    if (this.mode === 'joystick') {
      const zone = e.currentTarget.getBoundingClientRect();
      this.origin = { x: e.clientX, y: e.clientY };
      this.joyBase.classList.add('active');
      this.joyBase.style.left = `${e.clientX - zone.left}px`;
      this.joyBase.style.top = `${e.clientY - zone.top}px`;
      this.setKnob(0, 0);
      this.touchDir = null;
    } else {
      this.updateDpad(e);
    }
  }

  onMove(e) {
    if (e.pointerId !== this.pointer) return;
    if (this.mode === 'joystick') {
      const dx = e.clientX - this.origin.x;
      const dy = e.clientY - this.origin.y;
      const len = Math.hypot(dx, dy);
      const k = len > JOY_RADIUS ? JOY_RADIUS / len : 1;
      this.setKnob(dx * k, dy * k);
      this.touchDir = dirFromVector(dx, dy, DEADZONE + 2);
    } else {
      this.updateDpad(e);
    }
  }

  onMoveEnd(e) {
    if (e.pointerId !== this.pointer) return;
    this.pointer = null;
    this.touchDir = null;
    this.joyBase.classList.remove('active');
    this.joyBase.style.left = '';
    this.joyBase.style.top = '';
    this.setKnob(0, 0);
    this.highlightDpad(null);
  }

  /** D-패드: 패드 가운데를 기준으로 누른 쪽 방향 */
  updateDpad(e) {
    const r = this.dpad.getBoundingClientRect();
    this.touchDir = dirFromVector(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2), DEADZONE);
    this.highlightDpad(this.touchDir);
  }

  highlightDpad(dir) {
    for (const el of this.dpad.querySelectorAll('.arrow')) el.classList.toggle('on', el.classList.contains(dir));
  }

  setKnob(x, y) {
    this.joyKnob.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
  }

  /** 창을 열 때 등: 누르고 있던 입력을 모두 놓는다. */
  release() {
    this.pointer = null;
    this.keyStack = [];
    this.attackHeld = false;
    this.touchDir = null;
    this.highlightDpad(null);
  }

  update(game) {
    game.inputDir = this.touchDir ?? this.keyStack[this.keyStack.length - 1] ?? null;
    if (this.attackHeld) game.attack();
  }
}
