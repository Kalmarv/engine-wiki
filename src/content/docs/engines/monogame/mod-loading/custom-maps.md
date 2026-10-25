---
title: Custom maps
description: "How STUNTBOOST loads player-made levels: the custom_maps folder, the files a map consists of, the metadata JSON, what the game compiles itself, and the Blender exporter that makes them."
games: [stuntboost]
sources:
  - title: StuntboostTools
    url: https://github.com/bytinggames/StuntboostTools
    note: the exporter, add-ons and documentation shipped in the game's install (docs/01-setup.md to 04-advanced.md, faq.md)
---

STUNTBOOST supports custom levels made in Blender with the exporter that ships in the install (`StuntboostTools/`, which the
developers also publish on GitHub). The exporter bakes the lighting, writes glTF files and puts them where the game looks.
:sourced[StuntboostTools] This is separate from the game's own levels, which are [XNB-wrapped](/engines/monogame/world/levels/).

## Where a map lives

A map is a folder under the game's `custom_maps` directory in the save-game area: `%APPDATA%/STUNTBOOST/custom_maps/<map>` on
Windows, `~/.config/STUNTBOOST/custom_maps/<map>` on Linux (or under `$XDG_CONFIG_HOME`). The exporter creates the folder. If it
exists, a `CUSTOM LEVELS` button shows in the room selection (custom levels are otherwise hidden), and the *Custom* screen
has an *Open maps folder* button. :sourced[StuntboostTools] A map folder is shared by zipping it and unpacking it into another
`custom_maps`. :sourced[StuntboostTools] Exporting again reloads the active custom map and restarts the run while the game is
running. :sourced[StuntboostTools]

## What a map holds

| File | Content | Confidence |
|---|---|---|
| `<level>.gltf` (one or more parts) | glTF 2.0 JSON; triangles only | :observed{games="stuntboost"} |
| external `.bin` files | the glTF buffers | :observed{games="stuntboost"} |
| external PNG files | the images; embedded images are refused | :observed{games="stuntboost"} |
| exactly one `<level>_.json` | the metadata (below) | :observed{games="stuntboost"} |

The game compiles the collision itself from the glTF; no `Collision.xnb` is needed. :observed{games="stuntboost"} The map needs a
node `=Spawn(start)` or `=Spawn()` ([node names](/engines/monogame/gameplay/node-names/)). :sourced[StuntboostTools] An
unknown class in a node shows as a red wireframe box. :sourced[StuntboostTools]

### The metadata file

`<level>_.json` is the same sidecar a built-in level has (`modelCount`), with optional fields. :observed{games="stuntboost"}

| Field | Meaning |
|---|---|
| `modelCount` | the number of parts |
| `id` | a UUID, the map's identity; without it moving or renaming the folder changes the map's id |
| `version` | an integer; increase it for a new record version |
| `name` | the displayed title; falls back to the file name |
| `author` | the displayed name; falls back to `Unknown` |
| `preview` | path to a PNG inside the map folder shown in the level selection |
| `medalTimesSeconds` | targets in seconds, positive, `silver ≥ gold ≥ diamond ≥ obsidian ≥ developer` |

All :sourced[StuntboostTools]. A rejected file is explained in the game's *Map errors* list. :sourced[StuntboostTools]
There is no online leaderboard or replay for custom maps. :sourced[StuntboostTools]

## The exporter

The exporter is a set of Blender add-ons (`StuntboostTools/blender_addons`) for a modified Blender 4.3.2 (a custom build that
adds a multi-core pre-bake step, baking several passes at once, a fix for black borders in denoised bakes and a Cycles
*Color Spill* setting); newer Blender versions up to 5.2 are reported to work with fallbacks. :sourced[StuntboostTools] A
successful export ends with `EXPORT FINISHED`; a scene has *Level* and *Room* bake groups and a *Skybox* scene
([levels](/engines/monogame/world/levels/#parts)). :sourced[StuntboostTools] The game's own pipeline tool is a dotnet tool,
`bytinggames-dotnet-mgcb` 3.8.1.49 (`mgcb-byting`), listed in the install's `ContentMod` folder. :observed{games="stuntboost"}

The documentation lists as not implemented: changing the vehicle type, wheels, eyes and doors, godrays and fog; and as not yet
documented: creating own assets, detours and shortcut detection, the entity name language (physics delete, material replace,
rename logic, outline magic) and overriding post-processing and colour grading. :sourced[StuntboostTools]

:::open[Whether the game accepts a custom map's collision as it does a shipped level's]
Custom maps carry glTF only and the game builds collision for them; how that build compares with the pipeline's derived file for
a shipped level (the same node rules, ledge detection and grid) is not established.
:::
