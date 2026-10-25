// A page's place in the wiki, from its path: engines/<engine>/<system>/... An engine page covers the games its
// frontmatter lists, or every game of its engine; each listed game must be one of that engine's.
import { engineById, gameById, gamesOf, systemById } from './registry.mjs';

export function pageMeta(entry) {
  const parts = entry.id.split('/');
  const where = `src/content/docs/${entry.id}`;
  if (parts[0] !== 'engines' || parts.length < 2) {
    return { section: parts[0] || 'home', engine: null, system: null, games: entry.data.games ?? [] };
  }
  const engine = parts[1];
  if (!engineById[engine]) throw new Error(`${where}: engines/${engine} is not an engine in src/data/engines.yaml`);
  const system = parts.length >= 3 ? parts[2] : null;
  if (system && !systemById[system]) {
    throw new Error(`${where}: '${system}' is not a system in src/data/engines.yaml (folders under an engine are its systems)`);
  }
  const games = entry.data.games ?? gamesOf(engine).map((g) => g.id);
  for (const g of games) {
    if (gameById[g].engine !== engine) throw new Error(`${where}: game '${g}' runs on ${gameById[g].engine}, not ${engine}`);
  }
  return { section: 'engines', engine, system, games };
}
