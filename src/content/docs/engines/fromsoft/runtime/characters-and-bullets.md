---
title: Characters and bullets at runtime
description: "Where the running game keeps the player character, its position and flags, and how a Bullet row is launched by id."
games: [elden-ring]
sources:
  - title: The Grand Archives Elden Ring table v1.19.3
    url: https://github.com/The-Grand-Archives/Elden-Ring-CT-TGA
    note: Cheat Engine table; its pointer paths for the player's flags and physics
implementations:
  - name: locum game values (table.txt, locum-cli table)
    url: https://github.com/Kalmarv/locum
---

The game keeps its characters in a world character manager, a static singleton reached from the executable's data.
Each character instance holds modules (data, physics and others) by pointer, and a projectile is a Bullet param row
the bullet manager launches by its id. The offsets below are those of the 1.17.2 executable (file version 2.7.2.0);
static addresses move between versions, so they are found by byte pattern. :observed

## The player character

The static pointer at offset `0x3d6d018` of the image holds a `CS::WorldChrManImp` (named by its RTTI in a memory
dump). The player's character instance is at `+0x1E508` of it, and equally the first entry of the array at
`+0x10EF8`. :observed

| Value | Path from the player instance `P` | Confidence |
|---|---|---|
| Position in the physics frame (x, y, z floats; y is up) | `[[P+0x190]+0x68]+0x70` | Writing y raised the player by the amount added. :observed |
| No gravity (byte; 1 holds the character where it is put) | `[[P+0x190]+0x68]+0x1D3` | Set to 1, the player stayed 12 m above the ground for over 30 s. :observed |
| Cannot die (bit 0), takes no damage (bit 1) | `[[P+0x190]+0]+0x19B` | :sourced[The Grand Archives table] |
| Map-relative position (x, y, z), facing, map id | `P+0x6C0` to `+0x6D0` | The map id is `0xAABBCC00` for `mAA_BB_CC_00`, and reads `0xFFFFFFFF` while the world is still loading, before it reads the map. :observed |

`P+0x190` is the module table: its entry 0 is the character's data module and its `+0x68` the physics module.
:sourced[The Grand Archives table] The physics position and the map-relative position differ by the map's origin:
the same moment read `y` 5.81 in the physics frame and 45.81 on the map, and both changed by the same amount when
the physics `y` was written. :observed

## Launching a bullet

The function at image offset `0x3a2cb0` launches a bullet: the game calls it with the bullet manager (the static at
`0x3d697c8`) as its first argument, a handle to fill as its second, a request as its third and a further block as
its fourth. The request holds the Bullet row id at `+0x14` and the launch position, in the physics frame, at `+0x80`.
:observed[the game's own calls] Called with a zeroed 0x200-byte request whose id and position are set, the second and
fourth arguments at `+0x180` and `+0x1C0` of it, it returns a handle and the bullet flies and draws its effect,
without a cast animation or an owner: Bullet rows 10400000 and 10400100, the projectiles of the Magic rows 4000
(Glintstone Pebble) and 4001 (Great Glintstone Shard), both drew in a frame captured after the call.
:observed[two rows, from a thread of its own]{games="elden-ring"} A spell's Magic row names its bullets
([Magic and Bullet](/engines/fromsoft/data-model/params/#magic-and-bullet)), so any spell's projectile can be drawn
this way. :inferred

The game makes a request with a constructor (image offset `0x38c580` in 1.17.2) before it sets the id and the shot,
and that constructor's defaults are not zero: :observed[the game's code]

| Offset | Default | What the game's own launch puts there |
|---|---|---|
| `+0x00`, `+0x08` | -1 (none), 8 bytes each | `+0x00`: the launching character's handle |
| `+0x10` | 0 | |
| `+0x14` | -1 | the Bullet row id |
| `+0x1C`, `+0x20` | -1 (4 and 8 bytes) | |
| `+0x28`, `+0x2C` | 12 | |
| `+0x30` | four floats, each 1.0 | |
| `+0x40` | 0 | |
| `+0x44` | flags: bits 3 to 5 cleared, then bit 3 set | bit 0 set, bit 5 from the caller |
| `+0x50` | a 4x4 matrix, identity | the shot's matrix: its rows the orientation, its last row (`+0x80`) the position, w 1 |
| `+0x90` to `+0xA7` | 0 | |
| `+0xA8` | 0xFF (byte) | |
| `+0xB0` | a block of its own constructor: a handle -1 at `+0xB8`, a counted reference at `+0xC0`, vectors from the executable's data | copied from the caller's |

A request zeroed instead of constructed has a zero matrix (no orientation, and w 0 in the position's row), an owner
handle of 0 where the constructor's means none, and 0 in the four floats at `+0x30`. That is what the launches above
used. :inferred

The two requests fly differently. Bullet 10400100 is the Great Glintstone Shard's projectile: life 1.25 s,
initVellocity 13, accelOutRange 40 after accelTime 0.32, maxVellocity 25, minVellocity 6. Its speeds come from its
effect's tracers, which keep a point every 1/120 s.
- **From a zeroed request:** it held still about 0.4 s, then started at about 6 m/s (its minVellocity) and peaked
  near 18 to 19 m/s. :observed
- **From a request the constructor made, with only the id and position set:** it reached exactly 25 m/s (its
  maxVellocity) and held it for the last 28 samples, approaching at about 40 to 44 m/s². :observed
- **The zeroed request's motion cannot fit a constructed one.** A 0.4 s hold, then 6 m/s, would reach 25 m/s only at
  1.195 s, too late for the samples seen inside the 1.25 s life. So the zeroed fields, among them the four 1.0
  floats at `+0x30`, change the flight. :inferred

:::open[Does a constructed request start at initVellocity?]
The constructed shard's frames were captured too late in its flight to show its first 0.27 s. A start at 13 m/s
(initVellocity) and one at 6 m/s with no hold both fit what was seen. Settling it needs a frame of known age after
the launch, with the launch point known in that frame.
:::

## The executable's data

The page of the executable's `.data` section holding these statics is mapped `PAGE_EXECUTE_READWRITE` while the game
runs, though the section header does not mark it executable. :observed A tool that refuses to write executable pages
refuses the game's own data; telling data from code needs the section headers.
:inferred
