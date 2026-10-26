// What a public repository must not contain: local paths, and the private names (machines, accounts, the people and
// programs that did the work) listed in a file outside the repository. The wiki states how the games work; where our
// files live and who found something stay out of it (guide/writing.md, "What the wiki does not say").
//
// The names come from the file WIKI_PRIVATE_NAMES_FILE names, one per line ('#' starts a comment), matched as whole
// words in any case; a name that is also a file or folder name here is the wiki's own word and isn't checked. The
// repository itself never lists them. Publishing checks them on what the commits add; `pnpm check` with the variable
// set checks whole pages (an audit).
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const LOCAL = [
  { rx: /\b[a-z]:(\\\\?|\/)users(\\\\?|\/)/i, what: "a local Windows user folder path" },
  { rx: /(^|[^\w.])\/(mnt\/)?[a-z]\/users\//i, what: "a local Windows user folder path in Unix form" },
  { rx: /(^|[^\w.])\/(home|Users)\/[\w.-]+\//, what: 'a home folder path' },
];

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * The private names from WIKI_PRIVATE_NAMES_FILE (none when it isn't set), less the file and folder names of the
 * repository (`words`): a name that is also a page or a folder here (`far-view`, `texture-map`) is the wiki's word.
 */
export function privateNames(env = process.env, words = repoWords()) {
  const file = env.WIKI_PRIVATE_NAMES_FILE;
  if (!file) return [];
  let text;
  try {
    text = readFileSync(file, 'utf8');
  } catch (e) {
    throw new Error(`WIKI_PRIVATE_NAMES_FILE: can't read ${file}: ${e.message}`);
  }
  const names = text.split(/\r?\n/).map((l) => l.replace(/#.*/, '').trim()).filter(Boolean);
  return [...new Set(names)].filter((n) => !words.has(n.toLowerCase()));
}

/** Every file and folder name the repository tracks, with and without its extension, lower-case. */
function repoWords() {
  const r = spawnSync('git', ['ls-files', '-z'], { encoding: 'utf8', maxBuffer: 64 << 20 });
  const words = new Set();
  for (const f of r.status === 0 ? r.stdout.split('\0') : []) {
    for (const s of f.split('/').filter(Boolean)) {
      words.add(s.toLowerCase());
      words.add(s.replace(/\.[^.]*$/, '').toLowerCase());
    }
  }
  return words;
}

/** A checker for lines of text: returns what is wrong with a line, or null. */
export function publicTextRules(names = privateNames()) {
  const named = names.map((n) => ({ name: n, rx: new RegExp(`(?<![\\w-])${escape(n)}(?![\\w-])`, 'i') }));
  return (line) => {
    for (const r of LOCAL) {
      const m = line.match(r.rx);
      if (m) return `${r.what} ('${m[0].trim()}'): say where the file is inside the game, not on our disks`;
    }
    for (const n of named) if (n.rx.test(line)) return `a private name ('${n.name}'): describe the method, not the machine, account or who did it`;
    return null;
  };
}
