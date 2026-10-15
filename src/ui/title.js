import { esc, readFileText, formatPlayTime } from './dom.js';
import { GAME_VERSION } from '../config.js';
import { CLASSES } from '../data/classes.js';
import { MAP_DEFS } from '../data/maps.js';
import { titleOf } from '../data/tiers.js';
import { playerSprite } from '../render/sprites.js';

const NAME_MAX = 8;

/** 타이틀 화면: 저장 슬롯 4칸 / 새 캐릭터(이름·직업) / 백업 불러오기 */
export class Title {
  constructor(root, { listSaves, isCorrupt, deleteSave, importText, onStart }) {
    this.root = root;
    this.listSaves = listSaves;
    this.isCorrupt = isCorrupt;
    this.deleteSave = deleteSave;
    this.importText = importText;
    this.onStart = onStart;
    this.view = 'main';
    this.slot = 0;
    this.cls = null;
    this.gender = 'm';
    this.name = '';
    this.note = '';
    this.confirmDelete = null;
    root.addEventListener('click', (e) => this.onClick(e));
    root.addEventListener('input', (e) => {
      if (e.target.id === 'new-name') {
        this.name = e.target.value.slice(0, NAME_MAX);
        this.updateStartButton();
      }
    });
    root.addEventListener('change', (e) => {
      if (e.target.id === 'title-import-file') this.importFile(e.target.files?.[0]);
    });
  }

  show() {
    this.view = 'main';
    this.note = '';
    this.confirmDelete = null;
    this.root.hidden = false;
    this.render();
  }

  hide() {
    this.root.hidden = true;
  }

  render() {
    this.root.innerHTML = `<div class="title-wrap">${this[`render_${this.view}`]()}</div>`;
    this.drawPreviews();
  }

  render_main() {
    const saves = this.listSaves();
    const slots = saves.map((p, i) => {
      if (!p && this.isCorrupt(i)) {
        const del = this.confirmDelete === i
          ? `<button class="danger" data-act="delete" data-slot="${i}">정말 삭제</button><button data-act="cancelDelete">취소</button>`
          : `<button data-act="askDelete" data-slot="${i}">비우기</button>`;
        return `<div class="save-slot empty"><span class="slot-no">${i + 1}번</span>⚠️<br>읽을 수 없는 저장<small>백업이 있으면 '백업 불러오기'로 되살릴 수 있어요</small><div class="slot-actions">${del}</div></div>`;
      }
      if (!p) {
        return `<button class="save-slot empty" data-act="new" data-slot="${i}"><span class="slot-no">${i + 1}번</span>➕<br>새 캐릭터</button>`;
      }
      const del = this.confirmDelete === i
        ? `<button class="danger" data-act="delete" data-slot="${i}">정말 삭제</button><button data-act="cancelDelete">취소</button>`
        : `<button data-act="askDelete" data-slot="${i}">삭제</button>`;
      return `<div class="save-slot">
        <span class="slot-no">${i + 1}번</span>
        <canvas data-preview="${p.cls}" data-slot="${i}" width="32" height="48"></canvas>
        <b>${esc(p.name)}</b>
        <small>Lv.${p.level} ${esc(titleOf(p.cls, p.tier))}</small>
        <small>${esc(MAP_DEFS[p.mapId]?.name ?? '')} · ${formatPlayTime(p.playMs)}</small>
        <div class="slot-actions"><button class="primary" data-act="continue" data-slot="${i}">시작</button>${del}</div>
      </div>`;
    }).join('');
    return `
      <h1>청풍록</h1>
      <p class="hanja">淸風錄</p>
      <p class="sub">바람이 머무는 고을, 나만의 오프라인 모험</p>
      <div class="slot-grid">${slots}</div>
      <div class="title-buttons"><button data-act="import">백업 불러오기</button></div>
      ${this.note ? `<p class="note-light">${esc(this.note)}</p>` : ''}
      <p class="install-hint">아이패드·아이폰: Safari 공유 버튼 → <b>홈 화면에 추가</b>하면 비행기 모드에서도 실행됩니다.</p>
      <p class="install-hint">게임 버전 <b>${GAME_VERSION}</b></p>`;
  }

  render_new() {
    const cards = Object.entries(CLASSES).map(([id, c]) => `
      <button class="class-card${this.cls === id ? ' sel' : ''}" data-act="pick" data-cls="${id}">
        <canvas data-preview="${id}" width="32" height="48"></canvas>
        <b>${c.name}</b><small>${esc(c.desc)}</small>
        <span class="mini-stats">체${c.base.hp} 마${c.base.mp} 공${c.base.atk} 방${c.base.def} 술${c.base.mag}</span>
      </button>`).join('');
    return `
      <h2>${this.slot + 1}번 슬롯 · 새 캐릭터</h2>
      <label class="name-field">이름 <input id="new-name" maxlength="${NAME_MAX}" value="${esc(this.name)}" placeholder="최대 ${NAME_MAX}자" autocomplete="off"></label>
      <div class="row" style="justify-content:center">성별
        <button class="${this.gender === 'm' ? 'primary' : ''}" data-act="gender" data-g="m">남자</button>
        <button class="${this.gender === 'f' ? 'primary' : ''}" data-act="gender" data-g="f">여자</button>
      </div>
      <div class="class-grid">${cards}</div>
      <div class="title-buttons row">
        <button data-act="back">뒤로</button>
        <button class="primary" id="start-btn" data-act="start">모험 시작</button>
      </div>`;
  }

  render_import() {
    const saves = this.listSaves();
    const picks = saves.map((p, i) => `<button class="${this.slot === i ? 'primary' : ''}" data-act="pickSlot" data-slot="${i}">${i + 1}번${p ? ` (${esc(p.name)})` : ' (빈 칸)'}</button>`).join('');
    return `
      <h2>백업 불러오기</h2>
      <p class="sub">넣을 슬롯을 고르고, 백업 글자를 붙여넣거나 백업 파일을 고르세요.</p>
      <div class="row" style="justify-content:center">${picks}</div>
      ${saves[this.slot] ? '<p class="warn-text">※ 이 슬롯의 캐릭터는 백업 내용으로 바뀝니다.</p>' : ''}
      <textarea id="title-import-text" placeholder="여기에 붙여넣기"></textarea>
      <input type="file" id="title-import-file" accept=".json,application/json,text/plain">
      ${this.note ? `<p class="note-light">${esc(this.note)}</p>` : ''}
      <div class="title-buttons row">
        <button data-act="back">뒤로</button>
        <button class="primary" data-act="doImport">불러오기</button>
      </div>`;
  }

  drawPreviews() {
    const saves = this.view === 'main' ? this.listSaves() : [];
    for (const canvas of this.root.querySelectorAll('[data-preview]')) {
      const ctx = canvas.getContext('2d');
      const save = canvas.dataset.slot !== undefined ? saves[Number(canvas.dataset.slot)] : null;
      const img = playerSprite(canvas.dataset.preview, { gender: save?.gender ?? this.gender, equip: save?.equip ?? {} });
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
    }
    this.updateStartButton();
  }

  updateStartButton() {
    const btn = this.root.querySelector('#start-btn');
    if (btn) btn.disabled = !(this.name.trim() && this.cls);
  }

  onClick(e) {
    const el = e.target.closest('[data-act]');
    if (!el) return;
    const slot = Number(el.dataset.slot);
    switch (el.dataset.act) {
      case 'continue': {
        const save = this.listSaves()[slot];
        if (save) this.onStart(save, slot);
        return;
      }
      case 'new': this.view = 'new'; this.slot = slot; this.name = ''; this.cls = null; break;
      case 'askDelete': this.confirmDelete = slot; break;
      case 'cancelDelete': this.confirmDelete = null; break;
      case 'delete': this.deleteSave(slot); this.confirmDelete = null; this.note = `${slot + 1}번 슬롯을 비웠습니다.`; break;
      case 'import': {
        this.view = 'import';
        this.note = '';
        const empty = this.listSaves().findIndex((p) => !p);
        this.slot = empty >= 0 ? empty : 0;
        break;
      }
      case 'pickSlot': this.slot = slot; break;
      case 'back': this.view = 'main'; this.note = ''; break;
      case 'pick': this.cls = el.dataset.cls; break;
      case 'gender': this.gender = el.dataset.g; break;
      case 'start': {
        const name = this.name.trim();
        if (!name || !this.cls) return;
        this.onStart({ newName: name, cls: this.cls, gender: this.gender }, this.slot);
        return;
      }
      case 'doImport': this.tryImport(this.root.querySelector('#title-import-text').value); return;
      default: return;
    }
    this.render();
  }

  tryImport(text) {
    try {
      this.onStart(this.importText(text), this.slot);
    } catch (err) {
      this.note = err.message;
      this.render();
    }
  }

  async importFile(file) {
    if (!file) return;
    try {
      this.tryImport(await readFileText(file));
    } catch (err) {
      this.note = err.message;
      this.render();
    }
  }
}
