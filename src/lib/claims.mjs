// What a page claims, read from its Markdown source for the coverage page: every confidence badge (with the games
// it is limited to), every layout field, and every open question. Code fences other than layouts and inline code are
// skipped, so a page can show the syntax without counting it.
import { levelIds } from './confidence.mjs';
import { parseLayout } from './layout.mjs';

const BADGE = new RegExp(`(?<![\\w:])(?::)(${levelIds.join('|')})(?:\\[([^\\]]*)\\])?(?:\\{([^}]*)\\})?`, 'g');

/** @returns {{ badges: {level:string, games:string[]}[], layouts: ReturnType<typeof parseLayout>[], open: string[] }} */
export function claimsOf(body, where) {
  const badges = [];
  const layouts = [];
  const open = [];
  const lines = body.split(/\r?\n/);
  let fence = null; // { marker, lang, start, text[] }
  const prose = [];
  lines.forEach((line, i) => {
    const m = line.match(/^\s*(`{3,}|~{3,})\s*([\w-]*)/);
    if (fence) {
      if (m && m[1][0] === fence.marker[0] && m[1].length >= fence.marker.length && !m[2]) {
        if (fence.lang === 'layout') layouts.push(parseLayout(fence.text.join('\n'), `${where}:${fence.start}`));
        fence = null;
      } else fence.text.push(line);
      return;
    }
    if (m) {
      fence = { marker: m[1], lang: m[2], start: i + 1, text: [] };
      return;
    }
    prose.push(line.replace(/`[^`]*`/g, ''));
  });
  const text = prose.join('\n');
  for (const m of text.matchAll(BADGE)) {
    const games = (m[3]?.match(/games\s*=\s*"([^"]*)"/)?.[1] ?? '').split(/[\s,]+/).filter(Boolean);
    badges.push({ level: m[1], games });
  }
  for (const m of text.matchAll(/^:::open(?:\[([^\]]*)\])?/gm)) open.push(m[1] || 'Open question');
  return { badges, layouts, open };
}
