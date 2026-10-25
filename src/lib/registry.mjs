// The wiki's registries (games, engines, systems), read from src/data. Used by the content schema, the Markdown
// plugins (to check game ids in directives) and the coverage page. Paths are from the project root, which is the
// working directory for `astro dev`, `astro build` and the config.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { load as loadYaml } from 'js-yaml';

const read = (name) => loadYaml(readFileSync(join(process.cwd(), 'src', 'data', name), 'utf8'));

const enginesFile = read('engines.yaml');

export const engines = enginesFile.engines;
export const systems = enginesFile.systems;
export const games = read('games.yaml');

export const gameIds = games.map((g) => g.id);
export const engineIds = engines.map((e) => e.id);
export const systemIds = systems.map((s) => s.id);

export const gameById = Object.fromEntries(games.map((g) => [g.id, g]));
export const engineById = Object.fromEntries(engines.map((e) => [e.id, e]));
export const systemById = Object.fromEntries(systems.map((s) => [s.id, s]));

for (const g of games) {
  if (!engineById[g.engine]) throw new Error(`games.yaml: ${g.id} names engine '${g.engine}', not in engines.yaml`);
}
for (const list of [gameIds, engineIds, systemIds]) {
  const seen = new Set();
  for (const id of list) {
    if (seen.has(id)) throw new Error(`src/data: id '${id}' is listed twice`);
    seen.add(id);
  }
}

/** The games of an engine, in games.yaml order. */
export const gamesOf = (engine) => games.filter((g) => g.engine === engine);

/** Game ids from a directive label or attribute: separated by spaces or commas; each must be in games.yaml. */
export function parseGameList(text, where) {
  const ids = text.split(/[\s,]+/).filter(Boolean);
  if (!ids.length) throw new Error(`${where}: no game named`);
  for (const id of ids) {
    if (!gameById[id]) throw new Error(`${where}: '${id}' is not a game id (src/data/games.yaml: ${gameIds.join(', ')})`);
  }
  return ids;
}
