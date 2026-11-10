import { ChangeDetectionStrategy, Component, DOCUMENT, afterNextRender, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { findPost, TAGS } from '../data/blog';
import { SITE_NAME } from '../data/site';
import type { PostMeta } from '../data/types';
import { Seo } from '../shared/seo';
import { Card } from '../shared/ui';

type Entry = { s: string; t: string; x: string };
const norm = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

/** Client-side search over public/search.json (built by scripts/seo.ts). The index loads only on this page. */
@Component({
  selector: 'app-search',
  imports: [RouterLink, Card],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="wrap max-w-4xl pt-10 sm:pt-14">
      <p class="eyebrow">Busca</p>
      <h1 class="hl-xl mt-4 text-[44px] sm:text-[60px]">O que você procura?</h1>
      <form class="mt-8 flex gap-2" role="search" action="busca/" method="get" (submit)="submit($event)">
        <label for="q-page" class="sr-only">Termo de busca</label>
        <input id="q-page" name="q" type="search" class="field" placeholder="Ex.: Zelda, terror, Netflix" autocomplete="off"
               [value]="q()" (input)="type($any($event.target).value)">
        <button type="submit" class="btn btn-violet">Buscar</button>
      </form>
      <p class="meta mt-4" aria-live="polite">
        @if (q().trim().length >= 2) {
          @if (index()) { {{ results().length }} {{ results().length === 1 ? 'resultado' : 'resultados' }} para “{{ q().trim() }}” } @else { Carregando índice... }
        } @else { Digite pelo menos 2 letras. A busca cobre títulos, textos, tags e nomes de jogos, filmes e séries. }
      </p>
    </section>

    <section class="wrap mt-10 max-w-4xl" aria-label="Resultados">
      @if (results().length) {
        <ul class="divide-y divide-line border-y border-line">
          @for (p of results(); track p.slug) { <li class="py-6"><app-card [p]="p" variant="row" [level]="2" [dek]="true" /></li> }
        </ul>
      } @else if (q().trim().length >= 2 && index()) {
        <p class="text-[15px] text-ink-2">Nada encontrado. Tente outro termo ou navegue pelas tags abaixo.</p>
      }
      <h2 class="eyebrow mt-14">Tags populares</h2>
      <ul class="mt-4 flex flex-wrap gap-2">
        @for (t of tags; track t.slug) { <li><a class="chip" [routerLink]="['/tag', t.slug]">#{{ t.name }}</a></li> }
      </ul>
    </section>
  `,
})
export class Search {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private doc = inject(DOCUMENT);
  protected readonly tags = TAGS.slice(0, 16);
  protected q = signal('');
  protected index = signal<Entry[] | null>(null);

  protected results = computed<PostMeta[]>(() => {
    const idx = this.index();
    const terms = norm(this.q()).split(/\s+/).filter((t) => t.length >= 2);
    if (!idx || !terms.length) return [];
    return idx
      .filter((e) => terms.every((t) => e.t.includes(t) || e.x.includes(t)))
      .map((e) => ({ e, score: terms.filter((t) => e.t.includes(t)).length }))
      .sort((a, b) => b.score - a.score)
      .map(({ e }) => findPost(e.s))
      .filter((p): p is PostMeta => !!p);
  });

  constructor() {
    inject(Seo).set({
      title: `Busca | ${SITE_NAME}`,
      description: 'Busque notícias, reviews, guias e listas do G2 Hub por título, tag ou nome de jogo, filme e série.',
      path: '/busca/',
      noindex: true,
    });
    // Query and index only exist in the browser, after hydration (the prerendered page is the empty state).
    afterNextRender(() => {
      this.route.queryParamMap.subscribe((m) => {
        const q = m.get('q') ?? '';
        if (q !== this.q()) this.q.set(q);
        if (q) this.load();
      });
    });
  }

  private async load() {
    if (this.index()) return;
    try {
      const res = await fetch(new URL('search.json', this.doc.baseURI));
      this.index.set(res.ok ? ((await res.json()) as Entry[]) : []);
    } catch {
      this.index.set([]);
    }
  }

  protected type(v: string) {
    this.q.set(v);
    this.load();
    this.router.navigate([], { queryParams: v.trim() ? { q: v.trim() } : {}, replaceUrl: true });
  }

  protected submit(e: Event) {
    e.preventDefault();
    this.type(this.q());
  }
}
