// 대화창 거래: 상인 근처에서 "약초 10개 사자", "도토리 팔자"처럼 말하면 거래한다.
import { ITEMS } from '../data/items.js';

const PATTERN = /^(.+?)\s*(?:(\d+)\s*개)?\s*(사자|살게|살래|사요|주세요|줘|팔자|팔게|팔래|팔아요)$/;
const SELL_WORDS = ['팔자', '팔게', '팔래', '팔아요'];

const norm = (s) => String(s).replace(/\s+/g, '');

/** 말에서 거래 내용을 읽는다. 거래 말이 아니면 null */
export function parseTrade(text) {
  const m = String(text).trim().match(PATTERN);
  if (!m) return null;
  return { verb: SELL_WORDS.includes(m[3]) ? 'sell' : 'buy', name: m[1].trim(), qty: Math.max(1, Math.min(99, Number(m[2] ?? 1))) };
}

/** 이름으로 아이템 찾기(공백 무시, 정확히 같은 이름 우선, 없으면 앞부분이 같은 것) */
export function findItemByName(ids, name) {
  const q = norm(name);
  return ids.find((id) => norm(ITEMS[id].name) === q) ?? ids.find((id) => norm(ITEMS[id].name).startsWith(q)) ?? null;
}
