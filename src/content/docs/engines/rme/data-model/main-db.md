---
title: MAIN.DB and the other databases
description: "The SQLite 3 databases of the game's database folder: the 142 tables of MAIN.DB (levels, sessions, goals, tasks, drop spots, surfaces, tricks, actors) and the tables other pages join on."
implementations:
  - name: rme-formats (database.rs)
    url: https://github.com/Kalmarv/rme-formats/tree/main/src/database.rs
  - name: rme-formats (manifest.rs)
    url: https://github.com/Kalmarv/rme-formats/blob/main/src/manifest.rs
---

Gameplay data is not in the PAKs but in **SQLite 3** databases, in the `database` folder of the disc: `main.db` (1,307,648 bytes, 142 tables), `ui.db` (3 tables) and 25 localised text databases of one table each: `ui_frontend`, `ui_ingame`, `ui_sessions`,
`ui_subtitles` and `ui_tipstext`, in five languages (`en`, `fr`, `ge`, `it`, `sp`). All 27 are ordinary SQLite 3 files: 1,024-byte pages, UTF-8 text, no views or indexes in MAIN.DB. :proven[all 27 databases]

A strict reader walks the file's pages and B-trees and reads every table without the SQLite library, and refuses a file that does not fit its own structure by offset; its output equals that of SQLite itself on every table of MAIN.DB. :proven[all 142 tables]

Columns are declared without types, and **every value is stored as text**: `levels.id` is `'4'`, a session type `'10'`, a friction `'-0.5'`. A reader converts the columns it needs; an empty string stands for "no value". :proven[all 142 tables]

## Tables

MAIN.DB has these groups. :proven[all 142 tables]

| Group | Tables | Content |
|---|---|---|
| per level | `<Level>_dropspots`, `_goals`, `_sessions`, `_tasks` for 19 names (17 levels, `PlayerIsAwesome`, and the template `schema`), `_scores` for 11 | the level's spawns, goals, sessions, tasks and score tables |
| `levels`, `session_types`, `cities`, `level_modes`, `challenge_types`, `training_types` | 30, 12, 5, 2, 2, 4 rows | the list of levels and what they are |
| `surfaces`, `grind_types`, `physics_states` | 54, 42, 11 rows | physics per surface; grind angle limits; character states |
| `tricks`, `tricktypes`, `trick_anim`, `style`, `scoring`, `spots`, `manuals`, `hudmaxscoretable` | 318, 186, 287, 30, 100, 4, 1, 6 rows | tricks and scoring |
| `anim_ollie_skate`, `anim_ollie_snow`, `anim_vert_*` | 8, 8, 1 to 28 rows | animation selection |
| `actor_*` | 16 tables | the pedestrian and crowd actors: bodies, hair, hats, likenesses, texture sets |
| `characters`, `character_videos`, `bonus_videos`, `inGame_videos` | 109, 38, 12, 32 rows | playable characters and videos |
| `audio_events`, `audio_music`, `audio_parameters`, `audio_switch_groups` | 161, 65, 10, 7 rows | Wwise names and ids |
| `achievements`, `cheat_codes`, `hud_icons`, `score_names`, `spot_triggers`, `cspn_venice_beach` | 51, 1, 12, 92, 732, 19 rows | the rest |

## Levels

```
levels (id, SORT, NAME, DISPLAY_NAME, PATH, BOARD_TYPE, SESSIONS, LOCKED, POINTS_TO_UNLOCK, UNLOCKS_CITYID,
        SCRIPT, VFX_SCRIPT, LEADER_BOARDS, CAS_UNLOCKS, AUDIO_BANK, UI_ICON_FILE, UI_PREVIEW_VIDEO,
        SPECIAL_GAME_TYPE, SPECCUBE)
```

`levels` has 30 rows. `NAME` is the base level (`Charlie`, `Delta`, ...) and `DISPLAY_NAME` distinguishes the maps of one base: Mike has rows `Kilo`, `Lima` and `Mike`, Charlie has `CharlieBigAir2`, `CharlieManual1`, `CharlieGrind3`, `CharlieHPTraining` and more, Delta has `DeltaHP1` and `DeltaBigAir`.
`PATH` is `levels\<Name>\`, `BOARD_TYPE` is `SKATE`, `SNOW` or `SESSION` (the last for one row, `PlayerIsAwesome`), and `SCRIPT` names the level's load script (`script\level_load_<name>.lua`). :proven[all 30 rows]
Three rows (Bravo, Golf, Hotel) are placeholders: they have tables and scripts but no PAK on the disc. :observed

### Session types

`session_types` has 12 rows. Their ids are the session digit of a [layer PAK's name](/engines/rme/world/layers/) (read in hex): :proven[all 12 rows]

| Id | Name | Id | Name |
|---|---|---|---|
| 0 | CHALLENGE | 6 | ESSKATE |
| 1 | TRICK | 7 | MANUAL |
| 2 | SPEED | 8 | TUTORIAL |
| 3 | FREE | 9 | SURVIVAL |
| 4 | SCORE SPOTS | 10 | BIGAIR |
| 5 | SHOWCASE | 11 | GRIND |

## Per-level tables

| Table | Rows (Charlie) | Used for |
|---|---:|---|
| `<Level>_dropspots` | 26 | `NAME`, `SPOT_NAME` (the name of a `Teleport` chunk), `NAV_SET_START`, `NAV_INDEX_START`, `START_SPEED`, `START_STATE`, `IMAGE_PATH` |
| `<Level>_sessions` | 106 | `NAME`, `TYPE`, `GOALS`, `DROP_SPOTS`, `FLYTHROUGH_RAIL`, `BOUNDARIES`, `NAVIGATION`, and the text and video columns |
| `<Level>_goals` | 155 | a session's goals, with the tasks they require, time and score limits |
| `<Level>_tasks` | 575 | `TRICK`, `OBJ_SPOT`, `SURFACE`, counts and limits |
| `<Level>_scores` | 9 | score thresholds of a session |

The links to the scene files are by name hash: a drop spot's `SPOT_NAME`, a task's `OBJ_SPOT` and a session's `BOUNDARIES` are names of [spot chunks](/engines/rme/world/spot-chunks/) (as written, or in lower case), a session's `FLYTHROUGH_RAIL` is the name of a camera [spline](/engines/rme/world/splines/), and `NAV_SET_START` is the set letter of the `NavGuide_` splines. :observed
An `id` is not unique within its table: `Papa_tasks` has two rows with id 203. A reader keeps both rows in their stored order rather than indexing by id. :proven[all 142 tables]
The columns that list a session's goals or a goal's tasks hold small expressions, not plain lists: bracketed ranges, `|` alternatives and parentheses occur. :observed
One reference in DELTA's tables names task 393, which `Delta_tasks` does not have. :observed
In the executable a task is looked up by its logical id, and a missing id gives no task. :observed[static reading of the executable]

The ten playable levels, with their base and layer PAKs, the placements in those PAKs and the rows of their tables: :observed

| Level | PAKs (base and layers) | Placements | Sessions | Goals | Tasks |
|---|---:|---:|---:|---:|---:|
| CHARLIE | 41 | 49,820 | 106 | 155 | 575 |
| DELTA | 19 | 13,323 | 57 | 130 | 393 |
| ECHO | 17 | 8,472 | 56 | 113 | 208 |
| FOXTROT | 17 | 9,394 | 56 | 148 | 326 |
| INDIA | 17 | 9,749 | 58 | 168 | 471 |
| JULIET | 17 | 39,467 | 56 | 143 | 414 |
| MIKE | 40 | 8,944 | 46 | 1 | 1 |
| NOVEMBER | 17 | 9,764 | 57 | 228 | 541 |
| OSCAR | 17 | 7,608 | 32 | 78 | 171 |
| PAPA | 17 | 10,962 | 32 | 166 | 251 |

The drop spots join to `Teleport` chunks for 183 of 194 rows ([Spot chunks and spawns](/engines/rme/world/spot-chunks/)). :proven[all 194 rows]

## Surfaces

`surfaces` has 54 rows, ids 0 to 53, with a name, an audio surface and a long run of `PHYSICS_*` columns: friction, overall speed limits, up and down gravity, ollie jump speed, turn rates, and rail friction and gravity (`PHYSICS_RAIL_FRICTION`, `PHYSICS_RAIL_UP_GRAVITY`, `PHYSICS_RAIL_DOWN_GRAVITY`). Most friction values are empty: `default` has none, `grass` has −0.5, `speedburst` 80 and `ramp_boost` 0.25. :proven[all 54 rows]
The names run from `default`, `asphalt`, `wood`, `concrete` and `glass_marble` through `half_pipe`, `mega_ramp`, `tile`, `masonite`, `metal_pole`, `carpet`, `sidewalk` to the snow surfaces `Snow`, `snow_wood`, `snow_rock`, `snow_metal`, `snow_metal_pole`, `snow_Ice`, `snow_Packed`, `snow_Powder`, `snow_Day Old`, `snow_Groomed`, `snow_inside` and `snow_Whistler`; row 44 is `DO NOT USE`. :proven[all 54 rows]
The table is what the [collision triangles](/engines/rme/collision/havok-packfiles/) refer to with their surface id, and what a [rail candidate](/engines/rme/world/splines/) refers to. :observed

`grind_types` (42 rows) holds the angle, pitch and tilt limits for each grind: `Angle_Min_Constraint`, `Angle_Max_Constraint`, `Pitch_*`, `Tilt_*`, and the input ranges and the board location. Its use by the engine has not been traced. :observed

:::open[Which tables does the engine read, and when?]
The tables above are decoded as data. Which of them the executable reads by name, and which columns it converts, was not traced; only the joins the files themselves support are listed.
:::
