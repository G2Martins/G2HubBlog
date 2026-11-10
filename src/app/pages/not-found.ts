import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { mostRead } from '../data/blog';
import { SITE_NAME } from '../data/site';
import { Seo } from '../shared/seo';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="wrap max-w-3xl py-24">
      <p class="eyebrow">Erro 404</p>
      <h1 class="hl-xl mt-4 text-[44px] sm:text-[60px]">Esta página saiu de cartaz</h1>
      <p class="dek mt-4 text-[17px]">O endereço não existe ou mudou. Volte para a capa ou leia um dos textos mais procurados.</p>
      <a routerLink="/" class="btn btn-violet mt-8">Ir para a capa</a>
      <ul class="mt-12 divide-y divide-line border-y border-line">
        @for (p of picks; track p.slug) { <li class="py-4"><a [routerLink]="['/artigo', p.slug]" class="font-medium hover:text-accent">{{ p.title }}</a></li> }
      </ul>
    </section>
  `,
})
export class NotFound {
  protected readonly picks = mostRead().slice(0, 4);
  constructor() {
    inject(Seo).set({ title: `Página não encontrada | ${SITE_NAME}`, description: 'Esta página não existe no G2 Hub. Volte para a capa para ver notícias, reviews e guias de games, filmes e séries.', path: '/404/', noindex: true });
  }
}
