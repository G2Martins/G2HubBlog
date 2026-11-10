import { ResolveFn, Routes } from '@angular/router';
import { LOAD, type Loaded } from './data/loaders.gen';

const listing = () => import('./pages/listing').then((m) => m.Listing);
// Router waits for the resolver, so prerender and hydration both see the full body (no flash, no mismatch).
const article: ResolveFn<Loaded | null> = (route) => LOAD[route.paramMap.get('slug') ?? '']?.() ?? null;

export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/home').then((m) => m.Home) },
  { path: 'artigo/:slug', loadComponent: () => import('./pages/article').then((m) => m.Article), resolve: { article } },
  { path: 'games', loadComponent: listing, data: { section: 'games' } },
  { path: 'filmes', loadComponent: listing, data: { section: 'filmes' } },
  { path: 'series', loadComponent: listing, data: { section: 'series' } },
  { path: 'reviews', loadComponent: listing, data: { kind: 'review' } },
  { path: 'guias', loadComponent: listing, data: { kind: 'guia' } },
  { path: 'tag/:slug', loadComponent: listing, data: { mode: 'tag' } },
  { path: 'autor/:slug', loadComponent: listing, data: { mode: 'author' } },
  { path: 'busca', loadComponent: () => import('./pages/search').then((m) => m.Search) },
  { path: 'lancamentos', loadComponent: () => import('./pages/releases').then((m) => m.Releases) },
  { path: '**', loadComponent: () => import('./pages/not-found').then((m) => m.NotFound) },
];
