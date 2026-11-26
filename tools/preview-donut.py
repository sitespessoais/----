"""Desenha a rosquinha fora do navegador pra conferir a geometria.

Replica o mesmo calculo do renderIn() do app.js: viewBox 120, r=48,
traco de 13, vao proporcional. Gera um PNG comparando a versao antiga
(pontas arredondadas, CAP=15) com a nova (pontas retas, vao constante).

    python tools/preview-donut.py [saida.png]
"""

import sys
import math
from PIL import Image, ImageDraw

# gastos do seed, ja agrupados por categoria (maior -> menor)
SLICES = [
    ('#BE65E4', 1488.00),   # moradia
    ('#BE7345', 419.90),    # alimentacao
    ('#D2509F', 205.80),    # compras
    ('#D4555F', 159.00),    # beleza
    ('#3A9588', 122.00),    # lazer
    ('#998934', 89.90),     # pets
    ('#518CC2', 65.80),     # transporte
    ('#6C5BD6', 59.90),     # educacao
    ('#7C8494', 50.00),     # outros
    ('#42955F', 32.50),     # saude
]

R = 48.0
W = 13.0
VIEW = 120.0
CIRC = 2 * math.pi * R
TRACK = (190, 101, 228, 31)   # rgba(190,101,228,.12) sobre branco


def track_rgba():
    a = 0.12
    return (round(190 * a + 255 * (1 - a)), round(101 * a + 255 * (1 - a)),
            round(228 * a + 255 * (1 - a)))


def hex_rgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def sector(draw, cx, cy, r, width, a0, a1, color, rounded):
    """Fatia de anel entre os angulos a0 e a1 (radianos, ja em coords de tela)."""
    steps = 240
    inner, outer = r - width / 2, r + width / 2
    pts = []
    for i in range(steps + 1):
        t = a0 + (a1 - a0) * i / steps
        pts.append((cx + outer * math.cos(t), cy + outer * math.sin(t)))
    for i in range(steps, -1, -1):
        t = a0 + (a1 - a0) * i / steps
        pts.append((cx + inner * math.cos(t), cy + inner * math.sin(t)))
    draw.polygon(pts, fill=color)
    if rounded:
        rad = width / 2
        for t in (a0, a1):
            mx, my = cx + r * math.cos(t), cy + r * math.sin(t)
            draw.ellipse([mx - rad, my - rad, mx + rad, my + rad], fill=color)


def render(mode, px):
    scale = px / VIEW
    img = Image.new('RGB', (px, px), 'white')
    d = ImageDraw.Draw(img)
    cx = cy = px / 2
    r = R * scale
    w = W * scale

    d.ellipse([cx - r - w / 2, cy - r - w / 2, cx + r + w / 2, cy + r + w / 2],
              outline=track_rgba(), width=max(1, round(w)))

    total = sum(v for _, v in SLICES)
    offset = 0.0
    if mode == 'antiga':
        cap = 15.0
        for color, val in SLICES:
            frac = val / total
            length = max(frac * CIRC - cap, 3)
            a0 = -math.pi / 2 + offset / CIRC * 2 * math.pi
            a1 = -math.pi / 2 + (offset + length) / CIRC * 2 * math.pi
            sector(d, cx, cy, r, w, a0, a1, hex_rgb(color), True)
            offset += frac * CIRC
    else:
        gap = CIRC * 0.011
        usable = max(CIRC - len(SLICES) * gap, 1)
        for color, val in SLICES:
            dash = max((val / total) * usable, 1.2)
            a0 = -math.pi / 2 + offset / CIRC * 2 * math.pi
            a1 = -math.pi / 2 + (offset + dash) / CIRC * 2 * math.pi
            sector(d, cx, cy, r, w, a0, a1, hex_rgb(color), False)
            offset += dash + gap
    return img


def main():
    out = sys.argv[1] if len(sys.argv) > 1 else 'donut.png'
    px = 376  # 2x dos 188px da tela, pra ver o detalhe
    old, new = render('antiga', px), render('nova', px)
    sheet = Image.new('RGB', (px * 2 + 24, px), 'white')
    sheet.paste(old, (0, 0))
    sheet.paste(new, (px + 24, 0))
    sheet.save(out)
    print('salvo em', out)


if __name__ == '__main__':
    main()
