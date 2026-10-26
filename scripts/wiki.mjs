// The wiki from the command line: find and read pages, see what is known about a game, list what is still open, check,
// and publish. Made for agents as much as people: every reading command takes --json.
//
//   pnpm wiki search "words" [-n 10]     pages ranked by title, description, headings and text
//   pnpm wiki show <page>                one page (id, route or file), with its place, badges and open questions
//   pnpm wiki game <game|engine>         every page about a game (or an engine), by system
//   pnpm wiki open [game|engine]         the open questions, by page
//   pnpm wiki export                     every page and the registries as JSON (for indexers)
//   pnpm wiki check [paths]              the checks (same as pnpm check)
//   pnpm wiki publish                    rebase HEAD onto origin/main, check and build it in a clean worktree, push it
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { checkPages } from '../src/lib/check.mjs';
import { levelIds } from '../src/lib/confidence.mjs';
import { publicTextRules } from '../src/lib/public-text.mjs';
import { engineById, engines, gameById, games, gamesOf, systemById, systems } from '../src/lib/registry.mjs';
import { DOCS, ROOT, docFiles, idOf, readPage } from '../src/lib/source.mjs';

const USAGE = `usage: pnpm wiki <command>
  search "words" [-n 10]     pages ranked by title, description, headings and text
  show <page>                one page (id such as engines/anvil/archives/forge, a route, or a file)
  game <game|engine>         every page about a game or an engine, by system
  open [game|engine]         the open questions, by page
  export                     every page and the registries as JSON
  check [paths]              the checks (frontmatter, links, badges, layouts, public text)
  publish                    rebase HEAD onto origin/main, check and build it in a clean worktree, push it to main
Reading commands take --json.`;

class UsageError extends Error {}

// ---------------------------------------------------------------- pages

let cache;
/** Every page that reads; a page that doesn't is reported once and left out (pnpm wiki check says why). */
function pages() {
  if (cache) return cache;
  cache = [];
  for (const f of docFiles()) {
    try {
      cache.push(readPage(f));
    } catch (e) {
      console.error(`skipped: ${e.message}`);
    }
  }
  return cache;
}

const summaryOf = (p) => (typeof p.data.description === 'string' ? p.data.description : '');
const badgeLine = (b) => levelIds.map((l) => `${l[0].toUpperCase()}${b[l]}`).join(' ');
const shortGames = (ids) => ids.map((g) => gameById[g]?.short ?? g).join(', ');

/** A page from what someone would type: an id, a route, a file path, with or without a leading prefix such as "engine:". */
function findPage(arg) {
  const all = pages();
  const raw = arg.trim().replace(/^[a-z]+:(?!\/\/)(?=[a-z])/i, '');
  const asFile = [resolve(ROOT, raw), resolve(DOCS, raw)].find((p) => existsSync(p) && statSync(p).isFile());
  const id = asFile ? idOf(asFile) : raw.replace(/^\/+|\/+$/g, '').replace(/\.mdx?$/, '').replace(/(^|\/)index$/, '');
  const hit = all.find((p) => p.id === id);
  if (hit) return hit;
  const near = search(id.replace(/[/-]/g, ' '), 5).map((h) => h.page.id);
  throw new UsageError(`no page ${arg}${near.length ? `. Did you mean: ${near.join(', ')}?` : ''}`);
}

// ---------------------------------------------------------------- search

const words = (s) => s.toLowerCase().match(/[\p{L}\p{N}_]+/gu) ?? [];

/** Pages where every query word starts a word somewhere, ranked by where they match: title, description, headings, text. */
function search(query, limit) {
  const q = [...new Set(words(query))];
  if (!q.length) throw new UsageError('search needs words');
  const hits = [];
  for (const page of pages()) {
    const headings = page.body.split(/\r?\n/).filter((l) => /^#{1,6}\s/.test(l)).join(' ');
    const fields = [
      [words(`${page.data.title} ${page.id.replace(/[/-]/g, ' ')}`), 8],
      [words(summaryOf(page)), 4],
      [words(headings), 3],
      [words(page.body), 1],
    ];
    let score = 0;
    let all = true;
    for (const w of q) {
      let best = 0;
      let count = 0;
      for (const [tokens, weight] of fields) {
        const n = tokens.filter((t) => t.startsWith(w)).length;
        if (n && weight > best) best = weight;
        if (weight === 1) count = n;
      }
      if (!best) {
        all = false;
        break;
      }
      score += best + Math.log2(1 + count);
    }
    if (all) hits.push({ page, score });
  }
  return hits.sort((a, b) => b.score - a.score || a.page.id.localeCompare(b.page.id)).slice(0, limit);
}

/** The first line of a page's text that holds a query word, the words marked. */
function snippet(page, query) {
  const q = words(query);
  const line = page.body.split(/\r?\n/).find((l) => !l.startsWith('#') && q.some((w) => words(l).some((t) => t.startsWith(w))));
  if (!line) return '';
  const marked = line.trim().replace(/[\p{L}\p{N}_]+/gu, (t) => (q.some((w) => t.toLowerCase().startsWith(w)) ? `«${t}»` : t));
  return marked.length > 160 ? `${marked.slice(0, 159)}…` : marked;
}

// ---------------------------------------------------------------- games and engines

/** The pages about a game or an engine: its engine's pages that cover it, its hub, and other pages naming it or linking to its engine. */
function pagesAbout(id) {
  const game = gameById[id];
  const engine = game ? game.engine : engineById[id] ? id : null;
  if (!engine) throw new UsageError(`'${id}' is not a game or an engine (src/data/games.yaml, engines.yaml)`);
  const ids = game ? [id] : gamesOf(engine).map((g) => g.id);
  const link = `](/engines/${engine}/`;
  return {
    game,
    engine: engineById[engine],
    pages: pages().filter((p) => (p.engine === engine ? p.games.some((g) => ids.includes(g)) : p.games.some((g) => ids.includes(g)) || p.body.includes(link))),
  };
}

const systemOrder = (p) => (p.system ? systems.findIndex((s) => s.id === p.system) : p.engine ? -1 : systems.length);

function groupBySystem(list) {
  const groups = new Map();
  for (const p of [...list].sort((a, b) => systemOrder(a) - systemOrder(b) || a.id.localeCompare(b.id))) {
    const key = p.system ? systemById[p.system].name : p.engine ? 'Overview' : 'Across engines';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(p);
  }
  return groups;
}

const totalsOf = (list) => Object.fromEntries(levelIds.map((l) => [l, list.reduce((n, p) => n + p.badges[l], 0)]));

// ---------------------------------------------------------------- output

const pageJson = (p, withBody = false) => ({
  id: p.id,
  file: p.rel,
  title: p.data.title,
  summary: summaryOf(p),
  engine: p.engine,
  system: p.system,
  games: p.games,
  badges: p.badges,
  open: p.open,
  ...(withBody ? { body: p.body } : {}),
});

function print(json, data, text) {
  if (json) console.log(JSON.stringify(data, null, 2));
  else console.log(text());
}

// ---------------------------------------------------------------- commands

function cmdSearch(args, json) {
  const n = args.indexOf('-n');
  const limit = n >= 0 ? Number(args.splice(n, 2)[1]) || 10 : 10;
  const query = args.join(' ');
  const hits = search(query, limit);
  print(json, hits.map((h) => ({ ...pageJson(h.page), score: Number(h.score.toFixed(2)) })), () =>
    hits.length
      ? hits
          .map(({ page: p }) => {
            const where = [p.engine && engineById[p.engine].name, p.system && systemById[p.system].name].filter(Boolean).join(' · ');
            const s = snippet(p, query);
            return `${p.id}: ${p.data.title}. ${summaryOf(p)}\n    [${[where, badgeLine(p.badges), p.open.length ? `${p.open.length} open` : ''].filter(Boolean).join(' · ')}]${s ? `\n    … ${s}` : ''}`;
          })
          .join('\n')
      : `no page matches "${query}"`,
  );
}

function cmdShow(args, json) {
  if (!args.length) throw new UsageError('show needs a page');
  const p = findPage(args.join(' '));
  print(json, pageJson(p, true), () => {
    const head = [
      `# ${p.data.title}  (${p.id})`,
      summaryOf(p),
      [p.engine && `Engine: ${engineById[p.engine].name}`, p.system && `System: ${systemById[p.system].name}`, p.games.length && `Games: ${shortGames(p.games)}`].filter(Boolean).join(' · '),
      `Badges: ${levelIds.map((l) => `${l} ${p.badges[l]}`).join(', ')}${p.open.length ? ` · Open questions: ${p.open.length}` : ''}`,
      `File: ${p.rel}`,
      p.data.sources?.length && `Sources: ${p.data.sources.map((s) => s.title).join('; ')}`,
    ];
    return [...head.filter(Boolean), '', p.body.trim()].join('\n');
  });
}

function cmdGame(args, json) {
  if (args.length !== 1) throw new UsageError('game needs one game or engine id');
  const { game, engine, pages: list } = pagesAbout(args[0]);
  const totals = totalsOf(list);
  const open = list.reduce((n, p) => n + p.open.length, 0);
  print(
    json,
    { game: game ?? null, engine: { id: engine.id, name: engine.name }, badges: totals, open, pages: list.map((p) => pageJson(p)) },
    () => {
      const head = game ? `${game.name} (${game.id}) · ${engine.name} · ${game.build}` : `${engine.name} (${engine.id}) · ${gamesOf(engine.id).map((g) => g.short).join(', ')}`;
      const out = [head, `${list.length} pages · ${badgeLine(totals)} · ${open} open questions`];
      for (const [name, group] of groupBySystem(list)) {
        out.push('', name);
        for (const p of group) out.push(`  ${p.id}: ${p.data.title}  [${badgeLine(p.badges)}${p.open.length ? ` · ${p.open.length} open` : ''}]`);
      }
      return out.join('\n');
    },
  );
}

function cmdOpen(args, json) {
  if (args.length > 1) throw new UsageError('open takes at most one game or engine id');
  const list = (args.length ? pagesAbout(args[0]).pages : pages()).filter((p) => p.open.length || p.badges.unknown);
  print(
    json,
    list.map((p) => ({ id: p.id, title: p.data.title, open: p.open, unknown: p.badges.unknown })),
    () =>
      list.length
        ? list
            .filter((p) => p.open.length)
            .map((p) => `${p.id}: ${p.data.title}${p.badges.unknown ? ` (${p.badges.unknown} unknown)` : ''}\n${p.open.map((q) => `  - ${q}`).join('\n')}`)
            .join('\n') + `\n\n${list.reduce((n, p) => n + p.open.length, 0)} open questions; ${list.reduce((n, p) => n + p.badges.unknown, 0)} statements marked unknown`
        : 'no open questions',
  );
}

function cmdExport() {
  console.log(
    JSON.stringify({
      games: games.map((g) => ({ id: g.id, name: g.name, short: g.short, engine: g.engine })),
      engines: engines.map((e) => ({ id: e.id, name: e.name, summary: e.summary })),
      systems: systems.map((s) => ({ id: s.id, name: s.name })),
      pages: pages().map((p) => pageJson(p, true)),
    }),
  );
}

function cmdCheck(args) {
  const { files, errors, totals } = checkPages(args);
  for (const e of errors) console.error(`✗ ${e}`);
  const n = Object.values(totals).reduce((a, b) => a + b, 0);
  console.log(`${files.length} page(s) checked, ${errors.length} error(s); ${n} badges (${levelIds.map((l) => `${l} ${totals[l]}`).join(', ')})`);
  return errors.length ? 1 : 0;
}

// ---------------------------------------------------------------- publish

function run(cmd, args, opts = {}) {
  // pnpm as the pnpm running this script (it sets npm_execpath): a standalone executable is started as it is, a
  // JavaScript one through this Node. A bare `pnpm` on Windows is a .cmd, which only starts through a shell.
  const pnpm = cmd === 'pnpm' ? process.env.npm_execpath : undefined;
  const [file, argv] = pnpm ? (/\.[cm]?js$/.test(pnpm) ? [process.execPath, [pnpm, ...args]] : [pnpm, args]) : [cmd, args];
  const r = spawnSync(file, argv, { cwd: opts.cwd ?? ROOT, encoding: 'utf8', shell: process.platform === 'win32' && file === 'pnpm', env: opts.env ?? process.env, maxBuffer: 256 << 20 });
  if (r.error) throw r.error;
  if (r.status !== 0 && !opts.allowFail) throw new Error(`${cmd} ${args.join(' ')} failed (${r.status}):\n${(r.stderr || r.stdout).trim()}`);
  return { out: (r.stdout ?? '').trim(), err: (r.stderr ?? '').trim(), code: r.status };
}
const git = (args, opts) => run('git', args, opts);

/** One publish at a time per repository (its worktrees share it); a lock older than 30 minutes is a crashed run's. */
function lock(main) {
  const dir = join(main, '.wt', 'publish.lock');
  mkdirSync(dirname(dir), { recursive: true });
  const until = Date.now() + 20 * 60_000;
  for (;;) {
    try {
      mkdirSync(dir);
      writeFileSync(join(dir, 'pid'), String(process.pid));
      return () => rmSync(dir, { recursive: true, force: true });
    } catch (e) {
      if (e.code !== 'EEXIST') throw e;
      if (Date.now() - statSync(dir).mtimeMs > 30 * 60_000) rmSync(dir, { recursive: true, force: true });
      else if (Date.now() > until) throw new Error(`another publish has held ${relative(ROOT, dir)} for 20 minutes`);
      else Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 2000);
    }
  }
}

/** Lines the commits add, and their messages, checked against public-text.mjs. */
function publicProblems(cwd, base, sha) {
  const check = publicTextRules();
  const problems = [];
  for (const c of git(['rev-list', `${base}..${sha}`], { cwd }).out.split('\n').filter(Boolean)) {
    git(['log', '-1', '--format=%B', c], { cwd }).out.split('\n').forEach((l, i) => {
      const why = check(l);
      if (why) problems.push(`commit ${c.slice(0, 7)} message line ${i + 1}: ${why}`);
    });
  }
  let file = '';
  let line = 0;
  for (const l of git(['diff', '-U0', '--no-color', '--no-ext-diff', base, sha], { cwd }).out.split('\n')) {
    if (l.startsWith('+++ ')) file = l.slice(6);
    else if (l.startsWith('@@')) line = Number(l.match(/\+(\d+)/)?.[1] ?? 0);
    else if (l.startsWith('+')) {
      const why = check(l.slice(1));
      if (why) problems.push(`${file}:${line}: ${why}`);
      line++;
    }
  }
  return problems;
}

function cmdPublish(args) {
  const dry = args.includes('--dry-run');
  const head = git(['rev-parse', 'HEAD']).out;
  // The main checkout (the parent of the common .git), whichever worktree this runs in: its .wt/ holds the build worktree.
  const main = dirname(resolve(ROOT, git(['rev-parse', '--path-format=absolute', '--git-common-dir']).out));
  const wt = join(main, '.wt', 'head');
  const unlock = lock(main);
  try {
    for (let attempt = 1; ; attempt++) {
      git(['fetch', '-q', 'origin', 'main']);
      const base = git(['rev-parse', 'origin/main']).out;
      if (git(['merge-base', '--is-ancestor', head, base], { allowFail: true }).code === 0) {
        console.log(`nothing to publish: ${head.slice(0, 7)} is already on main (${base.slice(0, 7)})`);
        return 0;
      }
      if (!existsSync(wt)) git(['worktree', 'add', '-q', '--detach', wt, head]);
      git(['checkout', '-q', '--force', '--detach', head], { cwd: wt });
      git(['clean', '-fdq'], { cwd: wt });
      if (git(['rebase', '-q', base], { cwd: wt, allowFail: true }).code !== 0) {
        const files = git(['diff', '--name-only', '--diff-filter=U'], { cwd: wt, allowFail: true }).out;
        git(['rebase', '--abort'], { cwd: wt, allowFail: true });
        console.error(`✗ HEAD doesn't rebase cleanly onto origin/main; conflicts in:\n${files}\nRebase or merge origin/main yourself, then publish again.`);
        return 1;
      }
      const sha = git(['rev-parse', 'HEAD'], { cwd: wt }).out;
      const leaks = publicProblems(wt, base, sha);
      if (leaks.length) {
        for (const l of leaks) console.error(`✗ ${l}`);
        console.error('Nothing was pushed.');
        return 1;
      }
      run('pnpm', ['install', '--frozen-lockfile', '--prefer-offline', '--silent'], { cwd: wt });
      // Private names were checked above, on what the commits add: text already on main isn't held to a list that
      // grows with every new name.
      const { WIKI_PRIVATE_NAMES_FILE: _names, ...env } = process.env;
      const check = run('pnpm', ['-s', 'check'], { cwd: wt, allowFail: true, env });
      if (check.code !== 0) {
        console.error(`${check.err}\n${check.out}\n✗ the checks fail on ${sha.slice(0, 7)}; nothing was pushed.`);
        return 1;
      }
      const build = run('pnpm', ['-s', 'build'], { cwd: wt, allowFail: true });
      writeFileSync(join(main, '.wt', 'head-build.log'), `${build.out}\n${build.err}`);
      if (build.code !== 0) {
        const lines = `${build.out}\n${build.err}`.split('\n').filter((l) => /error/i.test(l)).slice(0, 20);
        console.error(`${lines.join('\n')}\n✗ the build fails on ${sha.slice(0, 7)} (log: .wt/head-build.log); nothing was pushed.`);
        return 1;
      }
      const built = `${build.out}\n${build.err}`.match(/\d+ page\(s\) built[^\n]*/)?.[0] ?? 'built';
      if (dry) {
        console.log(`${check.out.split('\n').at(-1)}\n${built}\nwould push ${sha.slice(0, 7)} to main (--dry-run)`);
        return 0;
      }
      const push = git(['push', '-q', 'origin', `${sha}:refs/heads/main`], { allowFail: true });
      if (push.code !== 0) {
        if (attempt < 2 && /rejected|non-fast-forward|fetch first/i.test(push.err)) {
          console.log('main moved while building; rebasing and checking again');
          continue;
        }
        console.error(`✗ push failed:\n${push.err}`);
        return 1;
      }
      console.log(`${check.out.split('\n').at(-1)}\n${built}\npublished ${sha} to main`);
      // Bring this branch level with what was pushed when nothing here is in the way; the replayed commits are already on main.
      if (sha !== head && git(['rev-parse', 'HEAD']).out === head && !git(['status', '--porcelain', '--untracked-files=no']).out) {
        if (git(['rebase', '-q', 'origin/main'], { allowFail: true }).code !== 0) {
          git(['rebase', '--abort'], { allowFail: true });
          console.log('this branch still has the commits as they were before the rebase: git pull --rebase brings it level');
        }
      } else if (sha !== head) console.log('this branch still has the commits as they were before the rebase: git pull --rebase brings it level');
      return 0;
    }
  } finally {
    unlock();
  }
}

// ---------------------------------------------------------------- main

// Exit codes go in process.exitCode, never process.exit(): writes to a pipe are asynchronous on Linux and macOS, and
// exiting at once cuts long output (an export into jq) short.
const argv = process.argv.slice(2);
const json = argv.includes('--json');
const [cmd, ...args] = argv.filter((a) => a !== '--json');
const commands = { search: cmdSearch, show: cmdShow, game: cmdGame, open: cmdOpen, export: cmdExport, check: cmdCheck, publish: cmdPublish };
try {
  if (!cmd || cmd === 'help' || cmd === '--help' || !commands[cmd]) {
    console.log(USAGE);
    process.exitCode = cmd && !['help', '--help'].includes(cmd) ? 2 : 0;
  } else process.exitCode = (await commands[cmd](args, json)) ?? 0;
} catch (e) {
  console.error(e instanceof UsageError ? e.message : (e.stack ?? String(e)));
  process.exitCode = e instanceof UsageError ? 2 : 1;
}
