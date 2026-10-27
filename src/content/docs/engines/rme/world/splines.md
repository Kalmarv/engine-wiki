---
title: Splines
description: "The polylines of the SCP blob: the five spline classes (probable grind rails, guide and camera ribbons, AI paths, the navigation layer's paths, short paths), the 56-byte record, the surface id, and how spline ids are named."
implementations:
  - name: rme-formats (scp_splines.rs)
    url: https://github.com/Kalmarv/rme-formats/blob/main/src/scp_splines.rs
---

A level carries thousands of **splines**, each a list of points in the level's own space. There are five classes, told apart by the **type** of the [blob section](/engines/rme/world/scp-tables/) that holds them: the engine registers the section types 0, 1, 9, `a` and `c` with one spline manager that keeps five classes of up to 1,000 records of 56 bytes each, and the type is the class (0 to 4 in the order below). The disc has **33,575** splines in 231 sections. :proven[all 547 SCPs]

| Class | Section type | Splines | What they are | Confidence |
|---:|---|---:|---|---|
| 0 | 0 | 2,334 | candidates for the grind rails | :inferred |
| 1 | 1 | 2,200 | guide ribbons and flythrough cameras; points hover about 2 above the ground | :observed |
| 2 | 9 | 25,250 | the walking network of pedestrians and AI skaters: edges between the `AIJunction` and `NavJunction` [spot chunks](/engines/rme/world/spot-chunks/); every point lies on the ground | :inferred |
| 3 | `a` | 3,760 | records of the navigation layer (3.3 MB of sections); no known use | :unknown |
| 4 | `c` | 31 | short paths in three sections; no known use | :unknown |

The low 16 bits of a section's flags are junk, not a variant: type 9 comes as `0x90000` (25,009 splines) and four other low halves, and types 0 and 1 as `0x80`, `0x81` and other low halves. Reading the splines by flags, as earlier tallies did, missed the 4,015 splines of types `a` and `c`, and the earlier total of 31,105 splines does not reconcile with any recount; the 33,575 above are every record of the five section types read by a strict reader. :proven[all 547 SCPs]
The registry and the manager are known from the executable: the loader of each of the five types calls the same function with the class index 0 to 4, and the unload function frees the class. :observed[static reading of the executable]

All numbers are big-endian.

## Record

A section holds `count` records of 56 bytes from its data offset. Their arrays follow in the section and the record's pointers are offsets from the **section's start**. The points are already in the level's space; the matrix is not applied to them. :proven[all 231 sections]

```layout
title: Spline record
size: 56
games: [shred]
fields:
  - {at: 0, size: 4, type: u32, name: id, level: proven, note: "sdbm of the spline's name"}
  - {at: 4, size: 4, type: u32, name: parent, level: observed, note: "the id of a group"}
  - {at: 8, size: 4, type: u32, name: id_again, level: observed, note: "the id again, not always"}
  - {at: 12, size: 4, type: u32, name: unknown, level: unknown}
  - {at: 16, size: 4, type: u32, name: one, level: observed, note: "1, or 3 once"}
  - {at: 20, size: 4, type: u32, name: point_count, level: proven}
  - {at: 24, size: 4, type: u32, name: second_count, level: observed, note: "equals point_count except in a few records, where it is one more"}
  - {at: 28, size: 4, type: u32, name: word7, level: unknown, note: "0 for every spline outside class 0; 0 to 2 for rail candidates"}
  - {at: 32, size: 4, type: u32, name: word8, level: unknown, note: "0 for every spline outside class 0; 0 or 1 for rail candidates"}
  - {at: 36, size: 4, type: u32, name: surface, level: observed, note: "a surfaces.id for rail candidates, 0 for all others"}
  - {at: 40, size: 4, type: u32, name: matrix_offset, level: proven, note: "of a 64-byte matrix"}
  - {at: 44, size: 4, type: u32, name: points_offset, level: proven, note: "of point_count × 3 f32"}
  - {at: 48, size: 4, type: u32, name: params_offset, level: proven, note: "of point_count f32 that rise from 0"}
  - {at: 52, size: 4, type: u32, name: unknown, level: unknown}
```

Every value read is finite, every pointer is inside its section and the per-point parameters increase from 0; they are not arc length. :proven[all 33,575 splines]
The 64-byte matrix is a frame local to the spline. It is not applied to the points, and what it is for is not established. :observed

## Rail candidates

The class-0 (type 0) splines are the best candidates for the grind rails, and the reading is **not proven**.

For: the surface word is a row of the database's `surfaces` table ([MAIN.DB](/engines/rme/data-model/main-db/)). Over the 2,334 splines its values are (value: splines) 3: 683, 0: 666, 11: 381, 32: 290, 41: 141, 43: 43, 2: 34, 53: 24, 39: 23, 46: 19, 14: 13, 40: 12 and 37: 5, every nonzero one a row of the table. :proven[all 2,334 splines]
The snow surfaces occur only on the snow levels. :observed
The `surfaces` table has `PHYSICS_RAIL_*` columns (rail friction and gravity), and the surfaces the candidates use are the materials of rails and ledges: concrete (3), metal (11), metal_pole (32), wood (2), plastic (14) and the snow variants snow_metal (41), snow_wood (39), snow_wood_log (43), snow_rock (40), snow_Ice (46), Snow (37) and snow_Whistler (53). :observed
The database's grind-task volumes contain candidate points more often than other volumes: in 76% of 212 grind-task volumes against 39% of 803 other task volumes. AI paths show 35% and 26% for the same two sets, and guides 76% for both. The percentages were measured on the 2,227 candidates of the flagged sections, before the other 107 were counted. :observed
The points sit on surfaces: the median drop to the ground is 0.17 and the tenth percentile 0.01. :observed

Against: the splines of the other four classes have `word7`, `word8` and the surface all 0, and the code that sets the grind surface (`GRIND_SURFACE` when the character's physics state is the rail state, `GROUND_SURFACE` otherwise) takes its surface key from a collision hit record, not from a spline. No code that reads the section flags was found, and the code that chooses which class a character's rail state follows was not found. :observed[static reading of the executable]
Grinding might also be driven by collision surface types alone (the `grind_types` table has angle limits), or by the AI-rail scripts (`SetRailData` in the Lua script of each level). :unknown

## Names

A spline's id is the sdbm of its name. Two schemes resolve names on the disc: guide splines are named `NavGuide_<set><n>`, with `<set>` one or two capital letters (A to ZZ) and `<n>` from 0 to 39, and the camera splines are the names in `FLYTHROUGH_RAIL` of a level's `<Level>_sessions` table. The `<set>` is the `NAV_SET_START` of a drop spot.
1,897 splines resolve to a `NavGuide_` name and 300 to a flythrough rail name (as written or in lower case); the rest are not named. :proven[all 33,575 splines]

:::open[Are the class-0 splines the grind rails?]
A runtime trace of a grind with the volumes of a challenge, or the code that assigns the character's spline class, would settle it. What the classes 3 and 4 are for is open as well.
:::
