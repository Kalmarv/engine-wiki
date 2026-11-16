---
title: Beat Saber beatmap files
description: "How a Beat Saber level's map files are written: Info.dat and the difficulty files, the v2, v3 and v4 versions, the note fields and tempo changes, the zero-valued fields v3.3 and v4 leave out, what the archive's maps use, where lighting lives, and what mod-requiring maps add."
games: [beat-saber]
sources:
  - title: BSMG Wiki, map format
    url: https://bsmg.wiki/mapping/map-format.html
    note: the file and field names and the event types used here
  - title: Mapping Extensions
    url: https://github.com/Kylemc1413/MappingExtensions
    note: the precision position convention
  - title: SongCore
    url: https://github.com/Kylemc1413/SongCore
    note: the level hash (Utilities/Hashing.cs); the per-difficulty colour fields (SongData.cs); extra level folders (folders.xml); the contributors list (README)
  - title: ChroMapper AutoLighterV2
    url: https://github.com/Jonas00000/ChroMapper-AutoLighterV2
    note: the lighter tag it writes into the files it lights
---

A Beat Saber level is a folder (a zip on BeatSaver) holding the song's audio, `Info.dat` and one JSON `.dat` file per
difficulty; `Info.dat` names the song, its tempo, its difficulties by characteristic (Standard, One Saber, Lawless, ...) and
the file each is in. :sourced[BSMG Wiki] The level hash that replays and BeatSaver use to name a map is a SHA-1 over
`Info.dat` and the difficulty files, so it changes when any of them does
(see [replays](/engines/unity/gameplay/beat-saber-replays/#where-replays-are-kept)). :observed[40 replays matched to their level folders]{games="beat-saber"}
It covers the bytes of `Info.dat` followed by each difficulty file in the order `Info.dat` lists them, and is written as
upper-case hex. :sourced[SongCore] For a v4 `Info.dat` the files after it are the audio data file named by
`audioDataFilename`, then each difficulty's beatmap file followed by its lightshow file, so a lightshow file that several
difficulties share enters the hash once for each of them; in every version a listed file that is not in the folder is
skipped. :sourced[SongCore] Recomputed that way over a folder of 960 levels, all 203 hashes of a playlist that names
levels in it resolve to a folder. :observed[203 playlist hashes against 960 level folders]{games="beat-saber"} Recomputed
for 120,897 zips of a BeatSaver archive, every hash equals the one BeatSaver serves the zip under.
:observed[120,897 BeatSaver zips, no mismatch]{games="beat-saber"}

Custom levels are loaded by the SongCore mod, as unzipped folders each with its own `Info.dat`, from the `CustomLevels`
folder and from extra folders listed in `UserData/SongCore/folders.xml`, where an entry gives the folder a name and a path,
`Pack` 2 shows it as a level pack of its own, `WIP` false makes its levels playable outside practice mode, and only an entry
with `CacheZIPs` set has its zips unpacked. :sourced[SongCore]

`Info.dat` does not keep a characteristic's difficulties distinct: a few maps list two Standard difficulties under the same
difficulty name, so a reader that keys difficulties by characteristic and name finds two for one key. :observed[22 of about 117,000 Standard difficulties in a BeatSaver census]{games="beat-saber"}

## Versions

The files come in three versions with different field names; a reader takes the version from the file. :sourced[BSMG Wiki]

| Version | Notes, walls | Basic lighting events | Colour boost | Where lighting lives | Confidence |
|---|---|---|---|---|---|
| v2 | `_notes`, `_obstacles` (underscored keys), and from v2.6 `_sliders` (arcs) | `_events`: `_time`, `_type`, `_value`, `_floatValue`, `_customData` | event type 5 in `_events` | the difficulty file | :sourced[BSMG Wiki] |
| v3 | `colorNotes`, `bombNotes`, `obstacles`, `sliders` (arcs), `burstSliders` (chains) | `basicBeatmapEvents`: `b`, `et`, `i`, `f` | `colorBoostBeatmapEvents`: `b`, `o` | the difficulty file, plus group lighting (`lightColorEventBoxGroups`, `lightRotationEventBoxGroups`, `lightTranslationEventBoxGroups`, `vfxEventBoxGroups`) | :sourced[BSMG Wiki] |
| v4 | `colorNotes`, `obstacles`, ... indexing shared `colorNotesData`, `obstaclesData`, ... | `basicEvents` indexing `basicEventsData` | `colorBoostEvents` indexing `colorBoostEventsData` | a separate lightshow file named by `lightshowDataFilename` in a v4 `Info.dat`, with `eventBoxGroups` | :sourced[BSMG Wiki] |

Of a sample of 999 maps from BeatSaver, 695 are written in v2, 277 in v3 and 27 in v4. :observed[999 BeatSaver maps]{games="beat-saber"}
The `Info.dat` version does not follow the difficulty files': 970 of the 999 have a v2 `Info.dat`, including 275 of the 304
maps whose difficulties are v3 or v4; the other 29 have a v4 `Info.dat`.
:observed[999 BeatSaver maps]{games="beat-saber"}

In every version a colour note has a beat, a line index 0 to 3 (left to right) and a layer 0 to 2 (bottom to top) on the
4×3 grid, a colour (0 red, the left saber; 1 blue, the right) and a cut direction: 0 up, 1 down, 2 left, 3 right, 4 up-left,
5 up-right, 6 down-left, 7 down-right, 8 any (a dot); v3 and v4 add an angle offset to the direction. :sourced[BSMG Wiki] A v2
wall has a type, 0 full height or 1 crouch, where v3 and v4 give every wall its own layer and height. :sourced[BSMG Wiki]
Beats convert to time at the `Info.dat` BPM unless the difficulty changes tempo: in v2 with an `_events` entry of type 100, in
v3 with `bpmEvents`, and in v4 with the `bpmData` of the audio data file. :sourced[BSMG Wiki]

Read with these rules, the current versions of 146,063 live BeatSaver maps list 297,363 difficulties across all
characteristics; 297,319 of them read, holding 268.7 million colour notes, 15.6 million bombs, 44.4 million walls, 4.0 million
arcs and 0.89 million chains. Of the 44 that do not, 26 are not valid JSON, 17 are files `Info.dat` lists but the zip does not
hold, and one is a file over 64 MB that was not read. :observed[146,063 BeatSaver maps]{games="beat-saber"}

### Fields left out when zero

v3.3 and v4 files leave out a field whose value is 0: a basic event of type 0, value 0 or at beat 0 has no `et`, `i` or `b`
key. :observed[v3.3.0 and v4.1.0 files of a 999-map sample]{games="beat-saber"} In one v3.3.0 difficulty, 1,513 of its 2,782
basic events lack one of these keys, so a reader that requires them silently drops more than half the events.
:observed[one difficulty]{games="beat-saber"} Reading every missing field as 0 brings the event counts within 2% of
BeatSaver's own on 964 of the 999 maps; most of the rest use group lighting or legacy Chroma colours, which BeatSaver counts
differently. :observed[999 BeatSaver maps]{games="beat-saber"}

## What the maps hold

These counts come from a database of every live BeatSaver map's difficulties, read as above. They cover the maps BeatSaver
does not flag as AI-made, so an unflagged automapped map counts among them. Unless stated otherwise, a count is over the
Standard difficulties with 50 notes or more, and a year is the year the map was uploaded.

| What | How the files use it | Confidence |
|---|---|---|
| Characteristics | 123,305 maps have a Standard difficulty, 4,163 Lawless, 3,294 Lightshow, 586 360 Degree and 204 90 Degree | :observed[BeatSaver archive]{games="beat-saber"} |
| Arcs and chains | the share of Expert+ difficulties with arcs rises from 6% of those uploaded in 2022, when v3 brought arcs and chains, to 64% in 2026; chains level off at about 20% | :observed[BeatSaver archive]{games="beat-saber"} |
| Bombs and walls | Expert+ difficulties with bombs go from 37% (2018) to 69% (2022) and back to 56%; those with walls from 73% to 86% and back to 80% | :observed[BeatSaver archive]{games="beat-saber"} |
| Grid rows | 55% of notes are on the bottom layer, and the rest split about evenly between the middle and top | :observed[BeatSaver archive]{games="beat-saber"} |
| Middle row | 77% of red notes on the middle layer are in line 0 and 75% of blue ones in line 3 | :observed[BeatSaver archive]{games="beat-saber"} |
| Crossovers | about 21% of Expert+ notes are on the other saber's half (red in lines 2 and 3, blue in 0 and 1), the same in every upload year since 2018 | :observed[BeatSaver archive]{games="beat-saber"} |
| Cut directions | left and right arrows fall from 16.7% of notes (2018) to about 5%, diagonals rise from 17.5% to 31% (2026), and dots peak at 16.7% (2025) | :observed[BeatSaver archive]{games="beat-saber"} |

The middle layer's centre cells are kept clear because a note there hides what comes behind it. :inferred

A reader meets extreme files among them. 86 maps have a difficulty of more than 50,000 notes, holding 13.7 million notes
between them; the largest has 1,000,073 notes in 3.4 minutes. Some maps have broken note times, one of them giving a
length of about 10¹⁷ minutes, so length and speed figures need such maps filtered out. :observed[BeatSaver archive]{games="beat-saber"}

## Note patterns ranked maps leave out

Two note patterns never occur in ranked maps: two notes of one colour at the same time whose arrows point 135° or more apart,
and a bomb in the cell a note at the same time swings in from (the cell one step against its arrow). Neither occurs in the
6,240 ScoreSaber-ranked difficulties of the 2,130 ranked maps, with 6.63 million notes and 467,000 bombs between them, while
unranked difficulties of some of those maps do have them. :observed[every ScoreSaber-ranked difficulty of a BeatSaver archive]{games="beat-saber"}
Unranked maps by people have both. On Standard difficulties of 50 notes or more, with the time taken to 1/16 of a beat, the
opposite-arrow pair comes 0.85 to 5.23 times per 1,000 notes depending on the difficulty (most on Expert+, where 5.7% of
difficulties have one, and Easy, with 4.12) and the bomb in the swing's start cell 0.11 to 2.51 times (most on Easy).
:observed[every Standard difficulty of 50 or more notes in a BeatSaver archive]{games="beat-saber"}

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
Human lighting follows the notes: in 564 maps whose lights are credited to a person, 43% of the moments at which the lights
change fall at the time of a note, against 9% expected by chance. :observed[564 maps credited to a human lighter]{games="beat-saber"}

Group lighting changes that picture for newer maps: 38 of the 999 use event box groups, 8 of them with no basic events at all
and 24 with fewer than one basic event per second, so a count of basic events alone puts most group-lit maps among the
sparse or unlit. :observed[999 BeatSaver maps]{games="beat-saber"} All 36 maps set in one of the environments made for group lighting
(Weave, The Weeknd, Rock Mixtape, Lizzo and the like) use group lighting, and 28 of them also have basic events.
:observed[36 maps of a 999-map sample]{games="beat-saber"}

A lighting tool can leave its name in the file: the AutoLighterV2 ChroMapper plugin adds an entry `AutoLighterV2 by Jonas`
holding its version to the difficulty's `customData.lighter` (`_customData._lighter` in v2), and in a v4 map also adds that
name to the difficulty's lighters in `Info.dat`. :sourced[ChroMapper AutoLighterV2] The text appears in 43 difficulty files of
19 of the 999 maps. :observed[text search of 999 BeatSaver maps]{games="beat-saber"} The entry stays when the lights are
edited by hand afterwards, so it shows that the tool was used, not that the final lights are its output alone. :inferred

A person who lit a map is named, if at all, in the level-author text or in the `lighters` of a difficulty's `beatmapAuthors`
in a v4 `Info.dat`, :sourced[BSMG Wiki] or among the contributors SongCore reads from the top-level
`_customData._contributors` of a v2 `Info.dat`, each entry a `_role`, a `_name` and an optional `_iconPath`. :sourced[SongCore] Few maps do: 36 of the 863 lit maps of
the sample name a human lighter in `Info.dat`. :observed[863 lit maps of a 999-map sample]{games="beat-saber"}

## Maps that need mods

Most mods extend the same files, in `_customData` or `customData` and in out-of-range values. :sourced[BSMG Wiki] A
difficulty's `_customData` in `Info.dat` names the mods it needs in `_requirements` and those it can use in `_suggestions`;
on the most-noted Standard difficulty of each of the 999 sampled maps, Noodle Extensions is required by 8 and Chroma by 5,
while Chroma is suggested by 134. :observed[999 BeatSaver maps]{games="beat-saber"} By BeatSaver's own per-difficulty flags,
of the 123,126 maps with a Standard difficulty not marked as automapped, 12.4% use Chroma, 5.9% Noodle Extensions, 2.9%
Mapping Extensions and 1.9% Cinema; of the 40,235 uploaded from 2024 on, 21.5% use Chroma and 12.2% Noodle Extensions.
:observed[BeatSaver catalog flags]{games="beat-saber"} Mapping Extensions reads a line index or layer of 1000 or more (or
-1000 or less) as a precise position off the 4×3 grid. :sourced[Mapping Extensions] A difficulty can have every colour note
off the grid that way. :observed[corpus difficulties]{games="beat-saber"} Noodle Extensions adds per-object data (position,
rotation, note speed, fake and uninteractable objects, free-form wall size) and animation through tracks and custom events.
:sourced[BSMG Wiki]

SongCore lets a map set its own colours per difficulty in a v2 `Info.dat`: the difficulty's `_customData` may hold
`_colorLeft`, `_colorRight`, `_envColorLeft`, `_envColorRight`, `_envColorWhite`, their `Boost` variants and
`_obstacleColor`, each an object of `r`, `g`, `b` and optional `a` (1 when left out). :sourced[SongCore] A difficulty whose
`_beatmapColorSchemeIdx` names an entry of `_colorSchemes` with `useOverride` set takes that scheme instead, and its
`_customData` colours are ignored; for a difficulty with neither, SongCore sets no colours. :sourced[SongCore] Of the 999
sampled maps, 278 have a `_colorSchemes` entry with `useOverride` set and 424 set custom colours one way or the other; among the
271 uploaded from 2024 on, 243 use such a scheme. :observed[999 BeatSaver maps]{games="beat-saber"}

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
68 of the 999 maps have no lighting events at all; what the environment shows for them has not been checked. Some maps are
lit only through event box groups (8 of the 999 have groups and no basic events), so the unlit ones are fewer than a count
of basic events suggests.
:::
