// 플레이어 그림(assets/people, 높이 400) 위의 장비 자리. tools/gear_bare.py 가 무기를 지운 맨손 그림(_bare)과 짝이다.
// over: 무기를 몸 위에 그린다(원래 무기를 지울 수 없을 때). grip: 무기를 쥔 주먹, tip: 원래 무기 끝(방향·길이), butt: 지팡이 아래 끝, head: [머리 가운데 x, 정수리 y, 머리 폭]
export const GEAR_ANCHORS = {
  warrior_m1: { grip: [48, 258], tip: [12, 116], head: [135, 40, 140] },
  warrior_m1_up: { grip: [182, 285], tip: [214, 116], head: [100, 40, 130] },
  warrior_m1_side: { grip: [100, 291], tip: [240, 291], head: [95, 32, 140] },
  warrior_f1: { grip: [46, 258], tip: [14, 118], head: [137, 40, 140] },
  warrior_f1_up: { grip: [182, 288], tip: [215, 118], head: [101, 40, 122] },
  warrior_f1_side: { grip: [128, 291], tip: [290, 291], head: [115, 28, 140] },
  rogue_m1: { grip: [36, 262], tip: [8, 146], head: [128, 45, 140] },
  rogue_m1_up: { grip: [188, 285], tip: [214, 140], head: [103, 40, 130] },
  rogue_m1_side: { grip: [115, 292], tip: [268, 292], head: [110, 40, 145] },
  rogue_f1: { grip: [38, 262], tip: [8, 164], head: [128, 35, 135] },
  rogue_f1_up: { grip: [195, 272], tip: [223, 154], head: [97, 30, 130] },
  rogue_f1_side: { grip: [122, 295], tip: [238, 293], head: [126, 30, 140] },
  mage_m1: { grip: [45, 255], tip: [28, 118], butt: [62, 395], head: [137, 30, 135] },
  mage_m1_up: { grip: [196, 245], tip: [212, 113], butt: [184, 395], head: [99, 25, 130] },
  mage_m1_side: { grip: [128, 298], tip: [275, 291], butt: [2, 300], head: [123, 25, 150] },
  mage_f1: { grip: [50, 265], tip: [28, 118], butt: [70, 395], head: [135, 30, 140] },
  mage_f1_up: { grip: [195, 258], tip: [210, 116], butt: [180, 395], head: [97, 25, 125] },
  mage_f1_side: { grip: [115, 300], tip: [268, 298], butt: [6, 302], head: [105, 25, 150] },
  priest_m1: { grip: [68, 272], tip: [30, 185], head: [145, 40, 135] },
  priest_m1_up: { grip: [190, 262], tip: [225, 180], head: [96, 40, 125] },
  // 도사 여자 앞·옆은 부채가 몸 앞에 있어 새 무기를 그림 위에 덮는다(over)
  priest_f1: { grip: [78, 150], tip: [64, 84], over: true, head: [84, 12, 82] },
  priest_f1_up: { grip: [112, 128], tip: [128, 90], head: [80, 6, 76] },
  priest_f1_side: { grip: [72, 218], tip: [131, 188], over: true, head: [72, 8, 82] },
  priest_m1_side: { grip: [118, 305], tip: [190, 250], head: [88, 45, 145] },
};
