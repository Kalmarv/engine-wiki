---
title: Object placement (SET files) and start positions
description: "The SET files that place a stage's objects, the object list that names them, and the start and end position tables in main.dol of Sonic Adventure 2: Battle."
sources:
  - title: X-Hax SA Tools (SALVL, SplitTools)
    url: https://github.com/X-Hax/sa_tools
    note: SET naming from sa2lvl.ini; ObjectList.Load; SA2's StartPosition layout
---

The objects of a stage (rings, springs, dash panels, enemies, checkpoints, goal rings, cameras) are not part of the landtable. They are **SET items** in separate files, resolved to a name through
the stage's **object list**, which sits in the stage module. :observed Object models are not in the data this wiki describes: SA Tools' object definitions are keyed by PC code addresses. :sourced[SA Tools]

Counts are from a recorded census of the USA disc `GSNE8P` (225 SET files with 58,781 placements); they cannot be re-checked now. :observed

## SET file

File names follow SALVL's convention `set{LevelID}{"",_2P,_HD}_{s,u}.bin`; the level id comes from SA Tools' `sa2lvl.ini`, matched to the stage by landtable file name. :sourced[SA Tools]

```layout
title: SET file
size: variable
games: [sa2b]
note: Big-endian. Every SET file read has size == 0x20 + count × 0x20.
fields:
  - {at: 0, size: 4, type: u32, name: count, level: observed, note: "padded to 0x20"}
  - {at: 32, size: "32 × count", type: "item[]", name: items, level: observed}
```

```layout
title: SET item
size: 32
games: [sa2b]
note: Big-endian.
fields:
  - {at: 0, size: 2, type: u16, name: id, level: observed, note: "low 12 bits = object-list index, high 4 bits = clip level"}
  - {at: 2, size: 6, type: "u16[3]", name: rotation, level: observed, note: "BAMS, x y z"}
  - {at: 8, size: 12, type: "f32[3]", name: position, level: observed}
  - {at: 20, size: 12, type: "f32[3]", name: parameters, level: observed, note: "p0, p1, p2; their meaning differs per object type and lives in each object's code"}
```

Every SET file read has exactly the size `0x20 + count × 0x20`. :observed How an object uses its rotation and the three parameters is object code and is not decoded. :unknown

## Object list

Read from the stage module with SplitTools' `ObjectList.Load`. SA2 entries are 16 bytes: `u8, u8, u16 flags, f32 distance, u32 code, char* name`. :sourced[SA Tools]

## Start and end positions (main.dol)

One array of 0x2C-byte records sits at DOL file offset `0x18E0C8` (GSNE8P). Each follows SA2 PC's `StartPosition` layout: `s16 level; u16 rot1P, rotP1, rotP2; vec3 pos1P, posP1, posP2`. A record
with level 91 ends a list. Lists 0 to 8 are start positions: Sonic, Shadow, Knuckles, Rouge, an empty list, the two mech lists, and two lists holding only level 66 (Final Hazard); lists 9 onward are
end positions. :observed In list 0, City Escape's start (0, 300, 340) is the `BOARD` object of `set0013_s.bin`; in list 9 its end (3955, −22175, 16130) is that file's `GOALRING`. :observed
In the SET files of the speed stages the checkpoints are `SAVEPOINT` objects and the dash panels `KASOKU` objects. :observed

:::open[What do the per-object rotation and parameter fields mean?]
They are raw in the files; each object type's code interprets them, and the game's object code was not read.
:::
