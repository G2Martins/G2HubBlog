import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { coverage } from '../data/blog';
import { fmtDate, weekday } from '../data/media';
import { CALENDAR } from '../data/calendar.gen';
import { UPDATED } from '../data/posts.gen';
import { SITE_NAME } from '../data/site';
import type { CalendarItem } from '../data/types';
import { Seo } from '../shared/seo';

const KIND = { game: 'Game', movie: 'Filme', tv: 'Série' } as const;
const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

/** /lancamentos: upcoming dates from TMDB (BR cinemas, season premieres) and IGDB (exact-day game launches). */
@Component({
  selector: 'app-releases',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="wrap pt-10 sm:pt-14">
      <p class="eyebrow">Calendário</p>
      <h1 class="hl-xl mt-4 text-[44px] sm:text-[64px]">Lançamentos</h1>
      <p class="dek mt-4 max-w-2xl text-[17px] leading-relaxed">
        Estreias nos cinemas brasileiros e temporadas novas de séries (TMDB) e jogos com dia exato anunciado (IGDB), dos próximos meses.
        Dados de {{ updated }}; datas podem mudar.
      </p>
      <div class="mt-8 flex flex-wrap gap-2" role="group" aria-label="Filtrar por tipo">
        @for (f of filters; track f.key) {
          <button type="button" class="chip cursor-pointer" [attr.aria-pressed]="kind() === f.key" (click)="kind.set(f.key)">{{ f.label }} <span class="text-dim">{{ count(f.key) }}</span></button>
        }
      </div>
    </section>

    <section class="wrap mt-10" aria-label="Datas">
      @for (m of months(); track m.key) {
        <div class="mt-12 first:mt-0">
          <h2 class="hl border-b border-line pb-3 text-[28px] sm:text-[34px]">{{ m.label }}</h2>
          <ol>
            @for (d of m.days; track d.date) {
              <li class="grid grid-cols-[64px_1fr] gap-4 border-b border-line py-5 sm:grid-cols-[110px_1fr] sm:gap-8">
                <p class="leading-none">
                  <span class="block font-mono text-[11px] uppercase tracking-[.14em] text-accent">{{ d.wd }}</span>
                  <span class="mt-1.5 block font-mono text-[34px] font-semibold tracking-[-0.05em] sm:text-[44px]">{{ d.n }}</span>
                </p>
                <ul class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  @for (it of d.items; track it.ref) {
                    <li class="stretch flex gap-3.5">
                      @if (it.poster) {
                        <img class="aspect-[2/3] w-[52px] shrink-0 rounded-md bg-well object-cover" [src]="it.poster.src" alt="" width="52" height="78" loading="lazy" decoding="async">
                      } @else { <span class="aspect-[2/3] w-[52px] shrink-0 rounded-md bg-well"></span> }
                      <div class="min-w-0">
                        <p class="font-mono text-[10.5px] uppercase tracking-[.12em] text-dim">{{ label[it.kind] }}</p>
                        <h3 class="mt-1 text-[15px] font-medium leading-snug">
                          @if (it.post) { <a class="stretch-link hover:text-accent" [routerLink]="['/artigo', it.post]">{{ it.title }}</a> } @else { {{ it.title }} }
                        </h3>
                        <p class="meta mt-1 clamp-2">{{ it.note }}</p>
                        @if (it.post) { <p class="mt-1 text-[12px] text-accent">Leia a matéria</p> }
                      </div>
                    </li>
                  }
                </ul>
              </li>
            }
          </ol>
        </div>
      } @empty {
        <p class="text-ink-2">Nenhuma data neste filtro.</p>
      }
    </section>
  `,
})
export class Releases {
  protected readonly label = KIND;
  protected readonly updated = fmtDate(UPDATED);
  protected readonly filters = [
    { key: 'all', label: 'Tudo' },
    { key: 'game', label: 'Games' },
    { key: 'movie', label: 'Filmes' },
    { key: 'tv', label: 'Séries' },
  ] as const;
  private readonly all = CALENDAR.map((c) => ({ ...c, post: coverage(c.ref)?.slug ?? null }));
  protected kind = signal<'all' | CalendarItem['kind']>('all');
  protected count = (k: string) => (k === 'all' ? this.all.length : this.all.filter((c) => c.kind === k).length);

  protected months = computed(() => {
    const list = this.all.filter((c) => this.kind() === 'all' || c.kind === this.kind());
    const months = new Map<string, Map<string, typeof list>>();
    for (const c of list) {
      const mk = c.date.slice(0, 7);
      const days = months.get(mk) ?? new Map();
      days.set(c.date, [...(days.get(c.date) ?? []), c]);
      months.set(mk, days);
    }
    return [...months.entries()].map(([key, days]) => ({
      key,
      label: `${MONTHS[Number(key.slice(5, 7)) - 1]} de ${key.slice(0, 4)}`,
      days: [...days.entries()].map(([date, items]) => ({ date, wd: weekday(date), n: Number(date.slice(8, 10)), items })),
    }));
  });

  constructor() {
    inject(Seo).set({
      title: `Lançamentos: calendário de games, filmes e séries | ${SITE_NAME}`,
      description: 'Calendário de lançamentos: estreias nos cinemas do Brasil, novas temporadas de séries e jogos com data marcada para PC, PlayStation, Xbox e Switch.',
      path: '/lancamentos/',
      crumbs: [['Lançamentos', '/lancamentos/']],
    });
  }
}
