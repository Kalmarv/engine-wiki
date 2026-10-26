---
title: ReSkate loading, merging and profiles
description: Mod discovery, shared shader-table merging, world layers, memory sizing and persistent state.
games: [skate]
sources:
  - title: ReSkate source
    url: https://github.com/Dingo-Shenanigans/ReSkate
  - title: ReSkate releases
    url: https://github.com/Dingo-Shenanigans/ReSkate/releases
---

ReSkate redirects and merges community content for skate. Its asset mod discovery, shared-table merge and
plugin discovery are different operations; disabling a map does not necessarily remove all its table edits.
:sourced[ReSkate]

## Mod discovery and identity

In the inspected 1.1.6-era loader, a `ModData` directory beside the executable selects `ModData/Default/Mods`;
otherwise the root is `Mods`. A folder name is at most 64 characters from `[A-Za-z0-9_-. ]`, and dot-prefixed
folders are reserved state. Thunderstore installations use `<Namespace>-<Name>` folder names.
:sourced[ReSkate]

`mods.json` uses `{schema:1, mods:[{name,enabled}]}`. Listed folders load in that order, unlisted folders follow
enabled, and absence of the file gives name order. A mod's identity is its folder name; version metadata comes
from `manifest.json.version_number` or `reskate-build.json`. :sourced[ReSkate]

The inspected shared-table merge includes disabled mods' globals and `dingolevel_root` TOCs. Removing the folder
from the mod root removes those contributions. When multiple installed mods edit shader tables, the merge
retains only stock program records and rejects map shader bytecode. :sourced[ReSkate]

## Version boundaries

| Version | Relevant behaviour | Confidence |
|---|---|---|
| 1.1.7 | Raised physics, render-resource, entity-page and spatial-bucket allocations | :sourced[ReSkate] |
| 2.0.4 | Approximately halves the earlier 3.5-GB entity-table reservation | :sourced[ReSkate] |
| 2.0.7 | 32,764 texture handles, 90% warning and `textures` command; ad system disabled | :sourced[ReSkate] |
| 2.1.0 | Raised cull ids and descriptor heaps; shader registry/range guards; light refusal and ToD barrier | :sourced[ReSkate] |
| 2.1.2 prerelease | Luau plugins and plugin Throwdown modes | :sourced[ReSkate] |

The 2.1.0-pre release assets are replaced several times under the same tag. DLL hashes and release-asset update
times distinguish builds that have different guards and boot behaviour; the tag alone is insufficient.
:observed

## Mesh streaming memory

The inspected 2.0.x sizing uses DXGI dedicated video memory: up to 6.25 GB retains 532,960 KB, up to 12.25 GB
gets 2 GiB, and larger adapters get 3.5 GiB. The hub retains its 520-MB pool. :sourced[ReSkate]

That runtime reapplies the setting every two seconds, while graphics-setting application can reset it to
520 MB. Pools are recreated at level start, so an isolated console write is not a persistent allocation change.
Later sizing uses free memory, with further changes after 2.1.0 accounting for the map's mesh content.
:sourced[ReSkate]

## Time-of-day state

The layer catalogue is scanned from game Data rather than mod content. BAM-family loads request Noon, then
the loader applies the saved world-layer choice on its 250-ms poll. An unload request while the layer is still
requested but not yet loaded is ignored by the engine. :observed

The inspected dedicated-server `tod` command matches keys containing `_tod_`, including quality-tier ToD layers
as well as the seven main ToD layers. :sourced[ReSkate]

## Profiles and console

ReSkate's per-user offline state uses `profiles/offline/reskate.sqlite3`, with SQLite WAL/SHM companions;
`objects.sqlite3` stores placed objects. `player_settings(scope,name,value_json)` stores preferences, including
the `/settings/world_layers` scope. :observed

`cosmetic_loadouts(preset_id,recipes_json)` stores outfit recipes with item fields `slot`, `asset` and
`parameter_bits`. The full-body costume slot is `2601889598`; asset values are item keys. The loader restores
these recipes during load. :observed

The console takes one setting per line; two settings on one line are refused with "Too many arguments". A
setting that echoes `= [value]` was accepted. A bare engine setting name in the console reads its value. Setting names are cached per game build, and the
catalogue becomes ready later than process startup. Launcher `--log-level` controls runtime logging even when
`RESKATE_LOG_LEVEL` is set in the environment. :sourced[ReSkate]

Camera height preference `UseHighCam` belongs to `/settings/native_profile_options/2`; normal camera-height
input can change it during play. It is not a pinned console or Game.cfg value. :observed

## Multiplayer and package handling

The inspected join path checks game-build hash and destination map id, rather than a complete mod list.
Appearance packets carry cosmetic asset names; a receiver missing an asset uses a stand-in. The map downloader
can obtain a host's map through Thunderstore. :sourced[ReSkate]

The launcher ZIP reader rejects measured sub-4-GiB archives containing ZIP64 `0xffffffff` offset markers.
Its mod icon comes from the Thunderstore icon cache rather than the installed mod's `icon.png`; a manually
installed unpublished package can therefore show a grey icon. The inspected README view preserves line breaks
and does not display images. :observed

The in-game menu map grid, by contrast, uses the mod folder's `icon.png` (PNG, at most 4 MB); stock maps use their
loading screen cropped to 256 pixels, and a map without `icon.png` has no grid picture. :sourced[ReSkate]

The loader redirects profile, saves, content cache and catalogue state under the user's local application-data
directory; crash dumps go to `ReSkate/Game/Skate/CrashDumps` there. `RESKATE_CRASH_REPORTING=0` disables its crash-dump upload; its network block also prevents the game's
GPU-report upload. :sourced[ReSkate]
