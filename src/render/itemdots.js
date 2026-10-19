// 아이템 도트 아이콘(원작풍): 글자 그림(템플릿)에 색을 입히고 바깥에 검은 외곽선 한 칸을 자동으로 두른다.
// 무기는 종류(wtype)별 그림에 날·보주 색(tint), 갑옷은 옷 색(trim), 목걸이는 구슬 색(gem), 나머지는 아이템마다 그림과 색을 고른다.
// 캔버스 없이 16×16 RGBA 배열을 돌려주므로 브라우저와 노드(테스트) 둘 다에서 쓴다. 모두 새로 그린 그림이다.
import { ITEMS } from '../data/items.js';

export const ICON_SIZE = 16;

const HEX = (h) => {
  const x = h.length === 4 ? [...h.slice(1)].map((c) => c + c).join('') : h.slice(1, 7);
  return [parseInt(x.slice(0, 2), 16), parseInt(x.slice(2, 4), 16), parseInt(x.slice(4, 6), 16)];
};
const shade = (rgb, k) => rgb.map((v) => Math.max(0, Math.min(255, Math.round(v * k))));
const lighten = (rgb, k) => rgb.map((v) => Math.round(v + (255 - v) * k));

// 글자: a·b·c 는 아이템마다 바뀌는 색(대문자는 그늘), l 은 a 의 밝은 빛,
// w 흰빛, y 금빛, r 빨강, n 나무 갈색, g 풀빛, s 은빛, k 안쪽 선. '.' 은 빈 칸
const FIXED = { w: '#fff8e8', y: '#f0c040', r: '#d03030', n: '#8b5a2b', g: '#4a9a3a', s: '#c8d0d8', k: '#2a1a10' };
const OUTLINE = [20, 12, 8];

// ── 무기 ──
const SWORD = [
  '............wl',
  '...........wla',
  '..........wlaA',
  '.........wlaA.',
  '........wlaA..',
  '.......wlaA...',
  '......wlaA....',
  '..y..wlaA.....',
  '..yywlaA......',
  '...yyaA.......',
  '...nyyy.......',
  '..nN..yy......',
  '.nN...........',
  'yN............',
];
const DAGGER = [
  '..........wl',
  '.........wla',
  '........wlaA',
  '.......wlaA.',
  '......wlaA..',
  '..y..wlaA...',
  '..yywlaA....',
  '...yyaA.....',
  '...cyyy.....',
  '..cC..y.....',
  '.cC.........',
  'cC..........',
];
const STAFF = [
  '.........lw..',
  '........llaa.',
  '.......lwaaaA',
  '.......laaaAA',
  '.......aaaAAA',
  '.....y..AAA..',
  '......yy.....',
  '.....nNy.....',
  '....nN.......',
  '...nN........',
  '..nN.........',
  '.nN..........',
  'nN...........',
  'N............',
];
const FAN = [
  '...lAlAlAl...',
  '.lAlAlAlAlAl.',
  'aAaAaAaAaAaAa',
  'aAaAaAaAaAaAa',
  '.aAaAaAaAaAa.',
  '..nAaAaAaAn..',
  '...nnAaAnn...',
  '....nnAnn....',
  '.....nnn.....',
  '......y......',
  '......r......',
  '.....rrr.....',
];
const SPEAR = [
  '............la',
  '...........laA',
  '..........laA.',
  '.........yAA..',
  '........ry....',
  '.......rnr....',
  '......nN.r....',
  '.....nN.......',
  '....nN........',
  '...nN.........',
  '..nN..........',
  '.nN...........',
  'nN............',
  'N.............',
];

// ── 옷·갑옷 ──
const ROBE = [
  '....aawbaa....',
  '..aaaaawbaaa..',
  '.aaaaaaawbaaa.',
  'aaaaaaaaawbaaa',
  'aaaAaaaabbbAaa',
  'aaaAaaaaabbAaa',
  'bbbAaaaaabaAbb',
  'bbbAaaaaabaAbb',
  '...AaaaaaaaA..',
  '...AaaaaaaaA..',
  '...AaaaaaaaA..',
  '...AAAAAAAAA..',
];
const PLATE = [
  '..cccaaaaccc..',
  '.cccCabbaCccc.',
  '.cCCaaaaaaCCc.',
  '..alalalalal..',
  '..AaAaAaAaAa..',
  '..alalalalal..',
  '..AaAaAaAaAa..',
  '..bbbbbbbbbb..',
  '..aaaAaaAaaa..',
  '..aaaA..Aaaa..',
  '..AAAA..AAAA..',
];

// ── 쓰개 ──
const KAT = [
  '......aa......',
  '.....alaA.....',
  '....alaaAA....',
  '...alaaaaAA...',
  '..alaaaaaaAA..',
  'aalaaaaaaaaAAA',
  'AAAAAAAAAAAAAA',
  '....b....b....',
  '.....b..b.....',
  '......bb......',
];
const GAT = [
  '....aaaaaa....',
  '....alaaaA....',
  '....alaaaA....',
  '....bbbbbb....',
  '....alaaaA....',
  'aaaaaaaaaaaaaa',
  '.AAAAAAAAAAAA.',
  '..c........c..',
  '...c......c...',
  '....c....c....',
];
const CAP = [
  '...aaaaaa....',
  '..alaaaaaA...',
  '.alaaaaaaaA..',
  '.aaaaaaaaaA..',
  '.bbbbbbbbbbb.',
  '.BBBBBBBBBBbb',
  '...........bB',
  '............b',
];
const HELM = [
  '.....bb.....',
  '.....bb.....',
  '...aaaaaa...',
  '..alaaaaaA..',
  '.alaaaaaaaA.',
  '.aaaaaaaaaA.',
  '.yyyyyyyyyy.',
  '.aA......Aa.',
  '.aA......Aa.',
  '.AA......AA.',
];
const CROWN = [
  '.b....b....b.',
  '.a...aaa...a.',
  '.aa.aalaA.aA.',
  '.alaaalaaaaA.',
  '.aaaaaaaaaaA.',
  '.abababababa.',
  '.AAAAAAAAAAA.',
];

// ── 방패 ──
const ROUND = [
  '....bbbbb....',
  '..bbaaaaabb..',
  '.baalaaaaaAb.',
  '.balaaaaaaAb.',
  'baaaaaaaaaaAb',
  'baaaayyyaaaAb',
  'baaaayYyaaaAb',
  'baaaayyYaaAAb',
  'baaaaaaaaaAAb',
  '.baaaaaaaAAb.',
  '.bAaaaaaAAAb.',
  '..bbAAAAAbb..',
  '....bbbbb....',
];
const KITE = [
  'bbbbbbbbbbbb',
  'balaaaaaaaAb',
  'balaaaaaaaAb',
  'balaayyaaaAb',
  'balayyyyaaAb',
  'balaayyaaaAb',
  'baaaaaaaaaAb',
  '.baaaaaaaAb.',
  '.baaaaaaaAb.',
  '..baaaaaAb..',
  '...baaaAb...',
  '....baAb....',
  '.....bb.....',
];
const MIRROR = [
  '...bbbbb...',
  '.bbwwaaabb.',
  '.bwwaaaaab.',
  'bwaaaaaaaAb',
  'bwaaaaaaaAb',
  'baaaaaaaaAb',
  'baaaaaaaAAb',
  '.baaaaaAAb.',
  '.bbAAAAAbb.',
  '...bbbbb...',
  '....rBr....',
  '....bBb....',
  '....bBb....',
  '.....r.....',
];

// ── 목걸이·반지 ──
const BEADS = [
  '...b.....b...',
  '..b.......b..',
  '.b.........b.',
  '.b.........b.',
  'b...........b',
  'b...........b',
  '.b.........b.',
  '..b.......b..',
  '...bb...bb...',
  '.....yyy.....',
  '....laaaA....',
  '....aaaAA....',
  '.....AAA.....',
];
const NORIGAE = [
  '....b....',
  '...b.b...',
  '...b.b...',
  '....y....',
  '...laA...',
  '..laaaA..',
  '..aaaAA..',
  '...AAA...',
  '....y....',
  '...ccc...',
  '...cCc...',
  '..cCcCc..',
  '..cCcCc..',
  '..c.c.c..',
];
const RING = [
  '....law....',
  '...laaaA...',
  '....aAA....',
  '..bbbybbb..',
  '.bl.....bB.',
  'bl.......Bb',
  'b.........B',
  'bb.......BB',
  '.bb.....BB.',
  '..bbbBBBB..',
];

// ── 보조 ──
const POUCH = [
  '....c.c....',
  '...ccccc...',
  '....aaa....',
  '...bbbbb...',
  '..aaaaaaa..',
  '.aalaaaaaA.',
  'aalaaayaaAA',
  'aaaaayyyaAA',
  'aaaaaayaaAA',
  'AaaaaaaaaAA',
  '.AAaaaaaAA.',
  '..AAAAAAA..',
];
const CHARM = [
  'aaaaaaaA',
  'aabbbbaA',
  'aaabaaaA',
  'abbbbbbA',
  'aaabaaaA',
  'aabaabaA',
  'abaaaabA',
  'aaabbaaA',
  'aaabaaaA',
  'aabbbbaA',
  'aaaaaaaA',
  'AAAAAAAA',
];
const GOURD = [
  '...nnn...',
  '...aaa...',
  '..alaaA..',
  '..alaaA..',
  '...aaA...',
  '...bbb...',
  '..alaaA..',
  '.alaaaaA.',
  'alaaaaaAA',
  'aaaaaaaAA',
  'AaaaaaAAA',
  '.AAAAAAA.',
];
const BELL = [
  '.....r.....',
  '....r.r....',
  '.....y.....',
  '...alaaA...',
  '..alaaaaA..',
  '..aaaaaaA..',
  '.alaaaaaaA.',
  '.aaaaaaaaA.',
  'aaaaaaaaaAA',
  'AAAAAAAAAAA',
  '.....a.....',
];
const CLAW = [
  'r.........r',
  '.r.......r.',
  '..rrrrrrr..',
  '..aa.aa.aa.',
  '..la.la.la.',
  '..la.la.la.',
  '...aA.aA.aA',
  '....A..A..A',
];
const TABLET = [
  '....r....',
  '....r....',
  '..laaaA..',
  '.laaaaaA.',
  '.laAAAaA.',
  '.laAaAaA.',
  '.laAAAaA.',
  '.laaaaaA.',
  '..aaaaA..',
  '...AAA...',
  '....r....',
  '...rrr...',
  '...rRr...',
  '...r.r...',
];
const TAIL = [
  '........ww..',
  '.......wwww.',
  '......awwwww',
  '.....aaawww.',
  '....alaaAw..',
  '...alaaaA...',
  '..alaaaAA...',
  '.alaaaAA....',
  '.aaaaAA.....',
  'aaaaAA......',
  'aaaAA.......',
  '.AA.........',
];

// ── 소모품 ──
const HERB = [
  '.....l.....',
  '....lal....',
  '....aaa....',
  '.la.aaa.al.',
  'laaA.a.Aaal',
  '.aaAAaAAaa.',
  '..AA.b.AA..',
  '.....b.....',
  '....bb.....',
  '....b......',
];
const ROOT = [
  '..a..r..a..',
  '.ala...ala.',
  '..aA.a.Aa..',
  '....aaa....',
  '.....b.....',
  '....ccc....',
  '...cwccC...',
  '...ccccC...',
  '..cwcccCC..',
  '..cccccCC..',
  '.cc.cCc.CC.',
  '.c..c.C..C.',
  'c...c..C...',
];
const DROP = [
  '....a....',
  '....a....',
  '...ala...',
  '...ala...',
  '..alaaA..',
  '..waaaA..',
  '.wlaaaaA.',
  '.wlaaaaA.',
  '.laaaaAA.',
  '..aaaAA..',
  '...AAA...',
];
const BOTTLE = [
  '...nnn...',
  '...aaa...',
  '...laA...',
  '...laA...',
  '..laaaA..',
  '.laaaaaA.',
  'laabbbaAA',
  'labbbbbAA',
  'laabbbaAA',
  'laaaaaaAA',
  '.AaaaaAA.',
  '..AAAAA..',
];
const TTEOK = [
  '...n...',
  '..aaa..',
  '.awaaA.',
  '.aaaAA.',
  '..bbb..',
  '.bwbbB.',
  '.bbbBB.',
  '..ccc..',
  '.cwccC.',
  '.cccCC.',
  '..CCC..',
  '...n...',
  '...n...',
];
const BOWL = [
  '..w...w...w..',
  '...w...w...w.',
  '..w...w...w..',
  '.bbbbbbbbbbb.',
  'abbcbbbcbbbbA',
  'alaaaaaaaaaAA',
  '.alaaaaaaaAA.',
  '..aaaaaaaAA..',
  '...AAAAAAA...',
  '....AAAAA....',
];
const SCROLL = [
  '.y.........y.',
  'nNaaaaaaaaanN',
  'nNabbbbbbbanN',
  'nNaaaaaaaaanN',
  'nNabbbbbaaanN',
  'nNaaaaaaaaanN',
  'nNabbbbbbranN',
  'nNaaaaaaaaanN',
  '.y.........y.',
];

// ── 전리품 ──
const ORB = [
  '...aaaa...',
  '..lwaaaA..',
  '.lwlaaaaA.',
  '.llaaaaaA.',
  'laaaaaaaAA',
  'aaaaaaaaAA',
  'aaaaaaaAAA',
  '.aaaaaAAA.',
  '.AAaaAAAA.',
  '...AAAA...',
];
const SCALE = [
  '..aaaaaa..',
  '.alaaaaaA.',
  'alaaaaaaaA',
  'alAaaaaAaA',
  'alaAaaAaaA',
  'alaaAAaaAA',
  '.alaaaaaA.',
  '..aaaaAA..',
  '...aaAA...',
  '....AA....',
];
const COIN = [
  '...aaaa...',
  '.alaaaaaA.',
  'alaaaaaaaA',
  'laaaAAaaaA',
  'laaA..laaA',
  'laaA..laAA',
  'aaaallaaAA',
  '.aaaaaaAA.',
  '.AAaaaAAA.',
  '...AAAA...',
];
const CRYSTAL = [
  '....w....',
  '...lwa...',
  '..llwaA..',
  '..lwaaA..',
  '.llwaaAA.',
  '.lwaaaAA.',
  '.lwaaaAA.',
  '.llaaaAA.',
  '..laaAA..',
  '..laaAA..',
  '...aAA...',
  '....A....',
];
const FEATHER = [
  '..........aa',
  '........aawA',
  '.......aawAA',
  '......aawAA.',
  '.....aawAA..',
  '....aawAA...',
  '...aawAA....',
  '..aawAA.....',
  '..awAA......',
  '..wA........',
  '.w..........',
  'w...........',
];
const MEAT = [
  '..aaaa......',
  '.alaaaA.....',
  'alaaaaaA....',
  'alabaaaAA...',
  'aaaaaabAA...',
  'AaaaaaAAA...',
  '.AAaaAAAww..',
  '..AAAAA.ww..',
  '.........ww.',
  '........wwww',
  '.........ww.',
];
const WING = [
  '........aaaa',
  '.....aaaaaaA',
  '...aaaalaaAA',
  '.aaaalaaaAA.',
  'aaalaaaAAA..',
  'a.aa.aaA....',
  '..a...a.....',
];
const ACORN = [
  '....n....',
  '..bbbbb..',
  '.bBbBbBb.',
  '.BBBBBBB.',
  '..laaaA..',
  '..laaaA..',
  '..laaAA..',
  '...aAA...',
  '....A....',
];
const FUR = [
  '...a..a....',
  '..alaalaa..',
  '.alaaaaaaA.',
  'alaaaaaaaaA',
  'aaaaaaaaaAA',
  'AaaaaaaaAAA',
  '.AaAaaAaAA.',
  '..A..A..A..',
];
const FANG = [
  'aaaaaaa..',
  'laaaaaA..',
  '.laaaAA..',
  '..laaA...',
  '...laA...',
  '....laA..',
  '.....aA..',
  '.....laA.',
  '......aA.',
  '.......A.',
];
const HORN = [
  '........a',
  '.......la',
  '......laA',
  '.....laaA',
  '....laaA.',
  '...laaAA.',
  '..laaaAA.',
  '.laaaAA..',
  'bbbbbbB..',
  'BBBBBB...',
];
const SHELL = [
  '...aaaaaa...',
  '..alAaaAaA..',
  '.alaAaaAaaA.',
  'alaaAaaAaaAA',
  'alaaAaaAaaAA',
  'aaaaAaaAaaAA',
  '.aaaAaaAaAA.',
  '..AAAAAAAA..',
  '....bAAb....',
  '....bbbb....',
];
const GEM = [
  '..aaaaaa..',
  '.alwaaaaA.',
  'alwlaaaaAA',
  'aaaaaaaaAA',
  '.aaaaaaAA.',
  '..aaaaAA..',
  '...aaAA...',
  '....AA....',
];
const ROCK = [
  '...aaaa...',
  '.alaaaaaA.',
  'alaabaaaAA',
  'aaabbbaaAA',
  'aaaabaabAA',
  'AaaaaabbbA',
  '.AAaaaabA.',
  '...AAAA...',
];

export const ITEM_ART = {
  sword: SWORD, dagger: DAGGER, staff: STAFF, fan: FAN, spear: SPEAR,
  robe: ROBE, plate: PLATE, kat: KAT, gat: GAT, cap: CAP, helm: HELM, crown: CROWN,
  round: ROUND, kite: KITE, mirror: MIRROR, beads: BEADS, norigae: NORIGAE, ring: RING,
  pouch: POUCH, charm: CHARM, gourd: GOURD, bell: BELL, claw: CLAW, tablet: TABLET, tail: TAIL,
  herb: HERB, root: ROOT, drop: DROP, bottle: BOTTLE, tteok: TTEOK, bowl: BOWL, scroll: SCROLL,
  orb: ORB, scale: SCALE, coin: COIN, crystal: CRYSTAL, feather: FEATHER, meat: MEAT, wing: WING,
  acorn: ACORN, fur: FUR, fang: FANG, horn: HORN, shell: SHELL, gem: GEM, rock: ROCK,
};

// 아이템마다 [그림, a, b, c] — 색을 비우면 그림의 기본색
const PAPER = '#f0d870';
const LOOKS = {
  // 소모품
  herb: ['herb', '#5cb84a', '#3a7a2a'],
  bigHerb: ['root', '#4a9a3a', '#3a7a2a', '#e8c890'],
  dew: ['drop', '#6ec8ff'],
  bigDew: ['bottle', '#7ab8e8', '#f8f4e8'],
  elixir: ['bottle', '#f0c040', '#d03030'],
  tteok: ['tteok', '#f4a0b8', '#fff4e8', '#8cc860'],
  gukbap: ['bowl', '#6a4030', '#e8cc98', '#5aa040'],
  makgeolli: ['gourd', '#e8e0cc', '#4a6a9a'],
  returnScroll: ['scroll', '#f0e4c0', '#6a5040'],
  // 투구·쓰개
  strawHat: ['kat', '#d8b868', '#8a6a3a'],
  paeraengi: ['kat', '#c89850', '#d03030'],
  leatherCap: ['cap', '#8a5a30', '#5a3a20'],
  headband: ['cap', '#e8e0d0', '#d03030'],
  ironHelm: ['helm', '#a8b4bc', '#d03030'],
  dragonHelm: ['helm', '#2e8a64', '#f0c040'],
  eagleHelm: ['helm', '#7a6a58', '#f4f0e8'],
  jeonrip: ['gat', '#3a3040', '#d03030', '#f0c040'],
  heukrip: ['gat', '#26222a', '#4a4450', '#e8e0d0'],
  phoenixCrown: ['crown', '#f0c040', '#d03030'],
  // 방패
  woodShield: ['round', '#b07a40', '#6a4420'],
  leatherShield: ['round', '#8a5a30', '#c8a060'],
  ironShield: ['kite', '#a8b4bc', '#5a646c'],
  mirrorShield: ['mirror', '#b8e0e8', '#c08a3a'],
  turtleShield: ['round', '#4a8a5a', '#8a6a3a'],
  ghostFaceShield: ['kite', '#a83030', '#2a2a2a'],
  blackTortoiseShield: ['round', '#2a4a5a', '#f0c040'],
  // 보조
  luckyPouch: ['pouch', '#d84060', '#f0c040', '#f0c040'],
  paperCharm: ['charm', PAPER, '#c02020'],
  gourdBottle: ['gourd', '#d8b860', '#d03030'],
  spiritBell: ['bell', '#f0c040'],
  incensePouch: ['pouch', '#5a7ac8', '#f0c040', '#d03030'],
  tigerClaw: ['claw', '#f4ecd8'],
  bronzeMirror: ['mirror', '#c8e4e0', '#b07a30'],
  thunderCharm: ['charm', '#7a9ae8', '#fff060'],
  jadeTablet: ['tablet', '#3fd18a'],
  foxTailCharm: ['tail', '#f08a30'],
  // 반지: a 보석, b 가락지
  copperRing: ['ring', '#e08050', '#c0703a'],
  jadeRing: ['ring', '#3fd18a', '#e8e8e0'],
  silverRing: ['ring', '#a8d8ff', '#d0d8e0'],
  goldRing: ['ring', '#f8f0b0', '#f0c040'],
  blueDragonRing: ['ring', '#3aa8e8', '#f0c040'],
  heavenRing: ['ring', '#fff8c0', '#ffe0f0'],
  foxRing: ['ring', '#ff7a30', '#f0c040'],
  ironRing: ['ring', '#8a949c', '#8a949c'],
  rubyRing: ['ring', '#e02040', '#f0c040'],
  obsidianRing: ['ring', '#3a3048', '#c8d0d8'],
  sapphireRing: ['ring', '#3060e0', '#d0d8e0'],
  moonstoneRing: ['ring', '#e0e8ff', '#d0d8e0'],
  whiteTigerRing: ['ring', '#f4f4f4', '#3a3a3a'],
  // 전리품
  dragonBreath: ['orb', '#5ad8e8'],
  guardCharm: ['charm', '#e04040', '#f8e070'],
  horseTicket: ['scroll', '#f4ead0', '#8a5a30'],
  blueScale: ['scale', '#3a8ae8'],
  redScale: ['scale', '#e04040'],
  zodiacJade: ['tablet', '#3fd18a'],
  pearlShell: ['shell', '#f4d8c8', '#f8f8f0'],
  frostCrystal: ['crystal', '#a8e0ff'],
  islandCoin: ['coin', '#c09040'],
  emberStone: ['rock', '#6a6068', '#ff7020'],
  firebirdFeather: ['feather', '#ff5a1f'],
  ratMeat: ['meat', '#c87060', '#f0d8c0'],
  batWing: ['wing', '#5a4a6a'],
  snakeMeat: ['meat', '#b8a070', '#e8e0b8'],
  snakeSpirit: ['orb', '#60c060'],
  pigMeat: ['meat', '#c04838', '#f4dcc8'],
  forestPigMeat: ['meat', '#a03028', '#f4dcc8'],
  amber: ['gem', '#f0a030'],
  darkAmber: ['gem', '#a05a1a'],
  acorn: ['acorn', '#c08040', '#7a5030'],
  rabbitFur: ['fur', '#f0ece4'],
  foxTail: ['tail', '#e8803a'],
  wolfFang: ['fang', '#f4ecd8'],
  goblinHorn: ['horn', '#e8d8a8', '#8a5a30'],
  boarTusk: ['fang', '#ece0c0'],
  whiteFur: ['fur', '#fafaff'],
  ghostBead: ['orb', '#4a7ae0'],
  imugiScale: ['scale', '#4a9a7a'],
  snowPelt: ['fur', '#dce8f4'],
  dueokHorn: ['horn', '#a83030', '#3a2a2a'],
  ironScale: ['scale', '#8a949c'],
  dragonOrb: ['orb', '#4a3e5c'],
  foxBead: ['orb', '#c080ff'],
};

// 갑주(쇠·비늘)로 그리는 갑옷 — 나머지는 저고리·도포 그림
const PLATE_IDS = new Set(['leatherArmor', 'chainArmor', 'ironArmor', 'dragonArmor', 'blackPlate', 'silverPlate', 'scaleArmor']);
const HIGH = /^high([A-Z][a-z]+)\d+$/;

/** 아이템 id → { art, pal } (pal: 글자별 색 문자열) */
export function itemLook(id) {
  if (id === '__gold') return { art: 'coin', pal: { a: '#f0c040' } };
  if (id?.startsWith?.('slot:')) return slotLook(id.slice(5));
  const it = ITEMS[id];
  if (!it) return { art: 'orb', pal: { a: '#9a9aa8' } };
  const own = LOOKS[id];
  if (own) return { art: own[0], pal: { a: own[1], b: own[2], c: own[3] } };
  const high = HIGH.exec(id)?.[1];
  const tint = it.tint ?? it.gem;
  switch (it.type) {
    case 'weapon': return { art: ITEM_ART[it.wtype] ? it.wtype : 'sword', pal: { a: it.tint ?? '#d5dbdb', c: '#6b3a2a' } };
    case 'armor':
      if (high) return { art: 'plate', pal: { a: highTint(id), b: '#f0c040', c: '#fff4e0' } };
      return PLATE_IDS.has(id)
        ? { art: 'plate', pal: { a: it.trim?.d ?? '#8a949c', b: it.trim?.w ?? '#f0c040', c: it.shoulder ?? it.trim?.w ?? '#c8d0d8' } }
        : { art: 'robe', pal: { a: it.trim?.d ?? '#ece4cc', b: it.trim?.w ?? '#b8a888' } };
    case 'helmet': return { art: 'crown', pal: { a: '#f0c040', b: highTint(id) } };
    case 'shield': return { art: 'kite', pal: { a: highTint(id), b: '#f0c040' } };
    case 'necklace': return /[nN]origae$|^highNeck/.test(id) ? { art: 'norigae', pal: { a: tint ?? '#5dd6c0', b: '#c03030', c: '#d03030' } } : { art: 'beads', pal: { a: tint ?? '#e8e0d0', b: tint ?? '#e8e0d0' } };
    case 'ring': return { art: 'ring', pal: { a: highTint(id), b: '#f0c040' } };
    case 'aux': return { art: 'tablet', pal: { a: highTint(id) } };
    case 'consume': return { art: 'bottle', pal: { a: '#e8e0cc', b: '#d03030' } };
    default: return { art: 'orb', pal: { a: '#9a9aa8' } };
  }
}

// 고급 장비(Lv55·65·75·85) 색: 레벨대마다 다르게
const HIGH_COLORS = { 55: '#ff7b6b', 65: '#7ee0ff', 75: '#ffe066', 85: '#d9a6ff' };
const highTint = (id) => HIGH_COLORS[ITEMS[id]?.level] ?? ITEMS[id]?.tint ?? '#c8d0d8';

// 빈 장비 칸: 잿빛 그림
const SLOT_ART = { weapon: 'sword', helmet: 'kat', armor: 'robe', shield: 'round', necklace: 'beads', ring: 'ring', ring2: 'ring', aux: 'pouch', aux2: 'pouch' };
function slotLook(slot) {
  const g = '#b8b0a0';
  return { art: SLOT_ART[slot] ?? 'orb', pal: { a: g, b: '#9a9288', c: '#9a9288', y: '#a8a090', n: '#8a8278', r: '#a09888', w: '#d8d0c0' } };
}

/** 템플릿 줄 길이가 고르고 16칸 안에 드는지(테스트용) */
export function checkItemTemplates() {
  const bad = [];
  for (const [name, rows] of Object.entries(ITEM_ART)) {
    if (rows.some((r) => r.length !== rows[0].length)) bad.push(`${name}: 줄 길이`);
    if (rows.length > ICON_SIZE - 2 || rows[0].length > ICON_SIZE - 2) bad.push(`${name}: 너무 큼`);
  }
  return bad;
}

/** 색표 → 글자별 RGB. 대문자는 그늘, l 은 a 의 밝은 빛 */
function palette(pal) {
  const out = {};
  const src = { a: '#c8d0d8', b: '#8a5a30', c: '#d03030', ...FIXED };
  for (const [ch, v] of Object.entries(pal)) if (v) src[ch] = v;
  for (const [ch, v] of Object.entries(src)) out[ch] = HEX(v);
  for (const ch of Object.keys(out)) {
    const up = ch.toUpperCase();
    if (up !== ch && !out[up]) out[up] = shade(out[ch], 0.66);
  }
  out.l = lighten(out.a, 0.5);
  return out;
}

/** 아이템 아이콘 한 장: { w: 16, h: 16, data } — 가운데 놓고 바깥에 외곽선 한 칸 */
export function itemFrame(id) {
  const { art, pal } = itemLook(id);
  const rows = ITEM_ART[art];
  const p = palette(pal);
  const w = ICON_SIZE;
  const h = ICON_SIZE;
  const ox = Math.floor((w - rows[0].length) / 2);
  const oy = Math.floor((h - rows.length) / 2);
  const px = new Uint8ClampedArray(w * h * 4);
  rows.forEach((row, y) => [...row].forEach((ch, x) => {
    const c = p[ch];
    if (c) px.set([...c, 255], ((oy + y) * w + ox + x) * 4);
  }));
  const solid = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) solid[i] = px[i * 4 + 3] ? 1 : 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (solid[i]) continue;
      if ((x > 0 && solid[i - 1]) || (x < w - 1 && solid[i + 1]) || (y > 0 && solid[i - w]) || (y < h - 1 && solid[i + w])) px.set([...OUTLINE, 255], i * 4);
    }
  }
  return { w, h, data: px };
}
