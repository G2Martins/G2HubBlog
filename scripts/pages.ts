// Publishes the static build to /docs (GitHub Pages source: main branch, /docs folder, base /G2HubBlog/).
import { cp, rm, writeFile } from 'node:fs/promises';

const dist = new URL('../dist/g2-hub/browser/', import.meta.url);
const docs = new URL('../docs/', import.meta.url);

// ponytail: async cp on purpose: Node 22's native cpSync exits 127 silently on non-ASCII paths ("Programação").
await rm(docs, { recursive: true, force: true });
await cp(dist, docs, { recursive: true });
await writeFile(new URL('.nojekyll', docs), '');
// Every real route is prerendered; unknown URLs boot the client app, whose router shows the 404 page.
await cp(new URL('index.csr.html', dist), new URL('404.html', docs));
console.log('pages: dist/g2-hub/browser -> docs/ (+ .nojekyll, 404.html)');
