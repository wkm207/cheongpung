// LPC(Liberated Pixel Cup) 캐릭터 그림: 직업·성별마다 걷기·베기·시전·찌르기·쓰러짐 동작.
// assets/lpc/<이름>/<동작>.png — 줄은 위·왼쪽·아래·오른쪽, 한 칸 64px(큰 베기는 192px). 출처는 assets/lpc/CREDITS.txt
const ANIMS = { walk: 9, slash: 6, spellcast: 7, thrust: 8, hurt: 6 };
const ROW = { up: 0, left: 1, down: 2, right: 3 };
const sheets = new Map();

// NPC 생김새 → 그림
const NPC_SHEET = {
  smith: 'npc_man', forger: 'npc_man', stable: 'npc_man', ferryman: 'npc_man', traveler: 'npc_man',
  tailor: 'npc_merchant', peddler: 'npc_merchant', innkeeper: 'npc_woman', herbalist: 'npc_woman',
  chief: 'npc_elder', master: 'npc_elder', guard: 'npc_guard', lord: 'npc_lord',
};
export const npcSheetName = (look) => NPC_SHEET[look] ?? null;

/** 그림 한 장(없으면 불러오기 시작하고 null) */
function sheet(name, anim) {
  const key = `${name}/${anim}`;
  if (!sheets.has(key)) {
    if (typeof Image === 'undefined') return null;
    const img = new Image();
    img.loaded = false;
    img.onload = () => {
      img.loaded = true;
    };
    img.src = `assets/lpc/${key}.png`;
    sheets.set(key, img);
  }
  const img = sheets.get(key);
  return img.loaded ? img : null;
}

/** 미리 불러 두기 */
export function preloadLpc(name, anims = Object.keys(ANIMS)) {
  for (const a of anims) sheet(name, a);
}

/**
 * 한 칸 그리기. (x,y)는 게임 칸의 왼쪽 위(32px 칸). 발이 칸 아래쪽에 오도록 맞춘다.
 * 그림이 아직 없으면 false
 */
export function drawLpc(ctx, name, anim, dir, frame, x, y, alpha = 1, lift = 0) {
  const img = sheet(name, anim);
  if (!img) return false;
  const n = ANIMS[anim];
  const rows = anim === 'hurt' ? 1 : 4;
  const size = img.width / n;
  const row = rows === 1 ? 0 : ROW[dir] ?? 2;
  const f = Math.max(0, Math.min(n - 1, frame));
  // 64칸 기준 발끝이 아래에서 2px 위 → 칸 아래(y+31)에 맞춘다. 큰 칸(192)은 가운데에 64칸이 있다
  const pad = (size - 64) / 2;
  const dx = x + 16 - 32 - pad;
  const dy = y + 31 - 62 - pad - lift;
  const prev = ctx.globalAlpha;
  ctx.globalAlpha = prev * alpha;
  ctx.drawImage(img, f * size, row * size, size, size, Math.round(dx), Math.round(dy), size, size);
  ctx.globalAlpha = prev;
  return true;
}

export const LPC_FRAMES = ANIMS;
