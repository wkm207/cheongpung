"""LPC(Liberated Pixel Cup) 재료를 받아 직업별 캐릭터 그림을 겹쳐 만든다.

    python tools/lpc_build.py

- 재료는 공식 저장소(LiberatedPixelCup/Universal-LPC-Spritesheet-Character-Generator)에서 받아
  tools/.lpc_cache/ 에 둔다(저장소에는 넣지 않음).
- 결과: assets/lpc/<이름>/<동작>.png  (walk 9칸, slash 6칸, spellcast 7칸, thrust 8칸, hurt 6칸)
        방향 줄 순서는 LPC 그대로 위·왼쪽·아래·오른쪽, hurt는 한 줄.
        큰 무기 베기(slash_oversize)는 한 칸이 192px, 나머지는 64px.
- 만든 이 표기: assets/lpc/CREDITS.txt (각 재료의 저작자·라이선스를 모은다)
"""
import json
import sys
import urllib.request
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
CACHE = ROOT / 'tools' / '.lpc_cache'
OUT = ROOT / 'assets' / 'lpc'
RAW = 'https://raw.githubusercontent.com/LiberatedPixelCup/Universal-LPC-Spritesheet-Character-Generator/master/'

FRAMES = {'walk': 9, 'slash': 6, 'spellcast': 7, 'thrust': 8, 'hurt': 6}
ROWS = {'hurt': 1}


def fetch(rel):
    """저장소 상대 경로의 파일(없으면 None)"""
    dest = CACHE / rel
    if dest.exists():
        return dest if dest.stat().st_size else None
    dest.parent.mkdir(parents=True, exist_ok=True)
    try:
        with urllib.request.urlopen(RAW + rel, timeout=30) as r:
            dest.write_bytes(r.read())
        return dest
    except Exception:
        dest.write_bytes(b'')
        return None


def definition(rel):
    p = fetch('sheet_definitions/' + rel)
    return json.loads(p.read_text(encoding='utf-8')) if p else None


def palettes(kind):
    return json.loads(fetch(f'palette_definitions/{kind}/{kind}_ulpc.json').read_text(encoding='utf-8'))


CLOTH = palettes('cloth')
HAIR = palettes('hair')
BODY = palettes('body')


def recolor(im, src, dst):
    """기준 색 6단계(src)를 원하는 색 6단계(dst)로"""
    table = {tuple(int(a[i:i + 2], 16) for i in (1, 3, 5)): tuple(int(b[i:i + 2], 16) for i in (1, 3, 5)) for a, b in zip(src, dst)}
    px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            if a and (r, g, b) in table:
                nr, ng, nb = table[(r, g, b)]
                px[x, y] = (nr, ng, nb, a)
    return im


def layer_image(path, anim, variant):
    """한 층의 동작 그림: {path}{anim}/{variant}.png 또는 {path}{anim}.png"""
    for rel in ([f'spritesheets/{path}{anim}/{variant}.png'] if variant else []) + [f'spritesheets/{path}{anim}.png']:
        p = fetch(rel)
        if p:
            return Image.open(p).convert('RGBA')
    return None


# 캐릭터 한 명 = [(정의 파일, 색 종류, 색 이름 또는 변형)]
def outfit(sex, hair, hair_color, top, top_color, legs=None, legs_color=None, weapon=None, feet='feet/shoes/feet_shoes_basic.json'):
    items = [
        ('body/body.json', 'body', 'light'),
        (f'head/heads/human/heads_human_{sex}.json', 'body', 'light'),
        ('head/faces/face_neutral.json', None, None),
        (hair, 'hair', hair_color),
        (top, 'cloth', top_color),
        (feet, 'cloth', 'black'),
    ]
    if legs:
        items.append((legs, 'cloth', legs_color))
    if weapon:
        items.append((weapon, None, None))
    return {'sex': 'male' if sex == 'male' else 'female', 'items': items}


TOPKNOT = 'hair/braids/hair_topknot_short.json'
TOPKNOT_LONG = 'hair/braids/hair_topknot_long.json'
LONG = 'hair/braids/hair_long_tied.json'
PONY = 'hair/braids/hair_ponytail.json'
SHIRT = 'torso/shirts/longsleeve/torso_clothes_longsleeve.json'
KIMONO = 'torso/dresses/kimono/dress_kimono.json'
PANTS = 'legs/pants/legs_pants.json'
SWORD = 'weapons/sword/weapon_sword_longsword.json'
DAGGER = 'weapons/sword/weapon_sword_dagger.json'
STAFF = 'weapons/magic/weapon_magic_simple.json'
SPEAR = 'weapons/polearm/weapon_polearm_spear.json'

CHARACTERS = {
    'warrior_m': outfit('male', TOPKNOT, 'black', SHIRT, 'maroon', PANTS, 'brown', SWORD),
    'warrior_f': outfit('female', LONG, 'black', KIMONO, 'red', None, None, SWORD),
    'rogue_m': outfit('male', TOPKNOT, 'black', SHIRT, 'charcoal', PANTS, 'black', DAGGER),
    'rogue_f': outfit('female', PONY, 'black', KIMONO, 'navy', None, None, DAGGER),
    'mage_m': outfit('male', TOPKNOT_LONG, 'black', SHIRT, 'purple', PANTS, 'navy', STAFF),
    'mage_f': outfit('female', LONG, 'black', KIMONO, 'purple', None, None, STAFF),
    'priest_m': outfit('male', TOPKNOT, 'black', SHIRT, 'white', PANTS, 'gray', STAFF),
    'priest_f': outfit('female', LONG, 'black', KIMONO, 'white', None, None, STAFF),
    # 마을 사람들(걷기만)
    'npc_man': outfit('male', TOPKNOT, 'black', SHIRT, 'brown', PANTS, 'tan'),
    'npc_woman': outfit('female', LONG, 'black', KIMONO, 'pink'),
    'npc_elder': outfit('male', TOPKNOT_LONG, 'white', SHIRT, 'white', PANTS, 'gray'),
    'npc_guard': outfit('male', TOPKNOT, 'black', SHIRT, 'navy', PANTS, 'black', SPEAR),
    'npc_lord': outfit('male', TOPKNOT_LONG, 'black', SHIRT, 'maroon', PANTS, 'black'),
    'npc_merchant': outfit('female', PONY, 'black', KIMONO, 'teal'),
}


def layers_for(char):
    """[(zPos, 경로, 색 바꾸기(src,dst) 또는 None, 변형 이름, 전용 동작)]"""
    out = []
    credits = []
    for rel, pal_kind, color in char['items']:
        d = definition(rel)
        if not d:
            print('정의 없음', rel, file=sys.stderr)
            continue
        credits.extend(d.get('credits', []))
        variant = (d.get('variants') or [None])[0]
        if pal_kind == 'cloth' and color in (d.get('variants') or []):
            variant, pal = color, None  # 색별 파일이 따로 있는 옷
        elif pal_kind:
            src = {'cloth': CLOTH['white'], 'hair': HAIR['orange'], 'body': BODY['light']}[pal_kind]
            dst = {'cloth': CLOTH, 'hair': HAIR, 'body': BODY}[pal_kind][color]
            pal = (src, dst)
        else:
            pal = None
        for key, layer in d.items():
            if not key.startswith('layer_'):
                continue
            path = layer.get(char['sex'])
            if not path:
                continue
            out.append((layer['zPos'], path, pal, variant, layer.get('custom_animation')))
    return sorted(out, key=lambda t: t[0]), credits


def compose(char, anim):
    layers, _ = layers_for(char)
    n = FRAMES[anim]
    rows = ROWS.get(anim, 4)
    big = anim == 'slash' and any(c == 'slash_oversize' for *_, c in layers)
    size = 192 if big else 64
    sheet = Image.new('RGBA', (n * size, rows * size))
    for z, path, pal, variant, custom in layers:
        if custom and not (big and custom == 'slash_oversize'):
            continue
        if not custom and big:
            # 몸·옷은 64칸을 192칸 가운데에 놓는다
            im = layer_image(path, anim, variant)
            if im is None:
                continue
            if pal:
                recolor(im, *pal)
            for r in range(rows):
                for f in range(n):
                    cell = im.crop((f * 64, r * 64, f * 64 + 64, r * 64 + 64))
                    sheet.alpha_composite(cell, (f * size + 64, r * size + 64))
            continue
        im = None
        if custom and variant:
            # 전용 동작(큰 베기 등)은 동작 폴더 없이 {path}{variant}.png
            p = fetch(f'spritesheets/{path}{variant}.png')
            im = Image.open(p).convert('RGBA') if p else None
        if im is None:
            im = layer_image(path, custom or anim, variant)
        if im is None:
            continue
        if pal:
            recolor(im, *pal)
        sheet.alpha_composite(im.crop((0, 0, min(im.width, sheet.width), min(im.height, sheet.height))), (0, 0))
    return sheet


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    all_credits = {}
    for name, char in CHARACTERS.items():
        anims = ['walk', 'hurt'] if name.startswith('npc') else ['walk', 'slash', 'spellcast', 'thrust', 'hurt']
        (OUT / name).mkdir(exist_ok=True)
        for anim in anims:
            compose(char, anim).save(OUT / name / f'{anim}.png', optimize=True)
        for c in layers_for(char)[1]:
            all_credits[c['file']] = c
        print('만듦', name)
    lines = ['LPC(Liberated Pixel Cup) 캐릭터 그림 출처', '이 폴더의 그림은 아래 재료를 겹쳐 만든 것입니다. 각 재료의 라이선스를 따릅니다.', '']
    for f, c in sorted(all_credits.items()):
        lines.append(f"- {f}: {', '.join(c.get('authors', []))} / {', '.join(c.get('licenses', []))}")
        for u in c.get('urls', []):
            lines.append(f'    {u}')
    (OUT / 'CREDITS.txt').write_text('\n'.join(lines) + '\n', encoding='utf-8')


if __name__ == '__main__':
    main()
