// Byte layouts: a fenced ```layout block of YAML, checked and drawn as a byte grid and a field table. The same parse
// feeds the coverage page's byte counts, so a layout is written once, in the page that explains it.
import { load as loadYaml } from 'js-yaml';
import { checkLevel, levelById, levels } from './confidence.mjs';
import { gameById, parseGameList } from './registry.mjs';

const isNum = (x) => typeof x === 'number' && Number.isInteger(x) && x >= 0;
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
/** Escaped text with `code` spans kept. */
const inline = (s) => esc(s).replace(/`([^`]+)`/g, '<code>$1</code>');

const FIELD_KEYS = new Set(['at', 'size', 'type', 'name', 'level', 'value', 'note', 'games']);
const BOX_KEYS = new Set(['title', 'size', 'note', 'games', 'fields']);

/** Parse and check one layout block. Throws with `where` on anything malformed. */
export function parseLayout(source, where) {
  let box;
  try {
    box = loadYaml(source);
  } catch (e) {
    throw new Error(`${where}: layout block is not valid YAML: ${e.message}`);
  }
  if (!box || typeof box !== 'object') throw new Error(`${where}: layout block must be a YAML mapping`);
  for (const k of Object.keys(box)) if (!BOX_KEYS.has(k)) throw new Error(`${where}: layout has unknown key '${k}'`);
  if (typeof box.title !== 'string' || !box.title) throw new Error(`${where}: layout needs a title`);
  where = `${where}: layout '${box.title}'`;
  if (box.size !== undefined && !isNum(box.size) && typeof box.size !== 'string')
    throw new Error(`${where}: size must be a byte count or a description`);
  const games = box.games ? parseGameList(Array.isArray(box.games) ? box.games.join(' ') : box.games, where) : [];
  if (!Array.isArray(box.fields) || !box.fields.length) throw new Error(`${where}: layout needs fields`);

  const fields = box.fields.map((f, i) => {
    const fw = `${where}, field ${i + 1}${f?.name ? ` '${f.name}'` : ''}`;
    if (!f || typeof f !== 'object') throw new Error(`${fw}: must be a mapping`);
    for (const k of Object.keys(f)) if (!FIELD_KEYS.has(k)) throw new Error(`${fw}: unknown key '${k}'`);
    for (const k of ['at', 'size', 'type', 'name', 'level'])
      if (f[k] === undefined || f[k] === '') throw new Error(`${fw}: needs '${k}'`);
    if (!isNum(f.at) && typeof f.at !== 'string') throw new Error(`${fw}: at must be an offset or a description`);
    if (!isNum(f.size) && typeof f.size !== 'string') throw new Error(`${fw}: size must be a byte count or a description`);
    if (isNum(f.size) && f.size === 0) throw new Error(`${fw}: size 0`);
    checkLevel(f.level, fw);
    return {
      ...f,
      games: f.games ? parseGameList(Array.isArray(f.games) ? f.games.join(' ') : f.games, fw) : [],
    };
  });

  // Fixed fields must not overlap and must fit the stated size; gaps are allowed and count as undescribed bytes.
  let end = 0;
  let prev = null;
  for (const f of fields) {
    if (!isNum(f.at) || !isNum(f.size)) {
      prev = null;
      continue;
    }
    // Fields for different games may share offsets; only fields that apply to the same games must not overlap.
    if (prev && f.at < prev.at + prev.size && sameGames(prev, f))
      throw new Error(`${where}: '${f.name}' at ${f.at} overlaps '${prev.name}' (${prev.at}..${prev.at + prev.size})`);
    prev = f;
    end = Math.max(end, f.at + f.size);
  }
  if (isNum(box.size) && end > box.size) throw new Error(`${where}: fields end at ${end}, past the stated size ${box.size}`);

  return { title: box.title, size: box.size, note: box.note, games, fields, stats: byteStats(box, fields) };
}

const sameGames = (a, b) => !a.games.length || !b.games.length || a.games.some((g) => b.games.includes(g));

/** Bytes per level over the fixed fields (a field shared by several games counted once), and undescribed bytes. */
function byteStats(box, fields) {
  const byLevel = Object.fromEntries(levels.map((l) => [l.id, 0]));
  const covered = new Map(); // byte offset -> level (the first field that claims it)
  for (const f of fields) {
    if (!isNum(f.at) || !isNum(f.size)) continue;
    for (let b = f.at; b < f.at + f.size; b++) if (!covered.has(b)) covered.set(b, f.level);
  }
  for (const lv of covered.values()) byLevel[lv]++;
  const extent = isNum(box.size) ? box.size : covered.size ? Math.max(...covered.keys()) + 1 : 0;
  const undescribed = Math.max(0, extent - covered.size);
  return { byLevel, undescribed, total: extent, fields: fields.length };
}

const chips = (ids) => ids.map((g) => `<span class="game-chip">${esc(gameById[g].short)}</span>`).join('');

function cell(f, span, cont, label) {
  const lv = levelById[f.level];
  const title = `${f.name}\n${f.type}${f.value !== undefined ? ` = ${f.value}` : ''}, ${f.size} bytes at ${f.at}\n${lv.label}${f.note ? `\n${f.note}` : ''}`;
  const sub = !cont && !label ? `<i>${esc(f.value !== undefined ? `${f.type} = ${f.value}` : f.type)}</i>` : '';
  return `<div class="f lv-${f.level}${cont ? ' cont' : ''}" style="grid-column:span ${span}" title="${esc(title)}"><b>${esc(label || (cont ? `… ${f.name}` : f.name))}</b>${sub}</div>`;
}

// 16 bytes a row; a field spans its bytes, wrapping. A field of more than three rows shows its first row, one elided
// row and its last. A field with a variable offset or size takes a whole row.
function grid(fields, extent) {
  const out = ['<div class="bytes" aria-hidden="true"><div class="ruler"></div>'];
  for (let i = 0; i < 16; i++) out.push(`<div class="ruler">${i.toString(16).toUpperCase()}</div>`);
  let col = 16;
  let next = -1; // the offset the open row continues at
  let rowBase = 0; // the offset of the open row's first byte
  // Skipped bytes inside the structure are undescribed (dotted); padding past its end is blank.
  const gap = (n, start) => {
    const inside = Math.max(0, Math.min(n, extent - start));
    if (inside > 0) out.push(`<div class="f gap lv-undescribed" style="grid-column:span ${inside}" title="${inside} bytes not described"></div>`);
    if (n - inside > 0) out.push(`<div class="f gap" style="grid-column:span ${n - inside}"></div>`);
  };
  const close = () => {
    if (col < 16) gap(16 - col, rowBase + col);
    col = 16;
  };
  for (const f of fields) {
    if (!isNum(f.at) || !isNum(f.size)) {
      close();
      out.push(`<div class="off">${isNum(f.at) ? `0x${f.at.toString(16).toUpperCase()}` : esc(f.at)}</div>`, cell(f, 16, false));
      next = -1;
      continue;
    }
    let at = f.at;
    let left = f.size;
    let first = true;
    const rows = Math.ceil(((f.at % 16) + f.size) / 16);
    let row = 0;
    if (col < 16) {
      // Continue the open row only if this field starts later on the same row; leave a gap for skipped bytes.
      if (at >= next && Math.floor(at / 16) === Math.floor(next / 16)) {
        gap(at - next, next);
        col = at % 16;
      } else close();
    }
    while (left > 0) {
      if (col >= 16) {
        out.push(`<div class="off">0x${(at - (at % 16)).toString(16).toUpperCase()}</div>`);
        rowBase = at - (at % 16);
        gap(at % 16, rowBase);
        col = at % 16;
      }
      if (!first && rows > 3 && row === 1) {
        const skip = Math.floor((left - 1) / 16) * 16;
        out.pop();
        out.push('<div class="off">…</div>', cell(f, 16, true, `⋮ ${f.name}: ${f.size} bytes`));
        col = 16;
        at += skip;
        left -= skip;
        row++;
        continue;
      }
      const take = Math.min(16 - col, left);
      out.push(cell(f, take, !first));
      col += take;
      at += take;
      left -= take;
      first = false;
      if (col >= 16) row++;
    }
    next = f.at + f.size;
  }
  close();
  out.push('</div>');
  return out.join('');
}

function table(fields) {
  const anyGames = fields.some((f) => f.games.length);
  const head = ['Offset', 'Size', 'Type', 'Field', 'Confidence', ...(anyGames ? ['Games'] : []), 'Notes'];
  const rows = fields.map((f) => {
    const off = isNum(f.at) ? `0x${f.at.toString(16).toUpperCase()}` : esc(f.at);
    const type = esc(f.type) + (f.value !== undefined ? ` = ${esc(f.value)}` : '');
    const lv = levelById[f.level];
    return `<tr class="lv-row-${f.level}"><td class="mono">${off}</td><td class="mono">${esc(f.size)}</td><td class="mono">${type}</td><td>${inline(f.name)}</td><td><span class="conf conf-${f.level}" title="${esc(lv.meaning)}">${lv.label}</span></td>${anyGames ? `<td>${chips(f.games)}</td>` : ''}<td>${f.note ? inline(f.note) : ''}</td></tr>`;
  });
  return `<table class="fields"><thead><tr>${head.map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table>`;
}

function summary(stats) {
  if (!stats.total) return '';
  const known = stats.byLevel.proven + stats.byLevel.observed;
  const pct = Math.round((100 * known) / stats.total);
  const segs = [...levels.map((l) => [l.id, stats.byLevel[l.id]]), ['undescribed', stats.undescribed]]
    .filter(([, n]) => n)
    .map(([id, n]) => `<span class="seg lv-${id}" style="flex:${n}" title="${id}: ${n} bytes"></span>`)
    .join('');
  return `<span class="known" title="bytes proven or observed, of ${stats.total}">${pct}% known</span><span class="bar">${segs}</span>`;
}

export function legend() {
  const items = [...levels.map((l) => [l.id, l.label]), ['undescribed', 'Not described']];
  return `<div class="legend">${items.map(([id, label]) => `<span><i class="lv-${id}"></i>${label}</span>`).join('')}</div>`;
}

/** The HTML for a parsed layout. */
export function renderLayout(box) {
  const size = isNum(box.size) ? `${box.size} bytes` : box.size ? esc(box.size) : '';
  return [
    '<figure class="layout">',
    `<figcaption><strong>${esc(box.title)}</strong>${size ? `<span class="size">${size}</span>` : ''}${chips(box.games)}${summary(box.stats)}</figcaption>`,
    box.note ? `<p class="layout-note">${inline(box.note)}</p>` : '',
    legend(),
    grid(box.fields, box.stats.total),
    table(box.fields),
    '</figure>',
  ].join('');
}
