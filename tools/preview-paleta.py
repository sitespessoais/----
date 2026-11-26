"""Pre-visualiza uma paleta de categorias: pastilhas + rosquinha + legenda.

    python tools/preview-paleta.py [saida.png]

Serve pra julgar as cores fora do navegador (o sandbox nao abre o Chrome).
"""

import sys
from PIL import Image, ImageDraw

from preview import BG, INK, MUTED, mix, fonte, render_ring

# paleta candidata: (categoria, cor) na ordem dos gastos (maior -> menor)
CATS = [
    ('Moradia', '#BE65E4'),
    ('Alimentação', '#BE7345'),
    ('Compras', '#D2509F'),
    ('Transporte', '#518CC2'),
    ('Lazer', '#3A9588'),
    ('Beleza', '#D4555F'),
    ('Saúde', '#42955F'),
    ('Educação', '#6C5BD6'),
    ('Pets', '#998934'),
    ('Outros', '#7C8494'),
]

ENTRADAS = [
    ('Salário', '#33691E'),
    ('Presente', '#5C8F1F'),
    ('Freela', '#0B5E6E'),
    ('Outros', '#14614F'),
]

GASTOS = [1488.00, 419.90, 205.80, 159.00, 122.00, 89.90, 65.80, 59.90, 50.00, 32.50]


def main():
    out = sys.argv[1] if len(sys.argv) > 1 else 'paleta.png'
    W, H = 720, 1160
    img = Image.new('RGB', (W, H), BG)
    d = ImageDraw.Draw(img)

    f_title = fonte(24, True)
    f_name = fonte(16, True)
    f_small = fonte(13)
    f_pct = fonte(15, True)

    d.text((28, 20), 'Paleta das categorias', font=f_title, fill=INK)

    # ---- pastilhas (como os cartoes da home) ----
    x0, y0, cw, ch, gap = 26, 68, 166, 72, 11
    for i, (nome, cor) in enumerate(CATS):
        cx = x0 + (i % 4) * (cw + gap)
        cy = y0 + (i // 4) * (ch + gap)
        d.rounded_rectangle([cx, cy, cx + cw, cy + ch], 18, fill='white',
                            outline=mix(cor, 'white', 0.55), width=2)
        d.rounded_rectangle([cx + 13, cy + 19, cx + 47, cy + 53], 12,
                            fill=mix(cor, 'white', 0.85))
        d.ellipse([cx + 23, cy + 29, cx + 37, cy + 43], fill=cor)
        d.text((cx + 56, cy + 18), nome, font=f_name, fill=INK)
        d.text((cx + 56, cy + 39), cor, font=f_small, fill=MUTED)

    # ---- rosquinha ----
    dy = y0 + 3 * (ch + gap) + 26
    tamanho = 290
    ring = render_ring([c[1] for c in CATS], GASTOS, tamanho, 'nova', BG)
    img.paste(ring, (W // 2 - tamanho // 2, dy))

    # ---- legenda ----
    total = sum(GASTOS)
    ly = dy + tamanho + 2
    for i, ((nome, cor), val) in enumerate(zip(CATS, GASTOS)):
        col, row = i % 2, i // 2
        lx = 92 + col * 300
        yy = ly + row * 29
        d.ellipse([lx, yy + 5, lx + 12, yy + 17], fill=cor)
        d.text((lx + 20, yy), nome, font=f_small, fill=INK)
        d.text((lx + 190, yy), '%d%%' % round(val / total * 100), font=f_pct, fill=MUTED)

    # ---- entradas (familia do verde) ----
    ey = ly + 5 * 29 + 10
    d.text((92, ey), 'Entradas', font=f_name, fill=INK)
    for i, (nome, cor) in enumerate(ENTRADAS):
        ex = 92 + i * 152
        d.ellipse([ex, ey + 30, ex + 12, ey + 42], fill=cor)
        d.text((ex + 20, ey + 25), nome, font=f_small, fill=INK)

    # ---- mock da lista de registros ----
    ry = ey + 62
    d.text((40, ry), 'Registros', font=f_name, fill=INK)
    linhas = [
        ('Mercado da semana', 'Alimentação', '#BE7345', '- R$ 187,40'),
        ('Uber', 'Transporte', '#518CC2', '- R$ 24,90'),
        ('Salário', 'Salário', '#33691E', '+ R$ 3.200,00'),
        ('Freela de design', 'Freela', '#0B5E6E', '+ R$ 450,00'),
    ]
    for i, (titulo, sub, cor, valor) in enumerate(linhas):
        yy = ry + 34 + i * 62
        d.rounded_rectangle([40, yy, W - 40, yy + 54], 16, fill='white')
        d.rounded_rectangle([52, yy + 10, 86, yy + 44], 12, fill=mix(cor, 'white', 0.85))
        d.ellipse([63, yy + 21, 75, yy + 33], fill=cor)
        d.text((98, yy + 9), titulo, font=f_small, fill=INK)
        d.text((98, yy + 28), sub, font=f_small, fill=MUTED)
        d.text((W - 168, yy + 16), valor, font=f_pct, fill=INK)

    img.save(out)
    print('salvo em', out)


if __name__ == '__main__':
    main()
