"""플레이어 그림에서 들고 있는 무기를 지워 '맨손 그림'(assets/people/*_bare.png)을 만든다.

무기 자리는 손으로 잰 도형(선분·원·다각형)으로 정한다.
- erase: 몸 바깥으로 나온 무기 → 투명하게
- fill: 몸 위를 가로지르던 무기 → 위·아래(v) 또는 왼쪽(h) 색으로 메운다
게임에서는 맨손 그림 뒤에 끼고 있는 무기를 그리고(주먹이 손잡이를 가린다), 머리에 쓰개를 얹는다.
쓰는 법: python -I tools/gear_bare.py  [미리보기는 --preview 경로]
"""
import sys
from pathlib import Path

import numpy as np
from scipy import ndimage
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
PEOPLE = ROOT / 'assets' / 'people'

# 그림마다: erase / fill 도형. seg=(x1,y1,x2,y2,굵기) circle=(x,y,r) poly=[(x,y)...]
CUTS = {
    'warrior_m1': {'erase': [('seg', 12, 116, 42, 236, 42)]},
    'warrior_m1_up': {'erase': [('seg', 214, 116, 192, 264, 42)]},
    'warrior_m1_side': {'erase': [('poly', [(124, 278), (248, 278), (248, 304), (124, 304)])]},
    'warrior_f1': {'erase': [('seg', 14, 118, 40, 236, 42)]},
    'warrior_f1_up': {'erase': [('seg', 215, 118, 193, 262, 42)]},
    'warrior_f1_side': {'erase': [('poly', [(160, 278), (291, 278), (291, 304), (160, 304)])]},
    'rogue_m1': {'erase': [('seg', 8, 146, 30, 240, 40)]},
    'rogue_m1_up': {'erase': [('seg', 214, 140, 195, 262, 40)]},
    'rogue_m1_side': {'erase': [('poly', [(147, 280), (271, 280), (271, 304), (147, 304)])]},
    'rogue_f1': {'erase': [('seg', 8, 164, 28, 240, 38)]},
    'rogue_f1_up': {'erase': [('seg', 223, 154, 200, 256, 38)]},
    'rogue_f1_side': {'erase': [('poly', [(147, 282), (239, 282), (239, 306), (147, 306)])]},
    'mage_m1': {'erase': [('circle', 28, 140, 32), ('seg', 30, 160, 42, 234, 32), ('seg', 50, 278, 62, 400, 30)]},
    'mage_m1_up': {'erase': [('circle', 212, 135, 32), ('seg', 208, 158, 198, 224, 32), ('seg', 192, 266, 184, 400, 30)]},
    'mage_m1_side': {
        'erase': [('seg', 0, 300, 57, 299, 32), ('seg', 175, 296, 236, 293, 32), ('circle', 255, 291, 32)],
        'fill': [('v', 'seg', 57, 299, 112, 298, 16), ('v', 'seg', 144, 297, 175, 296, 16)],
    },
    'mage_f1': {'erase': [('circle', 28, 140, 32), ('seg', 35, 165, 45, 238, 32), ('seg', 56, 290, 70, 400, 30)]},
    'mage_f1_up': {'erase': [('circle', 210, 138, 32), ('seg', 205, 160, 198, 238, 32), ('seg', 190, 280, 180, 400, 30)]},
    'mage_f1_side': {
        'erase': [('seg', 0, 302, 61, 300, 32), ('seg', 172, 299, 228, 298, 32), ('circle', 247, 298, 32)],
        'fill': [('v', 'seg', 61, 301, 96, 300, 16), ('v', 'seg', 133, 300, 172, 299, 16)],
    },
    'priest_m1': {'erase': [('poly', [(0, 185), (30, 163), (72, 163), (80, 240), (60, 262), (0, 248)])]},
    'priest_m1_up': {
        'erase': [('poly', [(185, 163), (248, 163), (248, 252), (200, 264), (185, 242)])],
        'fill': [('h', 'poly', [(158, 170), (185, 163), (185, 242), (165, 245)])],
    },
    'priest_m1_side': {'erase': [('poly', [(136, 230), (212, 234), (212, 336), (170, 366), (136, 356)])]},
}


def shape_mask(size, kind, *args):
    m = Image.new('L', size, 0)
    d = ImageDraw.Draw(m)
    if kind == 'seg':
        x1, y1, x2, y2, w = args
        d.line([(x1, y1), (x2, y2)], fill=255, width=int(w))
        for x, y in ((x1, y1), (x2, y2)):
            d.ellipse([x - w / 2, y - w / 2, x + w / 2, y + w / 2], fill=255)
    elif kind == 'circle':
        x, y, r = args
        d.ellipse([x - r, y - r, x + r, y + r], fill=255)
    elif kind == 'poly':
        d.polygon(args[0], fill=255)
    return np.array(m) > 0


def fill_vertical(a, mask):
    """가려진 칸을 같은 열의 위·아래 가장 가까운 칸 색으로(가까운 쪽)"""
    h = a.shape[0]
    for x in np.unique(np.nonzero(mask)[1]):
        col = mask[:, x]
        ys = np.nonzero(col)[0]
        top = ys.min() - 1
        bot = ys.max() + 1
        for y in ys:
            src = top if (y - top) <= (bot - y) else bot
            src = min(max(src, 0), h - 1)
            a[y, x] = a[src, x]


def fill_left(a, mask):
    """가려진 칸을 같은 줄 왼쪽의 가장 가까운 칸 색으로, 새 오른쪽 끝에는 테두리"""
    for y in np.unique(np.nonzero(mask)[0]):
        xs = np.nonzero(mask[y])[0]
        src = a[y, max(xs.min() - 1, 0)].copy()
        for x in xs:
            a[y, x] = src
        if src[3] > 0:
            a[y, xs.max()] = (34, 26, 22, 255)


def make_bare(name):
    src = Image.open(PEOPLE / f'{name}.png').convert('RGBA')
    a = np.array(src)
    cut = CUTS[name]
    for f in cut.get('fill', []):
        mode, kind, *args = f
        mask = shape_mask(src.size, kind, *args)
        (fill_vertical if mode == 'v' else fill_left)(a, mask)
    for kind, *args in cut.get('erase', []):
        a[shape_mask(src.size, kind, *args)] = (0, 0, 0, 0)
    # 지우고 남은 테두리 부스러기(몸과 떨어진 조각)는 버린다
    lab, n = ndimage.label(a[:, :, 3] > 20, structure=np.ones((3, 3)))
    if n > 1:
        sizes = ndimage.sum(np.ones_like(lab), lab, range(1, n + 1))
        a[(lab > 0) & (lab != 1 + int(np.argmax(sizes)))] = (0, 0, 0, 0)
    out = Image.fromarray(a)
    out.save(PEOPLE / f'{name}_bare.png', optimize=True)
    return out


def main():
    made = [make_bare(n) for n in CUTS]
    if '--preview' in sys.argv:
        dest = sys.argv[sys.argv.index('--preview') + 1]
        names = list(CUTS)
        sheet = Image.new('RGBA', (3 * 300, (len(names) // 3) * 410), (170, 200, 150, 255))
        for i, (n, im) in enumerate(zip(names, made)):
            sheet.alpha_composite(im, ((i % 3) * 300, (i // 3) * 410))
        sheet.save(dest)
    print(f'맨손 그림 {len(made)}장')


if __name__ == '__main__':
    main()
