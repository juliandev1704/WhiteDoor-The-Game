"""Genera los íconos y la pantalla de carga de la app Android a partir
del ícono de puerta pixelada del juego (js/render.js)."""
import os, re
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
RES = os.path.join(HERE, 'android', 'app', 'src', 'main', 'res')
BG = (0x1b, 0x17, 0x30)
DARK = (0x0d, 0x0b, 0x1a)
PINK = (0xff, 0x77, 0xa8)

src = open(os.path.join(HERE, '..', 'js', 'render.js'), encoding='utf-8').read()
pal = dict(re.findall(r"(\w): '#([0-9a-f]{6})'", src.split('const ICON_PAL')[1].split('};')[0]))
door = re.findall(r"'([^']{12})'", src.split('  door:')[1].split(']')[0])


def door_img(cell):
    im = Image.new('RGBA', (12 * cell, 12 * cell), (0, 0, 0, 0))
    px = im.load()
    for j, row in enumerate(door):
        for i, ch in enumerate(row):
            if ch == '.':
                continue
            c = tuple(int(pal[ch][k:k + 2], 16) for k in (0, 2, 4)) + (255,)
            for y in range(cell):
                for x in range(cell):
                    px[i * cell + x, j * cell + y] = c
    return im


def square(size, scale, frame, bg=BG, transparent=False):
    im = Image.new('RGBA', (size, size), (0, 0, 0, 0) if transparent else bg + (255,))
    if frame:
        b = max(2, round(size * 0.04))
        for box in [(0, 0, size, b), (0, size - b, size, size), (0, 0, b, size), (size - b, 0, size, size)]:
            im.paste(PINK + (255,), box)
    cell = max(1, int(size * scale / 12))
    d = door_img(cell)
    im.alpha_composite(d, ((size - d.width) // 2, (size - d.height) // 2))
    return im


DENS = {'mdpi': 1, 'hdpi': 1.5, 'xhdpi': 2, 'xxhdpi': 3, 'xxxhdpi': 4}
for name, f in DENS.items():
    folder = os.path.join(RES, f'mipmap-{name}')
    os.makedirs(folder, exist_ok=True)
    s = round(48 * f)
    square(s, 0.7, True).save(os.path.join(folder, 'ic_launcher.png'))
    square(s, 0.7, True).save(os.path.join(folder, 'ic_launcher_round.png'))
    fg = round(108 * f)  # capa del ícono adaptable: la zona segura es el 66% central
    square(fg, 0.42, False, transparent=True).save(os.path.join(folder, 'ic_launcher_foreground.png'))

with open(os.path.join(RES, 'values', 'ic_launcher_background.xml'), 'w', encoding='utf-8') as fh:
    fh.write('<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#1B1730</color>\n</resources>\n')

# Pantallas de carga (splash): fondo oscuro con la puerta al centro
for d in os.listdir(RES):
    p = os.path.join(RES, d, 'splash.png')
    if os.path.exists(p):
        w, h = Image.open(p).size
        im = Image.new('RGBA', (w, h), DARK + (255,))
        cell = max(1, int(min(w, h) * 0.3 / 12))
        dd = door_img(cell)
        im.alpha_composite(dd, ((w - dd.width) // 2, (h - dd.height) // 2))
        im.convert('RGB').save(p)
print('Íconos y splash generados')
