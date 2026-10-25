// A fast check of every page, without building the site: frontmatter (YAML, title, games, sources), the page's place
// (engine, system, games), and the Markdown extensions through the same plugin the site uses (badges, scopes, open
// questions, layouts, links). Writes nothing, so any number of writers can run it at once in one checkout.
//
//   pnpm check            every page
//   pnpm check <path>...  only these files or folders (paths under src/content/docs, or relative to the repo)
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { load as loadYaml } from 'js-yaml';
import { markdownToHtml } from 'satteri';
import { wikiMarkdown } from '../src/lib/markdown.mjs';
import { claimsOf } from '../src/lib/claims.mjs';
import { pageMeta } from '../src/lib/page-meta.mjs';
import { pageRoutes } from '../src/lib/pages.mjs';
import { gameById } from '../src/lib/registry.mjs';

const ROOT = process.cwd();
const DOCS = join(ROOT, 'src', 'content', 'docs');

function walk(p, out = []) {
  if (statSync(p).isDirectory()) for (const n of readdirSync(p)) walk(join(p, n), out);
  else if (/\.mdx?$/.test(p)) out.push(p);
  return out;
}

const args = process.argv.slice(2);
const targets = args.length
  ? args.map((a) => {
      const p = [resolve(ROOT, a), resolve(DOCS, a)].find((x) => {
        try {
          statSync(x);
          return true;
        } catch {
          return false;
        }
      });
      if (!p) throw new Error(`no file or folder ${a}`);
      return p;
    })
  : [DOCS];
const files = [...new Set(targets.flatMap((t) => walk(t)))].sort();

pageRoutes(); // checks every file name in the site, and is what links are checked against
const plugin = wikiMarkdown({ base: '/' });
const errors = [];
const totals = { proven: 0, observed: 0, sourced: 0, inferred: 0, unknown: 0 };

for (const file of files) {
  const rel = relative(ROOT, file).replaceAll('\\', '/');
  try {
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
    // Starlight's entry id: the path without its extension, a folder's index.md being the folder itself.
    const id = relative(DOCS, file).replaceAll('\\', '/').replace(/\.mdx?$/, '').replace(/(^|\/)index$/, '');
    pageMeta({ id, data });
    const body = text.slice(m[0].length);
    markdownToHtml(body, { features: { directive: true, gfm: true, frontmatter: false }, mdastPlugins: [plugin], fileURL: pathToFileURL(file) });
    for (const b of claimsOf(body, rel).badges) totals[b.level]++;
  } catch (e) {
    errors.push(e.message);
  }
}

for (const e of errors) console.error(`✗ ${e}`);
const n = Object.values(totals).reduce((a, b) => a + b, 0);
console.log(`${files.length} page(s) checked, ${errors.length} with errors; ${n} badges (${Object.entries(totals).map(([k, v]) => `${k} ${v}`).join(', ')})`);
process.exit(errors.length ? 1 : 0);
