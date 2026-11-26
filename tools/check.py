"""Checagem estatica de consistencia HTML <-> JS <-> CSS (v2)."""

import os
import re
import sys

HTML = open("index.html", encoding="utf-8").read()
JS = open("app.js", encoding="utf-8").read()
CSS = open("styles.css", encoding="utf-8").read()

problems = []

# ---------- ids ----------
html_ids = set(re.findall(r'\bid="([^"]+)"', HTML))
js_ids = set(re.findall(r"\$\('([a-zA-Z][a-zA-Z0-9_-]*)'\)", JS))
js_ids |= set(re.findall(r"getElementById\('([a-zA-Z][a-zA-Z0-9_-]*)'\)", JS))

print("ids no HTML:", len(html_ids), "| ids citados no JS:", len(js_ids))

for i in sorted(js_ids):
    if i not in html_ids:
        problems.append("JS usa id inexistente no HTML: #" + i)

# ---------- classes ----------
html_classes = set()
for attr in re.findall(r'class="([^"]*)"', HTML):
    for c in attr.split():
        html_classes.add(c)

# classes estaticas escritas dentro de template strings do JS
for attr in re.findall(r'class="([^"\'+]*)"', JS):
    for c in attr.split():
        html_classes.add(c)

css_classes = set(re.findall(r'\.([a-zA-Z][a-zA-Z0-9_-]*)', CSS))

ignore = {'is-active', 'is-on', 'is-sel', 'is-open', 'in', 'out', 'hi', 'income',
          'shake', 'no-scroll', 'wide', 'danger', 'empty', 'ce', 'co-n', 'tx',
          'is-locked', 'nojs'}
for c in sorted(html_classes):
    if c in ignore:
        continue
    if c not in css_classes:
        problems.append("classe sem estilo no CSS: ." + c)

for c in ['is-active', 'is-on', 'is-sel', 'income', 'shake', 'no-scroll', 'hi', 'in', 'out', 'wide']:
    if c not in css_classes:
        problems.append("classe dinamica sem CSS: ." + c)

# ---------- css ----------
if CSS.count("{") != CSS.count("}"):
    problems.append("chaves CSS desbalanceadas: %d abre / %d fecha" % (CSS.count("{"), CSS.count("}")))

for name in ["screenIn", "riseIn", "popIn", "fabIn", "donutIn", "navPop", "twinkle",
             "ringPulse", "sheen", "drift1", "drift2", "drift3", "shake"]:
    if ("@keyframes " + name) not in CSS:
        problems.append("keyframes ausente: " + name)
    if not re.search(r'(?:animation|animation-name)\s*:[^;}]*\b' + name + r'\b', CSS) and name not in JS:
        problems.append("keyframes nunca usada: " + name)

declared = set(re.findall(r'(--[a-zA-Z0-9-]+)\s*:', CSS))
used = set(re.findall(r'var\((--[a-zA-Z0-9-]+)', CSS))
for v in sorted(used - declared):
    problems.append("var CSS nao declarada: " + v)

# ---------- arquivos ----------
for ref in sorted(set(re.findall(r'(?:href|src)="([^"]+)"', HTML))):
    if ref.startswith(("http", "#", "data:", "mailto:")):
        continue
    if not os.path.exists(ref):
        problems.append("arquivo referenciado inexistente: " + ref)

# manifest / sw citam arquivos
man = open("manifest.json", encoding="utf-8").read()
for ref in re.findall(r'"src":\s*"([^"]+)"', man):
    if not os.path.exists(ref):
        problems.append("icone do manifest inexistente: " + ref)

sw = open("sw.js", encoding="utf-8").read()
for ref in re.findall(r"'\./([^']+)'", sw):
    if ref and not os.path.exists(ref):
        problems.append("asset do service worker inexistente: " + ref)

# ---------- paleta das categorias ----------
def _lab(hex_):
    h = hex_.lstrip('#')
    r, g, b = (int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))

    def lin(c):
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

    r, g, b = lin(r), lin(g), lin(b)
    x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047
    y = r * 0.2126 + g * 0.7152 + b * 0.0722
    z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883

    def f(t):
        return t ** (1 / 3) if t > 0.008856 else 7.787 * t + 16 / 116

    fx, fy, fz = f(x), f(y), f(z)
    return (116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz))


def _dist(a, b):
    la, aa, ba = _lab(a)
    lb, ab, bb = _lab(b)
    return ((la - lb) ** 2 + (aa - ab) ** 2 + (ba - bb) ** 2) ** 0.5


PAR_RE = r"name:\s*'([^']*)',\s*icon:\s*'[^']*',\s*color:\s*'(#[0-9A-Fa-f]{6})'"


def _cats(bloco):
    m = re.search(bloco + r":\s*\[(.*?)\n    \]", JS, re.S)
    return re.findall(PAR_RE, m.group(1)) if m else []


for grupo, minimo in (('expense', 20.0), ('income', 20.0)):
    cores = _cats(grupo)
    if not cores:
        problems.append("nao consegui ler as cores das categorias de " + grupo)
        continue
    if len({c for _, c in cores}) != len(cores):
        problems.append("cor repetida entre categorias de " + grupo)
    pior = min((( _dist(a, b), na, nb) for i, (na, a) in enumerate(cores)
                for nb, b in cores[i + 1:]), default=(999, '', ''))
    if pior[0] < minimo:
        problems.append("cores parecidas demais em %s: %s x %s (%.1f < %.0f)"
                        % (grupo, pior[1], pior[2], pior[0], minimo))
    print("cores de %s: %d | mais parecidas: %s x %s = %.1f"
          % (grupo, len(cores), pior[1], pior[2], pior[0]))

_gastos, _entradas = _cats('expense'), _cats('income')
cruz = min(((_dist(a, b), na, nb) for na, a in _gastos for nb, b in _entradas),
           default=(999, '', ''))
if cruz[0] < 18:
    problems.append("cor de entrada parecida com a de gasto: %s x %s (%.1f)"
                    % (cruz[1], cruz[2], cruz[0]))
print("entrada x gasto: mais parecidas %s x %s = %.1f" % (cruz[1], cruz[2], cruz[0]))


def _lum(c):
    def f(v):
        v /= 255.0
        return v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4
    r, g, b = (f(v) for v in c)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


pior_contraste = (99, '')
for nome, cor in _gastos + _entradas:
    c = [int(cor[i:i + 2], 16) for i in (1, 3, 5)]
    tinte = [c[i] + (255 - c[i]) * 0.85 for i in range(3)]   # hexA(cor, .15) no branco
    la, lb = _lum(c), _lum(tinte)
    r = (max(la, lb) + 0.05) / (min(la, lb) + 0.05)
    if r < pior_contraste[0]:
        pior_contraste = (r, nome)
if pior_contraste[0] < 2.8:
    problems.append("icone some no fundo tintado: %s (contraste %.2f)"
                    % (pior_contraste[1], pior_contraste[0]))
print("contraste do icone no tinte: pior = %s (%.2f)" % (pior_contraste[1], pior_contraste[0]))

# ---------- espaco morto no fim da pagina ----------
_base = re.search(r'\n\.screen\{([^}]*)\}', CSS)
if not _base:
    problems.append("regra .screen nao encontrada")
else:
    _pad = re.search(r'padding:0 0 calc\((\d+)px', _base.group(1))
    if not _pad:
        problems.append(".screen sem padding inferior calculado")
    elif int(_pad.group(1)) > 120:
        problems.append("padding inferior de .screen muito grande: %spx (a barra ocupa ~83px)"
                        % _pad.group(1))
    else:
        print("padding inferior das telas: %spx + safe area" % _pad.group(1))

# ---------- categorias removidas ----------
if re.search(r"id:\s*'freela'", JS):
    problems.append("a categoria Freela (removida a pedido) voltou pro CATS")
if not re.search(r"CAT_ALIAS\s*=\s*\{[^}]*freela:\s*'other-in'", JS):
    problems.append("falta o alias que converte registros antigos de Freela em Outros")

# ---------- assinatura ----------
if 'amor da sua vida' not in HTML.lower():
    problems.append("assinatura do Bryan sumiu do index.html")
if 'Bryan pra Dayanne' not in HTML:
    problems.append("credito 'Bryan pra Dayanne' sumiu dos ajustes")

# ---------- js ----------
if JS.count("{") != JS.count("}"):
    problems.append("chaves JS desbalanceadas: %d / %d" % (JS.count("{"), JS.count("}")))
if JS.count("(") != JS.count(")"):
    problems.append("parenteses JS desbalanceados: %d / %d" % (JS.count("("), JS.count(")")))

# ids duplicados no HTML
all_ids = re.findall(r'\bid="([^"]+)"', HTML)
dups = {i for i in all_ids if all_ids.count(i) > 1}
for d in sorted(dups):
    problems.append("id duplicado no HTML: " + d)

print()
if problems:
    print("PROBLEMAS (%d):" % len(problems))
    for p in problems:
        print("  -", p)
    sys.exit(1)
print("Tudo consistente.")
