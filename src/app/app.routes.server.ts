import { RenderMode, ServerRoute } from '@angular/ssr';
import { POSTS, TAGS } from './data/posts.gen';
import { AUTHORS } from './data/site';

// Every real page is prerendered to static HTML (GitHub Pages, no server). Unknown URLs fall to the
// client app through 404.html (scripts/pages.ts), which renders the not-found page.
const prerender = (path: string): ServerRoute => ({ path, renderMode: RenderMode.Prerender });

export const serverRoutes: ServerRoute[] = [
  ...['', 'games', 'filmes', 'series', 'reviews', 'guias', 'busca', 'lancamentos'].map(prerender),
  { path: 'artigo/:slug', renderMode: RenderMode.Prerender, getPrerenderParams: async () => POSTS.map((p) => ({ slug: p.slug })) },
  { path: 'tag/:slug', renderMode: RenderMode.Prerender, getPrerenderParams: async () => TAGS.map((t) => ({ slug: t.slug })) },
  { path: 'autor/:slug', renderMode: RenderMode.Prerender, getPrerenderParams: async () => AUTHORS.map((a) => ({ slug: a.slug })) },
  { path: '**', renderMode: RenderMode.Client },
];
