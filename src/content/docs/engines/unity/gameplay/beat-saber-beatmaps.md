---
title: Beat Saber beatmap files
description: "How a Beat Saber level's map files are written: Info.dat and the difficulty files, the v2, v3 and v4 versions, the zero-valued fields v3.3 and v4 leave out, where lighting lives, and what mod-requiring maps add."
games: [beat-saber]
sources:
  - title: BSMG Wiki, map format
    url: https://bsmg.wiki/mapping/map-format.html
    note: the file and field names and the event types used here
  - title: Mapping Extensions
    url: https://github.com/Kylemc1413/MappingExtensions
    note: the precision position convention
---

A Beat Saber level is a folder (a zip on BeatSaver) holding the song's audio, `Info.dat` and one JSON `.dat` file per
difficulty; `Info.dat` names the song, its tempo, its difficulties by characteristic (Standard, One Saber, Lawless, ...) and
the file each is in. :sourced[BSMG Wiki] The level hash that replays and BeatSaver use to name a map is a SHA-1 over
`Info.dat` and the difficulty files, so it changes when any of them does
(see [replays](/engines/unity/gameplay/beat-saber-replays/#where-replays-are-kept)). :observed[40 replays matched to their level folders]{games="beat-saber"}

## Versions

The files come in three versions with different field names; a reader takes the version from the file. :sourced[BSMG Wiki]

| Version | Notes, walls | Basic lighting events | Colour boost | Where lighting lives | Confidence |
|---|---|---|---|---|---|
| v2 | `_notes`, `_obstacles` (underscored keys) | `_events`: `_time`, `_type`, `_value`, `_floatValue`, `_customData` | event type 5 in `_events` | the difficulty file | :sourced[BSMG Wiki] |
| v3 | `colorNotes`, `bombNotes`, `obstacles`, `sliders` (arcs), `burstSliders` (chains) | `basicBeatmapEvents`: `b`, `et`, `i`, `f` | `colorBoostBeatmapEvents`: `b`, `o` | the difficulty file, plus group lighting (`lightColorEventBoxGroups`, `lightRotationEventBoxGroups`, `lightTranslationEventBoxGroups`, `vfxEventBoxGroups`) | :sourced[BSMG Wiki] |
| v4 | `colorNotes`, `obstacles`, ... indexing shared `colorNotesData`, `obstaclesData`, ... | `basicEvents` indexing `basicEventsData` | `colorBoostEvents` indexing `colorBoostEventsData` | a separate lightshow file named by `lightshowDataFilename` in a v4 `Info.dat`, with `eventBoxGroups` | :sourced[BSMG Wiki] |

Of a sample of 999 maps from BeatSaver, 695 are written in v2, 277 in v3 and 27 in v4. :observed[999 BeatSaver maps]{games="beat-saber"}

### Fields left out when zero

v3.3 and v4 files leave out a field whose value is 0: a basic event of type 0, value 0 or at beat 0 has no `et`, `i` or `b`
key. :observed[v3.3.0 and v4.1.0 files of a 999-map sample]{games="beat-saber"} In one v3.3.0 difficulty, 1,513 of its 2,782
basic events lack one of these keys, so a reader that requires them silently drops more than half the events.
:observed[one difficulty]{games="beat-saber"} Reading every missing field as 0 brings the event counts within 2% of
BeatSaver's own on 964 of the 999 maps; most of the rest use group lighting or legacy Chroma colours, which BeatSaver counts
differently. :observed[999 BeatSaver maps]{games="beat-saber"}

## Lighting

Basic event types 0 to 4 (and 6, 7, 10, 11) switch light groups, 8 and 9 spin and zoom the rings, 12 and 13 set the laser
speeds, 14 and 15 are early and late rotations of 90 and 360 degree maps, and type 100 in v2 is a tempo change; a light value of 0 is off, 1 to 4 blue on, flash,
fade and transition, 5 to 8 the same in red, and 9 to 12 in white. :sourced[BSMG Wiki] Legacy Chroma packs an RGB colour into
`_value` at 2,000,000,000 and above. :sourced[BSMG Wiki]

Lights are written per difficulty, but most maps give every difficulty the same: of 339 maps with two or more lit Standard
difficulties, 57% have identical lighting events in all of them and 83% overlap by at least 0.9.
:observed[339 maps of a 999-map sample]{games="beat-saber"} Of the 999 maps, 863 have at least one lighting event per second
and 68 have none; the five light groups, ring spin and laser speed make up almost all basic events, and 94% to 96% of lit
maps use rings and laser speeds. :observed[999 BeatSaver maps]{games="beat-saber"} The median lit map has 10.5 lighting events
per second at 5.3 distinct times per second. :observed[863 lit maps]{games="beat-saber"}

## Maps that need mods

Most mods extend the same files, in `_customData` or `customData` and in out-of-range values. :sourced[BSMG Wiki] Mapping Extensions reads a line index or layer of 1000 or more (or
-1000 or less) as a precise position off the 4×3 grid. :sourced[Mapping Extensions] A difficulty can have every colour note
off the grid that way. :observed[corpus difficulties]{games="beat-saber"} Noodle Extensions adds per-object data (position,
rotation, note speed, fake and uninteractable objects, free-form wall size) and animation through tracks and custom events.
:sourced[BSMG Wiki]

How much of that a map uses varies with its popularity:

| Sample | What the files use | Confidence |
|---|---|---|
| 147 random Noodle maps | 78% have no animation; the main uses are notes off the grid (109 maps, about a quarter of their notes) and free-form walls (51 maps) | :observed[147 maps]{games="beat-saber"} |
| 100 most-upvoted Noodle maps | 74% have animation events, a median of 449 per map and up to 37,501; 76 also need Chroma, 31 move the player, 43 change the environment, 27 have 500 or more walls that are decoration only, and 30 leave the notes unmodified | :observed[100 maps]{games="beat-saber"} |
| 40 Vivify maps | all 40 load Unity asset bundles (prefabs, shaders); 37 also need Noodle | :observed[40 maps]{games="beat-saber"} |

An animated difficulty file is large: a median of 3.7 MB against 0.2 MB for one without mods.
:observed[533 mod-requiring maps]{games="beat-saber"} Such files are written by scripts, and the file holds their output
keyframe by keyframe rather than the script. :inferred

:::open[What does the game light when a map has no events?]
68 of the 999 maps have no lighting events at all; what the environment shows for them has not been checked.
:::
