// 새 도트 모드의 몬스터: mobdots.js 의 도트 칸을 캔버스로 만들어 두고, 보통 2배(작은 짐승은 사람과 같은 1.5배, 보스는 더 크게)로 그린다.
import { mobFrame } from './mobdots.js';
import { MONSTER_LOOK, monsterScale } from './sprites.js';

const cache = new Map();
// 사람 도트와 같은 배율: 도트 한 개 = 게임 1.5칸 픽셀
const MOB_SCALE = 1.5;
const MOB_BIG = 2;
// 늘 움직이는 몸(치맛자락·날갯짓): 서 있어도 걸음 칸을 돈다
const FLOATERS = new Set(['ghost', 'bat', 'bird', 'egg']);

/** 몬스터 한 칸 캔버스. lw·lh 는 게임 좌표 크기 */
export function mobSprite(type, dir, step) {
  const key = `${type}|${dir}|${step}`;
  if (cache.has(key)) return cache.get(key);
  const look = MONSTER_LOOK[type];
  const f = mobFrame(look, dir, step);
  const c = document.createElement('canvas');
  c.width = f.w;
  c.height = f.h;
  c.getContext('2d').putImageData(new ImageData(f.data, f.w, f.h), 0, 0);
  // 원작처럼 몬스터는 사람보다 크게: 보통 2배, 작은 짐승(쥐·토끼 등)은 사람과 같은 1.5배, 보스는 정해진 만큼 더
  const k = look.scale ? MOB_SCALE * look.scale : monsterScale(type) > 1 ? MOB_BIG : MOB_SCALE;
  c.lw = f.w * k;
  c.lh = f.h * k;
  cache.set(key, c);
  return c;
}

/** 걸음 칸: 걸으면 1·0·2·0, 떠다니는 몸은 늘 돈다 */
export function mobStep(m, now) {
  const art = MONSTER_LOOK[m.type].art;
  if (FLOATERS.has(art)) return [1, 0, 2, 0][Math.floor((now + m.id * 170) / (art === 'ghost' || art === 'egg' ? 220 : 110)) % 4];
  return m.moving ? [1, 0, 2, 0][Math.floor(now / 120) % 4] : 0;
}

/** 떠 있는 높이(귀신·박쥐·새는 둥실둥실) */
export function mobHover(m, now) {
  const art = MONSTER_LOOK[m.type].art;
  if (art === 'bat' || art === 'bird') return 5 + Math.sin((now + m.id * 300) / 180) * 2;
  if (art === 'ghost') return 2 + Math.sin((now + m.id * 300) / 400) * 1.5;
  return 0;
}
