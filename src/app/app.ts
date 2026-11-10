import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AUTHOR, PORTFOLIO_URL, PROJECT_URL, REPO_URL, SECTIONS } from './data/site';
import { Icon } from './shared/icon';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.html',
})
export class App {
  private router = inject(Router);
  protected readonly links = { author: AUTHOR, portfolio: PORTFOLIO_URL, project: PROJECT_URL, repo: REPO_URL };
  protected readonly nav = [
    ...Object.values(SECTIONS).map((s) => ({ label: s.label, path: s.path })),
    { label: 'Reviews', path: '/reviews/' },
    { label: 'Guias', path: '/guias/' },
    { label: 'Lançamentos', path: '/lancamentos/' },
  ];
  protected readonly year = new Date().getFullYear();

  /** Header search: client navigation when JS runs; the plain GET form still works without it. */
  protected search(e: Event, q: string) {
    e.preventDefault();
    this.router.navigate(['/busca'], { queryParams: q.trim() ? { q: q.trim() } : {} });
  }
}
