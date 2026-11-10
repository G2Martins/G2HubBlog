# G2 Hub

Site editorial de **games, filmes e séries**, feito como peça de portfólio por [Gustavo Martins Gripaldi](https://g2portfolio.grovicdata.com).
Notícias, reviews com nota da redação, guias, listas, calendário de lançamentos, busca e feed RSS, tudo estático no GitHub Pages.

**Ao vivo:** https://g2martins.github.io/G2HubBlog/ · **No portfólio:** https://g2portfolio.grovicdata.com/projetos/g2hubblog

> Os textos são de demonstração, escritos para este projeto de portfólio. Datas, plataformas, estúdios, elencos e direção vêm do TMDB e do IGDB (ou foram checados na web); reviews e rankings são opinião da "Redação G2 Hub".

## O que tem

- **Home de jornal:** nameplate "G2 HUB" (releitura do título com borda do blog original), destaque principal, "Em alta", faixa **Lançamentos da semana**, Últimas, seções Games / Filmes / Séries, Reviews com nota em anel, Guias e listas e **Mais lidas** (ranking editorial estático).
- **22 artigos originais em PT-BR** (318 a 1188 palavras): notícias e explicadores de lançamentos de novembro de 2026, seis reviews, listas e guias.
- **Página do artigo** (`/artigo/:slug`): hero, seção, tipo, redação/edição, data, tempo de leitura, índice para textos longos, blocos ricos (parágrafo, intertítulo, citação editorial, imagem com legenda, lista, caixa de nota, itens numerados com capa e **ficha técnica** gerada dos dados), veredito com acertos e tropeços nas reviews, tags, compartilhamento por links simples, caixa da redação, anterior/próximo e relacionados.
- **Listagens:** `/games`, `/filmes`, `/series`, `/reviews`, `/guias`, `/tag/:slug` (41 tags) e `/autor/redacao-g2-hub`.
- **Busca no cliente** (`/busca`) sobre um índice pré-gerado (`search.json`), carregado só nessa página. O formulário funciona sem JS.
- **Calendário `/lancamentos`:** estreias nos cinemas do Brasil e temporadas novas (TMDB) e jogos com dia exato (IGDB), com filtro por tipo e link para a matéria quando existe.
- **SEO:** todas as 72 rotas pré-renderizadas; title, description e canonical por página; Open Graph com a imagem de cada artigo; JSON-LD `WebSite`, `Organization`, `NewsArticle`/`Article` (autor e publisher), `BreadcrumbList` e `CollectionPage`, **sem** `Review`/`AggregateRating`; `sitemap.xml`, `robots.txt` e `rss.xml` gerados no build.
- **Acessibilidade e performance:** HTML semântico, link "pular para o conteúdo", foco visível, `prefers-reduced-motion`, conteúdo visível sem JS, imagens com proporção reservada, lazy abaixo da dobra e `fetchpriority` no hero. Cada artigo carrega só o próprio corpo e os dados que cita. Lighthouse mobile local: performance 93 a 98, acessibilidade, boas práticas e SEO 100.

## Stack

Angular 21 (standalone, zoneless, signals) com SSG (`outputMode: "static"`) e hidratação com event replay · Tailwind CSS v4 · TypeScript 5.9 · Geist e Geist Mono · scripts em Node 22 com TypeScript nativo · Playwright (Python) para a imagem social. Linguagem visual baseada no design system Valerium da Grovic Data, com o violeta do G2 Hub Blog original.

## Rodar

```bash
npm install
npm start            # http://localhost:4420/G2HubBlog/
npm run build:pages  # build + checagem + publica em docs/
```

## Dados (TMDB + IGDB)

`npm run media` lê as credenciais de `.env` (modelo em `.env.example`: `TMDB_TOKEN`, `TWITCH_CLIENT_ID`, `TWITCH_CLIENT_SECRET`) e grava `src/app/data/media.json` com:

- todo jogo, filme ou série citado nos artigos (refs `"game:<id>"`, `"movie:<id>"`, `"tv:<id>"`), com capa/pôster, imagens 16:9, gêneros, estúdios, datas por plataforma, direção, roteiro, elenco com personagem e classificação indicativa do Brasil (ou "a definir");
- o calendário: filmes em `upcoming` (região BR), jogos com data exata e hype no IGDB nos próximos 120 dias, estreias de temporada via `discover/tv`.

Para achar ids: `npm run media -- --search game "zelda|fable"` (também `movie` e `tv`). Imagens são servidas direto de `image.tmdb.org` e `images.igdb.com` com `srcset`.

## Escrever um artigo

1. Crie `src/app/data/posts/<slug>.ts` exportando `post` (veja os existentes; tipos em `src/app/data/types.ts`).
2. `npm run media` para buscar as refs novas e `npm run seo` para validar (dek de 70 a 170 caracteres, links internos, refs existentes, nenhum travessão longo).
3. `npm run build:pages`.

## Estrutura

```
src/app/data/posts/   conteúdo (um arquivo por artigo)
src/app/data/         media.json (TMDB/IGDB), site.ts (constantes), media.ts/types.ts (helpers), blog.ts/view.ts (seletores e renderização)
src/app/pages/        home, article, listing, search, releases, not-found
src/app/shared/       card, nota, selo ClassInd, inline, SEO, ícones, reveal
scripts/              fetch-media.ts, seo.ts, check.ts, pages.ts, og.py
docs/                 saída do build (GitHub Pages), não editar à mão
```

## Deploy

GitHub Pages servindo `main:/docs` com base `/G2HubBlog/`. `npm run build:pages` gera o build, roda `npm run check` (uma `<h1>`, canonical, description, og:image, créditos e JSON-LD em cada página, JSON-LD sem Review, RSS e índice de busca completos, dados renderizados, nenhum travessão longo) e copia para `docs/` com `.nojekyll` e `404.html`.

## Avisos

Este produto usa a API do TMDB, mas não é endossado ou certificado pelo TMDB. Dados de jogos fornecidos por [IGDB.com](https://www.igdb.com). Imagens de divulgação via TMDB e IGDB; marcas pertencem aos respectivos donos. G2 Hub é um projeto de portfólio sem afiliação com estúdios, distribuidoras ou plataformas.
