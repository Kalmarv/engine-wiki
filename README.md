# Engine Wiki

How games store and process their data, engine by engine, with every statement marked by how surely it is known.
Organised by engine and system (archives, geometry, materials, ...), with the differences between games that share an
engine written where they occur.

Read it at the published site, or in `src/content/docs/` as plain Markdown.

- How it is organised and how to read it: `src/content/docs/guide/index.md`
- The confidence levels: `src/content/docs/guide/confidence.md`
- How to write pages (people and agents): `src/content/docs/guide/writing.md`

```sh
pnpm install     # Node 24 (pnpm fetches it: .npmrc)
pnpm dev         # http://localhost:4321
pnpm build       # fails on any schema, link, directive or layout error
pnpm wiki        # search, show, game, open, export, check, publish (guide/writing.md)
```

Built with [Starlight](https://starlight.astro.build). Pushes to `main` deploy to GitHub Pages.
