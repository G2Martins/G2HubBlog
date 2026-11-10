// Post-build smoke check (npm run check, also part of build:pages). Exits 1 on any failure.
// SEO essentials per prerendered page, structured data rules, data rendering, feeds, and no em dash anywhere.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { SITE_URL } from '../src/app/data/site.ts';

const root = new URL('../dist/g2-hub/browser/', import.meta.url);
const file = (p: string) => new URL(p.replace(/^\//, ''), root);
const fails: string[] = [];
const must = (ok: unknown, msg: string) => ok || fails.push(msg);

const sitemap = readFileSync(file('sitemap.xml'), 'utf8');
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(SITE_URL, ''));
const posts = urls.filter((u) => u.startsWith('/artigo/'));
must(posts.length >= 18 && posts.length <= 24, `expected 18 to 24 articles, sitemap has ${posts.length}`);

const html = (u: string) => readFileSync(file(`${u}index.html`), 'utf8');
for (const u of [...urls, '/busca/']) {
  if (!existsSync(file(`${u}index.html`))) { fails.push(`not prerendered: ${u}`); continue; }
  const h = html(u);
  must((h.match(/<h1[\s>]/g) ?? []).length === 1, `${u}: expected exactly one <h1>`);
  must(h.includes(`<link rel="canonical" href="${SITE_URL}${u}">`), `${u}: canonical mismatch`);
  must(/<meta name="description" content="[^"]{70,}/.test(h), `${u}: description missing/short`);
  must(/<meta property="og:image" content="https:\/\/[^"]+"/.test(h), `${u}: og:image missing`);
  must(h.includes('Projeto de portfólio de Gustavo Martins Gripaldi. Conteúdo de demonstração.'), `${u}: disclaimer missing`);
  must(h.includes('Este produto usa a API do TMDB, mas não é endossado ou certificado pelo TMDB.'), `${u}: TMDB attribution missing`);
  must(h.includes('Dados de jogos fornecidos por IGDB.com'), `${u}: IGDB attribution missing`);
  must(h.includes('Textos de demonstração escritos para este projeto de portfólio.'), `${u}: demo-text note missing`);
  // Images reserve their box (no layout shift).
  for (const [tag] of h.matchAll(/<img\b[^>]*>/g)) must(/\swidth="\d+"/.test(tag) && /\sheight="\d+"/.test(tag), `${u}: img without width/height`);
  const ld = h.match(/<script id="ld-json" type="application\/ld\+json">(.*?)<\/script>/s)?.[1];
  try {
    const graph = JSON.parse(ld ?? '')['@graph'] as { '@type': string; author?: unknown; publisher?: unknown }[];
    const types = graph.map((n) => n['@type']);
    must(types.includes('WebSite'), `${u}: WebSite JSON-LD missing`);
    // Scores are editorial opinion: no Review / AggregateRating markup, ever.
    must(!/"@type":"(Review|AggregateRating|Rating)"/.test(ld ?? ''), `${u}: Review/Rating markup found`);
    if (u.startsWith('/artigo/')) {
      const art = graph.find((n) => n['@type'] === 'NewsArticle' || n['@type'] === 'Article');
      must(art?.author && art?.publisher, `${u}: Article JSON-LD missing or without author/publisher`);
      must(types.includes('BreadcrumbList'), `${u}: BreadcrumbList missing`);
      must(/<img[^>]*fetchpriority="high"/.test(h), `${u}: hero image without fetchpriority`);
      must(/<meta property="og:type" content="article"/.test(h), `${u}: og:type article missing`);
    }
  } catch { fails.push(`${u}: invalid JSON-LD`); }
}
must(html('/busca/').includes('content="noindex'), '/busca/ should be noindex');

// Data really renders: facts from IGDB/TMDB on known pages, and a missing BR rating stays "a definir".
const gta = html('/artigo/gta-vi-lancamento-19-de-novembro/');
must(gta.includes('Rockstar North') && gta.includes('19 de novembro de 2026'), 'GTA VI ficha missing IGDB facts');
must(html('/artigo/guia-por-onde-comecar-em-zelda/').includes('Classificação indicativa a definir'), 'Zelda movie rating should be "a definir"');
must(/Lançamentos da semana/.test(html('/')), 'home week strip missing');
must((html('/lancamentos/').match(/<li class="stretch/g) ?? []).length >= 20, '/lancamentos/ has too few entries');

// Feeds.
const rss = readFileSync(file('rss.xml'), 'utf8');
must(rss.startsWith('<?xml') && (rss.match(/<item>/g) ?? []).length === posts.length, 'rss.xml item count mismatch');
const index = JSON.parse(readFileSync(file('search.json'), 'utf8')) as unknown[];
must(index.length === posts.length, 'search.json entry count mismatch');

// No em dash in anything a visitor can read.
const walk = (dir: URL): URL[] => readdirSync(dir).flatMap((n) => {
  const p = new URL(n, dir);
  return statSync(p).isDirectory() ? walk(new URL(`${n}/`, dir)) : [p];
});
for (const f of walk(root).filter((f) => /\.(html|js|json|txt|xml|webmanifest)$/.test(f.pathname) && !f.pathname.endsWith('3rdpartylicenses.txt'))) {
  must(!readFileSync(f, 'utf8').includes(String.fromCharCode(0x2014)), `em dash in ${decodeURIComponent(f.pathname).split('/browser/')[1]}`);
}
for (const f of ['robots.txt', 'sitemap.xml', 'rss.xml', 'search.json', 'site.webmanifest', 'favicon.svg', 'favicon-32.png', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png', 'og/g2hub.png', 'index.csr.html', 'fonts/geist-latin-wght-normal.woff2'])
  must(existsSync(file(f)), `missing /${f}`);

if (fails.length) { console.error(`check: ${fails.length} problem(s)\n- ` + [...new Set(fails)].join('\n- ')); process.exit(1); }
console.log(`check: ${urls.length} urls + /busca/ OK (${posts.length} artigos), JSON-LD sem Review, rss + search ok, no em dash`);
