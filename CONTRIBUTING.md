# Contributing

Everything about adding to the wiki (where a page goes, the voice, confidence badges, byte layouts, links) is in
[`src/content/docs/guide/writing.md`](src/content/docs/guide/writing.md), and the confidence levels are in
[`src/content/docs/guide/confidence.md`](src/content/docs/guide/confidence.md). Read both before writing a page.

The short version:

- Pages live under `src/content/docs/engines/<engine>/<system>/`; games and engines are registered in `src/data/`.
- Every statement of fact gets a badge: `:proven`, `:observed`, `:sourced`, `:inferred` or `:unknown`.
- Say how something is known (method and scope), never who found it or which internal tool did.
- No local paths, machine names, keys or secrets.
- Search first (`pnpm wiki search`, `pnpm wiki game <id>`); publish with `pnpm wiki publish`, which checks and builds
  the commit before it pushes.
