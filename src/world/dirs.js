export const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
export const DIR_NAMES = Object.keys(DIRS);

export function dirTowards(fx, fy, tx, ty) {
  const dx = tx - fx;
  const dy = ty - fy;
  if (Math.abs(dx) >= Math.abs(dy)) return dx < 0 ? 'left' : 'right';
  return dy < 0 ? 'up' : 'down';
}

export const manhattan = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
export const chebyshev = (a, b) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));

/** 걷는 도중 보간된 화면 위치(타일 단위) */
export function lerpPos(e) {
  const t = e.moving ? e.stepT : 1;
  return { x: e.fromX + (e.x - e.fromX) * t, y: e.fromY + (e.y - e.fromY) * t };
}

/** 한 칸 이동을 시작한다. */
export function beginStep(e, nx, ny) {
  e.fromX = e.x;
  e.fromY = e.y;
  e.x = nx;
  e.y = ny;
  e.stepT = 0;
  e.moving = true;
}

/** 이동을 진행하고, 이번 프레임에 도착했으면 남은 진행률(0 이상)을, 아니면 -1을 돌려준다. */
export function advanceStep(e, dt, stepMs) {
  if (!e.moving) return -1;
  e.stepT += dt / stepMs;
  if (e.stepT < 1) return -1;
  const overflow = e.stepT - 1;
  e.stepT = 1;
  e.moving = false;
  return overflow;
}
