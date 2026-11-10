import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { findPost, kindLabel, neighbors, related, sectionLabel, tagSlug } from '../data/blog';
import { fmtDate } from '../data/media';
import { AUTHOR, AUTHORS, NEWSROOM, PORTFOLIO_URL, SECTIONS, SITE_NAME, SITE_URL } from '../data/site';
import type { Loaded } from '../data/loaders.gen';
import type { Post } from '../data/types';
import { view } from '../data/view';
import { Icon } from '../shared/icon';
import { abs, Seo } from '../shared/seo';
import { Card, Cert, Inline, Score } from '../shared/ui';

@Component({
  selector: 'app-article',
  imports: [RouterLink, Card, Cert, Inline, Score, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './article.html',
})
export class Article {
  /** Resolved by the route (app.routes.ts): body + its media records; null for an unknown slug. */
  article = input<Loaded | null>(null);
  slug = input('');
  protected post = computed(() => this.article()?.post ?? null);

  protected meta = computed(() => (this.post() ? findPost(this.post()!.slug) ?? null : null));
  protected v = computed(() => (this.article() ? view(this.article()!.post, this.article()!.media) : { blocks: [], toc: [] }));
  protected related = computed(() => (this.meta() ? related(this.meta()!) : []));
  protected nav = computed(() => neighbors(this.post()?.slug ?? ''));
  protected date = computed(() => fmtDate(this.post()?.date));
  protected url = computed(() => `${SITE_URL}/artigo/${this.post()?.slug}/`);
  protected share = computed(() => {
    const u = encodeURIComponent(this.url());
    const t = encodeURIComponent(this.post()?.title ?? '');
    return [
      { label: 'WhatsApp', href: `https://wa.me/?text=${t}%20${u}` },
      { label: 'X', href: `https://twitter.com/intent/tweet?text=${t}&url=${u}` },
      { label: 'Telegram', href: `https://t.me/share/url?url=${u}&text=${t}` },
      { label: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${u}` },
      { label: 'LinkedIn', href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}` },
    ];
  });
  protected copied = signal(false);
  protected readonly author = AUTHORS[0];
  protected updated = computed(() => fmtDate(this.article()?.media.updatedAt));
  protected readonly label = { section: sectionLabel, kind: kindLabel, tag: tagSlug, path: (s: Post['section']) => SECTIONS[s].path };
  protected readonly scoreLabel = (n: number) => String(n).replace('.', ',');

  constructor() {
    const seo = inject(Seo);
    effect(() => {
      const p = this.post();
      const m = this.meta();
      if (!p || !m) {
        seo.set({ title: `Artigo não encontrado | ${SITE_NAME}`, description: 'Este artigo não existe ou mudou de endereço. Veja as últimas notícias, reviews e guias do G2 Hub.', path: `/artigo/${this.slug()}/`, noindex: true });
        return;
      }
      const path = `/artigo/${p.slug}/`;
      const section = sectionLabel(p.section);
      seo.set({
        title: `${p.title} | ${SITE_NAME}`,
        description: p.dek,
        path,
        image: m.image.src,
        imageAlt: p.hero.alt,
        article: { published: p.date, section, tags: p.tags },
        crumbs: [[section, SECTIONS[p.section].path], [p.title, path]],
        jsonLd: [{
          '@type': p.kind === 'noticia' ? 'NewsArticle' : 'Article',
          '@id': `${abs(path)}#article`,
          headline: p.title.length > 110 ? `${p.title.slice(0, 107)}...` : p.title,
          description: p.dek,
          image: [m.image.src],
          datePublished: `${p.date}T09:00:00-03:00`,
          dateModified: `${p.date}T09:00:00-03:00`,
          author: { '@type': 'Organization', name: NEWSROOM, url: `${SITE_URL}/autor/${AUTHORS[0].slug}/` },
          editor: { '@type': 'Person', '@id': `${PORTFOLIO_URL}#person`, name: AUTHOR, url: PORTFOLIO_URL },
          publisher: { '@id': `${SITE_URL}/#org` },
          mainEntityOfPage: abs(path),
          articleSection: section,
          keywords: p.tags.join(', '),
          wordCount: m.words,
          inLanguage: 'pt-BR',
          isAccessibleForFree: true,
        }],
      });
    });
  }

  protected async copy() {
    try {
      await navigator.clipboard.writeText(this.url());
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2400);
    } catch {
      /* clipboard blocked: the plain links still work */
    }
  }
}
