"""Gera os icones PNG do app (coracao lilas).

Uso:  python tools/make-icons.py
Saida: icons/icon-180.png, icon-192.png, icon-512.png, icon-1024.png
"""

import math
import os

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(HERE, "icons")
os.makedirs(OUT, exist_ok=True)

S = 2048  # resolucao mestra

C1 = (201, 120, 236)   # #C978EC
C2 = (155, 61, 199)    # #9B3DC7

# coracao em caixa unitaria (y cresce pra baixo)
SEGMENTS = [
    ((0.50, 1.00), (0.50, 1.00), (0.00, 0.70), (0.00, 0.36)),
    ((0.00, 0.36), (0.00, 0.14), (0.17, 0.02), (0.31, 0.02)),
    ((0.31, 0.02), (0.41, 0.02), (0.48, 0.08), (0.50, 0.16)),
    ((0.50, 0.16), (0.52, 0.08), (0.59, 0.02), (0.69, 0.02)),
    ((0.69, 0.02), (0.83, 0.02), (1.00, 0.14), (1.00, 0.36)),
    ((1.00, 0.36), (1.00, 0.66), (0.78, 0.88), (0.50, 1.00)),
]


def gradient_base(size):
    yy, xx = np.mgrid[0:size, 0:size]
    t = ((xx + yy) / (2.0 * (size - 1))).astype(np.float32)
    t = np.clip(t, 0.0, 1.0)
    arr = np.zeros((size, size, 3), dtype=np.float32)
    for i in range(3):
        arr[..., i] = C1[i] + (C2[i] - C1[i]) * t
    return Image.fromarray(arr.astype(np.uint8), "RGB").convert("RGBA")


def radial_shine(img, cx_frac, cy_frac, r_frac, strength):
    size = img.size[0]
    cy, cx = size * cy_frac, size * cx_frac
    r = size * r_frac
    Y, X = np.ogrid[0:size, 0:size]
    d = np.sqrt((X - cx) ** 2 + (Y - cy) ** 2) / r
    alpha = np.clip(1.0 - d, 0.0, 1.0) ** 1.7
    layer = Image.new("RGBA", (size, size), (255, 255, 255, 0))
    layer.putalpha(Image.fromarray((alpha * strength).astype(np.uint8), "L"))
    return Image.alpha_composite(img, layer)


def bez(p0, p1, p2, p3, n=64):
    out = []
    for i in range(n + 1):
        t = i / n
        mt = 1.0 - t
        x = mt ** 3 * p0[0] + 3 * mt * mt * t * p1[0] + 3 * mt * t * t * p2[0] + t ** 3 * p3[0]
        y = mt ** 3 * p0[1] + 3 * mt * mt * t * p1[1] + 3 * mt * t * t * p2[1] + t ** 3 * p3[1]
        out.append((x, y))
    return out


def heart_points(cx, cy, size):
    unit = []
    for seg in SEGMENTS:
        unit += bez(seg[0], seg[1], seg[2], seg[3], n=56)
    xs = [p[0] for p in unit]
    ys = [p[1] for p in unit]
    w = max(xs) - min(xs)
    h = max(ys) - min(ys)
    k = size / max(w, h)
    ox = (max(xs) + min(xs)) / 2.0
    oy = (max(ys) + min(ys)) / 2.0
    return [((p[0] - ox) * k + cx, (p[1] - oy) * k + cy) for p in unit]


def sparkle(cx, cy, r, inner=0.2, n=4, rot=0.0):
    pts = []
    for i in range(n * 2):
        ang = rot + i * math.pi / n
        rr = r if i % 2 == 0 else r * inner
        pts.append((cx + rr * math.cos(ang), cy + rr * math.sin(ang)))
    return pts


def build():
    img = gradient_base(S)
    img = radial_shine(img, 0.27, 0.22, 0.70, 92)

    heart_size = S * 0.55
    heart = heart_points(S / 2.0, S * 0.495, heart_size)

    far = max(math.hypot(x - S / 2.0, y - S / 2.0) for (x, y) in heart) / S
    print("distancia max. do centro (%.3f) - seguro ate 0.400" % far)

    # sombra macia atras do coracao
    shadow = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    ds = ImageDraw.Draw(shadow)
    ds.polygon([(x, y + S * 0.045) for (x, y) in heart], fill=(62, 10, 96, 105))
    shadow = shadow.filter(ImageFilter.GaussianBlur(S * 0.030))
    img = Image.alpha_composite(img, shadow)

    # coracao branco (desenhado 2x e reduzido => bordas bem lisas)
    big = Image.new("RGBA", (S * 2, S * 2), (0, 0, 0, 0))
    db = ImageDraw.Draw(big)
    db.polygon([(x * 2, y * 2) for (x, y) in heart], fill=(255, 255, 255, 255))
    big = big.resize((S, S), Image.LANCZOS)
    img = Image.alpha_composite(img, big)

    # brilhos discretos
    gl = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    dg = ImageDraw.Draw(gl)
    for cx, cy, r, op in [
        (S * 0.245, S * 0.245, S * 0.036, 232),
        (S * 0.762, S * 0.258, S * 0.024, 190),
        (S * 0.700, S * 0.760, S * 0.020, 150),
    ]:
        dg.polygon(sparkle(cx, cy, r), fill=(255, 255, 255, op))
    img = Image.alpha_composite(img, gl)

    return img.convert("RGB")


def main():
    master = build()
    sizes = {"icon-180.png": 180, "icon-192.png": 192, "icon-512.png": 512, "icon-1024.png": 1024}
    for name, size in sizes.items():
        master.resize((size, size), Image.LANCZOS).save(os.path.join(OUT, name), optimize=True)
        print("ok:", name)


if __name__ == "__main__":
    main()
