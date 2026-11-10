import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { inSection, ofKind, POSTS, TAGS, tagName, withTag } from '../data/blog';
import { AUTHORS, SECTIONS, SITE_NAME } from '../data/site';
import type { Kind, PostMeta, Section } from '../data/types';
import { abs, Seo } from '../shared/seo';
import { Card } from '../shared/ui';

interface Page {
  eyebrow: string;
  title: string;
  blurb: string;
  path: string;
  seoTitle: string;
  description: string;
  posts: PostMeta[];
  dot?: Section;
  editor?: { name: string; url: string };
}

/** One component for /games, /filmes, /series, /reviews, /guias, /tag/:slug and /autor/:slug. */
@Component({
  selector: 'app-listing',
  imports: [RouterLink, Card],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (page(); as pg) {
      <section class="wrap pt-10 sm:pt-14">
        <p class="eyebrow" [class]="pg.dot ? 'sec-' + pg.dot : ''">{{ pg.eyebrow }}</p>
        <h1 class="hl-xl mt-4 text-[44px] sm:text-[64px]">{{ pg.title }}</h1>
        <p class="dek mt-4 max-w-2xl text-[17px] leading-relaxed">{{ pg.blurb }}</p>
        @if (pg.editor) {
          <p class="meta mt-3">Edição: <a [href]="pg.editor.url" class="text-ink-2 underline underline-offset-2 hover:text-ink">{{ pg.editor.name }}</a></p>
        }
        <p class="meta mt-6 border-b border-line pb-4">{{ pg.posts.length }} {{ pg.posts.length === 1 ? 'texto' : 'textos' }}</p>
      </section>

      <section class="wrap mt-10" aria-label="Textos">
        @if (pg.posts[0]; as first) {
          <app-card class="block max-w-4xl" [p]="first" [big]="true" [level]="2" [eager]="true" />
        }
        <div class="mt-14 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          @for (p of pg.posts.slice(1); track p.slug) { <app-card [p]="p" [level]="2" /> }
        </div>
      </section>

      <section class="wrap mt-20" aria-labelledby="tags">
        <h2 id="tags" class="eyebrow">Explore por tag</h2>
        <ul class="mt-4 flex flex-wrap gap-2">
          @for (t of tags; track t.slug) { <li><a class="chip" [routerLink]="['/tag', t.slug]">#{{ t.name }} <span class="text-dim">{{ t.count }}</span></a></li> }
        </ul>
      </section>
    } @else {
      <section class="wrap py-24 text-center">
        <p class="eyebrow">Erro 404</p>
        <h1 class="hl-xl mt-4 text-[40px]">Página não encontrada</h1>
        <a routerLink="/" class="btn btn-violet mt-8">Ir para a capa</a>
      </section>
    }
  `,
})
export class Listing {
  section = input<Section>();
  kind = input<Kind>();
  mode = input<'tag' | 'author'>();
  slug = input('');
  protected readonly tags = TAGS;

  protected page = computed((): Page | null => {
    const s = this.section();
    if (s) {
      const sec = SECTIONS[s];
      return {
        eyebrow: 'Seção', title: sec.label, blurb: sec.blurb, path: sec.path, dot: s, posts: inSection(s),
        seoTitle: `${sec.label}: notícias, reviews e guias | ${SITE_NAME}`,
        description: `${sec.blurb} Textos da redação do G2 Hub, com datas e fichas do TMDB e do IGDB.`,
      };
    }
    if (this.kind() === 'review') {
      return {
        eyebrow: 'Nota da redação', title: 'Reviews', path: '/reviews/', posts: ofKind('review'),
        blurb: 'Análises de jogos, filmes e séries com nota de 0 a 10. É a opinião da casa, sem médias de outros veículos.',
        seoTitle: `Reviews de games, filmes e séries | ${SITE_NAME}`,
        description: 'Reviews do G2 Hub: análises de jogos, filmes e séries com nota da redação de 0 a 10, acertos, tropeços e veredito.',
      };
    }
    if (this.kind() === 'guia') {
      return {
        eyebrow: 'Para começar bem', title: 'Guias e listas', path: '/guias/', posts: ofKind('guia'),
        blurb: 'Por onde começar, o que jogar, o que assistir: guias e listas para decidir rápido e não perder nada.',
        seoTitle: `Guias e listas de games, filmes e séries | ${SITE_NAME}`,
        description: 'Guias e listas do G2 Hub: por onde começar em séries de jogos, o que maratonar, agenda de lançamentos e rankings da redação.',
      };
    }
    if (this.mode() === 'tag') {
      const name = tagName(this.slug());
      if (!name) return null;
      return {
        eyebrow: 'Tag', title: `#${name}`, path: `/tag/${this.slug()}/`, posts: withTag(this.slug()),
        blurb: `Tudo o que o G2 Hub publicou sobre ${name}.`,
        seoTitle: `${name}: notícias, reviews e guias | ${SITE_NAME}`,
        description: `Todos os textos do G2 Hub com a tag ${name}: notícias, reviews, guias e listas de games, filmes e séries.`,
      };
    }
    if (this.mode() === 'author') {
      const a = AUTHORS.find((x) => x.slug === this.slug());
      if (!a) return null;
      return {
        eyebrow: a.role, title: a.name, path: `/autor/${a.slug}/`, posts: POSTS, blurb: a.bio, editor: { name: a.editor, url: a.editorUrl },
        seoTitle: `${a.name}: todos os textos | ${SITE_NAME}`,
        description: `${a.bio.slice(0, 150)}`,
      };
    }
    return null;
  });

  constructor() {
    const seo = inject(Seo);
    effect(() => {
      const pg = this.page();
      if (!pg) {
        seo.set({ title: `Página não encontrada | ${SITE_NAME}`, description: 'Esta página não existe no G2 Hub. Volte para a capa para ver notícias, reviews e guias.', path: '/404/', noindex: true });
        return;
      }
      seo.set({
        title: pg.seoTitle,
        description: pg.description,
        path: pg.path,
        crumbs: [[pg.title, pg.path]],
        jsonLd: [{
          '@type': 'CollectionPage',
          name: pg.title,
          url: abs(pg.path),
          inLanguage: 'pt-BR',
          mainEntity: { '@type': 'ItemList', itemListElement: pg.posts.map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: abs(`/artigo/${p.slug}/`) })) },
        }],
      });
    });
  }
}
