// App-side selectors over the generated post index. No bodies and no media.json here: listing pages stay light.
import { POSTS, TAGS, WEEK } from './posts.gen';
import { FEATURED, KINDS, MOST_READ, SECTIONS } from './site';
import { slugify } from './media';
import type { Kind, PostMeta, Ref, Section } from './types';

export { POSTS, TAGS, WEEK };

const bySlug = new Map(POSTS.map((p) => [p.slug, p]));
export const findPost = (slug: string) => bySlug.get(slug);

export const sectionLabel = (s: Section) => SECTIONS[s].label;
export const kindLabel = (k: Kind) => KINDS[k];
export const tagSlug = slugify;
export const tagName = (slug: string) => TAGS.find((t) => t.slug === slug)?.name;

export const featured = () => findPost(FEATURED) ?? POSTS[0];
export const mostRead = () => MOST_READ.map(findPost).filter((p): p is PostMeta => !!p);
export const inSection = (s: Section) => POSTS.filter((p) => p.section === s);
/** /guias groups guides and lists. */
export const ofKind = (k: Kind) => POSTS.filter((p) => (k === 'guia' ? p.kind === 'guia' || p.kind === 'lista' : p.kind === k));
export const withTag = (slug: string) => POSTS.filter((p) => p.tags.some((t) => slugify(t) === slug));

/** First post (newest) that covers a media ref, for linking calendar entries to coverage. */
export const coverage = (ref: Ref) => POSTS.find((p) => p.refs.includes(ref));

/** Related: shared tags weigh most, then same section; newest first on ties. */
export function related(p: PostMeta, n = 3): PostMeta[] {
  const score = (o: PostMeta) => o.tags.filter((t) => p.tags.includes(t)).length * 2 + (o.section === p.section ? 1 : 0);
  return POSTS.filter((o) => o.slug !== p.slug)
    .map((o) => ({ o, s: score(o) }))
    .sort((a, b) => b.s - a.s || b.o.date.localeCompare(a.o.date))
    .slice(0, n)
    .map((x) => x.o);
}

/** Chronological neighbours: prev = older, next = newer. */
export function neighbors(slug: string) {
  const i = POSTS.findIndex((p) => p.slug === slug);
  return { prev: POSTS[i + 1] ?? null, next: i > 0 ? POSTS[i - 1] : null };
}
