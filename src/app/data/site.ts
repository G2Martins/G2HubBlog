// Site constants. No imports: scripts/*.ts read this file directly with Node type stripping.
export const SITE_URL = 'https://g2martins.github.io/G2HubBlog';
export const SITE_NAME = 'G2 Hub';
export const SITE_TAGLINE = 'Games, filmes e séries';
export const AUTHOR = 'Gustavo Martins Gripaldi';
// Trailing slashes: the portfolio is on GitHub Pages, where /path answers with a 301 to /path/.
export const PORTFOLIO_URL = 'https://g2portfolio.grovicdata.com/';
export const PROJECT_URL = 'https://g2portfolio.grovicdata.com/projetos/g2hubblog/';
export const REPO_URL = 'https://github.com/G2Martins/G2HubBlog';
export const OG_IMAGE = '/og/g2hub.png';
export const NEWSROOM = 'Redação G2 Hub';

export const SECTIONS = {
  games: { label: 'Games', path: '/games/', blurb: 'Lançamentos, reviews e guias de jogos para PC, PlayStation, Xbox e Nintendo.' },
  filmes: { label: 'Filmes', path: '/filmes/', blurb: 'Estreias nos cinemas brasileiros, adaptações de games e críticas.' },
  series: { label: 'Séries', path: '/series/', blurb: 'Temporadas novas, maratonas e as adaptações de games na TV.' },
} as const;

export const KINDS = {
  noticia: 'Notícia',
  review: 'Review',
  guia: 'Guia',
  lista: 'Lista',
  opiniao: 'Opinião',
} as const;

export const AUTHORS = [
  {
    slug: 'redacao-g2-hub',
    name: NEWSROOM,
    role: 'Equipe editorial',
    bio: 'A redação do G2 Hub escreve sobre games, filmes e séries com foco no que chega ao Brasil. Datas, plataformas, elencos e estúdios vêm do TMDB e do IGDB; reviews e listas são a opinião da casa.',
    editor: AUTHOR,
    editorUrl: PORTFOLIO_URL,
  },
] as const;

// ponytail: static ranking on purpose. There is no analytics on a portfolio demo, so "Mais lidas" is curated.
export const MOST_READ = [
  'gta-vi-lancamento-19-de-novembro',
  'guia-por-onde-comecar-em-zelda',
  '10-jogos-de-terror-para-jogar-em-2026',
  'review-arcane-a-melhor-adaptacao-de-game',
  'adaptacoes-de-games-no-cinema-2026',
];

export const FEATURED = 'gta-vi-lancamento-19-de-novembro';
