import { ITEMS, isStackable } from '../data/items.js';
import { INVENTORY_SIZE, STACK_MAX } from '../config.js';

/** 인벤토리는 [{ id, qty }] 배열. 모든 함수는 새 배열을 돌려준다. */
export function addItem(inv, id, qty = 1) {
  if (!ITEMS[id] || qty <= 0) return { inv, leftover: qty };
  const next = inv.map((s) => ({ ...s }));
  let left = qty;
  if (isStackable(id)) {
    for (const s of next) {
      if (left <= 0) break;
      if (s.id !== id || s.qty >= STACK_MAX) continue;
      const add = Math.min(STACK_MAX - s.qty, left);
      s.qty += add;
      left -= add;
    }
    while (left > 0 && next.length < INVENTORY_SIZE) {
      const add = Math.min(STACK_MAX, left);
      next.push({ id, qty: add });
      left -= add;
    }
  } else {
    while (left > 0 && next.length < INVENTORY_SIZE) {
      next.push({ id, qty: 1 });
      left -= 1;
    }
  }
  return { inv: next, leftover: left };
}

export function removeAt(inv, index, qty = 1) {
  const slot = inv[index];
  if (!slot) return inv;
  if (slot.qty > qty) return inv.map((s, i) => (i === index ? { ...s, qty: s.qty - qty } : s));
  return inv.filter((_, i) => i !== index);
}

export function countOf(inv, id) {
  return inv.reduce((n, s) => (s.id === id ? n + s.qty : n), 0);
}

export function canAdd(inv, id, qty = 1) {
  return addItem(inv, id, qty).leftover === 0;
}

/** id 아이템을 qty개 빼낸다(여러 칸에 나뉘어 있어도). 모자라면 원본 그대로 돌려준다. */
export function removeCount(inv, id, qty) {
  if (countOf(inv, id) < qty) return inv;
  let left = qty;
  return inv
    .map((s) => {
      if (s.id !== id || left <= 0) return s;
      const take = Math.min(s.qty, left);
      left -= take;
      return { ...s, qty: s.qty - take };
    })
    .filter((s) => s.qty > 0);
}
