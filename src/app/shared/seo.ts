import { DOCUMENT, Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { AUTHOR, OG_IMAGE, PORTFOLIO_URL, SITE_NAME, SITE_URL } from '../data/site';

export interface PageSeo {
  title: string;
  description: string;
  /** Path with trailing slash, e.g. "/artigo/slug/". */
  path: string;
  image?: string;
  imageAlt?: string;
  noindex?: boolean;
  article?: { published: string; section: string; tags: string[] };
  /** Breadcrumb trail after "Início": [name, path]. */
  crumbs?: [string, string][];
  jsonLd?: object[];
}

export const abs = (p: string) => (p.startsWith('http') ? p : SITE_URL + p);

export const publisher = {
  '@type': 'Organization',
  '@id': `${SITE_URL}/#org`,
  name: SITE_NAME,
  url: `${SITE_URL}/`,
  logo: { '@type': 'ImageObject', url: `${SITE_URL}/icon-512.png`, width: 512, height: 512 },
  founder: { '@type': 'Person', '@id': `${PORTFOLIO_URL}#person`, name: AUTHOR, url: PORTFOLIO_URL },
};

const website = {
  '@type': 'WebSite',
  '@id': `${SITE_URL}/#website`,
  url: `${SITE_URL}/`,
  name: SITE_NAME,
  inLanguage: 'pt-BR',
  description: 'Notícias, reviews e guias de games, filmes e séries. Projeto de portfólio com textos de demonstração.',
  publisher: { '@id': `${SITE_URL}/#org` },
  potentialAction: {
    '@type': 'SearchAction',
    target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/busca/?q={busca}` },
    'query-input': 'required name=busca',
  },
};

@Injectable({ providedIn: 'root' })
export class Seo {
  private doc = inject(DOCUMENT);
  private meta = inject(Meta);
  private title = inject(Title);

  set(p: PageSeo) {
    const url = abs(p.path);
    const image = abs(p.image ?? OG_IMAGE);
    this.title.setTitle(p.title);
    const tags: Record<string, string> = {
      description: p.description,
      robots: p.noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large',
      'og:type': p.article ? 'article' : 'website',
      'og:site_name': SITE_NAME,
      'og:locale': 'pt_BR',
      'og:title': p.title,
      'og:description': p.description,
      'og:url': url,
      'og:image': image,
      'og:image:alt': p.imageAlt ?? p.title,
      'twitter:card': 'summary_large_image',
      'twitter:title': p.title,
      'twitter:description': p.description,
      'twitter:image': image,
    };
    if (p.article) {
      tags['article:published_time'] = `${p.article.published}T09:00:00-03:00`;
      tags['article:section'] = p.article.section;
    }
    for (const [key, content] of Object.entries(tags)) {
      const attr = key.startsWith('og:') || key.startsWith('article:') ? 'property' : 'name';
      this.meta.updateTag({ [attr]: key, content }, `${attr}="${key}"`);
    }
    if (!p.article) for (const k of ['article:published_time', 'article:section']) this.meta.removeTag(`property="${k}"`);

    let link = this.doc.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.doc.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.doc.head.appendChild(link);
    }
    link.setAttribute('href', url);

    const graph: object[] = [website, publisher, ...(p.jsonLd ?? [])];
    if (p.crumbs?.length) {
      graph.push({
        '@type': 'BreadcrumbList',
        itemListElement: [['Início', '/'] as [string, string], ...p.crumbs].map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: abs(path) })),
      });
    }
    let ld = this.doc.getElementById('ld-json');
    if (!ld) {
      ld = this.doc.createElement('script');
      ld.id = 'ld-json';
      ld.setAttribute('type', 'application/ld+json');
      this.doc.head.appendChild(ld);
    }
    // Escape "<" so no string in the data can close the script element.
    ld.textContent = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c');
  }
}
