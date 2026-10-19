// 타이틀 화면의 로그인·계정 부분(HTML 만 만든다. 동작은 title.js)
import { esc, formatPlayTime } from './dom.js';
import { MAP_DEFS } from '../data/maps.js';
import { titleOf } from '../data/tiers.js';
import { PASSWORD_MIN } from '../core/account.js';

/** 슬롯 위에 붙는 한 줄: 로그인 상태와 서버 저장 상태 */
export function accountBar(sync) {
  if (!sync?.enabled) return '';
  if (!sync.loggedIn) {
    return `<p class="sub">📱 이 기기에만 저장 중 <button class="tiny" data-act="toLogin">로그인</button></p>`;
  }
  const text = sync.statusText();
  return `<p class="sub">☁️ <b>${esc(sync.userId)}</b> · ${esc(text)} <button class="tiny" data-act="logout">로그아웃</button></p>`;
}

function field(id, label, type, value, auto) {
  return `<label class="name-field" style="justify-content:space-between">${label} <input id="${id}" type="${type}" value="${esc(value)}" autocomplete="${auto}" autocapitalize="off" spellcheck="false"></label>`;
}

/** 로그인(signup=false) / 가입(signup=true) 화면 */
export function loginView({ id, note, busy, signup }) {
  const pw2 = signup ? field('acc-pw2', '비밀번호 확인', 'password', '', 'new-password') : '';
  const main = signup
    ? `<button class="primary" type="submit" ${busy ? 'disabled' : ''}>가입하고 시작</button>`
    : `<button class="primary" type="submit" ${busy ? 'disabled' : ''}>로그인</button>`;
  const other = signup
    ? '<button type="button" data-act="toLogin">이미 아이디가 있어요</button>'
    : '<button type="button" data-act="toSignup">처음이에요 (가입)</button>';
  return `
    <h1>Country of Wind</h1>
    <h2>${signup ? '아이디 만들기' : '로그인'}</h2>
    <p class="sub">로그인하면 폰·아이패드·컴퓨터 어디서든 같은 캐릭터로 이어서 할 수 있어요.</p>
    <form class="title-buttons" data-form="${signup ? 'signUp' : 'signIn'}" autocomplete="on">
      ${field('acc-id', '아이디', 'text', id, 'username')}
      ${field('acc-pw', '비밀번호', 'password', '', signup ? 'new-password' : 'current-password')}
      ${pw2}
      ${main}
      ${other}
    </form>
    ${signup ? `<p class="install-hint">아이디는 영문·숫자 4~16자, 비밀번호는 ${PASSWORD_MIN}자 이상. 이메일이 없어 <b>비밀번호를 잊으면 찾을 수 없으니</b> 꼭 기억해 두세요.</p>` : ''}
    ${busy ? '<p class="note-light">잠시만요…</p>' : ''}
    ${note ? `<p class="warn-text">${esc(note)}</p>` : ''}
    <div class="title-buttons"><button data-act="playLocal">로그인 없이 이 기기에서만 하기</button></div>`;
}

function sideCard(side, player, at, newer) {
  const label = side === 'local' ? '이 기기' : '서버';
  const when = at ? new Date(at).toLocaleString('ko-KR') : '';
  const pick = side === 'local' ? 'useLocal' : 'useRemote';
  if (!player) {
    return `<div class="save-slot"><span class="slot-no">${label}</span><b>(비어 있음)</b>
      <div class="slot-actions"><button data-act="${pick}">빈 칸으로 두기</button></div></div>`;
  }
  return `<div class="save-slot">
    <span class="slot-no">${label}${newer ? ' · 더 최근' : ''}</span>
    <canvas data-preview="${player.cls}" data-side="${side}" width="32" height="48"></canvas>
    <b>${esc(player.name)}</b>
    <small>Lv.${player.level} ${esc(titleOf(player.cls, player.tier))}</small>
    <small>${esc(MAP_DEFS[player.mapId]?.name ?? '')} · ${formatPlayTime(player.playMs)}</small>
    <small>${esc(when)} 저장</small>
    <div class="slot-actions"><button class="${newer ? 'primary' : ''}" data-act="${pick}">이걸 쓰기</button></div>
  </div>`;
}

/** 기기와 서버 저장이 갈린 칸: 어느 쪽을 쓸지 고른다 */
export function conflictView(slot, info) {
  return `
    <h2>${slot + 1}번 슬롯 · 어느 저장을 쓸까요?</h2>
    <p class="sub">이 기기와 서버(다른 기기에서 한 것)의 저장이 서로 다릅니다. 고르지 않은 쪽은 사라집니다.</p>
    <div class="slot-grid">
      ${sideCard('local', info.local, info.localAt, info.newer === 'local')}
      ${sideCard('remote', info.remote, info.remoteAt, info.newer === 'remote')}
    </div>
    <div class="title-buttons row"><button data-act="back">나중에 고르기</button></div>`;
}
