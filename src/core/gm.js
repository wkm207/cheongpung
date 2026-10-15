import { ITEMS } from '../data/items.js';
import { josa } from './josa.js';
import { MONSTERS } from '../data/monsters.js';
import { MAP_DEFS } from '../data/maps.js';
import { CLASSES } from '../data/classes.js';

export const COMMANDS = {
  help: { aliases: ['도움', '도움말', 'help', '?'], usage: '/도움' },
  level: { aliases: ['레벨', 'level', 'lv'], usage: '/레벨 30' },
  exp: { aliases: ['경험치', 'exp'], usage: '/경험치 1000' },
  gold: { aliases: ['돈', 'gold', 'money'], usage: '/돈 10000' },
  item: { aliases: ['아이템', 'item', 'give'], usage: '/아이템 청룡검 1' },
  tp: { aliases: ['이동', 'tp', 'warp'], usage: '/이동 여우숲' },
  spawn: { aliases: ['소환', 'spawn'], usage: '/소환 늑대 3' },
  god: { aliases: ['무적', 'god'], usage: '/무적' },
  heal: { aliases: ['회복', 'heal'], usage: '/회복' },
  speed: { aliases: ['속도', 'speed'], usage: '/속도 2' },
  killall: { aliases: ['전체처치', 'killall'], usage: '/전체처치' },
  cls: { aliases: ['직업', 'class'], usage: '/직업 도사' },
  tier: { aliases: ['승급', 'tier'], usage: '/승급 3' },
  learnall: { aliases: ['기술전부', 'learnall'], usage: '/기술전부' },
};

export function parseCommand(text) {
  const trimmed = String(text ?? '').trim().replace(/^\//, '');
  if (!trimmed) return null;
  const [head, ...args] = trimmed.split(/\s+/);
  const lower = head.toLowerCase();
  const cmd = Object.keys(COMMANDS).find((k) => COMMANDS[k].aliases.includes(lower)) ?? null;
  return { cmd, head, args };
}

const normalize = (s) => String(s).replace(/\s+/g, '').toLowerCase();

/** id 또는 한글 이름(공백 무시, 부분 일치 허용)으로 테이블의 키를 찾는다. */
export function resolveId(table, query) {
  if (!query) return null;
  if (Object.hasOwn(table, query)) return query;
  const q = normalize(query);
  const entries = Object.entries(table);
  const exact = entries.find(([id, v]) => normalize(v.name) === q || id.toLowerCase() === q);
  if (exact) return exact[0];
  const partial = entries.find(([, v]) => normalize(v.name).includes(q));
  return partial ? partial[0] : null;
}

export const resolveItem = (q) => resolveId(ITEMS, q);
export const resolveMonster = (q) => resolveId(MONSTERS, q);
export const resolveMap = (q) => resolveId(MAP_DEFS, q);
export const resolveClass = (q) => resolveId(CLASSES, q);

const toInt = (v, fallback) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : fallback;
};

export function helpText() {
  return Object.values(COMMANDS).map((c) => c.usage).join('\n');
}

/** GM 명령을 실행하고 결과 문구를 돌려준다. game은 Game 인스턴스. */
export function runCommand(game, text) {
  const parsed = parseCommand(text);
  if (!parsed) return '명령어를 입력하세요. (/도움)';
  const { cmd, head, args } = parsed;
  switch (cmd) {
    case 'help':
      return helpText();
    case 'level':
      game.gmSetLevel(toInt(args[0], game.player.level + 1));
      return `레벨이 ${josa(game.player.level, '으로/로')} 바뀌었습니다.`;
    case 'exp':
      game.grantExp(Math.max(0, toInt(args[0], 1000)));
      return '경험치를 지급했습니다.';
    case 'gold': {
      const amount = toInt(args[0], 10000);
      game.setPlayer({ gold: Math.max(0, game.player.gold + amount) });
      return `금전 ${amount.toLocaleString()} 지급. (보유 ${game.player.gold.toLocaleString()})`;
    }
    case 'item': {
      const id = resolveItem(args[0]);
      if (!id) return `'${args[0] ?? ''}' 아이템을 찾을 수 없습니다.`;
      const qty = Math.max(1, Math.min(99, toInt(args[1], 1)));
      const given = game.giveItem(id, qty);
      return given > 0 ? `${ITEMS[id].name} ${given}개를 만들었습니다.` : '가방이 가득 찼습니다.';
    }
    case 'tp': {
      const id = resolveMap(args[0]);
      if (!id) return `'${args[0] ?? ''}' 맵을 찾을 수 없습니다. (${Object.values(MAP_DEFS).map((m) => m.name).join(', ')})`;
      game.teleport(id);
      return `${josa(MAP_DEFS[id].name, '으로/로')} 이동했습니다.`;
    }
    case 'spawn': {
      const id = resolveMonster(args[0]);
      if (!id) return `'${args[0] ?? ''}' 몬스터를 찾을 수 없습니다.`;
      const n = game.gmSpawn(id, Math.max(1, Math.min(30, toInt(args[1], 1))));
      return `${MONSTERS[id].name} ${n}마리를 소환했습니다.`;
    }
    case 'god':
      game.setGm({ god: !game.player.gm.god });
      return `무적 ${game.player.gm.god ? '켜짐' : '꺼짐'}`;
    case 'heal':
      game.healFull();
      return '체력과 마력을 모두 회복했습니다.';
    case 'speed': {
      const speed = Math.max(1, Math.min(3, toInt(args[0], game.player.gm.speed % 3 + 1)));
      game.setGm({ speed });
      return `이동 속도 ${speed}배`;
    }
    case 'killall':
      return `몬스터 ${game.killAll()}마리를 처치했습니다.`;
    case 'cls': {
      const id = resolveClass(args[0]);
      if (!id) return '직업: 전사, 도적, 주술사, 도사';
      game.gmSetClass(id);
      return `직업이 ${josa(CLASSES[id].name, '으로/로')} 바뀌었습니다.`;
    }
    case 'tier': {
      game.gmSetTier(toInt(args[0], game.player.tier + 1));
      return `${game.player.tier}차 [${game.title()}]${josa(game.title(), '으로/로').slice(game.title().length)} 바뀌었습니다.`;
    }
    case 'learnall':
      return `기술 ${game.gmLearnAll()}개를 배웠습니다.`;
    default:
      return `알 수 없는 명령어: ${head} (/도움)`;
  }
}
