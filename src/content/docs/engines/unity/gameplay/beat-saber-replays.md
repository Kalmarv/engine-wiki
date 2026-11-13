---
title: Beat Saber replays (BSOR) and the energy bar
description: "The BeatLeader mod's open replay format: where replays are kept, the byte layout, how note events line up with a map's notes, what a failed run records, the energy rules a replay reproduces, and the XROR repackaging used by BOXRR-23."
games: [beat-saber]
sources:
  - title: BS Open Replay (BSOR) specification
    url: https://github.com/BeatLeader/BS-Open-Replay
    note: the field list and meanings used here
  - title: BeatLeader ReplayDecoder
    url: https://github.com/BeatLeader/ReplayDecoder
    note: the reference C# reader
  - title: metaguard/xror
    url: https://github.com/metaguard/xror
    note: XROR container and its BSOR conversion
  - title: BOXRR-23 dataset
    url: https://rdi.berkeley.edu/metaverse/boxrr-23
    note: 4.7 million XR recordings, most of them Beat Saber replays in XROR
---

Beat Saber keeps no replay of its own; the BeatLeader mod records every play as a BSOR file (Beat Saber Open Replay): the
head and both controllers every frame, every note event with its full cut, wall hits, height changes and pauses.
:sourced[BS Open Replay] With local saving on, the mod writes one file per attempt, for any map, including maps that are not on
BeatSaver. :observed{games="beat-saber"}

## Where replays are kept

The mod writes to `UserData/BeatLeader/Replays` in the game folder; its settings file `UserData/BeatLeader.json` holds
`SaveLocalReplays`, `OverrideOldReplays` and `EnableReplayCaching`. :observed[one install, 66 replays]{games="beat-saber"}
A file is named `<player id>-[exit-|fail-]<song folder name>-<difficulty>-<characteristic>-<map hash>-<unix time>.bsor`: no
prefix for a finished run, `fail-` for a failed one, `exit-` for one the player left. :observed[66 files]{games="beat-saber"}
The map hash is the level hash of the custom level (SHA-1 over Info.dat and its difficulty files), so a replay of an unpublished
map still names the exact map it was played on. :observed[40 replays matched to their level folders]{games="beat-saber"}
The ScoreSaber mod keeps its own replays (`.dat`) in `UserData/ScoreSaber/Replays`. :observed{games="beat-saber"}

## File layout

A BSOR file is little-endian; a string is an int32 byte count and UTF-8 bytes. :sourced[BS Open Replay] After the magic
`0x442D3D69` and a version byte (1), sections follow, each opened by its id byte: 0 info, 1 frames, 2 note events, 3 wall
hits, 4 height changes, 5 pauses, then optionally 6 controller offsets and 7 user data. :sourced[BS Open Replay] A reader
that follows the specification reads the 23 replays of game 1.40.8 (mod 0.9.33) checked, through the pause section, with
every section id where it is expected. :observed[23 replays]{games="beat-saber"}

The info section is strings and numbers in this order: mod version, game version, timestamp, player id, player name, platform,
tracking system, HMD, controller, map hash, song name, mapper, difficulty, score (int32), mode, environment, modifiers
(comma-separated), jump distance (f32), left-handed (bool), height (f32), practice start time, fail time and practice speed
(f32 each). :sourced[BS Open Replay] The game version reads `1.40.8_7379` and the tracking system `OpenXR` in the replays
checked. :observed[23 replays]{games="beat-saber"}

```layout
title: Frame
size: 92
note: One per rendered frame, after an int32 frame count. Positions in metres, rotations as quaternions (x, y, z, w).
fields:
  - {at: 0, size: 4, type: f32, name: time, level: sourced, note: "song time, seconds"}
  - {at: 4, size: 4, type: i32, name: fps, level: sourced}
  - {at: 8, size: 12, type: "f32[3]", name: head position, level: sourced}
  - {at: 20, size: 16, type: "f32[4]", name: head rotation, level: sourced}
  - {at: 36, size: 12, type: "f32[3]", name: left hand position, level: sourced}
  - {at: 48, size: 16, type: "f32[4]", name: left hand rotation, level: sourced}
  - {at: 64, size: 12, type: "f32[3]", name: right hand position, level: sourced}
  - {at: 76, size: 16, type: "f32[4]", name: right hand rotation, level: sourced}
```

Replays hold about 90 frames a second: the median over the 4.66 million Beat Saber recordings of BOXRR-23 is 89.2.
:observed[BOXRR-23 metadata]{games="beat-saber"}

```layout
title: Note event
size: "16, or 88 with the cut"
note: After an int32 event count. The cut follows only for good and bad cuts (event type 0 or 1).
fields:
  - {at: 0, size: 4, type: i32, name: noteID, level: sourced, note: "scoringType*10000 + lineIndex*1000 + lineLayer*100 + colour*10 + cutDirection; scoringType is the game's value + 2"}
  - {at: 4, size: 4, type: f32, name: eventTime, level: sourced, note: "song time of the cut or miss"}
  - {at: 8, size: 4, type: f32, name: spawnTime, level: observed, note: "the note's own song time, seconds (see below)"}
  - {at: 12, size: 4, type: i32, name: eventType, level: sourced, note: "0 good, 1 bad, 2 miss, 3 bomb"}
  - {at: 16, size: 4, type: "bool[4]", name: speedOK directionOK saberTypeOK wasCutTooSoon, level: sourced}
  - {at: 20, size: 4, type: f32, name: saberSpeed, level: sourced}
  - {at: 24, size: 12, type: "f32[3]", name: saberDir, level: sourced}
  - {at: 36, size: 4, type: i32, name: saberType, level: sourced, note: "0 left, 1 right"}
  - {at: 40, size: 4, type: f32, name: timeDeviation, level: sourced}
  - {at: 44, size: 4, type: f32, name: cutDirDeviation, level: sourced}
  - {at: 48, size: 12, type: "f32[3]", name: cutPoint, level: sourced}
  - {at: 60, size: 12, type: "f32[3]", name: cutNormal, level: sourced}
  - {at: 72, size: 4, type: f32, name: cutDistanceToCenter, level: sourced, note: "centre score = 15 * (1 - clamp01(d / 0.3))"}
  - {at: 76, size: 4, type: f32, name: cutAngle, level: sourced}
  - {at: 80, size: 4, type: f32, name: beforeCutRating, level: sourced, note: "uncapped; 1 = 70 points"}
  - {at: 84, size: 4, type: f32, name: afterCutRating, level: sourced, note: "uncapped; 1 = 30 points"}
```

A wall hit is 16 bytes (wall id `lineIndex*100 + obstacleType*10 + width`, the energy after the hit, time, spawn time), a height
change 8 bytes (height, time) and a pause 12 bytes (int64 duration in seconds, time). :sourced[BS Open Replay]

## Lining note events up with the map

`spawnTime` is the note's own time in the song, in seconds: every note event that is neither a bomb nor a chain link
(scoringType 7) matches a colour note of the map with the same line, layer, colour and cut direction whose beat times
60/BPM lies within 50 ms of it. :observed[9,532 of 9,532 events, 23 replays of maps with one BPM]{games="beat-saber"}
Frame times are song times too: a finished run's last frame falls within 0.2 s of the end of the audio.
:observed[4 finished replays]{games="beat-saber"}

## Failed and abandoned runs

`failTime` is above 0 exactly when the run failed: it is above 0 in every `fail-` replay and 0 in every finished and `exit-`
replay. :observed[23 replays: 15 failed, 4 finished, 4 left]{games="beat-saber"} The last frame of a failed run is at
`failTime`. :observed[15 failed replays]{games="beat-saber"} A run the player left ends at the frame they left; it has no
other marker. :observed[4 replays]{games="beat-saber"}

## The energy bar

The replay holds no energy track except the energy after each wall hit, but the bar can be rebuilt from the note events:
start at 0.5, add 0.01 for a good cut, take 0.1 for a bad cut and 0.15 for a miss or a bomb hit, and clamp to 0..1.
:inferred Rebuilt this way, the energy of each failed run reaches 0 exactly 0.50 s before its `failTime` in 13 of 15 runs,
and bottoms at under 0.01 in the other two. :observed[15 failed replays without wall hits]{games="beat-saber"} So the run is
recorded as failed half a second after the energy empties. :observed[13 of 15 failed replays]{games="beat-saber"} Because the
bar starts half full, four or five misses in a row early in a run end it. :inferred

:::open[What do chain links and walls take from the energy?]
None of the failed runs checked hit a wall, and chain links (scoringType 7) were left out of the rebuild; the values for
them and for a wall's drain per second are not established here.
:::

:::open[Why does the fail come 0.5 s after the energy is empty?]
The offset is the same in 13 runs; whether it is a fail animation, a grace period or the time the last miss registers
is not known.
:::

## XROR, the BOXRR-23 repackaging

BOXRR-23 stores each BeatLeader replay as XROR: one BSON document with `info` (hardware devices and their axes, the app and
its extensions, the activity with song hash, difficulty, mode, modifiers, score, height and jump distance), `frames` and
`events`. :sourced[metaguard/xror] `frames` is one fpzip-compressed float32 array with a row per frame: time, then seven
values for each of head, left hand and right hand (x, y, z, i, j, k, w). :observed[54,167 of 54,171 replays decoded]{games="beat-saber"} Each
event block has an `id` (`gc` good cut, `bc` bad cut, `m` miss, `b` bomb, `wh` wall hit, `h` height, `p` pause), an `attr`
name list, an fpzip float array `floatData` (time, then the float attributes) and an `otherData` list of the remaining
values per row. :observed[54,167 of 54,171 replays decoded]{games="beat-saber"} In good cuts, `beforeCutRating`, `afterCutRating`, `noteID`
and `saberType` are in `otherData`, not in the float array. :observed[54,167 of 54,171 replays decoded]{games="beat-saber"} Rows whose time is
-1 are padding. :sourced[metaguard/xror] The recordings of 71 of 4,335 users hold a `saberType`
other than 0 or 1, and some hold a `noteID` beyond the signed 32-bit range. :observed[4,335 users]{games="beat-saber"} ScoreSaber replays in the same set give the
difficulty as its rank number (1, 3, 5, 7, 9) rather than its name. :observed{games="beat-saber"} They are about a tenth of
the Beat Saber recordings and their metadata carries no score. :observed[BOXRR-23 metadata]{games="beat-saber"}

The Beat Saber recordings are nearly all finished runs: over the 4.36 million Standard-mode replays of BeatSaver maps, 99%
last the whole map (the 1st percentile of duration over map length is 1.01), 0.1% are failed runs and about 0.4% end early.
:observed[BOXRR-23 metadata, 4.36 million replays]{games="beat-saber"} They are the replays the leaderboard mods uploaded as
scores, not every attempt, so failed and abandoned runs and where players leave a map are recorded only in local replays.
:inferred No map uploaded to BeatSaver after 2023 has a recording in the set.
:observed[BOXRR-23 metadata joined to BeatSaver maps]{games="beat-saber"} Frame times line up with the map's note times: averaged over players, the right hand's speed peaks
40 ms after the right-hand notes. :observed[179 map difficulties with 8 or more players]{games="beat-saber"}

Hand positions line up with the notes too. Averaged over three or more players, at a lone note the left hand follows red
notes and the right hand blue ones: the hand's x rises with the note's lane (correlation 0.94 for both colours) and its y
with the layer (0.89 red, 0.88 blue). Around the note, the hand and its saber's forward vector move the way the cut direction
points. The note's hand is fastest just before or at the note, about twice as fast as 180 ms either side, and the other
hand is slowest there. :observed[90 difficulties of 40 maps, 32,132 lone notes]{games="beat-saber"}

:::open[Does the swing peak before the note or 40 ms after it?]
Sampled every 40 ms, the note's hand is fastest in the step from 40 ms before the note to the note, and the other
measurement puts the right hand's peak 40 ms after it, about 60 ms apart. Which way each was measured has not been traced,
so the exact offset between frame times and note times is open.
:::

:::open[What do the out-of-range noteID and saberType values mean?]
They come from a minority of recordings; whether they are older mod versions, Quest recordings or conversion damage is not
known.
:::
