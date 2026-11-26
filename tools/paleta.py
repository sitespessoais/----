"""Escolhe uma paleta de categorias com cores realmente distintas entre si.

Seleciona 10 cores de um conjunto de candidatas (todas na mesma faixa de
luminosidade/saturacao, pra ficarem harmoniosas) maximizando a menor
distancia perceptual (CIE Lab) entre qualquer par.

    python tools/paleta.py
"""

import math

# ---------------------------------------------------------------- conversao

def srgb_to_lab(hex_):
    h = hex_.lstrip('#')
    r, g, b = (int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))

    def lin(c):
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

    r, g, b = lin(r), lin(g), lin(b)
    x = r * 0.4124 + g * 0.3576 + b * 0.1805
    y = r * 0.2126 + g * 0.7152 + b * 0.0722
    z = r * 0.0193 + g * 0.1192 + b * 0.9505
    x, y, z = x / 0.95047, y / 1.0, z / 1.08883

    def f(t):
        return t ** (1 / 3) if t > 0.008856 else 7.787 * t + 16 / 116

    fx, fy, fz = f(x), f(y), f(z)
    return (116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz))


def delta_e(a, b):
    """CIE76: rapida e suficiente pra separar cores de cartela."""
    la, aa, ba = srgb_to_lab(a)
    lb, ab, bb = srgb_to_lab(b)
    return math.sqrt((la - lb) ** 2 + (aa - ab) ** 2 + (ba - bb) ** 2)


def hue(hex_):
    h = hex_.lstrip('#')
    r, g, b = (int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))
    mx, mn = max(r, g, b), min(r, g, b)
    d = mx - mn
    if not d:
        return 0
    if mx == r:
        hh = ((g - b) / d) % 6
    elif mx == g:
        hh = (b - r) / d + 2
    else:
        hh = (r - g) / d + 4
    return round(hh * 60)


# ---------------------------------------------------------------- candidatas
# todas em tons medios/doces, casando com o lilas #BE65E4 da marca
CANDIDATAS = [
    '#BE65E4',  # lilas (marca)
    '#A855D8', '#8E5BE8', '#9B3DC7', '#C77BF0',
    '#E8559C', '#DE55C7', '#F06BB8', '#C94BB0',
    '#E85D7A', '#F2708F', '#D9476B',
    '#E05252', '#EF6A5A', '#C93A3A',
    '#F2994A', '#EE8351', '#F0A63C', '#E9743B',
    '#D9A93C', '#E8B84B',
    '#A8C04A', '#8FAF3E',
    '#43C08B', '#3FAE6E', '#6BC47F', '#2FA36B',
    '#38BFC6', '#3FB6B0', '#2FA89B',
    '#3FB6E0', '#4A9FE3', '#5AB2E8',
    '#4A7BE0', '#5B7CE8', '#3F63D6',
    '#6574E0', '#6C5CE8',
    '#B0824A', '#A97650',
    '#8A8FA0', '#7D8592',
]

SEMENTE = ['#BE65E4']   # a cor da marca entra sempre


def min_dist(paleta, hex_):
    return min(delta_e(hex_, p) for p in paleta)


def escolher(total=10):
    paleta = list(SEMENTE)
    while len(paleta) < total:
        melhor, nota = None, -1
        for cand in CANDIDATAS:
            if cand in paleta:
                continue
            d = min_dist(paleta, cand)
            if d > nota:
                melhor, nota = cand, d
        paleta.append(melhor)
    return paleta


def main():
    paleta = escolher()
    print('paleta:', ' '.join(paleta))
    print()
    print('matiz de cada uma:', ', '.join('%s=%d' % (c, hue(c)) for c in paleta))
    print()

    pares = []
    for i, a in enumerate(paleta):
        for b in paleta[i + 1:]:
            pares.append((delta_e(a, b), a, b))
    pares.sort()
    print('pares mais parecidos (menor = mais risco de confundir):')
    for d, a, b in pares[:6]:
        print('   %6.1f  %s x %s' % (d, a, b))
    print()
    print('menor distancia da paleta: %.1f' % pares[0][0])


if __name__ == '__main__':
    main()
