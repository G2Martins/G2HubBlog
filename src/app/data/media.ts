// Pure helpers over media.json (image URLs, titles, dates). Type-only imports, so scripts can use it too.
import type { Game, Img, Media, Movie, Ref, Show } from './types';

const tmdb = (path: string, size: string) => `https://image.tmdb.org/t/p/${size}${path}`;
const igdb = (id: string, size: string) => `https://images.igdb.com/igdb/image/upload/t_${size}/${id}.jpg`;

export function record(media: Media, ref: Ref): { kind: 'game'; r: Game } | { kind: 'movie'; r: Movie } | { kind: 'tv'; r: Show } | null {
  const [kind, id] = ref.split(':');
  if (kind === 'game' && media.games[id]) return { kind, r: media.games[id] };
  if (kind === 'movie' && media.movies[id]) return { kind, r: media.movies[id] };
  if (kind === 'tv' && media.tv[id]) return { kind, r: media.tv[id] };
  return null;
}

export function titleOf(media: Media, ref: Ref): string {
  const m = record(media, ref);
  return !m ? '' : m.kind === 'game' ? m.r.name : m.kind === 'movie' ? m.r.title : m.r.name;
}

/** 16:9 image (artwork/screenshot or backdrop). `thumb` = card sizes. */
export function wide(media: Media, ref: Ref, pick = 0, thumb = false): Img | null {
  const m = record(media, ref);
  if (!m) return null;
  if (m.kind === 'game') {
    const all = [...m.r.arts, ...m.r.shots];
    const id = all[pick] ?? all[0];
    if (!id) return null;
    return thumb
      ? { src: igdb(id, 'screenshot_big'), srcset: `${igdb(id, 'screenshot_med')} 569w, ${igdb(id, 'screenshot_big')} 889w`, credit: 'Imagem: divulgação via IGDB' }
      : { src: igdb(id, 'screenshot_huge'), srcset: `${igdb(id, 'screenshot_big')} 889w, ${igdb(id, 'screenshot_huge')} 1280w, ${igdb(id, '1080p')} 1920w`, credit: 'Imagem: divulgação via IGDB' };
  }
  const path = m.r.backdrops[pick] ?? m.r.backdrops[0];
  if (!path) return null;
  return thumb
    ? { src: tmdb(path, 'w780'), srcset: `${tmdb(path, 'w300')} 300w, ${tmdb(path, 'w780')} 780w`, credit: 'Imagem: divulgação via TMDB' }
    : { src: tmdb(path, 'w1280'), srcset: `${tmdb(path, 'w780')} 780w, ${tmdb(path, 'w1280')} 1280w`, credit: 'Imagem: divulgação via TMDB' };
}

/** Portrait cover (game) or poster (movie, series), 2:3-ish. */
export function poster(media: Media, ref: Ref): Img | null {
  const m = record(media, ref);
  if (!m) return null;
  if (m.kind === 'game') {
    return m.r.cover
      ? { src: igdb(m.r.cover, 'cover_big'), srcset: `${igdb(m.r.cover, 'cover_big')} 264w, ${igdb(m.r.cover, 'cover_big_2x')} 528w`, credit: 'Capa via IGDB' }
      : null;
  }
  return m.r.poster
    ? { src: tmdb(m.r.poster, 'w342'), srcset: `${tmdb(m.r.poster, 'w185')} 185w, ${tmdb(m.r.poster, 'w342')} 342w`, credit: 'Pôster via TMDB' }
    : null;
}

const MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const WEEKDAYS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

/** "2026-11-19" -> "19 de novembro de 2026"; keeps IGDB's partial precision ("1998", "2027-03"). */
export function fmtDate(iso: string | null | undefined, short = false): string {
  if (!iso) return 'a definir';
  const [y, m, d] = iso.split('-').map(Number);
  if (!m) return String(y);
  if (!d) return `${MONTHS[m - 1]} de ${y}`;
  return short ? `${d} ${MONTHS[m - 1].slice(0, 3)}` : `${d} de ${MONTHS[m - 1]} de ${y}`;
}

/** Weekday abbreviation for an ISO day (UTC, so server and browser agree). */
export const weekday = (iso: string) => WEEKDAYS[new Date(`${iso}T12:00:00Z`).getUTCDay()];
const WEEKDAYS_LONG = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
export const weekdayLong = (iso: string) => WEEKDAYS_LONG[new Date(`${iso}T12:00:00Z`).getUTCDay()];

export const slugify = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/&/g, ' e ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

/** Plain text of a block string (inline syntax stripped), for word counts, search and RSS. */
export const plain = (s: string) => s.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/\*\*?([^*]+)\*\*?/g, '$1');
