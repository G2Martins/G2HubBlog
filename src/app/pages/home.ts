import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { coverage, featured, inSection, kindLabel, mostRead, ofKind, POSTS, sectionLabel, WEEK } from '../data/blog';
import { fmtDate, weekday, weekdayLong } from '../data/media';
import { SECTIONS, SITE_NAME } from '../data/site';
import type { Section } from '../data/types';
import { Icon } from '../shared/icon';
import { Reveal } from '../shared/reveal';
import { Seo } from '../shared/seo';
import { Card } from '../shared/ui';

@Component({
  selector: 'app-home',
  imports: [RouterLink, Card, Icon, Reveal],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home.html',
})
export class Home {
  protected readonly lead = featured();
  private readonly rest = POSTS.filter((p) => p.slug !== this.lead.slug);
  protected readonly trending = this.rest.slice(0, 3);
  protected readonly latest = this.rest.slice(3, 9);
  protected readonly sections = (Object.keys(SECTIONS) as Section[]).map((key) => {
    const list = inSection(key).filter((p) => p.slug !== this.lead.slug);
    return { key, label: SECTIONS[key].label, path: SECTIONS[key].path, blurb: SECTIONS[key].blurb, first: list[0], more: list.slice(1, 4) };
  });
  protected readonly reviews = ofKind('review').slice(0, 4);
  protected readonly guides = ofKind('guia').slice(0, 4);
  protected readonly ranking = mostRead();
  protected readonly week = WEEK.map((w) => ({ ...w, day: fmtDate(w.date, true), wd: weekday(w.date), post: coverage(w.ref) }));
  protected readonly edition = fmtDate(POSTS[0].date);
  protected readonly editionDay = weekdayLong(POSTS[0].date);
  protected readonly label = { section: sectionLabel, kind: kindLabel };

  constructor() {
    inject(Seo).set({
      title: `${SITE_NAME} | Games, filmes e séries: notícias, reviews e lançamentos`,
      description: 'Notícias, reviews e guias de games, filmes e séries, com datas de lançamento no Brasil do TMDB e do IGDB. Projeto de portfólio de Gustavo Martins Gripaldi.',
      path: '/',
    });
  }
}
