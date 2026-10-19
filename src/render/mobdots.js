// 몬스터 도트(원작풍): 글자 그림(템플릿)에 색을 입히고 바깥에 외곽선 한 칸을 자동으로 두른다.
// 모양 12종 × 세 방향(앞·뒤·옆) × 걸음 3칸. 옆모습은 왼쪽을 보고, 오른쪽은 좌우를 뒤집는다.
// 캔버스 없이 RGBA 배열을 돌려주므로 브라우저와 노드(미리보기·테스트) 둘 다에서 쓴다. 모두 새로 그린 그림이다.

const HEX = (h) => {
  const x = h.length === 4 ? [...h.slice(1)].map((c) => c + c).join('') : h.slice(1, 7);
  return [parseInt(x.slice(0, 2), 16), parseInt(x.slice(2, 4), 16), parseInt(x.slice(4, 6), 16)];
};
const shade = (rgb, k) => rgb.map((v) => Math.max(0, Math.min(255, Math.round(v * k))));

// 글자: 소문자는 몬스터 색표(MONSTER_LOOK.pal)의 색, 대문자는 그 색의 그늘, '1' 흰빛, '2' 혀·불꽃 빨강, 'k' 안쪽 선
// 걸음: [서기, 걸음1, 걸음2] — 그리는 쪽에서 0·1·0·2 순서로 돈다

/** 몸통 + 다리 세 벌 → 걸음 세 칸 */
const legged = (top, legs) => legs.map((l) => [...top, ...l]);
/** 같은 그림 세 칸(걸음 없이 둥실) */
const still = (rows) => [rows, rows, rows];

// ── 다람쥐(작음): b 몸, T 꼬리, w 배, p 귀 속·코, e 눈 ──
const SQUIRREL = {
  side: legged([
    '........TTT...',
    '.......TTTTT..',
    '.p.p...TTTTTT.',
    '.bbb...TT..TT.',
    'bbbbb..TT...T.',
    'bebbbb.TT.....',
    'pbbbbbbTT.....',
    '.wwbbbbbT.....',
    '.wwbbbbbb.....',
    '..wwbbbbB.....',
  ], [
    ['..b...bb......', '..b...bb......'],
    ['.b.....bb.....', 'b.......b.....'],
    ['...b..bb......', '...b.bb.......'],
  ]),
  down: legged([
    'p....p..TTT.',
    'bb..bb.TTTTT',
    'bbbbbb.TTTTT',
    'bebbeb..TTT.',
    'bbppbb...TT.',
    '.bwwb...TT..',
    'bbwwbbTTT...',
    'bbwwbb......',
    '.bwwB.......',
  ], [
    ['.b..b.......', '.b..b.......'],
    ['.b..b.......', '....b.......'],
    ['.b..b.......', '.b..........'],
  ]),
  up: legged([
    'p....p......',
    'bb..bb......',
    'bbbbbb......',
    'bbbbbb......',
    'bbbbbb......',
    '.bTTTT......',
    'bTTTTTT.....',
    'bTTTTTT.....',
    '.TTTTT......',
  ], [
    ['.b..b.......', '.b..b.......'],
    ['.b..b.......', '....b.......'],
    ['.b..b.......', '.b..........'],
  ]),
};

// ── 토끼(작음): w 몸, p 귀 속·코, e 눈 ──
const RABBIT = {
  side: legged([
    '...ww.......',
    '..wpw.......',
    '..wpw.......',
    '..wpww......',
    '...www......',
    '.wwwww......',
    'wewwwww.....',
    'wwwwwwwww...',
    'pwwwwwwwwww.',
    '.wwwwwwwww1w',
    '..wwwwwwwwW.',
  ], [
    ['..ww...www..', '.www...WWWW.'],
    ['...ww..www..', '..ww..WWWW..'],
    ['..ww....www.', '.ww.....WWWW'],
  ]),
  down: legged([
    '.ww..ww.',
    '.pw..wp.',
    '.pw..wp.',
    '.ww..ww.',
    'wwwwwwww',
    'wewwwwew',
    'wwwppwww',
    '.wwwwww.',
    'wwwwwwww',
    'wwwwwwww',
    '.wwwwww.',
  ], [
    ['ww....ww', 'WW....WW'],
    ['ww....ww', '......WW'],
    ['ww....ww', 'WW......'],
  ]),
  up: legged([
    '.ww..ww.',
    '.ww..ww.',
    '.ww..ww.',
    '.ww..ww.',
    'wwwwwwww',
    'wwwwwwww',
    'wwwwwwww',
    '.wwwwww.',
    'wwwwwwww',
    'www11www',
    '.ww11ww.',
  ], [
    ['ww....ww', 'WW....WW'],
    ['ww....ww', '......WW'],
    ['ww....ww', 'WW......'],
  ]),
};

// ── 네발 들짐승(여우·늑대·범·장산범): o 몸, O 그늘, l 배·주둥이, n 코, e 눈, t 꼬리 끝 ──
const CANINE = {
  side: legged([
    '...o.o................',
    '...oooo...............',
    '..ooeoo..............t',
    'nllooooo............tt',
    'lllloooo...........ott',
    '.llloooooooooooooooot.',
    '...llooooooooooooooo..',
    '....loooooooooooooOO..',
    '....llloooooooooOOOO..',
    '.....lllloooooOOOOOO..',
  ], [
    ['.....oo.O......oo.O...', '.....oo.O......oo.O...', '.....ll.l......ll.l...'],
    ['....oo...O....oo...O..', '...oo.....O..oo.....O.', '...ll.....l..ll.....l.'],
    ['......oo.O.....oo.O...', '.......ooO......ooO...', '.......lll......lll...'],
  ]),
  down: legged([
    'o..........o',
    'oo........oo',
    'oooooooooooo',
    'oooooooooooo',
    'ooeooooooeoo',
    'oooolllloooo',
    '.oollnnlloo.',
    '..oolllloo..',
    '...ollllo..t',
    '..oollllootT',
    '..oollllooT.',
    '..oOllllOo..',
  ], [
    ['..oo....oo..', '..oo....oo..', '..ll....ll..'],
    ['..oo....oo..', '..ll....oo..', '........ll..'],
    ['..oo....oo..', '..oo....ll..', '..ll........'],
  ]),
  up: legged([
    'o..........o',
    'oo........oo',
    'oooooooooooo',
    'oooooooooooo',
    'oooooooooooo',
    'oooooooooooo',
    '.oooooooooo.',
    '..oooooooo..',
    '...oooooo...',
    '..ooottooo..',
    '..oootttoo..',
    '..oOOttOOo..',
  ], [
    ['..oo....oo..', '..oo....oo..', '..OO....OO..'],
    ['..oo....oo..', '..OO....oo..', '........OO..'],
    ['..oo....oo..', '..oo....OO..', '..OO........'],
  ]),
};

// ── 도깨비·장수(서서 걷는 몸): g 살, G 그늘, y 뿔, e 눈동자, w 눈흰자·송곳니, s 머리·띠, f 옷(범가죽), c 방망이 ──
const GOBLIN = {
  down: legged([
    '........yy........',
    '.......yyyy.......',
    '.....ssssssss.....',
    '....ssggggggss....',
    '....sggggggggs....',
    '....gewggggweg....',
    '....gggggggggg....',
    '....ggwggggwgg....',
    'cc...gggggggg.....',
    'cc.gggggggggggg...',
    'cc.gggggggggggggg.',
    '.cggg.gggggg.ggg..',
    '.cgg.ffffffff.gg..',
    '.c...fsfffsff.....',
    '.c...ffffffff.....',
  ], [
    ['......gg..gg......', '......gg..gg......', '.....sss..sss.....'],
    ['......gg..gg......', '......gg..sss.....', '.....sss..........'],
    ['......gg..gg......', '.....sss..gg......', '...........sss....'],
  ]),
  up: legged([
    '........yy........',
    '.......yyyy.......',
    '.....ssssssss.....',
    '....ssssssssss....',
    '....ssssssssss....',
    '....ssssssssss....',
    '....ssssssssss....',
    '....gsssssssgg....',
    '.....gggggggg...cc',
    '...gggggggggggg.cc',
    '..ggggGGGGGGgggg.c',
    '..ggg.gGGGGg.gggc.',
    '..gg.ffffffff.ggc.',
    '.....fffsfffs...c.',
    '.....ffffffff.....',
  ], [
    ['......gg..gg......', '......gg..gg......', '.....sss..sss.....'],
    ['......gg..gg......', '......gg..sss.....', '.....sss..........'],
    ['......gg..gg......', '.....sss..gg......', '...........sss....'],
  ]),
  side: legged([
    '.......yy.......',
    '......yy........',
    '....sssssss.....',
    '...ggggggsss....',
    '..gggggggsss....',
    '..gwegggggss....',
    'ggggggggggs.....',
    '.wggggggggs.....',
    '..gggggggg......',
    'cc..gggggggg....',
    'ccgggggggggg....',
    '.cgggggggggg....',
    '..c..ffffffff...',
    '...c.fsfffsf....',
    '.....ffffffff...',
  ], [
    ['......gg.gg.....', '......gg.gg.....', '.....sss.sss....'],
    ['.....gg...gg....', '....gg.....gg...', '...sss.....sss..'],
    ['.......ggg......', '.......ggg......', '......ssss......'],
  ]),
};

// ── 멧돼지·소·거북 장수(덩치 큰 네발): b 몸, B 그늘, n 주둥이, w 엄니, e 눈 ──
const BOAR = {
  side: legged([
    '......bb............',
    '....BBBBBBBBBBBB....',
    '..bbbbbbbbbbbbbbBB..',
    '.bebbbbbbbbbbbbbbbb.',
    'nnbbbbbbbbbbbbbbbbbb',
    'nnbbbbbbbbbbbbbbbbbb',
    'wwbbbbbbbbbbbbbbbbbb',
    '.w.bbbbbbbbbbbbbbbB.',
    '....bbbbbbbbbbbbBBB.',
  ], [
    ['....bb.B.....bb.B...', '....bb.B.....bb.B...', '....BB.B.....BB.B...'],
    ['...bb...B...bb...B..', '..bb.....B.bb.....B.', '..BB.....B.BB.....B.'],
    ['.....bb.B.....bb.B..', '......bbB......bbB..', '......BBB......BBB..'],
  ]),
  down: legged([
    '.bb........bb.',
    '.bbbbbbbbbbbb.',
    'bbbbbbbbbbbbbb',
    'bbebbbbbbbbebb',
    'bbbbnnnnnnbbbb',
    'bwbbnknnknbbwb',
    'bwbbnnnnnnbbwb',
    '.bbbbbbbbbbbb.',
    '.bbbbbbbbbbbb.',
    '..bbBBBBBBbb..',
  ], [
    ['..bb......bb..', '..bb......bb..', '..BB......BB..'],
    ['..bb......bb..', '..BB......bb..', '..........BB..'],
    ['..bb......bb..', '..bb......BB..', '..BB..........'],
  ]),
  up: legged([
    '.bb........bb.',
    '.bbbbbbbbbbbb.',
    'bbbbbbbbbbbbbb',
    'bbbbbbbbbbbbbb',
    'bbbbbbbbbbbbbb',
    'bbbbbbbbbbbbbb',
    'BBbbbbbbbbbbBB',
    '.BBbbbbbbbbBB.',
    '.bbbbbbbbbbbb.',
    '..bbbbBnbbbb..',
  ], [
    ['..bb......bb..', '..bb......bb..', '..BB......BB..'],
    ['..bb......bb..', '..BB......bb..', '..........BB..'],
    ['..bb......bb..', '..bb......BB..', '..BB..........'],
  ]),
};

// ── 귀신(긴 머리 소복): h 머리, w 얼굴·옷, b 옷 그늘, e 눈, m 입. 걸음 칸 = 치맛자락 나풀거림 ──
const GHOST_HEM = [
  ['.wwbwwwbwwwbw.', '..w..w...w..w.'],
  ['..wwbwwwbwwwb.', '.w..w...w..w..'],
  ['.bwwwbwwwbwww.', '...w..w...w..w'],
];
const GHOST = {
  down: legged([
    '....hhhhhh....',
    '...hhhhhhhh...',
    '..hhhhhhhhhh..',
    '..hhwwwwwwhh..',
    '..hhwewwewhh..',
    '..hhwwwwwwhh..',
    '..hhwwmmwwhh..',
    '.hhhhwwwwhhhh.',
    '.hhwwwwwwwwhh.',
    'hhwwwwwwwwwwhh',
    'bwwwwwwwwwwwwb',
    'bwwwbwwwwbwwwb',
    'wwwwwwwwwwwwww',
    '.wwwbwwwwbwww.',
    '.wwwwwwwwwwww.',
  ], GHOST_HEM),
  up: legged([
    '....hhhhhh....',
    '...hhhhhhhh...',
    '..hhhhhhhhhh..',
    '..hhhhhhhhhh..',
    '..hhhhhhhhhh..',
    '..hhhhhhhhhh..',
    '..hhhhhhhhhh..',
    '.hhhhhhhhhhhh.',
    '.hhhhhhhhhhhh.',
    'hhhhhhhhhhhhhh',
    'bwhhhhhhhhhhwb',
    'bwwhhhhhhhhwwb',
    'wwwwhhhhhhwwww',
    '.wwwwbhhbwwww.',
    '.wwwwwwwwwwww.',
  ], GHOST_HEM),
  side: legged([
    '....hhhhhh....',
    '...hhhhhhhh...',
    '..hhhhhhhhhh..',
    '..wwwhhhhhhhh.',
    '..wewhhhhhhhh.',
    '..wwwhhhhhhhhh',
    '..wmwhhhhhhhhh',
    '...wwhhhhhhhhh',
    '..wwwwhhhhhhhh',
    '.wwwwwwwhhhhh.',
    'wwwwwwwwwhhhh.',
    '.bwwwwwwwwhh..',
    '..wwwwwwwwwww.',
    '..wwwbwwwwbww.',
    '.wwwwwwwwwwww.',
  ], GHOST_HEM),
};

// ── 뱀·이무기·용: g 몸, G 그늘, y 배, n 무늬, e 눈, 2 혀 ──
const SERPENT = {
  side: [
    [
      '.gggg.............',
      'gegggg............',
      'gggggg............',
      '22yggg............',
      '...ygg............',
      '...yggg...........',
      '....yggg..........',
      '....yyggggggg.....',
      '...yyggnggggnggg..',
      '..yyggggggggggGGgg',
      '.yyyyyyyyyyyyyyyGg',
    ],
    [
      '.gggg.............',
      'gegggg............',
      'gggggg............',
      '.2yggg............',
      '...ygg............',
      '...yggg...........',
      '....yggg..........',
      '....yyggggggg.....',
      '...yyggggnggggng.g',
      '..yyggggggggggGGgg',
      '.yyyyyyyyyyyyyyyy.',
    ],
    [
      '..gggg............',
      '.gegggg...........',
      '.gggggg...........',
      '222yggg...........',
      '....ygg...........',
      '...yggg...........',
      '...yggg...........',
      '....yyggggggg.....',
      '...yyggnggggnggg..',
      '..yyggggggggggGGg.',
      '.yyyyyyyyyyyyyyyGg',
    ],
  ],
  down: [
    [
      '....gggg....',
      '...gggggg...',
      '..ggeggegg..',
      '..gggggggg..',
      '...gyyyyg...',
      '.....22.....',
      '....gyyg....',
      '....gyyg....',
      '..gggyygggg.',
      '.ggnggyygnGg',
      'gggggggggGGg',
      '.gggnggggGg.',
    ],
    [
      '....gggg....',
      '...gggggg...',
      '..ggeggegg..',
      '..gggggggg..',
      '...gyyyyg...',
      '............',
      '....gyyg....',
      '....gyyg....',
      '.ggggyyggg..',
      'gGnggyygngg.',
      'gGGgggggggg.',
      '.gGggggnggg.',
    ],
    [
      '....gggg....',
      '...gggggg...',
      '..ggeggegg..',
      '..gggggggg..',
      '...gyyyyg...',
      '.....22.....',
      '.....2......',
      '....gyyg....',
      '..gggyygggg.',
      '.ggnggyygnGg',
      'gggggggggGGg',
      '.gggnggggGg.',
    ],
  ],
  up: still([
    '....gggg....',
    '...gggggg...',
    '..gggnnggg..',
    '..gggggggg..',
    '...gggggg...',
    '....gggg....',
    '....gnng....',
    '....gggg....',
    '..ggggnggggg',
    '.ggnggggngGg',
    'gggggggggGGg',
    '.gggnggggGg.',
  ]),
};
// 용·수호신·이무기 같은 큰 뱀은 뿔(y)과 등지느러미(n)를 덧댄다
const DRAGON_HORNS = {
  side: { rows: ['.y.y', 'yy.y', '.yy.'], at: [1, -3] },
  down: { rows: ['y......y', 'yy....yy', '.yy..yy.'], at: [2, -3] },
  up: { rows: ['y......y', 'yy....yy', '.yy..yy.'], at: [2, -3] },
};

// ── 새(불새): r 몸, o 날개, y 부리·발, e 눈, 2 불꽃. 걸음 칸 = 날갯짓 ──
const BIRD = {
  side: [
    [
      '..2.............',
      '.2rr............',
      '.rrrr...........',
      'yrerr...........',
      '.yrrr...........',
      '..rrrrooo.......',
      '..rrrroooooo....',
      '..rrrrrooooooo..',
      '...rrrrroooooo22',
      '....rrrrrr..2222',
      '.....y.y.....22.',
    ],
    [
      '..2.......oooo..',
      '.2rr.....ooooo..',
      '.rrrr...ooooo...',
      'yrerr..ooooo....',
      '.yrrr.oooo......',
      '..rrrrooo.......',
      '..rrrrrrrr......',
      '..rrrrrrrrrr....',
      '...rrrrrrrrr..22',
      '....rrrrrr..2222',
      '.....y.y.....22.',
    ],
    [
      '..2.............',
      '.2rr............',
      '.rrrr...........',
      'yrerr...........',
      '.yrrr...........',
      '..rrrrrrr.......',
      '..rrrrroooo.....',
      '..rrrrrooooo....',
      '...rrrrooooooo22',
      '....rrrroooooo22',
      '.....y.y..ooo.2.',
    ],
  ],
  down: [
    [
      '.......22.......',
      '......rrrr......',
      '.....rerrer.....',
      '.....rryyrr.....',
      'oo....rrrr....oo',
      'ooooo.rrrr.ooooo',
      '.oooooorroooooo.',
      '...oooorroooo...',
      '......rrrr......',
      '.....22rr22.....',
      '......y..y......',
    ],
    [
      'oo.....22.....oo',
      'ooo...rrrr...ooo',
      '.ooo.rerrer.ooo.',
      '..oooorryyroooo.',
      '...oooorrrroo...',
      '.....oorrrro....',
      '......rrrr......',
      '......rrrr......',
      '......rrrr......',
      '.....22rr22.....',
      '......y..y......',
    ],
    [
      '.......22.......',
      '......rrrr......',
      '.....rerrer.....',
      '.....rryyrr.....',
      '......rrrr......',
      '.....orrrro.....',
      '...oooorroooo...',
      '.oooooorroooooo.',
      'ooooo.rrrr.ooooo',
      'oo...22rr22...oo',
      '......y..y......',
    ],
  ],
};
BIRD.up = BIRD.down.map((f) => f.map((r) => r.replace(/e/g, 'r').replace(/y(?=y)/g, 'r').replace(/ry/g, 'rr')));

// ── 쥐(작음): b 몸, w 배, p 귀 속·꼬리, e 눈 ──
const RAT = {
  side: legged([
    '..pp..........',
    '.pbbp.........',
    '.bbbb.........',
    'bebbbb........',
    'pbbbbbbbbb....',
    '.wbbbbbbbbb...',
    '..wwbbbbbbbpp.',
    '...wwwbbbBB..p',
  ], [
    ['...b...bb.....', '...p...pp.....'],
    ['..b.....bb....', '.p.......pp...'],
    ['....b..bb.....', '....p.pp......'],
  ]),
  down: legged([
    'pp....pp',
    'pbb..bbp',
    '.bbbbbb.',
    '.bebbeb.',
    '.bbppbb.',
    '..bbbb..',
    '.bwwwwb.',
    '.bwwwwbp',
    '..bwwb.p',
  ], [
    ['.pp..pp.', '........'],
    ['.pp.....', '.....pp.'],
    ['.....pp.', '.pp.....'],
  ]),
  up: legged([
    'pp....pp',
    'pbb..bbp',
    '.bbbbbb.',
    '.bbbbbb.',
    '.bbbbbb.',
    '..bbbb..',
    '.bbbbbb.',
    '.bbbbbb.',
    '..bppb..',
  ], [
    ['.pp.p.p.', '....p...'],
    ['.pp..p..', '.....pp.'],
    ['....pp..', '.ppp....'],
  ]),
};

// ── 박쥐(작음): b 몸, w 날개막, e 눈. 걸음 칸 = 날갯짓 ──
const BAT_FRONT = [
  [
    '...b......b...',
    '...bb....bb...',
    'w...bbbbbb...w',
    'ww..bebbeb..ww',
    'wwwwbbbbbbwwww',
    'wwwwwbbbbwwwww',
    'w.wwwbbbbwww.w',
    '..w.w.bb.w.w..',
  ],
  [
    'ww.b......b.ww',
    'wwwbb....bbwww',
    '.wwwbbbbbbwww.',
    '..wwbebbebww..',
    '...wbbbbbbw...',
    '.....bbbb.....',
    '......bb......',
    '..............',
  ],
  [
    '...b......b...',
    '...bb....bb...',
    '....bbbbbb....',
    '....bebbeb....',
    '..wwbbbbbbww..',
    '.wwwwbbbbwwww.',
    'wwwwwwbbwwwwww',
    'w.w.w....w.w.w',
  ],
];
const BAT = {
  down: BAT_FRONT,
  up: BAT_FRONT.map((f) => f.map((r) => r.replace(/e/g, 'b'))),
  side: [
    [
      '..b.b.......',
      '..bbb..www..',
      '.bebb.wwwww.',
      'bbbbbwwwwwww',
      '..bbbbwww.w.',
      '...bb..w....',
    ],
    [
      '..b.b..ww...',
      '..bbb.wwww..',
      '.bebbwwwww..',
      'bbbbbww.....',
      '..bbbb......',
      '...bb.......',
    ],
    [
      '..b.b.......',
      '..bbb.......',
      '.bebb.......',
      'bbbbbww.....',
      '..bbbbwwww..',
      '...bb.wwwww.',
    ],
  ],
};

// ── 해골 병사: b 뼈, B 그늘, e 눈빛, c 누더기 ──
const SKELETON = {
  down: legged([
    '...bbbbbb...',
    '..bbbbbbbb..',
    '..bkekkekb..',
    '..bbbbbbbb..',
    '...bkbkbb...',
    '....bbbb....',
    '.bb.bbbb.bb.',
    'b..bkbbkb..b',
    'b..bbbbbb..b',
    'b..bkbbkb..b',
    '...cccccc...',
    '...cBccBc...',
  ], [
    ['....b..b....', '....b..b....', '...bb..bb...'],
    ['....b..b....', '....b..bb...', '...bb.......'],
    ['....b..b....', '...bb..b....', '.......bb...'],
  ]),
  up: legged([
    '...bbbbbb...',
    '..bbbbbbbb..',
    '..bbbbbbbb..',
    '..bbbbbbbb..',
    '...bbbbbb...',
    '....bbbb....',
    '.bb.bbbb.bb.',
    'b..b.bb.b..b',
    'b..bkbbkb..b',
    'b..b.bb.b..b',
    '...cccccc...',
    '...cBccBc...',
  ], [
    ['....b..b....', '....b..b....', '...bb..bb...'],
    ['....b..b....', '....b..bb...', '...bb.......'],
    ['....b..b....', '...bb..b....', '.......bb...'],
  ]),
  side: legged([
    '...bbbbb....',
    '..bbbbbbb...',
    '..kebbbbb...',
    '..bbbbbbb...',
    '...kbkbb....',
    '....bbb.....',
    '...bbbbb....',
    '..b.bkb.....',
    '.b..bbb.....',
    'b...bkb.....',
    '...cccc.....',
    '...cBcc.....',
  ], [
    ['....b.b.....', '....b.b.....', '...bb.bb....'],
    ['...b...b....', '..b.....b...', '.bb.....bb..'],
    ['.....b......', '.....b......', '....bb......'],
  ]),
};

// ── 달걀귀신: 얼굴 없는 달걀 머리(b, w 윤기)에 소복(b, B 그늘), 'k' 깃 선 ──
const EGG_HEM = [
  ['.bbbbbbbbbb.', '..b..bb..b..'],
  ['..bbbbbbbbb.', '.b..bb..b...'],
  ['.bbbbbbbbb..', '...b..bb..b.'],
];
const EGG = {
  down: legged([
    '....bbbb....',
    '...bwbbbb...',
    '..bwwbbbbb..',
    '..bwbbbbbb..',
    '..bbbbbbbb..',
    '..bbbbbbbB..',
    '...bbbbbB...',
    '....kkkk....',
    '..bbbkkbbb..',
    '.bbbbkkbbbb.',
    'bBbbbbbbbbBb',
    'bBbbbbbbbbBb',
    '.BbbbbbbbbB.',
  ], EGG_HEM),
  side: legged([
    '....bbbb....',
    '...bbbbwb...',
    '..bbbbbwwb..',
    '..bbbbbbwb..',
    '..bbbbbbbb..',
    '..Bbbbbbbb..',
    '...Bbbbbb...',
    '....kkkk....',
    '...bbbkbbb..',
    '..bbbbkbbbb.',
    '.bbbbbbbbBb.',
    '.Bbbbbbbbbb.',
    '..BbbbbbbbB.',
  ], EGG_HEM),
};
EGG.up = EGG.down.map((f) => f.map((r) => r.replace(/w/g, 'b').replace(/kk(?=bbb)/g, 'bb')));

export const MOB_ART = { squirrel: SQUIRREL, rabbit: RABBIT, canine: CANINE, goblin: GOBLIN, boar: BOAR, ghost: GHOST, serpent: SERPENT, bird: BIRD, rat: RAT, bat: BAT, skeleton: SKELETON, egg: EGG };

// ── 덧붙이는 것: 아홉 꼬리, 쥐왕 관, 해골 무기·투구 ──
const TAILS_FAN = [
  '.t...t...t...t.',
  'tot.tot.tot.tot',
  'tot.tot.tot.tot',
  '.ooo.ooo.ooo.o.',
  '..ooooooooooo..',
  '....ooooooo....',
];
const CROWN = ['c.c.c', 'ccccc'];
const SWORD = ['.1', '.1', '.1', '.1', 'yyy', '.c'];
const BOW = ['c.', '.c', '.c', '.c', '.c', 'c.'];
const HELM = ['..hh..', '.hhhh.', 'hhhhhh'];

/** 몬스터 색표 → 글자별 RGB(대문자는 그늘) */
function palette(pal) {
  const out = { 1: [255, 255, 255], 2: [232, 64, 40] };
  for (const [ch, v] of Object.entries(pal)) if (typeof v === 'string' && v[0] === '#') out[ch] = HEX(v);
  for (const ch of Object.keys(out)) {
    const up = ch.toUpperCase();
    if (up !== ch && !out[up]) out[up] = shade(out[ch], 0.72);
  }
  out.y ??= [240, 200, 80];
  out.c ??= [139, 90, 43];
  out.h ??= [30, 30, 36];
  return out;
}

/** 템플릿 줄 길이가 고른지(테스트용) */
export function checkMobTemplates() {
  const bad = [];
  for (const [art, views] of Object.entries(MOB_ART)) {
    for (const [view, frames] of Object.entries(views)) {
      frames.forEach((rows, i) => {
        if (rows.some((r) => r.length !== rows[0].length)) bad.push(`${art}.${view}.${i}`);
      });
    }
  }
  return bad;
}

/**
 * 몬스터 한 칸. look: MONSTER_LOOK 항목({ art, pal, tails?, ... }), dir: up|down|left|right, step: 0·1·2.
 * 돌려주는 것: { w, h, data } — 바깥 외곽선 한 칸을 포함한 크기.
 */
export function mobFrame(look, dir = 'down', step = 0) {
  const art = MOB_ART[look.art] ?? MOB_ART.goblin;
  const side = dir === 'left' || dir === 'right';
  const view = side ? 'side' : dir;
  const frames = art[view] ?? art.down;
  let rows = frames[step % frames.length];
  const pal = palette(look.pal);
  // 덧붙일 그림: [줄들, x, y] (왼쪽을 보는 그림 기준 좌표)
  const extras = [];
  if (look.tails) extras.push([TAILS_FAN, side ? rows[0].length - 11 : Math.floor((rows[0].length - 15) / 2), side ? -2 : -3, true]);
  if (look.art === 'serpent' && look.scale) {
    const h = DRAGON_HORNS[view];
    if (h) extras.push([h.rows, h.at[0], h.at[1]]);
  }
  if (look.pal.c && look.art === 'rat') extras.push([CROWN, side ? 1 : 2, -2]);
  if (look.art === 'skeleton') {
    if (look.pal.h) extras.push([HELM, side ? 2 : 3, -2]);
    if (look.pal.w === 'sword') extras.push([SWORD, side ? -1 : -1, 3]);
    if (look.pal.w === 'bow') extras.push([BOW, side ? -1 : -1, 4]);
  }
  // 덧붙인 것이 밖으로 나가면 판을 넓힌다
  let minX = 0;
  let minY = 0;
  let maxX = rows[0].length;
  let maxY = rows.length;
  for (const [r, x, y] of extras) {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x + r[0].length);
    maxY = Math.max(maxY, y + r.length);
  }
  const w = maxX - minX + 2;
  const h = maxY - minY + 2;
  const px = new Uint8ClampedArray(w * h * 4);
  const put = (rs, ox, oy, behind) => rs.forEach((row, y) => [...row].forEach((ch, x) => {
    const c = pal[ch];
    if (!c) return;
    const i = ((oy + y - minY + 1) * w + (ox + x - minX + 1)) * 4;
    if (behind && px[i + 3]) return;
    px.set([...c, 255], i);
  }));
  // 꼬리는 몸 뒤에: 몸을 먼저 찍고 빈 곳에만 꼬리를 채운다
  put(rows, 0, 0, false);
  for (const [r, x, y, behind] of extras) put(r, x, y, behind);
  // 바깥 외곽선
  const k = pal.k ?? [30, 20, 14];
  const solid = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) solid[i] = px[i * 4 + 3] ? 1 : 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (solid[i]) continue;
      if ((x > 0 && solid[i - 1]) || (x < w - 1 && solid[i + 1]) || (y > 0 && solid[i - w]) || (y < h - 1 && solid[i + w])) px.set([...k, 255], i * 4);
    }
  }
  if (dir === 'right') {
    // 좌우 뒤집기
    const out = new Uint8ClampedArray(px.length);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) out.set(px.subarray((y * w + x) * 4, (y * w + x) * 4 + 4), (y * w + (w - 1 - x)) * 4);
    return { w, h, data: out };
  }
  return { w, h, data: px };
}

