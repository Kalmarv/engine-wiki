// The wiki's Markdown extensions, as one Sätteri mdast plugin. Every one of them fails the build on a mistake
// (an unknown game id, a malformed layout, a link to a page that doesn't exist) so the wiki can't drift quietly.
//
//   :proven  :observed  :sourced  :inferred  :unknown      a confidence badge; [label] adds a scope note,
//                                                          {games="sekiro elden-ring"} limits it to those games
//   :only[elden-ring]  :since[sekiro]  :not[sekiro]  :in[sekiro elden-ring]    which games a statement applies to
//   :::open[Title] ... :::                                 an open question (listed on the coverage page)
//   ```layout                                              a byte layout (layout.mjs)
//   [text](/engines/fromsoft/...)                          internal links: absolute, checked, base path added
import { fileURLToPath } from 'node:url';
import { relative } from 'node:path';
import { checkLevel, isLevel, levelById } from './confidence.mjs';
import { parseLayout, renderLayout } from './layout.mjs';
import { gameById, parseGameList } from './registry.mjs';
import { pageRoutes } from './pages.mjs';

const SCOPES = { only: 'only in', since: 'since', not: 'not in', in: 'in' };

const span = (className, title, text) => ({
  type: 'emphasis',
  data: { hName: 'span', hProperties: { className, ...(title ? { title } : {}) } },
  children: [{ type: 'text', value: text }],
});

const div = (className, children) => ({
  type: 'paragraph',
  data: { hName: 'div', hProperties: { className } },
  children,
});

/** @param {{ base: string }} options */
export function wikiMarkdown({ base }) {
  const prefix = base.replace(/\/$/, '');
  const routes = pageRoutes();
  return ({ fileURL }) => {
    const file = fileURL ? relative(process.cwd(), fileURLToPath(fileURL)).replaceAll('\\', '/') : 'markdown';
    return {
      name: 'wiki-markdown',
      textDirective(node, ctx) {
        const where = `${file}: :${node.name}`;
        const label = ctx.textContent(node).trim();
        if (isLevel(node.name)) {
          const lv = levelById[checkLevel(node.name, where)];
          const games = node.attributes?.games ? parseGameList(node.attributes.games, where) : [];
          const scope = [games.map((g) => gameById[g].short).join(', '), label].filter(Boolean).join(' · ');
          return span(['conf', `conf-${lv.id}`], lv.meaning, scope ? `${lv.label} · ${scope}` : lv.label);
        }
        if (Object.hasOwn(SCOPES, node.name)) {
          const games = parseGameList(label, where);
          return span(['scope', `scope-${node.name}`], null, `${SCOPES[node.name]} ${games.map((g) => gameById[g].short).join(', ')}`);
        }
        return undefined; // not ours: Starlight restores it as text
      },
      containerDirective(node, ctx) {
        if (node.name !== 'open') return undefined;
        const children = [...node.children];
        let title = [{ type: 'text', value: 'Open question' }];
        if (children[0]?.type === 'paragraph' && children[0].data?.directiveLabel) title = children.shift().children;
        return div(['open-question'], [div(['open-question__title'], title), div(['open-question__body'], children)]);
      },
      code(node) {
        if (node.lang !== 'layout') return undefined;
        const line = node.position?.start?.line;
        return { type: 'html', value: renderLayout(parseLayout(node.value, `${file}${line ? `:${line}` : ''}`)) };
      },
      link(node, ctx) {
        const url = node.url;
        if (/^[a-z][a-z0-9+.-]*:/i.test(url) || url.startsWith('#') || url.startsWith('//')) return undefined;
        const where = `${file}: link '${url}'`;
        if (!url.startsWith('/')) throw new Error(`${where}: use an absolute site path such as /engines/fromsoft/ (relative links break on nested pages)`);
        const [path, hash] = url.split('#');
        const route = path.endsWith('/') ? path : `${path}/`;
        if (!routes.has(route)) throw new Error(`${where}: no page at ${route}`);
        ctx.setProperty(node, 'url', `${prefix}${route}${hash ? `#${hash}` : ''}`);
        return undefined;
      },
    };
  };
}
