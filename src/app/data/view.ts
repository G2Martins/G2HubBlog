// Article rendering model: post blocks + the article's media slice -> plain view objects the templates print.
// The browser never sees media.json: scripts/seo.ts ships each article with only the records it cites.
import { fmtDate, poster, record, slugify, titleOf, wide } from './media';
import type { Block, Img, Media, Post, Ref } from './types';

export type Seg = { t: 'text' | 'em' | 'strong'; v: string } | { t: 'link'; v: string; href: string; internal: boolean };

/** *italic*, **bold**, [text](href). No nesting, no HTML: output goes through Angular interpolation. */
export function inline(s: string): Seg[] {
  const out: Seg[] = [];
  const re = /\*\*([^*]+)\*\*|\*([^*]+)\*|\[([^\]]+)\]\(([^)\s]+)\)/g;
  let last = 0;
  for (const m of s.matchAll(re)) {
    if (m.index > last) out.push({ t: 'text', v: s.slice(last, m.index) });
    if (m[1]) out.push({ t: 'strong', v: m[1] });
    else if (m[2]) out.push({ t: 'em', v: m[2] });
    else out.push({ t: 'link', v: m[3], href: m[4], internal: m[4].startsWith('/') });
    last = m.index + m[0].length;
  }
  if (last < s.length) out.push({ t: 'text', v: s.slice(last) });
  return out;
}

export interface Ficha {
  kind: string;
  source: 'IGDB' | 'TMDB';
  title: string;
  original: string | null;
  poster: Img | null;
  cert: string;
  rows: [string, string][];
  overview: string | null;
}

const PLATFORM_ORDER = ['PC', 'PS5', 'PS4', 'Xbox Series X|S', 'Xbox One', 'Switch 2', 'Switch'];
const platformRank = (p: string) => (PLATFORM_ORDER.includes(p) ? PLATFORM_ORDER.indexOf(p) : 99);
const and = (xs: string[]) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} e ${xs.at(-1)}`);
const hours = (min: number) => (min >= 60 ? `${Math.floor(min / 60)}h${String(min % 60).padStart(2, '0')}` : `${min} min`);

/** "PC, PS5 e Xbox Series X|S: 19 de novembro de 2026" groups, earliest first. */
export function releaseGroups(releases: Record<string, string | null>): string[] {
  const by = new Map<string, string[]>();
  for (const [p, d] of Object.entries(releases)) by.set(d ?? '', [...(by.get(d ?? '') ?? []), p]);
  return [...by.entries()]
    .sort((a, b) => (a[0] || '9').localeCompare(b[0] || '9'))
    .map(([d, ps]) => `${and(ps.sort((x, y) => platformRank(x) - platformRank(y)))}: ${fmtDate(d || null)}`);
}

export function ficha(media: Media, ref: Ref): Ficha | null {
  const m = record(media, ref);
  if (!m) return null;
  if (m.kind === 'game') {
    const g = m.r;
    const rows: [string, string][] = [
      ['Lançamento', releaseGroups(g.releases).join(' · ') || fmtDate(g.released)],
      ['Desenvolvimento', and(g.devs)],
      ['Publicação', and(g.pubs)],
      ['Gêneros', g.genres.join(', ')],
    ];
    if (g.type && g.type !== 'Jogo principal') rows.push(['Tipo', g.type]);
    return { kind: 'Jogo', source: 'IGDB', title: g.name, original: null, poster: poster(media, ref), cert: g.classInd, rows: rows.filter((r) => r[1]), overview: null };
  }
  if (m.kind === 'movie') {
    const f = m.r;
    const rows: [string, string][] = [
      ['Estreia no Brasil', fmtDate(f.release)],
      ['Direção', and(f.directors)],
      ['Roteiro', and(f.writers)],
      ['Elenco', and(f.cast.slice(0, 4).map((c) => c.name))],
      ['Duração', f.runtime ? hours(f.runtime) : 'a definir'],
      ['Gêneros', f.genres.join(', ')],
      ['Produção', and(f.studios)],
    ];
    return { kind: 'Filme', source: 'TMDB', title: f.title, original: f.original !== f.title ? f.original : null, poster: poster(media, ref), cert: f.cert, rows: rows.filter((r) => r[1]), overview: f.overview || null };
  }
  const t = m.r;
  const years = t.first ? (t.last && t.last.slice(0, 4) !== t.first.slice(0, 4) ? `de ${t.first.slice(0, 4)} a ${t.last.slice(0, 4)}` : t.first.slice(0, 4)) : '';
  const rows: [string, string][] = [
    ['Onde assistir', and(t.networks)],
    ['Criação', and(t.creators)],
    ['Elenco', and(t.cast.slice(0, 4).map((c) => c.name))],
    ['No ar', years],
    ['Temporadas', t.seasons ? `${t.seasons} (${t.episodes} episódios no TMDB)` : ''],
    ['Situação', t.status ?? ''],
    ['Próximo episódio', t.next ? `T${t.next.season}E${t.next.episode}, ${fmtDate(t.next.date)}` : ''],
    ['Gêneros', t.genres.join(', ')],
  ];
  return { kind: 'Série', source: 'TMDB', title: t.name, original: t.original !== t.name ? t.original : null, poster: poster(media, ref), cert: t.cert, rows: rows.filter((r) => r[1]), overview: t.overview || null };
}

/** One-line facts under a list entry. */
export function facts(media: Media, ref: Ref): string {
  const m = record(media, ref);
  if (!m) return '';
  if (m.kind === 'game') return [...releaseGroups(m.r.releases), m.r.devs[0]].filter(Boolean).join(' · ');
  if (m.kind === 'movie') return [`Estreia no Brasil: ${fmtDate(m.r.release)}`, m.r.directors.length ? `Direção: ${and(m.r.directors)}` : '', m.r.runtime ? hours(m.r.runtime) : ''].filter(Boolean).join(' · ');
  const t = m.r;
  return [and(t.networks), t.seasons ? `${t.seasons} temporada${t.seasons > 1 ? 's' : ''}` : '', t.first ? `estreou em ${t.first.slice(0, 4)}` : '', t.status ?? ''].filter(Boolean).join(' · ');
}

export type View =
  | { t: 'p'; segs: Seg[]; lede: boolean }
  | { t: 'h2'; id: string; text: string }
  | { t: 'quote'; segs: Seg[] }
  | { t: 'img'; img: Img; alt: string; caption: Seg[] }
  | { t: 'list'; ordered: boolean; items: Seg[][] }
  | { t: 'box'; title: string; segs: Seg[] }
  | { t: 'ficha'; f: Ficha }
  | { t: 'entry'; n: number; id: string; title: string; cover: Img | null; facts: string; text: Seg[][] };

export function view(post: Post, media: Media): { blocks: View[]; toc: { id: string; text: string }[] } {
  const toc: { id: string; text: string }[] = [];
  const ids = new Set<string>();
  const uid = (s: string) => {
    let id = slugify(s) || 'secao';
    while (ids.has(id)) id += '-2';
    ids.add(id);
    return id;
  };
  let n = 0;
  let firstP = true;
  const blocks = post.body.map((b: Block): View | null => {
    if ('p' in b) {
      const v: View = { t: 'p', segs: inline(b.p), lede: firstP };
      firstP = false;
      return v;
    }
    if ('h2' in b) {
      const id = uid(b.h2);
      toc.push({ id, text: b.h2 });
      return { t: 'h2', id, text: b.h2 };
    }
    if ('quote' in b) return { t: 'quote', segs: inline(b.quote) };
    if ('img' in b) {
      const img = wide(media, b.img, b.pick ?? 1);
      return img ? { t: 'img', img, alt: titleOf(media, b.img), caption: inline(b.caption) } : null;
    }
    if ('list' in b) return { t: 'list', ordered: !!b.ordered, items: b.list.map(inline) };
    if ('box' in b) return { t: 'box', title: b.title ?? 'Nota', segs: inline(b.box) };
    if ('ficha' in b) {
      const f = ficha(media, b.ficha);
      return f ? { t: 'ficha', f } : null;
    }
    const title = b.title ?? titleOf(media, b.entry);
    const id = uid(title);
    n++;
    toc.push({ id, text: `${n}. ${title}` });
    return { t: 'entry', n, id, title, cover: poster(media, b.entry), facts: facts(media, b.entry), text: b.text.map(inline) };
  });
  return { blocks: blocks.filter((b): b is View => !!b), toc };
}
