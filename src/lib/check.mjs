// A fast check of pages, without building the site: frontmatter (YAML, title, games, sources), the page's place
// (engine, system, games), the Markdown extensions through the same plugin the site uses (badges, scopes, open
// questions, layouts, links), and nothing a public repository must not hold (public-text.mjs). Writes nothing, so any
// number of writers can run it at once in one checkout.
import { pathToFileURL } from 'node:url';
import { markdownToHtml } from 'satteri';
import { wikiMarkdown } from './markdown.mjs';
import { levelIds } from './confidence.mjs';
import { pageRoutes } from './pages.mjs';
import { publicTextRules } from './public-text.mjs';
import { docFiles, readPage } from './source.mjs';

/** Checks the pages under these paths (every page without any). */
export function checkPages(targets = []) {
  const files = docFiles(targets);
  pageRoutes(); // checks every file name in the site, and is what links are checked against
  const plugin = wikiMarkdown({ base: '/' });
  const publicText = publicTextRules();
  const errors = [];
  const totals = Object.fromEntries(levelIds.map((l) => [l, 0]));
  for (const file of files) {
    try {
      const page = readPage(file);
      markdownToHtml(page.body, { features: { directive: true, gfm: true, frontmatter: false }, mdastPlugins: [plugin], fileURL: pathToFileURL(file) });
      for (const l of levelIds) totals[l] += page.badges[l];
      // Frontmatter lines too: a source's note can leak a path as easily as the text.
      page.text.split(/\r?\n/).forEach((line, i) => {
        const why = publicText(line);
        if (why) errors.push(`${page.rel}:${i + 1}: ${why}`);
      });
    } catch (e) {
      errors.push(e.message);
    }
  }
  return { files, errors, totals };
}
