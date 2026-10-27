---
title: Spot chunks and spawns
description: "The typed volumes and points of a level (teleports, attractors, triggers, junctions and more): the 0x200-byte spot chunk, its class hash and shape, and how the database's drop spots name them."
implementations:
  - name: rme-formats (scp_tables.rs)
    url: https://github.com/Kalmarv/rme-formats/blob/main/src/scp_tables.rs
---

Everything a level places that is not a mesh is a **spot chunk**: a named, typed, transformed point or box: where the skater spawns, where a trigger fires, where the AI changes direction, where a sound plays. They sit in the type-2 sections of the [SCP blob](/engines/rme/world/scp-tables/).
The disc has 387 such sections and **53,015** chunks. :proven[all 547 SCPs]

All numbers are big-endian.

## Section and chunk

A type-2 section holds `count` chunks of 0x200 bytes, then `count` world matrices of 64 bytes, one per chunk in the same order. Its size is `0x10 + count × 576`. :proven[all 387 sections]

```layout
title: Spot chunk
size: 512
games: [shred]
note: Only the first 0x2C bytes are data. The rest is pool memory that the authoring tool wrote out as it was (identical vertex-like rows repeat from chunk to chunk and the w words are junk).
fields:
  - {at: 0, size: 12, type: "f32[3]", name: scale, value: "1, 1, 1", level: observed}
  - {at: 12, size: 4, type: u32, name: zero, level: observed}
  - {at: 16, size: 4, type: u32, name: name, level: proven, note: "sdbm of the chunk's name"}
  - {at: 20, size: 4, type: u32, name: id, level: proven, note: "the chunk's own id; equals the id of a node in the same SCP for 82% of the chunks"}
  - {at: 24, size: 4, type: u32, name: parent, level: proven, note: "the id of the group node that owns it"}
  - {at: 28, size: 4, type: u32, name: class, level: proven, note: "sdbm of the class name, see below"}
  - {at: 32, size: 4, type: u32, name: shape, level: proven, note: "sdbm of Rectangle (0xC092526F) or Grid (0x1FEFE6A6)"}
  - {at: 36, size: 8, type: "u32[2]", name: pair, level: unknown, note: "two paired ids; 0x41 and 0x42 for rectangles"}
  - {at: 44, size: 468, type: "u8[468]", name: pool, level: observed, note: "uninitialised pool data; not meaningful"}
```

The matrix after the chunks is the chunk's world transform (the translation in floats 12 to 14). It equals the world matrix of the node that has the chunk's id for 49 of 51 chunks checked in CHARLIE; for the 9,551 chunks (18%) whose id is no node's, it is the only transform. :observed
A **Rectangle** is a centred unit box in the chunk's frame, from −0.5 to +0.5 on each axis: 36 of 40 and 98 spline points fall inside such volumes of two India grind objects, against 4 for a box from 0 to 1. :observed

### Classes

The class is the sdbm of its name. The names of 14 are proven by their hash; the census over the disc's 53,015 chunks: :proven[all 547 SCPs]

| Class | Chunks | Class | Chunks |
|---|---:|---|---:|
| Attractor | 9,104 | ChallengeObj | 4,169 |
| AIJunction | 6,608 | AudioVolume | 1,711 |
| Spot | 5,862 | NavJunction | 1,513 |
| SafeRespawn | 5,472 | AudioTrigger | 1,252 |
| GenericTrigger | 4,953 | BailSpot | 372 |
| Teleport | 538 | ChallengeArea | 105 |
| AITriggerSpot | 8 | VFXSpot | 8 |

The other 11,340 chunks belong to twelve classes whose names are not known: `7641e379` (4,971 chunks), `92b2eb7c` (1,075), `7d06de87` (1,003), `32789c00` (924), `dccd6fb0` (860), `57ab8107` (799), `f3f74aad` (585), `c9e28dae` (545), `f1a32444` (292), `145af167` (122), `01ab0a9b` (163) and `e926a21d` (1). :proven[all 547 SCPs]
The executable's list of `AddSpotChunk_*` strings names 22 spot classes (Spot, NavJunctionSpot, AIJunctionSpot, GenericTriggerSpot, AITriggerSpot, AISpawnSpot, AITeleportSpot, AttractorSpot, SpeedSpot, TimeSpot, TrickSpot, ChallengeSpot, ScoreOrbSpot, AudioVolume, AudioSpot, SoundObject, AudioTrigger, ChannelSpot, BailSpot, SafeRespawnSpot, WheelTriggerSpot, TrickOrbSpot). The hash is of the name with or without the `Spot` suffix, inconsistently (`Attractor` but `BailSpot`). :observed
That the twelve unknown hashes are among those names is not established.

## Spawns

A **drop spot** is a spawn point a level offers. The database's `<Level>_dropspots` table names it ([MAIN.DB](/engines/rme/data-model/main-db/)) in `SPOT_NAME`; the chunk whose `name` equals the sdbm of that string, as written or in lower case, is a `Teleport` chunk, and its matrix is the spawn transform. :proven[all 194 drop-spot rows]

| Level | Drop-spot rows | Resolved to a chunk |
|---|---:|---:|
| Charlie | 26 | 26 |
| Delta | 9 | 8 |
| Echo | 14 | 14 |
| Foxtrot | 14 | 14 |
| India | 30 | 27 |
| Juliet | 15 | 15 |
| Mike | 4 | 4 |
| November | 26 | 26 |
| Oscar | 24 | 24 |
| Papa | 32 | 25 |
| **All** | **194** | **183** |

Each resolved row names a `Teleport` chunk. :proven[all 183 resolved rows]
The 11 unresolved rows have names such as `-1`, `na`, `Spawn_MANUALCHALLENGE`, `Spawn_ESGAMESKATE`, `Area0x_Teleport` or `Ch16_Teleport`, which match no chunk. :observed
Two of Charlie's rows are crossed: the row `BigAir2` names `Default_BigAir3_Spawn` and `BigAir3` names `Default_BigAir2_Spawn`. :observed
The objective spots of tasks (`OBJ_SPOT`, 87% resolve) and the session boundaries (90%) resolve to chunks the same way. :observed

In CHARLIE all 30 `Teleport` chunks have a surface below them, at drops of 0.0, 0.3, 0.5, 1.0 (seven) and 4.0 (four) units, with no extra mirror; with x negated the drops are noisy. The chunks' matrices are therefore in the placements' space. :observed
The spawn matrices are rotations with a flipped z axis for most spawns, and which axis points forward is not established. :unknown

:::open[Which axis of a Teleport chunk is the facing?]
The matrices say where the skater stands but a comparison with the game's own spawn orientation has not been made.
:::

:::open[What are the twelve unnamed classes?]
They are 21% of all chunks, the largest being 4,971 chunks. Their names would come from the executable's spot-class list or from a script that mentions them.
:::
