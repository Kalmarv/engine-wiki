---
title: Levels and layer PAKs
description: "How a playable map is assembled: a base level PAK plus layer PAKs named by difficulty, session type and map id, what each layer holds, and the load order the level scripts give."
implementations:
  - name: primase worlds/shred (manifest.rs)
    url: https://github.com/Kalmarv/primase/blob/main/worlds/shred/src/read/manifest.rs
---

A level is not one file. The ten **base** PAKs in `levels` (`CHARLIE.PAK` to `PAPA.PAK`, named for the NATO letters of the [hub](/games/shred/)) hold the geometry that every map of the level shares; **layer** PAKs in `levels/layers` hold the rest: lighting, navigation, the gameplay sessions, the difficulty
settings. A *map* is a base plus the layers its load script names. The disc has 10 base PAKs and 209 layer PAKs. :proven[all 336 PAKs]

## Layer names

A layer PAK is named by eight hex digits `DS0000ZZ` (`88000004.pak` is casual, session type 8 (tutorial), map `04`; `a200000f.pak` is hardcore, session type 2, map `0F`). :proven[all 209 layer PAKs]

| Digit | Meaning | Values |
|---|---|---|
| `D` | difficulty | 0 none, 8 casual, 9 confident, A hardcore |
| `S` | session type: the `id` of `session_types` ([MAIN.DB](/engines/rme/data-model/main-db/)) | 0 challenge, 1 trick, 2 speed, 3 free skate, 4 scoring spots, 5 showcase, 6 ESSKATE, 7 manual, 8 tutorial, 9 survival, A big air, B grind (10 and 11 in the table) |
| `ZZ` | map id | below |

186 of the layer PAKs have a nonzero difficulty digit and 23 have none. The `000000ZZ` PAKs are the always-loaded set of a map (lighting, standard session, navigation splines, level-specific data); the PAKs with a difficulty digit of `8`, `9` or `A` hold the session layer of that session type at that difficulty. :observed

| Map id | Map |
|---|---|
| `04` | Charlie (training, challenges) |
| `05`, `06`, `07` | Delta, Echo, Foxtrot |
| `0A`, `0B` | India, Juliet |
| `0C`, `0D`, `0E` | Mike, lower (Kilo), combo (Lima) and upper (Mike) |
| `0F`, `10`, `11` | November, Oscar, Papa |
| `16`, `17`, `21` | Charlie big air 2, 3 and 1 |
| `18`, `19`, `1A` | Charlie manual 1 to 3 (pro challenges) |
| `1E`, `1F`, `20` | Charlie grind 1 to 3 |
| `22`, `23` | Delta half-pipe 1, Delta big air |

The maps of one level share its base PAK; CHARLIE has ten map ids. :observed

## What a layer holds

Counted over the SCPs of the disc ([SCP tables](/engines/rme/world/scp-tables/)). :observed

| Layer | Content |
|---|---|
| `lighting_*` | one node and light or probe sections only; no placements |
| `navsplinedata` | navigation guide splines and `NavJunction` chunks; no placements |
| `standardsession` | two nodes and nothing else |
| base and the `challenge`, `trick`, `speed`, `freeskate`, `scoringspot` sessions | geometry placements, spot chunks and AI path splines |
| `casual`, `confident`, `hardcore` difficulty | spot chunks (`SafeRespawn`, `Attractor`, `Spot`, triggers); for casual also a few placements (ribbon and guidance meshes) |
| `saferespawndata` | `SafeRespawn` and `Spot` chunk pairs only; exists in the `9` and `A` PAKs, not in casual |

The geometry of a map is therefore the base PAK **plus** its layers: CHARLIE's base has 85 placements, its `trainingsession1` layer 2,558, its `challengesession` 227, and its big-air, grind and pro-challenge maps 4,000 to 5,000 each. :proven[all 547 SCPs]
The casual difficulty layer's constants name the ribbon textures `casual_path/ribbon_casual` and `casualplus`, which is how the guide ribbons are identified. :inferred

## Load order

The level script named by the `levels` row (`script\level_load_<name>.lua`, compiled Lua 5.1 in `SCRIPTS.SDAT`) lists the layers to load as `LoadData('<layer>\<layer>')` constants, read from the script's constant table without running it. The common order is `lighting_default` (then `LoadLighting`), `standardsession`, `navsplinedata`, then the level-specific layers (`TrainingSession1`, `challengesession`, `AAP_*`, `secretspeeddata`, `BigAir2`, ...), and the actor scripts (`Actors/<City>_Ambient|Imposters|AI_Rail.lua`) follow. :observed
The navigation script (`level_load_navigation.lua`, `LoadNavigationData`) loads the difficulty layer. :observed
Each such `LoadData` constant is one quartet in a layer PAK, listed by the PAK's entries. :observed
The base PAK is the `PATH` of the level row, which no Lua constant names; that is the reason for the base being taken from the row. :inferred

Rows of the `levels` table with no PAK on the disc: Bravo, Golf and Hotel (placeholders), `EchoProC` and `IndiaProC` (pro-challenge sessions), `HorseSession1` to `3` and `halfpipesession2`. Their scripts exist and their content does not. :observed

:::open[Which scripts join a map id to its layers?]
The mapping from a database row to its map id is made by the load scripts. The names of layers come from their constants, but the join itself was not run, so no reader chooses a map for a row; it is left to the program that loads the level.
:::
