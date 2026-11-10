// Refreshes src/app/data/media.json from TMDB (movies, series) and IGDB (games). Never prints credentials.
//   npm run media                               -> every ref used in src/app/data/posts + release calendar
//   npm run media -- --search game "zelda|fable" -> print hits (id, name, date) to pick ids for a post
//   npm run media -- --search movie "street fighter"   (also: tv)
// Credentials: .env in this repo, else ../Starplex/.env (TMDB_TOKEN) and ../G2Store/.env (TWITCH_*).
import { existsSync } from 'node:fs';
import { readdir, readFile, writeFile } from 'node:fs/promises';

for (const f of ['../.env', '../../Starplex/.env', '../../G2Store/.env']) {
  const url = new URL(f, import.meta.url);
  if (existsSync(url)) process.loadEnvFile(url);
}
const { TMDB_TOKEN: tmdbToken, TWITCH_CLIENT_ID: twitchId, TWITCH_CLIENT_SECRET: twitchSecret } = process.env;
if (!tmdbToken || !twitchId || !twitchSecret) {
  console.error('media: faltam TMDB_TOKEN / TWITCH_CLIENT_ID / TWITCH_CLIENT_SECRET (veja .env.example).');
  process.exit(1);
}

type J = Record<string, any>;
const today = new Date().toISOString().slice(0, 10);
const plusDays = (n: number) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
// Site copy never uses em dashes: external text gets a comma instead.
const clean = (s: unknown) => String(s ?? '').replace(/\s*\u2014\s*/g, ', ').replace(/[\u200b-\u200d\ufeff]/g, '').trim();

// ---------- TMDB ----------
async function tmdb(path: string): Promise<J> {
  const sep = path.includes('?') ? '&' : '?';
  const res = await fetch(`https://api.themoviedb.org/3${path}${sep}language=pt-BR`, {
    headers: { Authorization: `Bearer ${tmdbToken}`, accept: 'application/json' },
  });
  // Only the path goes to the log, never headers.
  if (!res.ok) throw new Error(`TMDB HTTP ${res.status} em ${path.split('?')[0]}`);
  return res.json();
}

// ---------- IGDB ----------
let igdbToken = '';
async function igdb(endpoint: string, body: string): Promise<J[]> {
  if (!igdbToken) {
    const auth = await fetch('https://id.twitch.tv/oauth2/token', {
      method: 'POST',
      body: new URLSearchParams({ client_id: twitchId!, client_secret: twitchSecret!, grant_type: 'client_credentials' }),
    });
    if (!auth.ok) throw new Error(`Twitch auth HTTP ${auth.status}`);
    igdbToken = ((await auth.json()) as J)['access_token'];
  }
  // ponytail: serial calls with a 260ms gap stay under IGDB's 4 req/s; a handful of calls, no pool needed.
  await sleep(260);
  const res = await fetch(`https://api.igdb.com/v4/${endpoint}`, {
    method: 'POST',
    headers: { 'Client-ID': twitchId!, Authorization: `Bearer ${igdbToken}`, Accept: 'application/json' },
    body,
  });
  if (!res.ok) throw new Error(`IGDB ${endpoint}: HTTP ${res.status}`);
  return res.json() as Promise<J[]>;
}

const day = (unix?: number) => (unix ? new Date(unix * 1000).toISOString().slice(0, 10) : null);
// IGDB stores "2027" as 2027-12-31 + format YYYY: keep only the precision it really has.
function releaseDay(r: J): string | null {
  const d = day(r['date']);
  const f = r['date_format']?.['format'] ?? 'YYYYMMDD';
  if (!d || f === 'TBD') return null;
  return f === 'YYYYMMDD' ? d : f === 'YYYYMM' ? d.slice(0, 7) : d.slice(0, 4);
}

// ---------- search mode ----------
const si = process.argv.indexOf('--search');
if (si > -1) {
  const kind = process.argv[si + 1];
  for (const term of process.argv[si + 2].split('|')) {
    console.log(`# ${kind}: ${term}`);
    if (kind === 'game') {
      const hits = await igdb('games', `search "${term.replace(/"/g, '')}"; fields name,game_type.type,first_release_date,platforms.abbreviation,involved_companies.company.name,involved_companies.developer,summary; limit 8;`);
      for (const g of hits) {
        const dev = (g['involved_companies'] ?? []).filter((c: J) => c['developer']).map((c: J) => c['company']?.['name']).join(', ');
        console.log(`${g['id']}\t${g['name']}\t[${g['game_type']?.['type']}]\t${day(g['first_release_date'])}\t${(g['platforms'] ?? []).map((p: J) => p['abbreviation']).join(' ')}\t${dev}`);
        if (process.argv.includes('--summary')) console.log(`\t${g['summary'] ?? ''}`);
      }
    } else {
      const r = await tmdb(`/search/${kind}?query=${encodeURIComponent(term)}`);
      for (const m of (r['results'] as J[]).slice(0, 8))
        console.log(`${m['id']}\t${m['title'] ?? m['name']}\t${m['original_title'] ?? m['original_name']}\t${m['release_date'] ?? m['first_air_date']}`);
    }
  }
  process.exit(0);
}

// ---------- refs used by the posts ----------
const postsDir = new URL('../src/app/data/posts/', import.meta.url);
const refs = { game: new Set<number>(), movie: new Set<number>(), tv: new Set<number>() };
for (const f of (await readdir(postsDir)).filter((f) => f.endsWith('.ts'))) {
  for (const m of (await readFile(new URL(f, postsDir), 'utf8')).matchAll(/["'](game|movie|tv):(\d+)["']/g))
    refs[m[1] as keyof typeof refs].add(Number(m[2]));
}
const postRefs = [...refs.game].map((i) => `game:${i}`).concat([...refs.movie].map((i) => `movie:${i}`), [...refs.tv].map((i) => `tv:${i}`));

// ---------- calendar sources ----------
const CAL_DAYS = 120;
const pages = async (path: string, n: number) =>
  (await Promise.all(Array.from({ length: n }, (_, i) => tmdb(`${path}${path.includes('?') ? '&' : '?'}page=${i + 1}`)))).flatMap((r) => r['results'] as J[]);

const upcoming = (await pages('/movie/upcoming?region=BR', 3)).filter((m) => m['poster_path'] && (m['release_date'] ?? '') >= today);
const nowPlaying = (await pages('/movie/now_playing?region=BR', 1)).filter((m) => m['poster_path']);
for (const m of [...upcoming.slice(0, 18), ...nowPlaying.slice(0, 10)]) refs.movie.add(m['id']);
// Series airing in the window (talk shows, news, reality and soaps excluded); season premieres are kept below.
const onAir = (await pages(`/discover/tv?air_date.gte=${today}&air_date.lte=${plusDays(CAL_DAYS)}&sort_by=popularity.desc&without_genres=10763,10764,10766,10767&watch_region=BR&with_watch_monetization_types=flatrate`, 3))
  .filter((t) => t['poster_path'] && t['backdrop_path']);
for (const t of onAir.slice(0, 40)) refs.tv.add(t['id']);

// Games with an exact release day in the window, on current platforms, ranked by IGDB hype.
const PLATFORMS: Record<number, string> = { 6: 'PC', 167: 'PS5', 48: 'PS4', 169: 'Xbox Series X|S', 49: 'Xbox One', 508: 'Switch 2', 130: 'Switch' };
const now = Math.floor(Date.now() / 1000);
const igdbReleases = await igdb('release_dates', `fields date,date_format.format,platform,status.name,game.id,game.name,game.hypes,game.game_type; where date >= ${now - 86400} & date < ${now + CAL_DAYS * 86400} & platform = (${Object.keys(PLATFORMS).join(',')}) & game.game_type = (0,2,4,8,9,10,11) & game.hypes >= 8; sort date asc; limit 500;`);
for (const r of igdbReleases) refs.game.add(r['game']['id']);

// ---------- details: movies ----------
const CERTS = ['L', '10', '12', '14', '16', '18'];
const rank = (t: number) => (t === 3 ? 0 : t === 2 ? 1 : 2);
const isLatin = (s: string) => /^[\p{Script=Latin}\p{M}\p{N}\s.'’&-]+$/u.test(s);
// Credits come in the person's native script (Hangul, Devanagari...). Prefer a Latin alias, else drop.
async function latin(id: number, name: string): Promise<string | null> {
  if (isLatin(name)) return name;
  const aliases = ((await tmdb(`/person/${id}`))['also_known_as'] ?? []) as string[];
  return aliases.find(isLatin) ?? null;
}
async function people(list: J[], n: number) {
  const out: string[] = [];
  for (const c of list) {
    if (out.length >= n) break;
    const name = await latin(c['id'], c['name']);
    if (name && !out.includes(name)) out.push(name);
  }
  return out;
}
// Cast with the character they play (series: the most-credited role).
async function cast(list: J[], n: number) {
  const out: { name: string; role: string }[] = [];
  for (const c of list) {
    if (out.length >= n) break;
    const name = await latin(c['id'], c['name']);
    const role = clean(c['character'] ?? c['roles']?.[0]?.['character'] ?? '').replace(/\s*\(uncredited\)/g, '').replace(/\(voice\)/g, '(voz)').replace(/\s+/g, ' ');
    if (name && !out.some((o) => o.name === name)) out.push({ name, role });
  }
  return out;
}
const backdrops = (d: J) =>
  [d['backdrop_path'], ...((d['images']?.['backdrops'] ?? []) as J[]).filter((b) => b['aspect_ratio'] > 1.7).map((b) => b['file_path'])]
    .filter((p, i, a) => p && a.indexOf(p) === i).slice(0, 5);

const movies: J = {};
for (const id of refs.movie) {
  const d = await tmdb(`/movie/${id}?append_to_response=credits,release_dates,images&include_image_language=null,pt,en`);
  const br = ((d['release_dates']?.['results'] ?? []) as J[]).find((r) => r['iso_3166_1'] === 'BR');
  const dates = ((br?.['release_dates'] ?? []) as J[]).sort((a, b) => rank(a['type']) - rank(b['type']));
  const cert = dates.map((r) => String(r['certification'] ?? '').trim().toUpperCase()).find((c) => CERTS.includes(c));
  const crew = (d['credits']?.['crew'] ?? []) as J[];
  movies[id] = {
    id,
    title: clean(d['title'] || d['original_title']),
    original: clean(d['original_title']),
    overview: clean(d['overview']),
    poster: d['poster_path'] ?? null,
    backdrops: backdrops(d),
    runtime: d['runtime'] || null,
    genres: (d['genres'] ?? []).map((g: J) => g['name']).slice(0, 3),
    cert: cert ?? 'AD',
    release: String(dates[0]?.['release_date'] ?? '').slice(0, 10) || d['release_date'] || null,
    world: d['release_date'] || null,
    directors: await people(crew.filter((c) => c['job'] === 'Director'), 2),
    writers: await people(crew.filter((c) => c['job'] === 'Screenplay' || c['job'] === 'Writer'), 2),
    cast: await cast((d['credits']?.['cast'] ?? []) as J[], 6),
    studios: (d['production_companies'] ?? []).map((c: J) => clean(c['name'])).slice(0, 2),
    country: (d['origin_country'] ?? [])[0] ?? null,
  };
}

// ---------- details: series ----------
const TV_STATUS: Record<string, string> = {
  'Returning Series': 'Em produção', Ended: 'Encerrada', Canceled: 'Cancelada', 'In Production': 'Em produção', Planned: 'Planejada', Pilot: 'Piloto',
};
const tv: J = {};
for (const id of refs.tv) {
  const d = await tmdb(`/tv/${id}?append_to_response=aggregate_credits,content_ratings,images&include_image_language=null,pt,en`);
  const cr = ((d['content_ratings']?.['results'] ?? []) as J[]).find((r) => r['iso_3166_1'] === 'BR');
  const cert = String(cr?.['rating'] ?? '').trim().toUpperCase();
  const next = d['next_episode_to_air'];
  tv[id] = {
    id,
    name: clean(d['name'] || d['original_name']),
    original: clean(d['original_name']),
    overview: clean(d['overview']),
    poster: d['poster_path'] ?? null,
    backdrops: backdrops(d),
    genres: (d['genres'] ?? []).map((g: J) => clean(g['name'])).slice(0, 3),
    cert: CERTS.includes(cert) ? cert : 'AD',
    creators: await people(d['created_by'] ?? [], 3),
    cast: await cast((d['aggregate_credits']?.['cast'] ?? []) as J[], 6),
    networks: (d['networks'] ?? []).map((n: J) => clean(n['name'])).slice(0, 2),
    first: d['first_air_date'] || null,
    last: d['last_air_date'] || null,
    status: TV_STATUS[d['status']] ?? d['status'] ?? null,
    seasons: d['number_of_seasons'] ?? null,
    episodes: d['number_of_episodes'] ?? null,
    next: next ? { date: next['air_date'], season: next['season_number'], episode: next['episode_number'] } : null,
    country: (d['origin_country'] ?? [])[0] ?? null,
  };
}

// ---------- details: games ----------
const PLATFORM_KEY: [RegExp, string][] = [
  [/^PC \(Microsoft Windows\)$/, 'PC'], [/^PlayStation 5$/, 'PS5'], [/^PlayStation 4$/, 'PS4'],
  [/^Xbox Series X\|S$/, 'Xbox Series X|S'], [/^Xbox One$/, 'Xbox One'], [/^Nintendo Switch 2$/, 'Switch 2'],
  [/^Nintendo Switch$/, 'Switch'], [/^Nintendo 64$/, 'Nintendo 64'], [/^Nintendo 3DS$/, '3DS'], [/^Wii U$/, 'Wii U'],
  [/^Super Nintendo Entertainment System$/, 'Super Nintendo'], [/^Nintendo Entertainment System$/, 'NES'], [/^Wii$/, 'Wii'],
  [/^Nintendo GameCube$/, 'GameCube'], [/^PlayStation 3$/, 'PS3'], [/^PlayStation 2$/, 'PS2'], [/^Xbox 360$/, 'Xbox 360'],
  [/^PlayStation$/, 'PlayStation'], [/^Nintendo DS$/, 'DS'], [/^Game Boy$/, 'Game Boy'],
];
const platformLabel = (name = '') => PLATFORM_KEY.find(([re]) => re.test(name))?.[1];
const GENRE_PT: Record<string, string> = {
  Shooter: 'Tiro', Adventure: 'Aventura', 'Role-playing (RPG)': 'RPG', Platform: 'Plataforma', Puzzle: 'Quebra-cabeça',
  Racing: 'Corrida', Simulator: 'Simulação', Sport: 'Esporte', Strategy: 'Estratégia', "Hack and slash/Beat 'em up": 'Ação',
  Indie: 'Indie', Arcade: 'Arcade', Fighting: 'Luta', 'Turn-based strategy (TBS)': 'Estratégia por turnos',
  'Real Time Strategy (RTS)': 'Estratégia em tempo real', Tactical: 'Tático', Music: 'Música', 'Point-and-click': 'Point-and-click',
  'Visual Novel': 'Visual novel', 'Card & Board Game': 'Cartas e tabuleiro', MOBA: 'MOBA', 'Quiz/Trivia': 'Quiz',
};
const THEME_PT: Record<string, string> = {
  Horror: 'Terror', Survival: 'Sobrevivência', 'Open world': 'Mundo aberto', Stealth: 'Furtividade', 'Science fiction': 'Ficção científica',
  Fantasy: 'Fantasia', Action: 'Ação', Sandbox: 'Sandbox', Comedy: 'Comédia', Warfare: 'Guerra', Mystery: 'Mistério',
};
const TYPE_PT: Record<string, string> = { 'Main Game': 'Jogo principal', Remake: 'Remake', Remaster: 'Remaster', Expansion: 'Expansão', Port: 'Port', 'Expanded Game': 'Edição expandida', 'Standalone Expansion': 'Expansão independente' };
// Real releases only: betas, advanced access and cancelled ports are not a launch.
const RELEASED = new Set([undefined, 'Full Release', 'Early Access', 'Next-Gen Optimization Patch Release']);

const gameFields = [
  'name', 'slug', 'game_type.type', 'cover.image_id', 'screenshots.image_id', 'screenshots.width', 'screenshots.height', 'artworks.image_id', 'artworks.width', 'artworks.height',
  'genres.name', 'themes.name', 'involved_companies.company.name', 'involved_companies.developer', 'involved_companies.publisher',
  'first_release_date', 'release_dates.platform.name', 'release_dates.date', 'release_dates.status.name', 'release_dates.date_format.format',
  'age_ratings.organization.name', 'age_ratings.rating_category.rating', 'game_modes.name',
].join(',');
const wide = (list: J[] = []) => list.filter((s) => !s['width'] || s['width'] / s['height'] > 1.6).map((s) => s['image_id']);
const games: J = {};
const ids = [...refs.game];
for (let i = 0; i < ids.length; i += 100) {
  for (const g of await igdb('games', `fields ${gameFields}; where id = (${ids.slice(i, i + 100).join(',')}); limit 100;`)) {
    const releases: Record<string, string | null> = {};
    for (const r of g['release_dates'] ?? []) {
      const key = platformLabel(r['platform']?.['name']);
      if (!key || !RELEASED.has(r['status']?.['name'])) continue;
      const d = releaseDay(r);
      const prev = releases[key];
      if (!(key in releases) || (d && (!prev || d < prev))) releases[key] = d;
    }
    const company = (role: string) => [...new Set((g['involved_companies'] ?? []).filter((c: J) => c[role]).map((c: J) => clean(c['company']?.['name'])))].slice(0, 2);
    const ci = (g['age_ratings'] ?? []).find((r: J) => r['organization']?.['name'] === 'CLASS_IND')?.['rating_category']?.['rating'] as string | undefined;
    const dates = Object.values(releases).filter(Boolean).sort() as string[];
    games[g['id']] = {
      id: g['id'],
      name: clean(g['name']),
      type: TYPE_PT[g['game_type']?.['type']] ?? null,
      cover: g['cover']?.['image_id'] ?? null,
      shots: wide(g['screenshots']).slice(0, 6),
      arts: wide(g['artworks']).slice(0, 4),
      genres: [...new Set([...(g['genres'] ?? []).map((x: J) => GENRE_PT[x['name']] ?? x['name']), ...(g['themes'] ?? []).map((x: J) => THEME_PT[x['name']]).filter(Boolean)])].slice(0, 4),
      modes: (g['game_modes'] ?? []).map((x: J) => x['name']),
      devs: company('developer'),
      pubs: company('publisher'),
      // Earliest real launch across tracked platforms; falls back to IGDB's first_release_date.
      released: dates[0] ?? day(g['first_release_date']),
      releases: Object.fromEntries(Object.entries(releases).sort((a, b) => String(a[1]).localeCompare(String(b[1])))),
      classInd: ci ? ci.replace(/^.*?(L|\d+)$/, '$1') : 'AD',
    };
  }
}
const missing = ids.filter((i) => !games[i]);
if (missing.length) console.warn(`media: IGDB nao retornou ${missing.join(', ')}`);

// ---------- calendar ----------
const end = plusDays(CAL_DAYS);
const calendar: J[] = [];
for (const m of upcoming) {
  const rec = movies[m['id']];
  if (rec?.release && rec.release >= today && rec.release <= end) calendar.push({ date: rec.release, ref: `movie:${m['id']}`, note: 'Cinemas' });
}
const byGameDay = new Map<string, J>();
for (const r of igdbReleases) {
  if ((r['date_format']?.['format'] ?? 'YYYYMMDD') !== 'YYYYMMDD' || !RELEASED.has(r['status']?.['name'])) continue;
  const date = day(r['date'])!;
  if (date < today) continue;
  const key = `${r['game']['id']}@${date}`;
  const e = byGameDay.get(key) ?? { date, ref: `game:${r['game']['id']}`, platforms: [] as string[], hype: r['game']['hypes'] };
  const p = PLATFORMS[r['platform']];
  if (!e.platforms.includes(p)) e.platforms.push(p);
  byGameDay.set(key, e);
}
calendar.push(...[...byGameDay.values()].sort((a, b) => b.hype - a.hype).slice(0, 30).map(({ hype, platforms, ...e }) => ({ ...e, note: platforms.join(' · ') })));
for (const t of Object.values(tv) as J[]) {
  // Season premieres only (episode 1), not every weekly episode.
  if (t.next?.episode === 1 && t.next.date >= today && t.next.date <= end)
    calendar.push({ date: t.next.date, ref: `tv:${t.id}`, note: t.next.season === 1 ? 'Estreia da série' : `Temporada ${t.next.season}` });
  else if (t.first >= today && t.first <= end) calendar.push({ date: t.first, ref: `tv:${t.id}`, note: 'Estreia da série' });
}
calendar.sort((a, b) => a.date.localeCompare(b.date) || a.ref.localeCompare(b.ref));

// Keep only what the site renders: refs used by posts plus calendar entries.
const keep = new Set([...calendar.map((c) => c.ref), ...postRefs]);
const only = (kind: string, all: J) => Object.fromEntries(Object.entries(all).filter(([id]) => keep.has(`${kind}:${id}`)));
const out = { source: 'TMDB + IGDB', updatedAt: today, calendar, games: only('game', games), movies: only('movie', movies), tv: only('tv', tv) };
await writeFile(new URL('../src/app/data/media.json', import.meta.url), JSON.stringify(out) + '\n');
console.log(`media: ${Object.keys(out.games).length} jogos, ${Object.keys(out.movies).length} filmes, ${Object.keys(out.tv).length} séries, ${calendar.length} datas no calendário`);
