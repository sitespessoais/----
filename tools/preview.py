"""Desenho da rosquinha fora do navegador (mesma geometria do app.js).

Modulo usado por preview-donut.py e preview-paleta.py.
"""

import math
from PIL import Image, ImageDraw, ImageFont

R = 48.0
W = 13.0
VIEW = 120.0
CIRC = 2 * math.pi * R
BG = '#FAF7FC'
INK = '#1F1A24'
MUTED = '#8A8090'


NOMES = {'white': (255, 255, 255), 'black': (0, 0, 0)}


def hex_rgb(h):
    if h in NOMES:
        return NOMES[h]
    h = h.lstrip('#')
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def mix(a, b, t):
    """Mistura duas cores (t=0 -> a, t=1 -> b)."""
    ra, ga, ba = hex_rgb(a) if isinstance(a, str) else a
    rb, gb, bb = hex_rgb(b) if isinstance(b, str) else b
    return (round(ra + (rb - ra) * t), round(ga + (gb - ga) * t), round(ba + (bb - ba) * t))


def fonte(tam, bold=False):
    nomes = ('seguisb.ttf' if bold else 'segoeui.ttf', 'arialbd.ttf' if bold else 'arial.ttf')
    for nome in nomes:
        try:
            return ImageFont.truetype(nome, tam)
        except Exception:
            pass
    return ImageFont.load_default()


def sector(draw, cx, cy, r, width, a0, a1, color, rounded):
    """Fatia de anel entre os angulos a0 e a1 (radianos, coords de tela)."""
    steps = 200
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


def render_ring(colors, values, px, modo='nova', bg='white'):
    """colors/values na ordem em que devem aparecer no anel."""
    scale = px / VIEW
    img = Image.new('RGB', (px, px), bg)
    d = ImageDraw.Draw(img)
    cx = cy = px / 2
    r, w = R * scale, W * scale

    d.ellipse([cx - r - w / 2, cy - r - w / 2, cx + r + w / 2, cy + r + w / 2],
              outline=mix('#BE65E4', bg, 0.88), width=max(1, round(w)))

    total = sum(values) or 1
    offset = 0.0
    if modo == 'antiga':
        for cor, val in zip(colors, values):
            frac = val / total
            length = max(frac * CIRC - 15.0, 3)
            a0 = -math.pi / 2 + offset / CIRC * 2 * math.pi
            a1 = -math.pi / 2 + (offset + length) / CIRC * 2 * math.pi
            sector(d, cx, cy, r, w, a0, a1, hex_rgb(cor), True)
            offset += frac * CIRC
    else:
        gap = CIRC * 0.011
        usable = max(CIRC - len(colors) * gap, 1)
        for cor, val in zip(colors, values):
            dash = max((val / total) * usable, 1.2)
            a0 = -math.pi / 2 + offset / CIRC * 2 * math.pi
            a1 = -math.pi / 2 + (offset + dash) / CIRC * 2 * math.pi
            sector(d, cx, cy, r, w, a0, a1, hex_rgb(cor), False)
            offset += dash + gap
    return img
