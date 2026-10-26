// A fast check of every page, without building the site (src/lib/check.mjs). Writes nothing, so any number of writers
// can run it at once in one checkout.
//
//   pnpm check            every page
//   pnpm check <path>...  only these files or folders (paths under src/content/docs, or relative to the repo)
import { checkPages } from '../src/lib/check.mjs';

const { files, errors, totals } = checkPages(process.argv.slice(2));
for (const e of errors) console.error(`✗ ${e}`);
const n = Object.values(totals).reduce((a, b) => a + b, 0);
console.log(`${files.length} page(s) checked, ${errors.length} error(s); ${n} badges (${Object.entries(totals).map(([k, v]) => `${k} ${v}`).join(', ')})`);
process.exit(errors.length ? 1 : 0);
