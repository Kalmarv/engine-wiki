// The site's routes, from the files under src/content/docs (and the pages under src/pages), for checking links.
import { readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const DOCS = join(process.cwd(), 'src', 'content', 'docs');
const PAGES = join(process.cwd(), 'src', 'pages');
const NAME = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

/** Route of a content or page file: a/b.md -> /a/b/, a/index.md -> /a/. Names must be lower-case kebab. */
function routeOf(root, file) {
  const rel = relative(root, file).replaceAll('\\', '/');
  const m = rel.match(/^(.*?)\.(md|mdx|astro)$/);
  if (!m) return null;
  const parts = m[1].split('/');
  for (const p of parts) {
    if (!NAME.test(p)) throw new Error(`src/content/docs/${rel}: file and folder names are lower-case words joined by '-' ('${p}')`);
  }
  if (parts.at(-1) === 'index') parts.pop();
  return parts.length ? `/${parts.join('/')}/` : '/';
}

let cached;
export function pageRoutes() {
  if (cached) return cached;
  cached = new Set();
  for (const f of walk(DOCS)) {
    const r = routeOf(DOCS, f);
    if (r) cached.add(r);
  }
  for (const f of walk(PAGES)) {
    const r = routeOf(PAGES, f);
    if (r) cached.add(r);
  }
  return cached;
}
