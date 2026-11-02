// The wiki's Markdown extensions, as one Sätteri mdast plugin. Every one of them fails the build on a mistake
// (an unknown game id, a malformed layout, a link to a page that doesn't exist) so the wiki can't drift quietly.
//
//   :proven  :observed  :sourced  :inferred  :unknown      a confidence badge; [label] adds a scope note,
//                                                          {games="sekiro elden-ring"} limits it to those games
//   :only[elden-ring]  :since[sekiro]  :not[sekiro]  :in[sekiro elden-ring]    which games a statement applies to
//   :::open[Title] ... :::                                 an open question (listed on the coverage page)
//   :::slides[Title] ... :::  :::pass[Title] ... :::       captioned pictures: a slider; a pass's inputs --- its result
//   ```layout                                              a byte layout (layout.mjs)
//   [text](/engines/fromsoft/...)                          internal links: absolute, checked, base path added
import { existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, relative, resolve } from 'node:path';
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

// :::slides[Title] and :::pass[Title]: pictures with captions. Each paragraph in them is one picture: an image first (a
// file beside the page, linked relatively, with alt text), then its caption. :::slides shows them one at a time behind a
// slider (MarkdownContent.astro; without JavaScript, one under another); :::pass splits them with a `---` line into a
// pass's inputs, above it, and its result, below.
const PICTURE_TYPES = /\.(webp|jpe?g|png|avif)$/i;
const PICTURE_MAX_BYTES = 600 * 1024; // web-sized: a frame picture is a few hundred KB

function figure(p, where, pageDir) {
  if (p.type !== 'paragraph') throw new Error(`${where}: each picture is a paragraph that starts with an image (found a ${p.type})`);
  const [img, ...caption] = p.children;
  if (img?.type !== 'image') throw new Error(`${where}: a picture's paragraph must start with an image`);
  const url = img.url ?? '';
  if (!/^\.\.?\//.test(url)) throw new Error(`${where}: '${url}': link a picture relatively, as a file beside the page (./_frames/...)`);
  if (!PICTURE_TYPES.test(url)) throw new Error(`${where}: '${url}': a picture is webp, jpg, png or avif`);
  if (!img.alt?.trim()) throw new Error(`${where}: '${url}' has no alt text`);
  if (pageDir) {
    const path = resolve(pageDir, decodeURI(url));
    if (!existsSync(path)) throw new Error(`${where}: '${url}': no such file`);
    const bytes = statSync(path).size;
    if (bytes > PICTURE_MAX_BYTES) throw new Error(`${where}: '${url}' is ${Math.round(bytes / 1024)} KB; keep pictures under ${PICTURE_MAX_BYTES / 1024} KB`);
  }
  while (caption[0]?.type === 'break' || (caption[0]?.type === 'text' && !caption[0].value.trim())) caption.shift();
  if (caption[0]?.type === 'text') caption[0] = { ...caption[0], value: caption[0].value.replace(/^\s+/, '') };
  if (!caption.length) throw new Error(`${where}: '${url}' has no caption`);
  return {
    type: 'paragraph',
    data: { hName: 'figure', hProperties: { className: ['pic'] } },
    children: [img, { type: 'paragraph', data: { hName: 'figcaption' }, children: caption }],
  };
}

function pictures(node, where, pageDir) {
  const children = [...node.children];
  let title = null;
  if (children[0]?.type === 'paragraph' && children[0].data?.directiveLabel) title = children.shift().children;
  const head = title ? [div([`pic-${node.name}__title`], title)] : [];
  if (node.name === 'slides') {
    if (children.length < 2) throw new Error(`${where}: a slider needs two pictures or more`);
    return div(['pic-slides'], [...head, div(['pic-slides__track'], children.map((p) => figure(p, where, pageDir)))]);
  }
  const breaks = children.filter((c) => c.type === 'thematicBreak').length;
  if (breaks !== 1) throw new Error(`${where}: a pass has one '---' line between its inputs and its result (found ${breaks})`);
  const at = children.findIndex((c) => c.type === 'thematicBreak');
  const inputs = children.slice(0, at), result = children.slice(at + 1);
  if (!inputs.length || !result.length) throw new Error(`${where}: a pass needs inputs above its '---' line and a result below it`);
  return div(['pic-pass'], [
    ...head,
    div(['pic-pass__inputs'], inputs.map((p) => figure(p, where, pageDir))),
    div(['pic-pass__arrow'], [{ type: 'text', value: '→' }]),
    div(['pic-pass__result'], result.map((p) => figure(p, where, pageDir))),
  ]);
}

/** @param {{ base: string }} options */
export function wikiMarkdown({ base }) {
  const prefix = base.replace(/\/$/, '');
  const routes = pageRoutes();
  return ({ fileURL }) => {
    const file = fileURL ? relative(process.cwd(), fileURLToPath(fileURL)).replaceAll('\\', '/') : 'markdown';
    const pageDir = fileURL ? dirname(fileURLToPath(fileURL)) : null;
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
        if (node.name === 'slides' || node.name === 'pass') return pictures(node, `${file}: :::${node.name}`, pageDir);
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
