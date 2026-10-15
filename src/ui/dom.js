export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ESC[c]);

/** 값이 바뀔 때만 DOM을 건드린다(매 프레임 호출용). */
export function setText(el, value) {
  if (el._v === value) return;
  el._v = value;
  el.textContent = value;
}

export function setStyle(el, prop, value) {
  const key = `_s_${prop}`;
  if (el[key] === value) return;
  el[key] = value;
  el.style.setProperty(prop, value);
}

export function formatPlayTime(ms) {
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h ? `${h}시간 ${m}분` : `${m}분`;
}

const isStandalone = () => navigator.standalone === true
  || matchMedia('(display-mode: standalone), (display-mode: fullscreen)').matches;

/**
 * 백업 파일 저장. 공유 시트가 되면 그걸 쓰고(iOS), 홈 화면 앱처럼 다운로드하면
 * 화면에 갇힐 수 있는 곳에서는 false를 돌려 '복사하기'를 쓰게 한다.
 */
export async function shareOrDownload(filename, text) {
  const file = new File([text], filename, { type: 'application/json' });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: '청풍록 백업' });
      return true;
    } catch (err) {
      return err?.name === 'AbortError';
    }
  }
  if (isStandalone()) return false;
  downloadText(filename, text);
  return true;
}

function downloadText(filename, text) {
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href: url, download: filename });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function copyText(text, fallbackEl) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    if (!fallbackEl) return false;
    fallbackEl.focus();
    fallbackEl.select();
    fallbackEl.setSelectionRange(0, fallbackEl.value.length);
    try {
      return document.execCommand('copy');
    } catch {
      return false;
    }
  }
}

export function readFileText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('파일을 읽지 못했습니다.'));
    reader.readAsText(file);
  });
}
