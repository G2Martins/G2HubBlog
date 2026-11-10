# CLAUDE.md, G2 Hub (G2HubBlog)

> **Spec viva.** Porta de entrada lida pelo agente em toda sessão. Não duplica o [README.md](README.md), **aponta** pra ele. Atualize quando uma regra, comando, módulo ou hurdle mudar.
>
> **Última revisão:** 2026-11-10
> **Detalhes de features, rodar, dados e deploy:** [README.md](README.md)

---

## 1. O que é

Site editorial **estático** de games, filmes e séries ("G2 Hub"): notícias, reviews com nota da redação, guias, listas, calendário de lançamentos, busca e RSS. Peça de portfólio de **Gustavo Martins Gripaldi**, linkada em https://g2portfolio.grovicdata.com/projetos/g2hubblog. Ao vivo: https://g2martins.github.io/G2HubBlog/ (repo `G2Martins/G2HubBlog`; a pasta local se chama `angular-blog`). Os 22 textos são **de demonstração**, escritos para o projeto; fatos (datas, plataformas, estúdios, elenco, direção) vêm do TMDB/IGDB ou foram checados na web. Referência funcional: flowgames.gg (só features, nunca layout, logo, cores ou textos). A versão antiga (Angular 14) está na tag `v1-angular14`.

## 2. Stack + Comandos

Angular 21.2 standalone + zoneless + signals, SSG (`outputMode: "static"`), `provideClientHydration(withEventReplay())`, Tailwind v4 (`@tailwindcss/postcss`), Geist + Geist Mono (woff2 servidas de `fonts/`), TS ~5.9, Node 22.18+ (scripts `.ts` nativos). GitHub Pages em `main:/docs`, `baseHref` `/G2HubBlog/`.

```bash
npm start            # seo + ng serve --port 4420 (http://localhost:4420/G2HubBlog/)
npm run media        # TMDB + IGDB -> src/app/data/media.json (credenciais, ver §5); "-- --search game|movie|tv 'nome'" acha ids
npm run seo          # valida posts e gera *.gen.ts, articles/, sitemap, robots, rss.xml, search.json
npm run build        # seo + ng build (prerender de 72 rotas)
npm run check        # smoke pós-build: SEO por página, JSON-LD sem Review, feeds, dados renderizados, zero travessão longo
npm run build:pages  # build + check + copia para docs/ (.nojekyll, 404.html)
npm run og           # python scripts/og.py: OG 1200x630 + ícones PNG via Playwright
```

## 3. Mapa de módulos

| Caminho | Responsabilidade |
|---|---|
| `src/app/data/posts/*.ts` | **Conteúdo.** Um arquivo por artigo (`export const post: Post`), nome = slug. Blocos ricos: `p`, `h2`, `quote`, `img`, `list`, `box`, `ficha`, `entry`. Inline: `*itálico*`, `**negrito**`, `[texto](/artigo/slug)`. Refs de mídia: `"game:<id IGDB>"`, `"movie:<id TMDB>"`, `"tv:<id TMDB>"`. |
| `src/app/data/media.json` | Snapshot TMDB/IGDB (gerado por `npm run media`). Só os scripts leem; o navegador nunca baixa. |
| `src/app/data/site.ts` | Constantes (URLs, seções, tipos, autor/redação, `FEATURED`, `MOST_READ`). Sem imports (scripts leem direto). |
| `src/app/data/media.ts`, `types.ts` | Helpers puros (URLs de imagem, datas pt-BR, slug) e tipos. Só `import type`, então servem app e scripts. |
| `src/app/data/*.gen.ts`, `articles/` | **Gerados** pelo `seo.ts` (gitignored): índice sem corpo (`posts.gen`), calendário, loaders e um módulo por artigo com o corpo + só os registros de mídia que ele cita. |
| `src/app/data/blog.ts`, `view.ts` | Seletores sobre o índice (seções, tags, relacionados, anterior/próximo) e modelo de renderização do artigo (blocos, ficha técnica, TOC). |
| `src/app/pages/` | `home`, `article` (resolver carrega o chunk do artigo), `listing` (`/games`, `/filmes`, `/series`, `/reviews`, `/guias`, `/tag/:slug`, `/autor/:slug`), `search`, `releases` (`/lancamentos`), `not-found`. |
| `src/app/shared/` | `ui.ts` (card, nota em anel, selo ClassInd, renderer inline sem innerHTML), `seo.ts`, `icon.ts`, `reveal.ts`. |
| `src/app/app.*` | Shell: barra de aviso, header com busca (form GET funciona sem JS), nav rolável no mobile, footer com créditos. |
| `scripts/` | `fetch-media.ts`, `seo.ts`, `check.ts`, `pages.ts`, `og.py` + `og.html`. |
| `docs/` | Saída do build publicada. Nunca editar à mão. |

## 4. Regras SEMPRE-ATIVAS

- **Fatos só de fonte:** datas, plataformas, estúdios, elenco e direção vêm do `media.json` (TMDB/IGDB) ou de checagem na web. Na dúvida, não afirmar. Nada de citação inventada, número de vendas/bilheteria, rumor como fato ou nota de outro veículo.
- **Opinião é da casa:** reviews e rankings são da "Redação G2 Hub" (Gustavo como editor). Nota 0 a 10 é editorial; **sem `Review`/`AggregateRating` no JSON-LD** (o `check` trava).
- **Classificação indicativa:** sem ClassInd/certificação BR na fonte = `AD` ("a definir", selo "?"). Nunca cair em "L" por padrão; nunca converter PEGI/ESRB.
- **Conteúdo novo:** criar `posts/<slug>.ts`, rodar `npm run media` (busca as refs novas) e `npm run seo` (valida dek 70 a 170, links internos, refs, travessão). Textos em PT-BR natural, 300 a 1200 palavras.
- **SSG:** toda rota real é pré-renderizada. APIs do browser só em `afterNextRender`, eventos ou fora do SSR. Estado do navegador (query da busca, filtro do calendário) entra **depois** da hidratação.
- **Performance:** imagens com `width`/`height` (aspect-ratio), `loading="lazy"` abaixo da dobra, `fetchpriority="high"` só no hero. Corpo dos artigos e mídia só no chunk do artigo; listagens usam o índice sem corpo.
- **Animação só `transform`/`opacity`**, com `prefers-reduced-motion`. Conteúdo visível sem JS (gate `.js` no `styles.css`). Nada animado no elemento de LCP.
- **Design Valerium:** Geist + Geist Mono, eyebrow mono, card "well", ticks, dot grid, out-expo. Cores só pelos tokens de `:root` (preto violeta + o violeta do blog antigo `#6b07bd`; matizes de seção só em pontos). Exceções documentadas: cores oficiais da ClassInd e o verde/vermelho de acertos/tropeços.
- **Zero travessão longo (U+2014, em dash)** em qualquer texto; `seo.ts` e `check` travam.
- **Sem coleta de dados:** nada de newsletter, e-mail ou formulário que envie dado. Compartilhar = links simples, sem scripts de terceiros.
- **Créditos em toda página:** aviso de portfólio, frase do TMDB, "Dados de jogos fornecidos por IGDB.com", "Desenvolvido por Gustavo Martins Gripaldi", GitHub, nota de textos de demonstração.
- **`npm run build:pages` verde** antes de publicar. **`docs/` é build.**

## 5. Segurança

- Credenciais só em `.env` (gitignored; `.env.example` versionado). `fetch-media.ts` carrega `.env` do repo e, se faltar, `../Starplex/.env` (TMDB_TOKEN) e `../G2Store/.env` (TWITCH_*), via `process.loadEnvFile`. Nunca logar token; em erro, só o status HTTP. Shell não lê `.env` (hook bloqueia).
- O site publicado não usa token: tudo vem pronto no build.
- Texto (posts e dados externos) só por interpolação do Angular; o renderer inline monta `<em>/<strong>/<a>` por template, nunca `innerHTML`. JSON-LD escapa `<`.
- Links externos com `rel="noopener"`. Busca roda no cliente sobre `search.json` estático.

## 6. Common Hurdles

- **Node 22 `cpSync` sai com 127 em silêncio** no caminho com "Programação": `scripts/pages.ts` usa `cp` de `fs/promises`.
- **EBUSY** ao recriar `docs/` se um shell ou servidor estiver com cwd dentro dela.
- **Python com caminho não-ASCII via argumento** chega corrompido: rodar `og.py`/Playwright de dentro do repo com caminhos relativos.
- **Kaspersky injeta script** no `chrome.exe` completo e derruba Best Practices/gzip no Lighthouse local. Usar o `chrome-headless-shell` do Playwright com `--remote-debugging-port` + `lighthouse --port` (+ `--blocked-url-patterns="*kaspersky-labs.com*"`). Servidor local precisa de gzip e de `/robots.txt` na raiz para números realistas.
- **Print de página inteira mostra vazio** abaixo da dobra (`content-visibility: auto` nas seções): rolar e tirar print da viewport.
- **Resolver, não efeito, para o corpo do artigo:** em zoneless, uma promise solta não segura o prerender; o resolver da rota sim (e a hidratação recebe o mesmo DOM).
- **Índice de posts no bundle inicial:** importar `posts.gen` nas rotas puxa o índice para o chunk inicial; por isso os loaders ficam em `loaders.gen.ts` separado.
- **IGDB:** `game_type` (não `category`), datas com `date_format.format`; ano sozinho vem como 31/12 e é guardado só como ano. Sem `CLASS_IND` = `AD`.
- **TMDB:** elenco em outra escrita troca pelo alias latino de `/person/{id}` ou sai; `/tv/on_the_air` é ruidoso (talk shows, novelas), por isso o calendário usa `discover/tv` sem gêneros 10763/10764/10766/10767.
- **Ferramentas do agente decodificam `\uXXXX`:** escapes unicode digitados em código viram o caractere real. Conferir com `cat -A` e preferir `String.fromCharCode`.
- **Links internos sempre com barra no fim** (`/artigo/x/`): o GitHub Pages responde `/x` com 301. O `TrailingSlashSerializer` (`src/app/shared/trailing-slash.ts`, registrado em `app.config.ts`) cuida disso no router.
