# Engine Wiki

A reference wiki on how video games store and process their data, organised by engine and then by system. It is a Starlight site published at https://kalmarv.github.io/engine-wiki/.

## Features

- Covers 13 engines, among them FromSoftware's engine, Anvil, RAGE, Frostbite, ForzaTech, Unity, Unreal and Bedrock
- Splits every engine into the same 17 systems, from archives and files through geometry, materials and shaders to mod loading
- Records differences between games that share an engine on that engine's pages
- Has a hub page for each of its 20 games, stating the game build the observations come from
- Has concept pages on topics that cut across engines and method pages on how facts are established
- Marks every statement of fact as proven, observed, sourced, inferred or unknown
- Limits a badge or a statement to particular games when it does not apply to all of them
- Draws byte layouts as a 16-byte grid with a field table, coloured by how well each field is understood
- Shows captured frames as picture sliders and render-pass diagrams
- Lists each page's outside sources and the tools that implement what it describes
- Computes a coverage page of claims per engine, system and game, byte-layout coverage and every open question
- Includes a command-line tool to search pages, read a page, list a game's pages and open questions, and export everything as JSON
- Fails the check and the build on unknown game ids, malformed layouts, broken internal links and oversized pictures
- Refuses local file paths, and private names from a configured list, in page text
- Publishes by checking and building the exact commit in a clean worktree before pushing it to `main`

## Getting Started

### Requirements

- pnpm 10. The wiki needs Node 24.22.1 or newer, which pnpm downloads itself because of the setting in `.npmrc`.

### Installation

```sh
git clone https://github.com/Kalmarv/engine-wiki.git
cd engine-wiki
pnpm install
```

### Usage

Find what is known about a game and read a page from the command line:

```sh
pnpm wiki search "forge archive"
pnpm wiki game sekiro
pnpm wiki show engines/anvil/archives/forge
```

`search` ranks pages by title, description, headings and text. `game` takes a game or an engine id from `src/data/` and lists its pages grouped by system, with badge counts and open questions. `show` prints a page with its engine, system, games, badges and sources. Every reading command takes `--json`.

Other commands:

```sh
pnpm dev                       # the site at http://localhost:4321
pnpm wiki open [game|engine]   # open questions, by page
pnpm wiki export               # every page and the game and engine registries as JSON
pnpm check [paths]             # check pages without building the site
pnpm build                     # build the whole site, as it deploys
pnpm wiki publish [--dry-run]  # rebase onto origin/main, check and build, then push to main
```

`pnpm check` can run while others edit the same checkout; `pnpm build` cannot. Setting `WIKI_PRIVATE_NAMES_FILE` to a file of names, one per line, makes the check refuse those names as well. Every push to `main` deploys the site to GitHub Pages.

Pages are Markdown files under `src/content/docs/`, and games and engines are registered in `src/data/`. Before adding a page, read [CONTRIBUTING.md](CONTRIBUTING.md), the [writing guide](src/content/docs/guide/writing.md) and the [confidence levels](src/content/docs/guide/confidence.md). The repository has no license file.
