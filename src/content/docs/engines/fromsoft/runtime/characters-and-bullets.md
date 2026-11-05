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

:::open[What do the request's other fields set?]
Only the id and position were set; direction, owner, team and the fourth argument's block were left zero. The
bullets launched this way flew level in one direction, so the direction lives in the request or follows from zero.
:::

## The executable's data

The page of the executable's `.data` section holding these statics is mapped `PAGE_EXECUTE_READWRITE` while the game
runs, though the section header does not mark it executable. :observed A tool that refuses to write executable pages
refuses the game's own data; telling data from code needs the section headers.
:inferred
