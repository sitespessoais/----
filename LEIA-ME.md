# Finanças da Dayanne 💜

App de controle de gastos feito para celular (iPhone em primeiro lugar), com visual
minimalista e feminino nas cores que você escolheu.

---

## 🌸 Abrir agora no computador

Já deixei um servidor rodando nesta pasta. Abra no navegador:

**http://localhost:8765**

## 📱 Abrir no iPhone (mesma rede Wi‑Fi)

1. Conecte o iPhone no **mesmo Wi‑Fi** deste computador.
2. Abra o **Safari** e digite:

   **http://192.168.0.119:8765**

3. Pronto. Se quiser o atalho na tela de início: toque em **Compartilhar** (quadradinho
   com a flecha) → **Adicionar à Tela de Início**.

> Se a página não abrir no iPhone, é o Firewall do Windows bloqueando a porta 8765.
> Basta permitir o Python na rede privada, ou usar a opção de hospedagem abaixo.

## ✨ Experiência de app "de verdade" (tela cheia, sem barra do navegador)

O modo aplicativo (standalone) só é liberado por **HTTPS**. O jeito mais fácil e grátis:

1. Entre em <https://app.netlify.com/drop> (não precisa de conta).
2. Arraste **esta pasta inteira** para a página.
3. Ela te dá um link `https://algumacoisa.netlify.app`.
4. Abra esse link no iPhone → Compartilhar → **Adicionar à Tela de Início**.

Aí o app abre em tela cheia, com ícone próprio, e **funciona offline** depois da
primeira visita (tem service worker).

---

## 🧠 Como funciona

Ao abrir, o app pede **e-mail e senha** (é a porta de entrada — veja
[Conta na nuvem](#-conta-na-nuvem-supabase)). Depois de entrar uma vez, o aparelho
guarda a sessão e ele abre direto, até sem internet.

- **Início** — saudação, saldo do mês, entradas/saídas, gastos por categoria e últimos registros.
- **Registros** — tudo que entrou e saiu, agrupado por dia, com **busca por texto**,
  **filtro por tipo** (Tudo / Entradas / Saídas) e **filtro por categoria** (a fileira de
  chips coloridos — tocar de novo no chip desliga o filtro, e o "✕" limpa tudo) e troca de mês.
  A busca ignora acento e maiúscula, e também encontra pelo valor. Como a lista já vem
  agrupada por dia ("Ontem", "24 de novembro"), cada linha mostra só a categoria — sem repetir a data.
- **Resumo** — rosquinha de gastos por categoria + comparação dos últimos 6 meses.
- **Câmbio** — conversor entre **Guarani (Gs)**, **Real (R$)** e **Dólar (US$)**.
- **Botão +** — adiciona um gasto ou entrada. O valor usa máscara de centavos
  (digite `1234` e vira `12,34`).
- **Avatar (canto superior)** — Ajustes: seu nome, **moeda do app**, categorias,
  backup/restauração e zerar dados.

### 🎨 Categorias

Em **Ajustes → Categorias** ela cria, renomeia, escolhe **cor** e **ícone**, e pode
**esconder** uma categoria (ela some dos seletores, mas os registros antigos continuam
aparecendo). Excluir manda os registros daquela categoria pra **"Outros"** — nada é
apagado. As categorias ficam salvas junto com os dados, então entram no backup.

### 🔁 Gastos e ganhos fixos

Aluguel, internet, Netflix, salário… tudo que se repete todo mês.

- **Criar:** no formulário do **+**, preencha normal e ligue **"Repetir todo mês"**.
- **Prazo:** com o fixo ligado aparecem **Começa em** e, se quiser, **Tem data pra
  acabar** → **Termina em**. Sem prazo de fim, ele repete pra sempre; com prazo, some
  sozinho depois do mês escolhido.
- **Aparecem** na lista com a etiqueta **fixo**, e somam no saldo, nas categorias e no resumo
  como qualquer outro registro — mas **sem duplicar** nada no seu backup.
- **Gerenciar:** **Ajustes → Gastos e ganhos fixos**. Lá você toca para editar,
  desliga no interruptor para **pausar** (para de contar) ou exclui de vez.
- `Novo fixo` na mesma tela cria um fixo sem passar pelo botão +.
- Editar um fixo e desligar "Repetir todo mês" transforma ele em registro único,
  e o contrário também vale.

### 💱 Moeda: Real ou Guarani

Em **Ajustes → Moeda do app** você troca o app inteiro entre **Real** e **Guarani**.
Todo o layout (saldo, categorias, registros, resumo e o campo de valor) passa a
mostrar a moeda escolhida, com o valor **convertido automaticamente** pela cotação
do dia.

- A cotação vem da API gratuita [`currency-api`](https://github.com/fawazahmed0/currency-api)
  (via jsDelivr), com [`open.er-api.com`](https://open.er-api.com) como reserva.
- A cotação fica **guardada no aparelho**, então o app abre na hora mesmo sem
  internet e se atualiza quando a rede volta.
- Se nunca houver internet, ele usa uma cotação aproximada (~1 R$ = 1.100 Gs) para
  não quebrar — o aviso "Sem internet" aparece em Ajustes.
- Os valores são guardados em reais e convertidos na hora de exibir, então trocar
  de moeda **não altera** o que você registrou.

### Onde ficam os dados

Sempre **no próprio aparelho** (`localStorage` do navegador) — é o que faz o app abrir
na hora e funcionar sem internet. Com a conta, os dados também ficam **na sua conta do
Supabase** (uma linha só sua, protegida por RLS), o que permite abrir no celular e no
computador e ter o mesmo conteúdo, e recuperar tudo se trocar de aparelho.

Por isso:

- Os dados do iPhone e do computador ficam iguais: o que salva em um aparece no outro
  na próxima sincronização.
- Se você limpar os dados do site no Safari, os registros somem do aparelho — mas
  quando entrar de novo na conta eles voltam da nuvem.
- Para segurança, use **Ajustes → Salvar backup** de vez em quando (gera um `.json`),
  e **Restaurar** para trazer de volta.

### 🔐 Tela de entrada

O app abre numa tela de login, no mesmo clima do resto: marca em degradê, "Finanças da
Dayanne", e um seletor **Entrar | Criar conta**.

- **Entrar** — e-mail e senha. Se a senha estiver errada, o aviso aparece ali mesmo
  ("E-mail ou senha não conferem"), sem sair da tela.
- **Criar conta** — cria na hora. Se o projeto estiver com **Confirm email** ligado,
  o app avisa pra confirmar o e-mail antes de entrar.
- **Esqueci a senha** — manda um link de redefinição pro e-mail cadastrado.
- **Sessão guardada** — depois do primeiro login o aparelho lembra. Fechou e abriu de
  novo, entra direto; **até sem internet** (a cópia na nuvem se acerta depois).
- **Sair** (em Ajustes → Conta na nuvem) volta pra essa tela — e os dados continuam
  aqui no aparelho até você entrar de novo.

### ☁️ Conta na nuvem (Supabase)

É onde a conta mora — a tela de entrada usa ela. O app **não abre sem login**.

**Como ligar (uma vez só):**

1. No painel do Supabase, abra o **SQL Editor** e rode o arquivo
   [`supabase/schema.sql`](supabase/schema.sql) — ele cria a tabela `finance_state`
   com **RLS** ligada (cada conta só enxerga a própria linha).
2. Em **Authentication → Providers → Email**, escolha: deixar "Confirm email" ligado
   (aí você confirma o e-mail uma vez) ou desligar (entra direto).
3. Abra o app: na tela de entrada toque em **Criar conta** (ou **Entrar**, se já criou).

**Como funciona no dia a dia:**

- Salvar um gasto é instantâneo no aparelho; a nuvem recebe a cópia ~2s depois.
- Sem internet, continua tudo normal e a cópia sobe quando a rede volta.
- Só sobe depois de **ler** a nuvem primeiro — assim um aparelho novo nunca manda um
  estado vazio por cima dos seus registros.
- Aparelho novo e vazio (recém-instalado) **baixa a nuvem sozinho**, sem perguntar.
- Se os dois lados mudaram, o app **pergunta** qual vale ("na nuvem tem 31, neste
  aparelho tem 24") — nunca sobrescreve calado. A pergunta também fica em
  **Ajustes → Conta na nuvem** caso você feche sem responder.
- **Importante:** faça o primeiro login no aparelho que já tem os seus registros de
  verdade. Num aparelho novo o app começa vazio e completa com o que vem da nuvem.

> A chave usada no app é a **publishable/anon**, que é pública por design. A senha do
> banco Postgres e a chave `service_role` **não entram no app** (quem protegeria seria a
> RLS, mas uma chave dessas ignora a RLS).

### Dados de exemplo

Os 24 registros de exemplo só aparecem quando o app roda **sem** a nuvem (por exemplo
se o `sync.js` não carregar). Com conta, o app começa vazio e as telas já convidam a
anotar o primeiro gasto. Para limpar tudo: **avatar → Zerar todos os dados**.

---

## 🎨 Cores e personalização

A paleta está toda em variáveis no topo do `styles.css`:

| Papel       | Cor       |
|-------------|-----------|
| Primária    | `#BE65E4` |
| Escura      | `#9B3DC7` |
| Clara       | `#D89BF0` |
| Texto       | `#1F1A24` |
| Fundo       | `#FAF7FC` |

Para trocar o nome: **Ajustes → Seu nome**. O nome aparece na saudação, no título e no
avatar da tela inicial.

### Cores das categorias

Cada categoria tem a **sua própria cor** (`CATS` no topo do `app.js`), escolhida pra
ficar bem diferente das outras — assim a rosquinha e a legenda do **Resumo** não viram
um borrão de tons parecidos. São 10 cores de gasto + 3 de entrada (as entradas ficam na
família do verde, que combina com o `+` da lista).

O `tools/check.py` confere isso sozinho: avisa se duas categorias ficarem parecidas
demais (distância de cor), se alguma cor de entrada encostar numa de gasto, e se o ícone
perder contraste no fundo tintado.

---

## 🪞 Refino visual (o "brilho" do app)

O visual foi todo repassado pra ficar mais delicado, sem perder nada da paleta:

- **Tipografia** com etiquetas em caixa alta e letra espaçada (`SALDO DO MÊS`,
  `CATEGORIA`, `SEU NOME`, `ONTEM`), números tabulares (os dígitos não "dançam") e
  hierarquia mais clara entre título, apoio e valor.
- **Cartões** em camadas: branco com um degradê quase invisível, fio de cabelo no lugar
  da borda e sombra em duas alturas (uma colada, outra difusa). Nada de borda dura.
- **Cartão do saldo** com degradê mais profundo, brilho radial no canto, fio claro em
  cima e as duas caixinhas de entradas/saídas em vidro.
- **Seletor de mês** virou uma pílula de vidro centralizada, com as setas dentro dela.
- **Registros**: o filtro de tipo virou um controle segmentado (Tudo / Entradas / Saídas)
  e a busca ficou mais discreta — a tela respira melhor.
- **Resumo**: legenda com o ícone de cada categoria no tom dela, linhas separadas por
  fio claro e barras com uma "barrinha" mínima nos meses sem gasto (antes o mês vazio
  desaparecia e parecia erro).
- **Animações** mais suaves: entrada em cascata por item, folhas com curva de
  desaceleração longa, brilho pulsando devagar na rosquinha e um coração que bate de
  leve na assinatura.
- **Sem pulinho lateral entre as telas:** a página fica sempre 1px mais alta que a tela,
  então a barra de rolagem nunca "aparece e some" ao trocar pra uma aba que cabe inteira
  (o Câmbio, um mês sem registros). Antes isso mudava a largura útil e o conteúdo dava
  uma travadinha pro lado.
- **Fundo: topo chapado, rodapé com brilho (e o motivo):** no iPhone o Safari **não deixa
  a página desenhar atrás das barras dele** (status bar em cima, barra flutuante embaixo):
  ele recorta o viewport e pinta essa faixa com **uma cor chapada**, tirada do fundo da
  página. Qualquer degradê *na borda* vira um degrau reto ali — o lilás começa dentro da
  página e a barra fica na cor do fundo. Por isso o **topo é chapado** (`--bg`) e o brilho
  do rodapé (`.deco::after`) **nasce com alpha zero na borda de baixo** e só sobe depois:
  tem degradê atrás da pílula, mas a cor da borda continua sendo exatamente a do fundo,
  então não há emenda. Os blobs lilás têm máscara de 56px nas pontas pelo mesmo motivo.
- **Dois vazamentos que viravam "linha reta" no rodapé:** o `box-shadow` da folha inferior
  fechada subia ~24px de offset + 64px de blur e vazava **pra dentro** do viewport (uma
  mancha lilás escura no fim da página, cortada na borda) — a folha agora fica 150px mais
  abaixo quando está fechada. E a pílula de navegação **perdeu a sombra pra fora** (ficou
  só o fio interno): era ela que descia pra baixo da barra e virava aquele degradê
  acinzentado. Ela também subiu pra 16px do rodapé, pra respirar longe da barra do Safari.
- **Estado vazio é tela de verdade:** quando não há nada cadastrado, cada aba ganha uma
  ilustração (moldura lilás + ícone no degradê, com halo que respira), título, uma
  explicação curta e **um botão que resolve** — "Anotar o primeiro" (abre a folha) ou
  "Limpar filtros" (quando o vazio é resultado de busca/filtro). O Resumo mostra a
  rosquinha como um **anel de pontinhos** e esconde o gráfico dos 6 meses (em vez de 6
  tracinhos de 2px que pareciam bug); em Início o bloco de categorias some quando o mês
  está vazio (e o "Ver todos" junto); em Registros o convite **centraliza** no espaço que
  sobra, em vez de ficar colado nos filtros com um buraco embaixo.
- Tudo isso respeita **prefers-reduced-motion**: quem tem "reduzir movimento" ligado no
  iPhone vê o app parado.

---

## 💜 O segredo dos 5 toques

Cinco toques rápidos (**até 1,1s entre um e outro**) **dentro do cartão roxo do saldo**
abrem a surpresa: um cartão com as duas fotos do casal, chuva de corações (24), confete
(34 tirinhas) e brilhos dourados estourando do meio, sobre um véu lilás desfocado. Toque
fora do cartão zera a contagem, então só conta sequência mesmo.

- **Entrada em cascata**, não tudo de uma vez: o véu abre com um zoom leve, um estouro de
  luz branca sai do centro e cada peça do cartão chega ~6% depois da anterior (badge →
  título → fotos → assinatura → botão), com a curva de mola do app. Corações e confete
  andam em curva (vão pra um lado e voltam), não em linha reta. As animações estão
  penduradas em `.love.is-on` (e não no elemento solto): sair e voltar a classe reinicia a
  cascata em toda abertura, sem depender do `display` mudar.
- **Roda mesmo com "Reduzir movimento" ligado:** o reset global de
  `prefers-reduced-motion` usa `!important` em `*`, então as animações da surpresa também
  são `!important` (e têm especificidade maior) — o resto do app continua parado pra quem
  liga essa opção, mas a celebração acontece (é curta, intencional e só com 5 toques).
- **É uma tela estática, como a de login:** `overflow:hidden` no overlay (nem scroll
  lateral, nem vertical, nem efeito elástico) e `height:100%` no palco, com o cartão
  centralizado. O que casa com a faixa em volta das barras do Safari é a **cor**
  (`--love-flat` no véu, no `background-color` do canvas via `html.is-love` e no
  `<meta name="theme-color">`, trocado no `open()` e restaurado no `close()`), não uma
  sobra pra fora da tela — então nada vaza pra trás da barra do Safari.
- Em tela baixa (abaixo de 700px de altura) o cartão **encolhe** um pouco (fotos, título e
  espaçamentos) pra caber inteiro sem pedir scroll.
- As fotos são `fotos/1.jpg` (a da esquerda) e `fotos/2.jpg` (a da direita, que fica na
  frente) — pra trocar, é só sobrescrever os arquivos com o mesmo nome. Enquanto não
  existirem, o cartão mostra um coração lilás no lugar, sem ícone de imagem quebrada.
- Fecha no botão, num toque fora do cartão ou no `Esc`. Tira o scroll do fundo enquanto
  está aberto.
- O texto está em `index.html` (`.love-title` / `.love-foot`) e a animação em
  `styles.css` (seção "SURPRESA"), caso queira mudar a frase ou a intensidade.

---

## 📁 Arquivos

```
index.html        estrutura do app
styles.css        visual, paleta e animações
app.js            toda a lógica (dados, gráficos, formulário)
sync.js           conta na nuvem (Supabase): login e cópia dos dados
manifest.json     ficha do PWA (nome, ícone, cor)
sw.js             service worker (funciona offline)
icons/            ícone do app (coração lilás) + favicon
supabase/
  schema.sql        tabela + RLS, pra rodar no SQL Editor
tools/            extras de manutenção (opcionais)
  make-icons.py     regenera os ícones PNG
  check.py          confere HTML x CSS x JS
  smoke.js          testa a lógica do app
  smoke-sync.js     testa a sincronização com a nuvem (sem rede)
  run-schema.js     roda o supabase/schema.sql pela Management API
                    (precisa de SUPABASE_ACCESS_TOKEN)
  e2e.js            teste ponta a ponta no Supabase de verdade
                    (node tools/e2e.js --clean apaga as contas de teste)
  shot.html         abre uma tela do app num iframe de 390px, pra tirar
                    print sem precisar do iPhone (?s=home|tx|in|fx,
                    &sheet=tx|set|cat|fix, &scroll=bottom, &cur=PYG)
```

## 🛠️ Comandos úteis (opcional)

```powershell
# subir o servidor de novo, se ele parar
python -m http.server 8765 --bind 0.0.0.0

# regenerar os ícones
python tools/make-icons.py

# rodar as verificações
python tools/check.py
node tools/smoke.js
```

---

Feito com carinho 💜
