---
title: SCP scene tables
description: "The SCP file of a level quartet: its header, the node tree with world matrices, the joint table, and the chain of typed sections (spot chunks, splines, lights and others) after it."
implementations:
  - name: primase worlds/shred (scp_tables.rs)
    url: https://github.com/Kalmarv/primase/blob/main/worlds/shred/src/read/scp_tables.rs
---

The **SCP** of a [model quartet](/engines/rme/geometry/model-quartets/) is the scene file. Its first table lists the mesh [placements](/engines/rme/geometry/placements/); the rest describes what a level is made of apart from geometry:
a tree of **nodes**, a table of their world matrices, a **joint** table, and a *blob*, a chain of typed sections that hold the spot chunks, splines and lights. Every level PAK holds one or more SCPs, 547 in all. :proven[all 547 SCPs]

All numbers are big-endian. Pointers inside an SCP are stored as offsets from its start; `0xFFFFFFFF` is a null. The loader turns them into pointers when it loads the file, so a stored 0 is a valid offset, not a null. :observed[static reading of the executable]

## Header

```layout
title: SCP header
size: 72
games: [shred]
note: Each table is a count and an offset from the start of the file. The loader relocates the offsets named in the last column of the table below.
fields:
  - {at: 0, size: 4, type: u32, name: magic, value: "0xBABF003C", level: proven}
  - {at: 4, size: 4, type: u32, name: unknown, level: unknown}
  - {at: 8, size: 2, type: u16, name: header_size, value: "0x0048", level: observed}
  - {at: 10, size: 2, type: u16, name: load_flags, level: observed, note: "bit 1 borrowed storage, bit 4 relocated; 0 on disc"}
  - {at: 12, size: 4, type: u32, name: unknown, level: unknown}
  - {at: 16, size: 4, type: u32, name: placement_count, level: proven}
  - {at: 20, size: 4, type: u32, name: placement_offset, level: proven, note: "records of 0x30 bytes"}
  - {at: 24, size: 4, type: u32, name: node_count, level: proven}
  - {at: 28, size: 4, type: u32, name: node_offset, level: proven, note: "records of 0x70 bytes"}
  - {at: 32, size: 4, type: u32, name: joint_count, level: proven, note: "141 in the 505 level SCPs with joints"}
  - {at: 36, size: 4, type: u32, name: joint_offset, level: proven, note: "records of 16 bytes"}
  - {at: 40, size: 8, type: "u32[2]", name: table_28, level: unknown, note: "a table of 0x38-byte records the loader relocates; 0 in every file read"}
  - {at: 48, size: 8, type: "u32[2]", name: table_30, level: unknown, note: "a table of 0x200-byte records the loader relocates; 0 in every file read"}
  - {at: 56, size: 4, type: u32, name: matrix_count, level: proven, note: "equals node_count in all 547 files"}
  - {at: 60, size: 4, type: u32, name: matrix_offset, level: proven, note: "records of 8 bytes"}
  - {at: 64, size: 4, type: u32, name: unknown, level: unknown, note: "0"}
  - {at: 68, size: 4, type: u32, name: blob_offset, level: proven, note: "0xFFFFFFFF or 0 when there is no blob (136 SCPs); the chain starts here"}
```

## Nodes

A node is 112 bytes. The scene is a tree of nodes; each node lists its children and the placements it owns.

```layout
title: SCP node
size: 112
games: [shred]
note: Two sets of five (count, pointer) pairs; only the first pair of each set is ever used.
fields:
  - {at: 0, size: 16, type: "f32[4]", name: sphere, level: inferred, note: "a bounding sphere (centre xyz, radius) on some nodes, zero on the rest"}
  - {at: 16, size: 4, type: u32, name: id, level: proven, note: "sdbm of the node's name; 1 of 106 in CHARLIE resolves (`Main`)"}
  - {at: 20, size: 12, type: "u32[3]", name: editor_leftovers, level: observed, note: "heap-like addresses of the authoring session; not data"}
  - {at: 32, size: 20, type: "u32[5]", name: child_counts, level: proven, note: "only the first is ever nonzero"}
  - {at: 52, size: 20, type: "u32[5]", name: child_offsets, level: proven, note: "0xFFFFFFFF when unused; each element is the offset of a node record"}
  - {at: 72, size: 20, type: "u32[5]", name: placement_counts, level: proven}
  - {at: 92, size: 20, type: "u32[5]", name: placement_offsets, level: proven, note: "each element is the offset of a placement record"}
```

Of the ten (count, offset) pairs only the first of each set occurs: 165,525 child links and 155,292 placement links over the disc's 166,089 nodes, and every link lands on the start of a record. :proven[all 547 SCPs]
564 nodes are never a child (the 547 file roots and 17 others), and 12,211 of the 167,503 placements are owned by no node. :proven[all 547 SCPs]
The leftovers have no use. Node names are not stored, and a node's id resolves to a name only in rare cases (`Main` in CHARLIE). :observed

### World matrices

The matrix table has one 8-byte record per node, in node order: a name or model hash and the offset of a 64-byte row-major matrix with the translation in floats 12 to 14 (the row-vector convention of [Placements](/engines/rme/geometry/placements/)).

```layout
title: Node matrix record
size: 8
games: [shred]
fields:
  - {at: 0, size: 4, type: u32, name: hash, level: observed, note: "the group's name hash (NavSplines, CHALLENGE, AI, Audio, ...) or, for a node of one mesh, the model hash; else 0"}
  - {at: 4, size: 4, type: u32, name: matrix_offset, level: proven}
```

For 63 of CHARLIE's 85 placements the node's matrix equals the placement's own. The group and root matrices are `diag(−1, 1, 1)`, the export mirror; a spot chunk's matrix is not composed with it. :observed

## Joints

The joint table has 141 records of 16 bytes in each of the 505 level SCPs, byte for byte the same: the rig of the player's skater and board (`Hips`, `Spine`, `Spine1`, ..., `BoardTruck`, `BoardNose`, `Hair*`). The two actor SCPs (male, female) have 40-joint variants. :proven[all 547 SCPs]
It is the table that [skinned meshes](/engines/rme/geometry/skinned-streams/) take their bone names from.

## The blob

At `blob_offset` is a chain of sections, each starting with four words and ending where the next begins.

```layout
title: SCP blob section header
size: 16
games: [shred]
note: The data starts `data_offset` bytes into the section. The chain ends with a 16-byte record `{junk, 8, 0, 0}`.
fields:
  - {at: 0, size: 4, type: u32, name: flags, level: proven, note: "the high 16 bits are the type; the low 16 sometimes mean a variant (0x80 and 0x81 for splines) or are junk"}
  - {at: 4, size: 4, type: u32, name: size, level: proven, note: "bytes of the section, header included"}
  - {at: 8, size: 4, type: u32, name: count, level: proven}
  - {at: 12, size: 4, type: u32, name: data_offset, level: proven, note: "0x10, or 0x20 to 0x40 for type 0xE"}
```

The 411 SCPs that have a blob all walk to the end record; the `data_offset` of 0x20 to 0x40 in type `0xE` sections is what makes the chain continuous (reading it as 0x10 stops it early in 35 files). :proven[all 411 chains]

| Type | Content | Sections | Read |
|---|---|---:|---|
| 2 | [spot chunks](/engines/rme/world/spot-chunks/) | 387 | :proven |
| 0, 1 (flags `0x80`/`0x81`), 9 | [splines](/engines/rme/world/splines/) | 186 | :proven |
| 4 | [lights](/engines/rme/world/lights/) | 55 | :proven |
| `b` | occluders: 16-byte records of a hash `RMOccluder<N>`, a matrix pointer, a quad pointer and flags (79 in CHARLIE) | 9 | :observed |
| `d` | lighting layers: names of specular cube textures (`spec_locator_N`) | 23 | :observed |
| `f` | records of 240 bytes starting with a position (w = 1): probe or ambient volumes | 23 | :inferred |
| `6` | small trailer sections of 32 to 432 bytes with a junk count | 175 | :unknown |
| `1`, `3`, `5`, `a`, `c`, `e`, `10` | not decoded (`a` is 3.3 MB in the navigation layer) | | :unknown |

The section counts are over the disc's SCPs; 364 sections remain that no reader decodes. :observed

## The disc by level

Counted by a strict reader over the SCPs of each level's PAKs (base and layers); every chain complete. :proven[all 547 SCPs]

| Level | PAKs | Nodes | Placements | Spot chunks | Teleport chunks |
|---|---:|---:|---:|---:|---:|
| Charlie | 41 | 35,820 | 49,820 | 3,217 | 30 |
| Delta | 19 | 12,050 | 13,323 | 1,344 | 22 |
| Echo | 17 | 8,382 | 8,472 | 4,714 | 57 |
| Foxtrot | 17 | 13,252 | 9,394 | 7,375 | 48 |
| India | 17 | 11,403 | 9,749 | 6,458 | 87 |
| Juliet | 17 | 41,184 | 39,467 | 7,695 | 60 |
| Mike | 40 | 11,401 | 8,944 | 7,637 | 15 |
| November | 17 | 13,576 | 9,764 | 7,194 | 63 |
| Oscar | 17 | 7,746 | 7,608 | 4,012 | 75 |
| Papa | 17 | 11,275 | 10,962 | 3,369 | 81 |
| **All** | | **166,089** | **167,503** | **53,015** | **538** |

:::open[What are the remaining header tables and section types?]
The tables at header offsets 0x28 and 0x30 are relocated by the loader but empty in every SCP read. Section types 1, 3, 5, a, c, e and 0x10 have not been decoded.
:::
