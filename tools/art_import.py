"""art/inbox 의 AI 그림을 게임용으로 다듬는다.

    python -I tools/art_import.py

- 캐릭터 `{직업}_{m|f}{번호}.(png|jpg)` → 흰 바탕을 지우고 몸에 맞춰 잘라 높이 256px 로
  assets/people/{직업}_{m|f}{번호}.png, 목록은 src/data/looks.js 에 쓴다.
- 마을 사람 `npc_{생김새}` → assets/people/npc_{생김새}.png (목록은 looks.js 의 NPC_PHOTOS)
- 아이콘 묶음 `icons_{종류}.(png|jpg)` → 흰 바탕 위 그림을 하나씩 떼어(읽는 순서) 64px 칸에 맞춰
  assets/icons/{종류}_{번호}.png
"""
import json
import re
import sys
from collections import deque
from pathlib import Path

from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
INBOX = ROOT / 'art' / 'inbox'
PEOPLE = ROOT / 'assets' / 'people'
MOBS = ROOT / 'assets' / 'mobs'
ICONS = ROOT / 'assets' / 'icons'
LOOKS_JS = ROOT / 'src' / 'data' / 'looks.js'
CLASSES = ('warrior', 'rogue', 'mage', 'priest')
PERSON_H = 400
ICON = 64


def background_mask(im, tol=34):
    """가장자리에서 이어진 흰 바탕 = True"""
    w, h = im.size
    px = im.load()
    bg = bytearray(w * h)

    def white(c):
        return min(c) >= 255 - tol and max(c) - min(c) < 28

    q = deque([(x, 0) for x in range(w)] + [(x, h - 1) for x in range(w)] + [(0, y) for y in range(h)] + [(w - 1, y) for y in range(h)])
    while q:
        x, y = q.popleft()
        if x < 0 or y < 0 or x >= w or y >= h or bg[y * w + x] or not white(px[x, y]):
            continue
        bg[y * w + x] = 1
        q.extend(((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)))
    return bg


def erase_grid(im):
    """아이콘 묶음에 그려진 옅은 회색 칸 줄(가로·세로로 길게 이어진 줄)을 흰색으로 지운다"""
    w, h = im.size
    px = im.load()

    def grid(c):
        return max(c) - min(c) < 14 and 180 <= c[0] <= 238

    cols = [x for x in range(w) if sum(grid(px[x, y]) for y in range(0, h, 4)) > h / 4 * 0.45]
    rows = [y for y in range(h) if sum(grid(px[x, y]) for x in range(0, w, 4)) > w / 4 * 0.45]
    for x in cols:
        for y in range(h):
            if grid(px[x, y]):
                px[x, y] = (255, 255, 255)
    for y in rows:
        for x in range(w):
            if grid(px[x, y]):
                px[x, y] = (255, 255, 255)
    return im


def enclosed_white(im, bg, min_area):
    """바탕과 이어지지 않았지만 넓고 새하얀 곳(목걸이 고리 안 등)도 바탕으로"""
    w, h = im.size
    px = im.load()
    seen = bytearray(w * h)
    for y0 in range(h):
        for x0 in range(w):
            i0 = y0 * w + x0
            if bg[i0] or seen[i0] or min(px[x0, y0]) < 246:
                continue
            q = deque([(x0, y0)])
            seen[i0] = 1
            region = []
            while q:
                x, y = q.popleft()
                region.append(y * w + x)
                for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                    if 0 <= nx < w and 0 <= ny < h:
                        j = ny * w + nx
                        if not bg[j] and not seen[j] and min(px[nx, ny]) >= 246:
                            seen[j] = 1
                            q.append((nx, ny))
            if len(region) >= min_area:
                for j in region:
                    bg[j] = 1
    return bg


def cutout(path, sheet=False):
    """흰 바탕을 지운 RGBA(가장자리 한 칸 깎고 살짝 부드럽게). sheet: 아이콘 묶음(칸 줄·고리 안 흰 곳도 지움)"""
    im = Image.open(path).convert('RGB')
    w, h = im.size
    if sheet:
        im = erase_grid(im)
    bg = background_mask(im)
    if sheet:
        bg = enclosed_white(im, bg, (w * h) // 3000)
    mask = Image.new('L', (w, h), 255)
    mask.putdata([0 if b else 255 for b in bg])
    blur = max(0.5, w / 1500)
    mask = mask.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(blur))
    out = im.convert('RGBA')
    out.putalpha(mask)
    return out


def import_person(path, name):
    out = cutout(path)
    out = out.crop(out.getbbox())
    k = PERSON_H / out.height
    out = out.resize((max(1, round(out.width * k)), PERSON_H), Image.LANCZOS)
    PEOPLE.mkdir(parents=True, exist_ok=True)
    out.save(PEOPLE / f'{name}.png', optimize=True)
    print('사람', name, out.size)


def keep_main(rgba, ratio=0.08):
    """옆 그림에서 딸려 온 작은 조각은 지우고 큰 덩어리(가장 큰 것의 ratio 이상)만 남긴다"""
    w, h = rgba.size
    a = bytearray(rgba.getchannel('A').tobytes())
    label = [0] * (w * h)
    sizes = [0]
    for i0 in range(w * h):
        if a[i0] < 128 or label[i0]:
            continue
        n = len(sizes)
        label[i0] = n
        q = deque([i0])
        count = 0
        while q:
            i = q.popleft()
            count += 1
            x, y = i % w, i // w
            for j in ((i + 1) if x + 1 < w else -1, (i - 1) if x > 0 else -1, (i + w) if y + 1 < h else -1, (i - w) if y > 0 else -1):
                if j >= 0 and a[j] >= 128 and not label[j]:
                    label[j] = n
                    q.append(j)
        sizes.append(count)
    if len(sizes) <= 2:
        return rgba
    big = max(sizes)
    keep = {n for n, s in enumerate(sizes) if n and s >= big * ratio}
    alpha = bytes(a[i] if label[i] in keep or (a[i] < 128 and a[i] and any(
        0 <= j < w * h and label[j] in keep for j in (i - 1, i + 1, i - w, i + w))) else 0 for i in range(w * h))
    out = rgba.copy()
    out.putalpha(Image.frombytes('L', (w, h), alpha))
    return out


def import_mob(path, mob_id, box=None, size=320, holes=False):
    """몬스터 한 마리(box 가 있으면 그 부분만) → 긴 쪽 size px, assets/mobs/{id}.png. holes: 똬리 안 흰 곳도 지움"""
    im = Image.open(path).convert('RGB')
    if box:
        im = im.crop(box)
    MOBS.mkdir(parents=True, exist_ok=True)
    tmp = MOBS / f'_{mob_id}.png'
    im.save(tmp)
    out = keep_main(cutout(tmp, sheet=holes))
    tmp.unlink()
    out = out.crop(out.getbbox())
    k = size / max(out.size)
    out = out.resize((max(1, round(out.width * k)), max(1, round(out.height * k))), Image.LANCZOS)
    out.save(MOBS / f'{mob_id}.png', optimize=True)
    print('몬스터', mob_id, out.size)


TERRAIN = ROOT / 'assets' / 'terrain'
OBJECTS = ROOT / 'assets' / 'objects'
TERRAIN_NAMES = ['grass', 'dark', 'dirt', 'stone', 'snow', 'sand', 'cave', 'water']
OBJECT_NAMES = ['tree', 'pine', 'blossom', 'snowpine', 'deadtree', 'bush', 'rock', 'flowers',
                'thatch', 'tilehouse', 'fence', 'jar', 'well']


def seamless(im):
    """이어 붙여도 이음새가 안 보이게: 반 칸 민 그림과 가장자리 쪽에서 섞는다"""
    import numpy as np
    a = np.asarray(im.convert('RGB'), dtype=np.float32)
    h, w, _ = a.shape
    rolled = np.roll(np.roll(a, h // 2, axis=0), w // 2, axis=1)
    yy = np.minimum(np.arange(h), h - 1 - np.arange(h)) / (h / 2)
    xx = np.minimum(np.arange(w), w - 1 - np.arange(w)) / (w / 2)
    m = np.minimum.outer(yy, xx)
    m = np.clip(m * 2.2, 0, 1)
    m = m * m * (3 - 2 * m)
    out = a * m[..., None] + rolled * (1 - m[..., None])
    return Image.fromarray(out.clip(0, 255).astype('uint8'))


def import_terrain(path, names=TERRAIN_NAMES, size=256):
    """바닥 무늬 묶음(흰 여백으로 나뉜 네모들) → 읽는 순서대로 assets/terrain/{이름}.png(이음새 없는 무늬)"""
    im = Image.open(path).convert('RGB')
    w, h = im.size
    bg = background_mask(im, tol=18)
    mask = Image.new('L', (w, h))
    mask.putdata([0 if b else 255 for b in bg])
    boxes = components(mask, min_px=(w * h) // 60)
    TERRAIN.mkdir(parents=True, exist_ok=True)
    for name, (x1, y1, x2, y2) in zip(names, boxes):
        inset = max(4, (x2 - x1) // 20)
        tile = im.crop((x1 + inset, y1 + inset, x2 - inset, y2 - inset)).resize((size, size), Image.LANCZOS)
        seamless(tile).save(TERRAIN / f'{name}.png', optimize=True)
        print('바닥', name)


# 흰색이 그림의 일부인 물건(눈 덮인 나무)은 흰 점 지우기를 건너뛴다
KEEP_WHITE = {'snowpine'}


def drop_white(rgba):
    """잎 사이에 남은 흰 바탕 점과 가장자리의 하얀 테두리를 지운다(흰색이 없는 그림에만)"""
    import numpy as np
    a = np.asarray(rgba, dtype=np.int16).copy()
    rgb = a[..., :3]
    white = (rgb.min(axis=2) >= 228) & ((rgb.max(axis=2) - rgb.min(axis=2)) < 22)
    a[..., 3][white] = 0
    # 투명한 곳과 맞닿은 밝은 가장자리 한 겹도 지운다
    alpha = a[..., 3]
    clear = alpha < 128
    near = np.zeros_like(clear)
    near[1:, :] |= clear[:-1, :]
    near[:-1, :] |= clear[1:, :]
    near[:, 1:] |= clear[:, :-1]
    near[:, :-1] |= clear[:, 1:]
    light = rgb.min(axis=2) >= 190
    a[..., 3][near & light & ~clear] = 0
    return Image.fromarray(a.clip(0, 255).astype('uint8'), 'RGBA')


def import_objects(path, names=OBJECT_NAMES, size=256, boxes=None):
    """맵 물건 묶음 → 읽는 순서대로(또는 boxes 로 정한 자리) assets/objects/{이름}.png"""
    OBJECTS.mkdir(parents=True, exist_ok=True)
    if boxes is None:
        out = cutout(path)
        boxes = components(out.getchannel('A'), min_px=(out.width * out.height) // 1500)
    for name, box in zip(names, boxes):
        tmp = OBJECTS / f'_{name}.png'
        Image.open(path).convert('RGB').crop(box).save(tmp)
        piece = keep_main(cutout(tmp, sheet=True))
        tmp.unlink()
        if name not in KEEP_WHITE:
            piece = drop_white(piece)
        piece = piece.crop(piece.getbbox())
        k = size / max(piece.size)
        piece = piece.resize((max(1, round(piece.width * k)), max(1, round(piece.height * k))), Image.LANCZOS)
        piece.save(OBJECTS / f'{name}.png', optimize=True)
        print('물건', name, piece.size)


def components(alpha, min_px):
    """불투명 덩어리들의 상자(읽는 순서: 위 줄부터 왼→오)"""
    w, h = alpha.size
    a = alpha.load()
    seen = bytearray(w * h)
    boxes = []
    for y0 in range(h):
        for x0 in range(w):
            if seen[y0 * w + x0] or a[x0, y0] < 128:
                continue
            q = deque([(x0, y0)])
            seen[y0 * w + x0] = 1
            n, x1, y1, x2, y2 = 0, x0, y0, x0, y0
            while q:
                x, y = q.popleft()
                n += 1
                x1, y1, x2, y2 = min(x1, x), min(y1, y), max(x2, x), max(y2, y)
                for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                    if 0 <= nx < w and 0 <= ny < h and not seen[ny * w + nx] and a[nx, ny] >= 128:
                        seen[ny * w + nx] = 1
                        q.append((nx, ny))
            if n >= min_px:
                boxes.append((x1, y1, x2 + 1, y2 + 1))
    if not boxes:
        return []
    row_h = sum(b[3] - b[1] for b in boxes) / len(boxes)
    return sorted(boxes, key=lambda b: (round(((b[1] + b[3]) / 2) / row_h), b[0]))


def import_icons(path, group):
    out = cutout(path, sheet=True)
    boxes = components(out.getchannel('A'), min_px=(out.width * out.height) // 900)
    ICONS.mkdir(parents=True, exist_ok=True)
    for old in ICONS.glob(f'{group}_*.png'):
        old.unlink()
    for i, box in enumerate(boxes, 1):
        piece = out.crop(box)
        k = (ICON - 4) / max(piece.size)
        piece = piece.resize((max(1, round(piece.width * k)), max(1, round(piece.height * k))), Image.LANCZOS)
        cell = Image.new('RGBA', (ICON, ICON))
        cell.alpha_composite(piece, ((ICON - piece.width) // 2, (ICON - piece.height) // 2))
        cell.save(ICONS / f'{group}_{i}.png', optimize=True)
    print('아이콘', group, len(boxes), '개')


def write_looks():
    looks = {c: {'m': [], 'f': []} for c in CLASSES}
    for p in sorted(PEOPLE.glob('*.png')):
        m = re.fullmatch(r'(\w+?)_([mf])(\d+)', p.stem)
        if m and m[1] in looks:
            looks[m[1]][m[2]].append(int(m[3]))
    for c in looks.values():
        for g in c.values():
            g.sort()
    icons = sorted(p.stem for p in ICONS.glob('*.png')) if ICONS.exists() else []
    npcs = sorted(p.stem[len('npc_'):] for p in PEOPLE.glob('npc_*.png'))
    mobs = sorted(p.stem for p in MOBS.glob('*.png') if not p.stem.startswith('_')) if MOBS.exists() else []
    LOOKS_JS.write_text(
        '// tools/art_import.py 가 만든다. 직업·성별마다 고를 수 있는 생김새 번호(assets/people/{직업}_{m|f}{번호}.png)\n'
        f'export const LOOKS = {json.dumps(looks, ensure_ascii=False)};\n'
        '// 실사 아이템 아이콘(assets/icons/{이름}.png)\n'
        f'export const ICON_FILES = {json.dumps(icons)};\n'
        '// 실사 마을 사람(assets/people/npc_{생김새}.png)\n'
        f'export const NPC_PHOTOS = {json.dumps(npcs)};\n'
        '// 실사 몬스터(assets/mobs/{몬스터 id}.png)\n'
        f'export const MOB_PHOTOS = {json.dumps(mobs)};\n'
        '// 실사 맵: 바닥 무늬(assets/terrain/{이름}.png)와 맵 물건(assets/objects/{이름}.png)\n'
        f'export const TERRAIN_FILES = {json.dumps(sorted(p.stem for p in TERRAIN.glob("*.png")) if TERRAIN.exists() else [])};\n'
        f'export const OBJECT_FILES = {json.dumps(sorted(p.stem for p in OBJECTS.glob("*.png") if not p.stem.startswith("_")) if OBJECTS.exists() else [])};\n',
        encoding='utf-8')
    print('목록', LOOKS_JS.relative_to(ROOT))


def main():
    files = sorted(p for p in INBOX.glob('*') if p.suffix.lower() in ('.png', '.jpg', '.jpeg', '.webp'))
    if not files:
        print('art/inbox 에 그림이 없습니다.')
    for p in files:
        stem = p.stem.lower()
        if re.fullmatch(r'(warrior|rogue|mage|priest)_[mf]\d+', stem) or re.fullmatch(r'npc_[a-z]+', stem):
            import_person(p, stem)
        elif stem.startswith('icons_'):
            import_icons(p, stem[len('icons_'):])
        else:
            print('이름을 모르는 그림(건너뜀):', p.name, file=sys.stderr)
    write_looks()


if __name__ == '__main__':
    main()
