// Types only (erased by Node type stripping, so scripts can import files that use them).
export type Section = 'games' | 'filmes' | 'series';
export type Kind = 'noticia' | 'review' | 'guia' | 'lista' | 'opiniao';
export type MediaKind = 'game' | 'movie' | 'tv';
/** "game:52189" (IGDB id), "movie:1300968" or "tv:94605" (TMDB ids). */
export type Ref = `${MediaKind}:${number}`;

/**
 * Body blocks. Strings accept a tiny inline syntax: *itálico*, **negrito**, [texto](/artigo/slug ou https://...).
 * `entry` is a numbered list item (heading in the TOC + cover + facts line from the data).
 */
export type Block =
  | { p: string }
  | { h2: string }
  | { quote: string }
  | { img: Ref; pick?: number; caption: string }
  | { list: string[]; ordered?: boolean }
  | { box: string; title?: string }
  | { ficha: Ref }
  | { entry: Ref; title?: string; text: string[] };

export interface Post {
  slug: string;
  title: string;
  /** Subtitle, also the meta description (70 to 160 chars). */
  dek: string;
  section: Section;
  kind: Kind;
  tags: string[];
  /** Publication day, YYYY-MM-DD. */
  date: string;
  hero: { ref: Ref; pick?: number; alt: string };
  /** Reviews only: editorial score 0 to 10. */
  score?: number;
  verdict?: { summary: string; good: string[]; bad: string[] };
  body: Block[];
}

export interface Img {
  src: string;
  srcset: string;
  credit: string;
}

export interface PostMeta extends Omit<Post, 'body' | 'verdict'> {
  image: Img;
  thumb: Img;
  minutes: number;
  words: number;
  /** Every media ref the post covers (hero first). */
  refs: Ref[];
}

export interface WeekItem {
  date: string;
  ref: Ref;
  title: string;
  note: string;
  poster: Img | null;
}

export interface Game {
  id: number;
  name: string;
  type: string | null;
  cover: string | null;
  shots: string[];
  arts: string[];
  genres: string[];
  modes: string[];
  devs: string[];
  pubs: string[];
  released: string | null;
  releases: Record<string, string | null>;
  classInd: string;
}

export interface Person {
  name: string;
  role: string;
}

export interface Movie {
  id: number;
  title: string;
  original: string;
  overview: string;
  poster: string | null;
  backdrops: string[];
  runtime: number | null;
  genres: string[];
  cert: string;
  release: string | null;
  world: string | null;
  directors: string[];
  writers: string[];
  cast: Person[];
  studios: string[];
  country: string | null;
}

export interface Show {
  id: number;
  name: string;
  original: string;
  overview: string;
  poster: string | null;
  backdrops: string[];
  genres: string[];
  cert: string;
  creators: string[];
  cast: Person[];
  networks: string[];
  first: string | null;
  last: string | null;
  status: string | null;
  seasons: number | null;
  episodes: number | null;
  next: { date: string; season: number; episode: number } | null;
  country: string | null;
}

export interface CalendarEntry {
  date: string;
  ref: Ref;
  note: string;
}

export interface CalendarItem extends CalendarEntry {
  kind: MediaKind;
  title: string;
  poster: Img | null;
}

export interface Media {
  source: string;
  updatedAt: string;
  calendar: CalendarEntry[];
  games: Record<string, Game>;
  movies: Record<string, Movie>;
  tv: Record<string, Show>;
}
