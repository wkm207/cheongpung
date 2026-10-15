// NPC별 퀘스트(순서대로 진행). goal.type: kill(처치 수) | collect(가방에 모아 오기, 완료 시 가져감)
// reward.byClass: 직업에 맞는 아이템 하나를 추가로 준다. repeat: 끝나도 같은 퀘스트를 다시 받을 수 있다.
const CHIEF = [
  {
    id: 'c1', title: '다람쥐 소동', where: '토끼 들판',
    goal: { type: 'kill', target: 'squirrel', count: 8 },
    offer: '요즘 다람쥐들이 곳간 도토리를 몽땅 훔쳐 간다네. 동쪽 토끼 들판에서 다람쥐 8마리만 혼내 주게.',
    done: '허허, 이제 곳간이 좀 조용하겠군! 이건 내 젊을 적 차던 염주라네. 목에 걸어 보게.',
    reward: { gold: 100, exp: 40, items: [['beadNecklace', 1], ['herb', 5]] },
  },
  {
    id: 'c2', title: '포근한 토끼털', where: '토끼 들판',
    goal: { type: 'collect', target: 'rabbitFur', count: 5 },
    offer: '겨울이 오기 전에 아이들 털배자를 지어 주고 싶네. 토끼털 5개를 모아다 주겠나?',
    done: '보들보들하구먼! 고맙네. 손가락이 허전해 보여 반지 하나 주겠네.',
    reward: { gold: 150, exp: 80, items: [['copperRing', 1], ['dew', 5]] },
  },
  {
    id: 'c3', title: '여우 숲의 말썽꾼', where: '여우 숲',
    goal: { type: 'kill', target: 'fox', count: 10 },
    offer: '북쪽 여우 숲의 여우들이 나그네를 덮친다는군. 여우 10마리를 물리쳐 길을 열어 주게.',
    done: '이제 나그네들이 마음 놓고 다니겠어. 이 모자는 먼 길 떠날 때 쓰게나.',
    reward: { gold: 300, exp: 400, items: [['leatherCap', 1], ['bigHerb', 3]] },
  },
  {
    id: 'c4', title: '늑대 언덕의 울음', where: '늑대 언덕',
    goal: { type: 'kill', target: 'wolf', count: 10 },
    offer: '밤마다 늑대 언덕에서 울음소리가 들려 잠을 못 이룬다네. 늑대 10마리를 쫓아 주게.',
    done: '덕분에 오늘 밤은 푹 자겠네. 호박 목걸이를 받게. 몸을 지켜 줄 걸세.',
    reward: { gold: 600, exp: 1200, items: [['amberNecklace', 1]] },
  },
  {
    id: 'c5', title: '도깨비뿔 다섯 개', where: '도깨비 굴',
    goal: { type: 'collect', target: 'goblinHorn', count: 5 },
    offer: '도깨비뿔을 갈아 넣으면 좋은 약이 된다지. 도깨비 굴에서 뿔 5개를 구해다 주겠나?',
    done: '이 정도면 마을 사람들 한 해 약은 걱정 없겠네. 금가락지를 주겠네.',
    reward: { gold: 1000, exp: 2500, items: [['goldRing', 1], ['elixir', 2]] },
  },
  {
    id: 'c6', title: '구미호 토벌', where: '구미호 굴',
    goal: { type: 'kill', target: 'gumiho', count: 1 },
    offer: '도깨비 굴 깊은 곳에 구미호가 산다네. 그대라면 할 수 있을 걸세. 마을을 지켜 주게.',
    done: '정말 구미호를 물리쳤단 말인가! 그대는 청풍촌의 영웅일세. 이 노리개를 받아 주게.',
    reward: { gold: 3000, exp: 5000, items: [['norigae', 1]] },
  },
  {
    id: 'c7', title: '깊은 산의 멧돼지', where: '깊은 산',
    goal: { type: 'kill', target: 'boar', count: 12 },
    offer: '늑대 언덕 동쪽 깊은 산의 멧돼지들이 밭을 다 파헤친다네. 12마리만 혼쭐을 내 주게.',
    done: '밭이 무사하겠군. 진주 목걸이를 받게.',
    reward: { gold: 2000, exp: 8000, items: [['pearlNecklace', 1], ['elixir', 2]] },
  },
  {
    id: 'c8', title: '이무기의 늪', where: '이무기 늪',
    goal: { type: 'kill', target: 'imugi', count: 1 },
    offer: '깊은 산 너머 늪에 용이 되지 못한 이무기가 산다네. 마지막 부탁일세. 부디 무사히 돌아오게.',
    done: '이무기까지... 그대의 이름은 이 고을에 길이 전해질 걸세. 여우불 가락지를 받게.',
    reward: { gold: 10000, exp: 20000, items: [['foxRing', 1], ['elixir', 5]] },
  },
  {
    id: 'c9', title: '설원의 눈늑대', where: '설원 고개',
    goal: { type: 'collect', target: 'snowPelt', count: 10 },
    offer: '이무기 늪 동쪽 설원 고개에 눈늑대 떼가 내려온다네. 가죽 10장을 모아 오면 마을 아이들 겨울옷이 되겠지.',
    done: '따뜻한 겨울을 나겠구먼. 용주 목걸이를 받게.',
    reward: { gold: 15000, exp: 40000, items: [['dragonPearl', 1], ['elixir', 5]] },
  },
  {
    id: 'c10', title: '흑룡의 둥지', where: '흑룡 동굴',
    goal: { type: 'kill', target: 'blackDragon', count: 1 },
    offer: '설원 너머 동굴에 흑룡이 깨어났다는 소문이네. 이 고을의 마지막 영웅이여... 부디 흑룡을 잠재워 주게.',
    done: '흑룡까지 잠재우다니! 청풍촌은 그대를 영원히 기억할 걸세. 천상 가락지를 받게.',
    reward: { gold: 50000, exp: 120000, items: [['heavenRing', 1], ['elixir', 10]] },
  },
];

const HERBALIST = [
  {
    id: 'h1', title: '도토리묵 쑤기', where: '토끼 들판',
    goal: { type: 'collect', target: 'acorn', count: 10 },
    offer: '도토리묵이 먹고 싶은데 다리가 성치 않구먼. 다람쥐들이 모아 둔 도토리 10개만 가져다주게.',
    done: '아이고 고마워라. 약초 좀 챙겨 가게. 다치지 말고.',
    reward: { gold: 50, exp: 30, items: [['herb', 10]] },
  },
  {
    id: 'h2', title: '여우꼬리 약재', where: '여우 숲',
    goal: { type: 'collect', target: 'foxTail', count: 5 },
    offer: '여우꼬리를 달이면 기운 나는 약이 된다네. 5개만 구해 오게나.',
    done: '옳지, 좋은 약이 되겠어. 산삼이랑 이슬을 넉넉히 주지.',
    reward: { gold: 100, exp: 300, items: [['bigHerb', 5], ['dew', 10]] },
  },
  {
    id: 'h3', title: '물귀신 구슬', where: '이무기 늪',
    goal: { type: 'collect', target: 'ghostBead', count: 3 },
    offer: '물귀신 구슬로 영약을 빚을 수 있다더구먼. 위험하지만... 3개만 부탁하네.',
    done: '세상에, 진짜로 구해 왔구먼! 영약을 받게.',
    reward: { gold: 500, exp: 3000, items: [['elixir', 3]] },
  },
  {
    id: 'h4', title: '약초꾼의 부탁', where: '토끼 들판', repeat: true,
    goal: { type: 'collect', target: 'acorn', count: 15 },
    offer: '도토리가 또 떨어졌다네. 15개를 모아 오면 약초로 바꿔 주지. (반복 가능)',
    done: '언제나 고맙구먼. 또 부탁하네.',
    reward: { gold: 60, exp: 20, items: [['herb', 6], ['dew', 3]] },
  },
];

const SMITH = [
  {
    id: 's1', title: '늑대이빨 숫돌', where: '늑대 언덕',
    goal: { type: 'collect', target: 'wolfFang', count: 5 },
    offer: '늑대이빨로 숫돌을 만들면 칼이 잘 든다네. 5개만 구해 오면 자네 무기를 하나 벼려 주지.',
    done: '이거면 충분하지! 자, 갓 벼린 무기일세.',
    reward: { gold: 100, exp: 600, items: [], byClass: { warrior: 'ironSword', rogue: 'ironDagger', mage: 'jadeStaff', priest: 'craneFan' } },
  },
  {
    id: 's2', title: '도깨비뿔 담금질', where: '도깨비 굴',
    goal: { type: 'collect', target: 'goblinHorn', count: 8 },
    offer: '도깨비뿔을 녹여 넣으면 강철보다 단단해진다네. 8개를 모아 오게.',
    done: '내 평생 최고의 작품이야. 받게!',
    reward: { gold: 500, exp: 3000, items: [], byClass: { warrior: 'steelSword', rogue: 'steelDagger', mage: 'spiritStaff', priest: 'cloudFan' } },
  },
  {
    id: 's3', title: '멧돼지 엄니 투구', where: '깊은 산',
    goal: { type: 'collect', target: 'boarTusk', count: 8 },
    offer: '멧돼지 엄니로 투구 장식을 해 볼까 하네. 8개를 모아 오면 자네 것도 하나 만들어 주지.',
    done: '용머리 투구일세. 머리를 단단히 지켜 줄 걸세.',
    reward: { gold: 800, exp: 6000, items: [['dragonHelm', 1]] },
  },
];

const TAILOR = [
  {
    id: 't1', title: '여우꼬리 목도리', where: '여우 숲',
    goal: { type: 'collect', target: 'foxTail', count: 8 },
    offer: '여우꼬리 목도리가 요즘 장에서 인기랍니다. 8개를 모아 오시면 가죽갑옷을 지어 드릴게요.',
    done: '어쩜, 털이 이렇게 고울 수가! 약속한 가죽갑옷이에요.',
    reward: { gold: 200, exp: 500, items: [['leatherArmor', 1]] },
  },
  {
    id: 't2', title: '장산범 털 두루마기', where: '깊은 산',
    goal: { type: 'collect', target: 'whiteFur', count: 8 },
    offer: '장산범의 흰 털로 두루마기를 지으면 칼도 안 든대요. 8개만 구해 주세요.',
    done: '평생 한 번 지을까 말까 한 옷이에요. 용린갑을 드릴게요.',
    reward: { gold: 1500, exp: 9000, items: [['dragonArmor', 1]] },
  },
];

const PEDDLER = [
  {
    id: 'p1', title: '토끼털 노리개 술', where: '토끼 들판',
    goal: { type: 'collect', target: 'rabbitFur', count: 8 },
    offer: '노리개 술을 토끼털로 달면 그렇게 예쁘대요~ 8개만 모아다 주시면 가락지 하나 드릴게요!',
    done: '꺄, 고마워요! 손님 직업에 딱 맞는 가락지예요.',
    reward: { gold: 100, exp: 200, items: [], byClass: { warrior: 'silverRing', rogue: 'silverRing', mage: 'jadeRing', priest: 'jadeRing' } },
  },
  {
    id: 'p2', title: '반짝이는 구슬', where: '구미호 굴',
    goal: { type: 'collect', target: 'foxBead', count: 1 },
    offer: '구미호가 품은 구슬이 그렇게 영롱하다던데... 하나만 구경시켜 주시면 진주 목걸이를 드릴게요!',
    done: '세상에, 이렇게 영롱할 수가! 약속한 진주 목걸이예요.',
    reward: { gold: 1000, exp: 2000, items: [['pearlNecklace', 1]] },
  },
];

const LORD = [
  {
    id: 'l1', title: '도깨비 굴 소탕령', where: '도깨비 굴',
    goal: { type: 'kill', target: 'goblin', count: 20 },
    offer: '성으로 가는 길목에 도깨비들이 들끓는다. 도깨비 20마리를 소탕해 오게.',
    done: '훌륭하다. 상을 내리겠다.',
    reward: { gold: 3000, exp: 5000, items: [['elixir', 3]] },
  },
  {
    id: 'l2', title: '장산범 가죽 진상', where: '깊은 산',
    goal: { type: 'collect', target: 'whiteFur', count: 10 },
    offer: '이웃 고을에 보낼 진상품으로 장산범의 흰 털 10장이 필요하다.',
    done: '이 정도면 이웃 고을도 놀라겠군. 용주 목걸이를 받게.',
    reward: { gold: 8000, exp: 15000, items: [['dragonPearl', 1]] },
  },
  {
    id: 'l3', title: '설원의 두억시니', where: '설원 고개',
    goal: { type: 'kill', target: 'dueok', count: 15 },
    offer: '설원 고개의 두억시니들이 사람을 해친다는 장계가 올라왔다. 15마리를 물리치게.',
    done: '백성들이 그대를 칭송하는구나. 청룡 가락지를 내리겠다.',
    reward: { gold: 20000, exp: 40000, items: [['blueDragonRing', 1]] },
  },
  {
    id: 'l4', title: '쇠를 먹는 괴물', where: '흑룡 동굴',
    goal: { type: 'collect', target: 'ironScale', count: 10 },
    offer: '흑룡 동굴의 불가사리가 성의 무기를 노린다. 놈들의 쇳조각 10개를 가져와 증거를 보이게.',
    done: '과연 소문대로구나. 산호 노리개를 받게.',
    reward: { gold: 50000, exp: 100000, items: [['highNeck55', 1]] },
  },
  {
    id: 'l5', title: '흑룡 토벌 어명', where: '흑룡 동굴',
    goal: { type: 'kill', target: 'blackDragon', count: 1 },
    offer: '성주의 이름으로 명한다. 흑룡을 토벌하라.',
    done: '이 성의 은인이여. 비취 가락지와 함께 그대의 이름을 성벽에 새기겠다.',
    reward: { gold: 100000, exp: 200000, items: [['highRing65', 1]] },
  },
  {
    id: 'l6', title: '불의 섬의 불새', where: '불의 섬',
    goal: { type: 'kill', target: 'firebird', count: 1 },
    offer: '먼 바다 불의 섬에서 불새 주작이 깨어나 바다를 끓이고 있다 한다. 이 나라 최고의 무사여, 마지막 어명이다.',
    done: '불새마저 잠재우다니... 그대야말로 이 나라의 수호신이로다. 천신 가락지를 내리겠다.',
    reward: { gold: 300000, exp: 800000, items: [['highRing85', 1]] },
  },
];

export const QUEST_CHAINS = { chief: CHIEF, herbalist: HERBALIST, smith: SMITH, tailor: TAILOR, peddler: PEDDLER, lord: LORD };
export const QUEST_GIVERS = { chief: '촌장', herbalist: '약방 할멈', smith: '대장장이 무쇠', tailor: '포목점 비단', peddler: '방물장수 꽃분이', lord: '성주 윤휘' };

export const questById = (chain, id) => QUEST_CHAINS[chain]?.find((q) => q.id === id) ?? null;

/** 처음 시작할 때의 퀘스트 진행 상태 */
export function newQuestState() {
  return Object.fromEntries(Object.entries(QUEST_CHAINS).map(([npc, list]) => [npc, { id: list[0].id, accepted: false, kills: 0 }]));
}

/** 보상 아이템 목록(직업별 아이템 포함) */
export function rewardItems(q, cls) {
  const extra = q.reward.byClass ? [[q.reward.byClass[cls], 1]] : [];
  return [...q.reward.items, ...extra];
}
