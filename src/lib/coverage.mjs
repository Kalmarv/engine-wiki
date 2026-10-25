// What the wiki knows and how surely, computed from the pages: every confidence badge and every layout field is one
// claim, counted for the games it applies to, by engine, system and game. Used by the coverage page and the game hubs.
import { levels } from './confidence.mjs';
import { games as allGames } from './registry.mjs';
import { claimsOf } from './claims.mjs';
import { pageMeta } from './page-meta.mjs';

export const zero = () => Object.fromEntries(levels.map((l) => [l.id, 0]));
export const sum = (counts) => Object.values(counts).reduce((a, b) => a + b, 0);
export const strong = (counts) => counts.proven + counts.observed;
/** Non-empty levels of a count, strongest first, for drawing a bar. */
export const segs = (counts) => levels.filter((l) => counts[l.id]).map((l) => ({ id: l.id, n: counts[l.id], label: l.label }));

/** @param {any[]} docs the docs collection */
export function computeCoverage(docs) {
  const sorted = [...docs].sort((a, b) => a.id.localeCompare(b.id));
  // engine|system|game -> { counts, pages: Set<id>, impl }
  const cells = new Map();
  const cell = (e, s, g) => {
    const k = `${e}|${s}|${g}`;
    if (!cells.has(k)) cells.set(k, { counts: zero(), pages: new Set(), impl: false });
    return cells.get(k);
  };
  const gameTotals = Object.fromEntries(allGames.map((g) => [g.id, zero()]));
  const layoutsByEngine = new Map();
  const open = [];
  const untagged = [];

  for (const entry of sorted) {
    const meta = pageMeta(entry);
    const claims = claimsOf(entry.body ?? '', `src/content/docs/${entry.id}`);
    for (const q of claims.open) open.push({ q, entry, meta });
    if (meta.section !== 'engines') continue;
    const system = meta.system ?? 'overview';
    const add = (level, gamesOfClaim) => {
      for (const g of gamesOfClaim.length ? gamesOfClaim : meta.games) {
        const c = cell(meta.engine, system, g);
        c.counts[level]++;
        c.pages.add(entry.id);
        gameTotals[g][level]++;
      }
    };
    for (const b of claims.badges) add(b.level, b.games);
    for (const lay of claims.layouts) {
      for (const f of lay.fields) add(f.level, f.games.length ? f.games : lay.games);
      if (!layoutsByEngine.has(meta.engine)) layoutsByEngine.set(meta.engine, []);
      layoutsByEngine.get(meta.engine).push({ lay, entry, games: lay.games.length ? lay.games : meta.games });
    }
    for (const g of meta.games) {
      const c = cell(meta.engine, system, g);
      c.pages.add(entry.id);
      if (entry.data.implementations.length) c.impl = true;
    }
    if (!claims.badges.length && !claims.layouts.length && meta.system) untagged.push(entry);
  }
  return { cells, gameTotals, layoutsByEngine, open, untagged, docs: sorted };
}
