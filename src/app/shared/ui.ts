import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { fmtDate } from '../data/media';
import { kindLabel, sectionLabel } from '../data/blog';
import type { PostMeta } from '../data/types';
import type { Seg } from '../data/view';

/** Renders inline segments inside the host element (`<p [appInline]="segs">`). Text only, never innerHTML. */
@Component({
  selector: '[appInline]',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `@for (s of appInline(); track $index) {@switch (s.t) {@case ('em') {<em>{{ s.v }}</em>}@case ('strong') {<strong>{{ s.v }}</strong>}@case ('link') {@if (s.internal) {<a [routerLink]="s.href">{{ s.v }}</a>} @else {<a [href]="s.href" target="_blank" rel="noopener">{{ s.v }}</a>}}@default {{{ s.v }}}}}`,
})
export class Inline {
  appInline = input.required<Seg[]>();
}

/** Editorial score ring (0 to 10). Opinion of the newsroom, never marked up as Review. */
@Component({
  selector: 'app-score',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="score" [style.--v]="value() / 10" [style.--s.px]="size()" role="img" [attr.aria-label]="'Nota da redação: ' + label() + ' de 10'"><span aria-hidden="true">{{ label() }}</span></span>`,
})
export class Score {
  value = input.required<number>();
  size = input(56);
  protected label = computed(() => String(this.value()).replace('.', ','));
}

/** ClassInd seal in the official colors. "AD" = a definir (never defaults to L). */
@Component({
  selector: 'app-cert',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="ci ci-{{ code() }}" role="img" [attr.aria-label]="code() === 'AD' ? 'Classificação indicativa a definir' : code() === 'L' ? 'Classificação livre' : 'Não recomendado para menores de ' + code() + ' anos'"><span aria-hidden="true">{{ code() === 'AD' ? '?' : code() }}</span></span>`,
})
export class Cert {
  code = input.required<string>();
}

/**
 * Post card. `lead` = big image on top, `row` = thumb left, `mini` = text only.
 * `level` keeps the heading outline right wherever the card sits.
 */
@Component({
  selector: 'app-card',
  imports: [RouterLink, Score],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <article class="stretch {{ variant() === 'row' ? 'grid grid-cols-[minmax(0,112px)_1fr] items-start gap-4 sm:grid-cols-[minmax(0,180px)_1fr]' : 'flex h-full flex-col' }}">
      @if (variant() !== 'mini') {
        <div class="media relative aspect-video rounded-lg" [class.mb-4]="variant() === 'lead'">
          <img class="zoom" [src]="p().thumb.src" [attr.srcset]="p().thumb.srcset" [attr.sizes]="sizes()" [alt]="p().hero.alt"
               width="780" height="439" [attr.loading]="eager() ? null : 'lazy'" [attr.fetchpriority]="eager() ? 'high' : null" decoding="async">
          @if (p().score != null && variant() === 'lead') {
            <app-score class="absolute bottom-3 right-3" [value]="p().score!" [size]="48" />
          }
        </div>
      }
      <div class="flex min-w-0 flex-col">
        <p class="eyebrow sec-{{ p().section }}">{{ section() }} · {{ kind() }}</p>
        @if (level() === 2) {
          <h2 class="hl mt-2.5 text-ink {{ titleSize() }}"><a class="stretch-link" [routerLink]="['/artigo', p().slug]">{{ p().title }}</a></h2>
        } @else {
          <h3 class="hl mt-2.5 text-ink {{ titleSize() }}"><a class="stretch-link" [routerLink]="['/artigo', p().slug]">{{ p().title }}</a></h3>
        }
        @if (showDek()) { <p class="dek clamp-3 mt-2 text-[14px] leading-relaxed">{{ p().dek }}</p> }
        <p class="meta mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 [&>*]:whitespace-nowrap">
          <time [attr.datetime]="p().date">{{ date() }}</time><span aria-hidden="true">·</span><span>{{ p().minutes }} min{{ variant() === 'lead' ? ' de leitura' : '' }}</span>
          @if (p().score != null && variant() !== 'lead') { <span aria-hidden="true">·</span><span class="text-accent">Nota {{ scoreLabel() }}</span> }
        </p>
      </div>
    </article>
  `,
})
export class Card {
  p = input.required<PostMeta>();
  variant = input<'lead' | 'row' | 'mini'>('lead');
  level = input(3);
  big = input(false);
  eager = input(false);
  dek = input<boolean | null>(null);
  protected section = computed(() => sectionLabel(this.p().section));
  protected kind = computed(() => kindLabel(this.p().kind));
  protected date = computed(() => (this.variant() === 'lead' ? fmtDate(this.p().date) : `${fmtDate(this.p().date, true)} ${this.p().date.slice(0, 4)}`));
  protected scoreLabel = computed(() => String(this.p().score).replace('.', ','));
  protected showDek = computed(() => this.dek() ?? this.variant() === 'lead');
  protected titleSize = computed(() => (this.big() ? 'text-[26px] sm:text-[34px]' : this.variant() === 'lead' ? 'text-[18px] sm:text-[20px]' : 'text-[16px] sm:text-[17px]'));
  protected sizes = computed(() => (this.variant() === 'row' ? '180px' : this.big() ? '(min-width: 1024px) 760px, 100vw' : '(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw'));
}
