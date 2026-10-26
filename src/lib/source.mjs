// The wiki's pages as files on disk, for the scripts (check, the wiki command): where they are, their frontmatter and
// body, and their place (engine, system, games). The site itself reads them through Starlight's content collection.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { basename, join, relative, resolve } from 'node:path';
import { load as loadYaml } from 'js-yaml';
import { claimsOf } from './claims.mjs';
import { levelIds } from './confidence.mjs';
import { pageMeta } from './page-meta.mjs';
import { gameById } from './registry.mjs';

export const ROOT = process.cwd();
export const DOCS = join(ROOT, 'src', 'content', 'docs');

function walk(p, out = []) {
  if (statSync(p).isDirectory()) for (const n of readdirSync(p)) walk(join(p, n), out);
  else if (/\.mdx?$/.test(p)) out.push(p);
  return out;
}

const exists = (p) => {
  try {
    statSync(p);
    return true;
  } catch {
    return false;
  }
};

/** The page files under these files or folders (paths relative to the repo or to src/content/docs); all without any. */
export function docFiles(targets = []) {
  const roots = targets.length
    ? targets.map((a) => {
        const p = [resolve(ROOT, a), resolve(DOCS, a)].find(exists);
        if (!p) throw new Error(`no file or folder ${a}`);
        return p;
      })
    : [DOCS];
  return [...new Set(roots.flatMap((t) => walk(t)))].sort();
}

/** Starlight's entry id: the path under src/content/docs without its extension, a folder's index.md being the folder. */
export const idOf = (file) =>
  relative(DOCS, file).replaceAll('\\', '/').replace(/\.mdx?$/, '').replace(/(^|\/)index$/, '');

/**
 * One page: its frontmatter checked the way the content schema checks it, its place, and what it claims. Throws with
 * the file and the problem on anything the build would refuse in the frontmatter.
 */
export function readPage(file) {
  const rel = relative(ROOT, file).replaceAll('\\', '/');
  const text = readFileSync(file, 'utf8');
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) throw new Error(`${rel}: no frontmatter (--- title: ... ---)`);
  let data;
  try {
    data = loadYaml(m[1]) ?? {};
  } catch (e) {
    throw new Error(`${rel}: frontmatter is not valid YAML (quote values containing ': '): ${e.message.split('\n')[0]}`);
  }
  if (typeof data.title !== 'string' || !data.title) throw new Error(`${rel}: frontmatter needs a title`);
  if (data.games !== undefined) {
    if (!Array.isArray(data.games)) throw new Error(`${rel}: games must be a list`);
    for (const g of data.games) if (!gameById[g]) throw new Error(`${rel}: games: '${g}' is not in src/data/games.yaml`);
  }
  for (const key of ['sources', 'implementations']) {
    if (data[key] === undefined) continue;
    if (!Array.isArray(data[key])) throw new Error(`${rel}: ${key} must be a list`);
    const need = key === 'sources' ? 'title' : 'name';
    for (const s of data[key]) {
      if (!s || typeof s[need] !== 'string') throw new Error(`${rel}: each of ${key} needs a ${need}`);
      if (s.url !== undefined && !/^https?:\/\//.test(s.url)) throw new Error(`${rel}: ${key} url '${s.url}' is not a full URL`);
    }
  }
  const id = idOf(file);
  const meta = pageMeta({ id, data });
  // A game's hub is about that game even when its frontmatter doesn't say so.
  const hub = meta.section === 'games' && gameById[basename(id)] ? [basename(id)] : [];
  const games = meta.games.length ? meta.games : hub;
  const body = text.slice(m[0].length);
  const claims = claimsOf(body, rel);
  const badges = Object.fromEntries(levelIds.map((l) => [l, 0]));
  for (const b of claims.badges) badges[b.level]++;
  return { file, rel, id, text, data, body, engine: meta.engine, system: meta.system, section: meta.section, games, badges, open: claims.open };
}
