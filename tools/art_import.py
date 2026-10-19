"""art/inbox 의 AI 그림을 게임용으로 다듬는다.

    python -I tools/art_import.py

- 캐릭터 `{직업}_{m|f}{번호}.(png|jpg)` → 흰 바탕을 지우고 몸에 맞춰 잘라 높이 256px 로
  assets/people/{직업}_{m|f}{번호}.png, 목록은 src/data/looks.js 에 쓴다.
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
    LOOKS_JS.write_text(
        '// tools/art_import.py 가 만든다. 직업·성별마다 고를 수 있는 생김새 번호(assets/people/{직업}_{m|f}{번호}.png)\n'
        f'export const LOOKS = {json.dumps(looks, ensure_ascii=False)};\n'
        '// 실사 아이템 아이콘(assets/icons/{이름}.png)\n'
        f'export const ICON_FILES = {json.dumps(icons)};\n',
        encoding='utf-8')
    print('목록', LOOKS_JS.relative_to(ROOT))


def main():
    files = sorted(p for p in INBOX.glob('*') if p.suffix.lower() in ('.png', '.jpg', '.jpeg', '.webp'))
    if not files:
        print('art/inbox 에 그림이 없습니다.')
    for p in files:
        stem = p.stem.lower()
        if re.fullmatch(r'(warrior|rogue|mage|priest)_[mf]\d+', stem):
            import_person(p, stem)
        elif stem.startswith('icons_'):
            import_icons(p, stem[len('icons_'):])
        else:
            print('이름을 모르는 그림(건너뜀):', p.name, file=sys.stderr)
    write_looks()


if __name__ == '__main__':
    main()
