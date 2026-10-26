---
title: Writing pages
description: "The rules for adding to the wiki, for people and agents alike: where a page goes, how it reads, and the syntax."
sidebar:
  order: 3
---

The wiki is the reference for how these games work. Write it as an engine team writes its own documentation: what
the engine does and why, then the exact detail, with every statement marked by how surely it is known.

## Where a page goes

```
src/content/docs/
  engines/<engine>/index.md               the engine's overview
  engines/<engine>/<system>/<topic>.md    a topic of one system (archives, geometry, ... see How this wiki works)
  games/<game>.md                         a game's hub
  concepts/<concept>.md                   an idea across engines
  methods/<method>.md                     a way of finding things out
```

- **By engine, never by game.** A fact about Sekiro's meshes goes in `engines/fromsoft/geometry/`, with
  `:only[sekiro]` if Elden Ring differs. Two games that do one thing two ways get one page with both, not two pages.
- **One topic per page**, named for the thing (`flver.md`, `vertex-formats.md`, `bhd5-bdt.md`), not for a task or a
  date. A page that passes ~600 lines splits by sub-topic.
- **The engine and system come from the folder.** Folders under an engine are its systems, from the fixed list in
  `src/data/engines.yaml`. A new game or engine is a line in `src/data/games.yaml` or `engines.yaml`.
- File and folder names are lower-case words joined by `-`.

## Frontmatter

```yaml
---
title: BHD5 and BDT archives
description: "One sentence: what the page covers."
games: [sekiro, elden-ring]     # optional: defaults to every game of the engine
sources:                         # outside work the page relies on (tools, their source, community docs)
  - title: SoulsFormats
    url: https://github.com/JKAnderson/SoulsFormats
    note: BHD5 reader; the field names used here
implementations:                 # optional: tools that implement what the page describes (shown small at the end)
  - name: primase worlds/fromsoft (bhd.rs)
    url: https://github.com/Kalmarv/primase/blob/main/worlds/fromsoft/src/bhd.rs
---
```

The build checks every value: unknown game ids, engines, systems and malformed fields fail it. Quote a value that
contains `: ` (YAML reads it as a nested mapping otherwise).

## How a page reads

1. **Start with what the thing is for** and how the engine uses it, in a short paragraph a newcomer can follow.
2. **Then the detail:** structure, layouts, rules, values, each with its badge.
3. **Differences between games** where they occur: a sentence with scope chips, a table with a column per game, or
   separate layout blocks marked with their `games`.
4. **Open questions** last, or beside the section they belong to.

Write in plain sentences and tables. State facts in the present tense about the game ("the record is 40 bytes"),
not as history ("we found that..."). No first-person narrative, no dates of discovery, no task status.

### What the wiki does not say

- **Who found something, or which internal tool, repository, test or agent did.** Say how it is known (the method
  and scope), not where in our code it lives. Our tools may appear under `implementations:` and nowhere else.
- **Local paths, machine names, account names, keys or secrets.** Say where a file lives inside the game
  ("`regulation.bin` beside the executable") and describe where to get a key ("published by UXM") without printing it.
- **Plans, progress, to-dos and conversion choices.** The wiki records how the game works, not what a converter
  decided to do with it.

Shader disassembly, byte values, constants and formulas are fine: they document how the engine works. Do not paste
whole game files or large blocks of game data.

## Confidence badges

Put a badge after every statement of fact, at the end of its sentence or table cell. See
[Confidence](/guide/confidence/) for what earns each level.

| Write | Shows |
|---|---|
| `:proven` | :proven |
| `:observed` | :observed |
| `:sourced[SoulsFormats]` | :sourced[SoulsFormats] |
| `:inferred` | :inferred |
| `:unknown` | :unknown |
| `:observed{games="sekiro"}` | :observed{games="sekiro"} |
| `:proven[every entry]{games="sekiro elden-ring"}` | :proven[every entry]{games="sekiro elden-ring"} |

The text in `[...]` is a short scope note. `{games="..."}` limits the badge to those games; without it, a badge counts
for every game the page applies to. Every badge feeds the [coverage page](/coverage/).

A paragraph that makes one claim needs one badge. A table of facts takes a badge per row (a `Confidence` column).

## Which games a statement applies to

| Write | Shows | Means |
|---|---|---|
| `:only[elden-ring]` | :only[elden-ring] | Elden Ring does this; the others don't |
| `:since[sekiro]` | :since[sekiro] | From this game on (in release order) |
| `:not[sekiro]` | :not[sekiro] | Every game of the engine but these |
| `:in[sekiro elden-ring]` | :in[sekiro elden-ring] | These games, when the page covers more |

These say where a statement applies; the badge says how surely. They are separate on purpose.

## Byte layouts

A structure's fields go in a fenced block with the language `layout`, written in YAML. It is drawn as a byte grid and
a field table, checked (no overlapping fields, sizes that fit, known levels and games), and counted on the coverage page.

````md
```layout
title: BHD5 header
size: variable            # a byte count, or a description when it varies
games: [sekiro]           # optional: the games this layout is for (default: the page's)
note: Little-endian when the flag at 4 is 0xFF.
fields:
  - {at: 0, size: 4, type: "char[4]", name: magic, value: "BHD5", level: proven}
  - {at: 4, size: 1, type: u8, name: endianness, level: proven, note: "0xFF little-endian, 0 big-endian"}
  - {at: 5, size: 1, type: u8, name: unknown, level: unknown, note: "0 or 1"}
  - {at: 28, size: "salt length", type: "char[]", name: salt, level: sourced}
```
````

- `at` and `size` are numbers (bytes) or, for variable ones, a short description.
- `level` is the confidence in the field's **meaning**. A field whose value is always the same but whose purpose is
  not known is `unknown` with a note giving the value.
- `games` on a field limits it to those games; fields for different games may then share offsets.
- Bytes inside the stated size that no field covers are drawn dotted as "not described". Describe them as `unknown`
  fields when you know they are there but not what they are: that counts as accounted for.

## Open questions

```md
:::open[What is the boolean at offset 5?]
It is 0 or 1 in every index; nothing seems to depend on it.
:::
```

## Links

Link to other pages with absolute site paths: `[DCX](/engines/fromsoft/archives/dcx/)`. Relative links and links to
pages that don't exist fail the build. Link to outside sources with full URLs.

## Bringing in existing notes

Notes from investigations, code comments and older documents are the raw material. When moving a fact in:

1. Re-state it about the game, in the wiki's voice, without the history of how it was found.
2. Give it the level its evidence supports today, using the mapping in [Confidence](/guide/confidence/#the-levels-in-other-notes).
   A note with no evidence is at most :inferred; a retired or archived note is a lead, not a fact.
3. Keep numbers exact and say what they were counted over ("over the 147,289 meshes of build 25394987").
4. If two sources disagree, write both with their levels and an open question.

## Finding what is already written

Search before writing, and add to the page that exists rather than starting a near-duplicate.

```sh
pnpm wiki search "forge header"      # pages ranked by title, description, headings and text
pnpm wiki show engines/anvil/archives/forge
pnpm wiki game riders-republic       # every page about a game (or an engine), by system, with badge counts
pnpm wiki open sekiro                # the open questions, by page
```

Each takes `--json`; `pnpm wiki export` prints every page and the registries as JSON for indexers.

## Checking your work

```sh
pnpm install
pnpm check                       # every page: frontmatter, links, badges, scopes, layouts, public text (seconds, writes nothing)
pnpm check src/content/docs/engines/fromsoft     # only these files or folders
pnpm build                       # the whole site, as it deploys
pnpm dev                         # http://localhost:4321 to read it
```

A change is ready when `pnpm check` and `pnpm build` pass and the page reads well in the browser. `pnpm check` is
safe to run while others edit the same checkout; `pnpm build` is not (one at a time). The check also refuses local
paths, and, when `WIKI_PRIVATE_NAMES_FILE` names a file of private names (machines, accounts), those names on whole
pages; a name that is also a file or folder name in the repository counts as the wiki's own word.

## Publishing

Commit, then `pnpm wiki publish`. It rebases the committed `HEAD` onto `origin/main`, checks every line the commits add
and their messages for local paths and private names, runs `pnpm check` and the full build of that exact commit in a
clean worktree (`.wt/head`, so uncommitted pages in a shared checkout can't hide a broken link), and pushes it to `main`,
which deploys the site. If `main` moves meanwhile it rebases and checks again. Nothing is pushed unless all of it
passes. It works from any branch, worktree or clone, one publish at a time per repository; when the working tree is
clean the branch is brought level with what was pushed. `--dry-run` does everything but the push.

Writers working at the same time each use their own worktree or clone; `publish` puts their commits in a line.
