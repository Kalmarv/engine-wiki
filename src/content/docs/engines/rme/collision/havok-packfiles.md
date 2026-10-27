---
title: Havok 7.1 collision packfiles
description: "The Havok 7.1.0-r1 packfiles that hold a level's collision: the file structure and fixups, how triangle meshes, convex shapes and rigid bodies are stored, the per-triangle surface id, and the frame."
sources:
  - title: HavokLib (PredatorCZ)
    url: https://github.com/PredatorCZ/HavokLib
    note: a third-party Havok reader; it has no physics classes, so it cannot read these files
implementations:
  - name: "havok-formats (packfile reader)"
    url: https://github.com/Kalmarv/havok-formats/tree/main/src/packfile
  - name: "primase worlds/shred (collision.rs, conversion of the Havok data)"
    url: https://github.com/Kalmarv/primase/blob/main/worlds/shred/src/read/collision.rs
---

Collision is not stored with the render meshes. Each level has Havok **packfiles**, `.hkw` entries in the `PHYSICS` section of its [PAKs](/engines/rme/archives/pak/) (482 of them) and eight `.HKX` files in `physics` (ragdolls). All 490 are Havok **7.1.0-r1**
packfiles: version 7, 32-bit pointers, big-endian, three sections (`__classnames__`, an empty `__types__`, `__data__`). All 490 parse. :proven[all 490 files]
The version string is also in the executable, so the engine ships the library it reads them with ([Robomodo RME](/engines/rme/)). :observed

A level is the sum of its files: the base `<NAME>.hkw` holds the static world, and each session layer (`trainingsession`, `speedsession`, `tricksession`, `freeskatesession`, `challengesession`, `scoringspotsession`, `grind`, `bigair`, ...) holds more. A map's collision is its base file plus the layer files that map loads. :observed
390 of the 490 files hold nothing but a root container, a physics-data object and two empty physics systems: the difficulty, safe-respawn and navigation-spline files. `navsplinedata.hkw` has no bodies at all. :observed

## Structure

The file has a header with the version string (at offset `0x28`), then section headers at `0x40 + 48 × i`.

```layout
title: Packfile section header
size: 48
games: [shred]
note: Offsets in the seven words are relative to `start`.
fields:
  - {at: 0, size: 19, type: "char[19]", name: tag, level: proven, note: "__classnames__, __types__, __data__"}
  - {at: 19, size: 1, type: u8, name: padding, level: observed}
  - {at: 20, size: 4, type: u32, name: start, level: proven, note: "absolute offset of the section data"}
  - {at: 24, size: 4, type: u32, name: local_fixups, level: proven}
  - {at: 28, size: 4, type: u32, name: global_fixups, level: proven}
  - {at: 32, size: 4, type: u32, name: virtual_fixups, level: proven}
  - {at: 36, size: 4, type: u32, name: exports, level: proven}
  - {at: 40, size: 4, type: u32, name: imports, level: proven}
  - {at: 44, size: 4, type: u32, name: end, level: proven}
```

Pointers inside the data are not stored; a pointer is non-null exactly when a fixup names it. Local fixups are `{source, destination}` pairs inside the section, global fixups `{source, section, destination}` and virtual fixups `{object, section, class name offset}`, where the class-name section holds `u32 signature, 0x09, name\0`.
An object is every target of a virtual fixup and runs to the next one; arrays and strings after it belong to it. :proven[all 490 files]
The `__types__` section is empty, so the files do not describe their own classes. The member layouts below follow Havok 7.1's member order and each was checked against the data. :observed

### Classes on the disc

The 490 files hold these objects, and no others: `hkRootLevelContainer` 490, `hkpPhysicsData` 490, `hkpPhysicsSystem` 972, `hkpRigidBody` 12,789, `hkpStorageExtendedMeshShape` 1,758 with 6,445 `MeshSubpartStorage`, `hkpMoppBvTreeShape` 1,705 with as many `hkpMoppCode`, `hkpConvexVerticesShape` 8,780 (and 8,751 connectivity objects), `hkpBoxShape` 1,971, `hkpConvexTranslateShape` 1,400, `hkpCylinderShape` 199, `hkpCapsuleShape` 96, `hkpSphereShape` 16, `hkpListShape` 10, and in the ragdolls `hkpConstraintInstance` 161 (72 ragdoll, 89 limited-hinge, 16 breakable constraint data). :proven[all 490 files]

## Triangle meshes

A mesh is a `hkpStorageExtendedMeshShape` (usually under a MOPP tree) with one or more subparts; 83 files have them. Together: 1,758 shapes, 6,445 subparts, **855,428 vertices and 646,081 triangles**. :proven[all 490 files]

- Each subpart's storage has `vertices` (16 bytes each: `x, y, z, 0`, local to the shape) and `indices32`; the 8- and 16-bit index arrays and the 8-bit material indices are empty everywhere. :proven[all 6,445 subparts]
- A triangle is **four** `u32` of the index array, `(v0, v1, v2, 0)`; the fourth is 0 in all 646,081 triangles and the index stride of the subpart is 16 bytes. The index count (2,584,324) is therefore four times the triangle count. :proven[all 646,081 triangles]
- The triangle's material is `materials[materialIndices16[i]]`. `materialIndices16` holds one `u16` per triangle. :proven[all 6,445 subparts]
- The shape's `aabbHalfExtents` and `aabbCenter` (at `+0x90`, `+0xA0`) contain every vertex (tolerance 0.06), `weldingInfo` has one `u16` per triangle, and a subpart's `triangleOffset` is the number of triangles before it. :proven[all 1,758 shapes]

```layout
title: Material record
size: 12
games: [shred]
note: 7,909 records in the subpart storages; `materials` is an array of them at +0x44 of the storage.
fields:
  - {at: 0, size: 4, type: u32, name: word, level: observed, note: "the per-triangle word; its bits 3 to 8 are the surface id"}
  - {at: 4, size: 4, type: u32, name: unknown, value: "0x00003F80", level: unknown, note: "constant in all 7,909 records"}
  - {at: 8, size: 4, type: u32, name: padding, level: unknown, note: "0 in 1,630 records, 2 in 535, otherwise heap bytes"}
```

### Surface id

The surface of a triangle is `(word >> 3) & 0x3F`. It is a row of the `surfaces` table of the game's main database: over the 646,081 triangles the ids run from 0 to 53, 36 of them occur, and they occur where the level says they should: the snow surfaces `snow_Whistler`, `snow_Powder`, `snow_Ice` and `snow_inside` only on the snow levels they belong to, `metal_pole` only in November, `extreme_decline` only in Mike's amusement park. :observed
No engine code that extracts the field was found, so the bit positions come from the data alone. :observed
Id 0 (the default) covers 456,551 triangles, 70.7%. :observed

The other bits of the word are flags whose meaning is not established. Their triangle counts: `0x1000` 22,317, `0x1` 19,408, `0x80000000` 15,856, `0x800` 10,201, `0x4` 8,827, `0x4000` 2,927, `0x2000` 1,529, `0x80006000` 709, others fewer than 50 each; 564,228 triangles have none. :observed
Taken as whole words, the flags form 13 distinct values, and surface and flags together 92 distinct pairs, 58 of them with a nonzero flag word, over the 646,081 triangles of all 482 `.hkw` entries of every layer. :proven[all 482 .hkw entries]
On the fixed meshes, `0x800` is mostly up-facing (91%), `0x2000` mostly vertical (89%) and `0x4` never down-facing, which suggests walkable ground, walls and slopes; this is a pattern, not a finding. :inferred

### Winding

In the one layer compared (CHARLIE's `trainingsession1`), the order of a collision triangle's indices is the reverse of the render mesh's order for 2,295 of 2,388 strongly parallel matched pairs (96%). Render triangles are clockwise relative to their normals ([Triangle winding](/engines/rme/geometry/winding/)), which would make collision triangles counter-clockwise. :observed

## Other shapes

| Shape | Members read | Confidence |
|---|---|---|
| `hkpConvexVerticesShape` | `+0x10` radius, `+0x20/+0x30` box, `+0x40` vertices as `FourVectors` (48 bytes: `x[4], y[4], z[4]`; vertex *j* is lane *j* mod 4 of group *j* / 4), `+0x4C` vertex count | :proven[all 8,780] |
| `hkpBoxShape` | `+0x10` radius, `+0x20` half extents | :proven[all 1,971] |
| `hkpSphereShape` | `+0x10` radius | :proven[all 16] |
| `hkpCapsuleShape` | `+0x10` radius, `+0x20` and `+0x30` the two axis ends | :proven[all 96] |
| `hkpCylinderShape` | `+0x10` convex radius, `+0x14` radius, `+0x20/+0x30` axis ends, `+0x40/+0x50` perpendiculars | :proven[all 199] |
| `hkpConvexTranslateShape` | `+0x18` child (a box 1,384 times, a sphere 16), `+0x20` translation | :proven[all 1,400] |
| `hkpListShape` | `+0x18` an array of 16-byte child records | :observed |
| `hkpMoppBvTreeShape` | `+0x14` the MOPP code, `+0x34` the child (an extended mesh 1,704 times, a list once) | :proven[all 1,705] |

The vertices of all 8,780 convex shapes lie inside and touch their stored box, which confirms the structure-of-arrays layout. :proven[all 8,780 shapes]
The stored plane equations are not exact hull faces (their normals have lengths from 0.75 to 2.19 and 220 shapes violate their own planes), so a reader should rebuild the hull from the vertices. :observed
The cylinders (180 of them fixed) are the `ConstructionMarker_*` traffic cones; they are not rails. :observed
The MOPP code is a search tree over the mesh and is not needed to read the triangles. It is not decoded.

## Rigid bodies

Each of the 12,789 `hkpRigidBody` objects (560 to 608 bytes with its name) places one shape in the level. Every walk from a body to its shape tree succeeds. :proven[all 12,789 bodies]

| Offset | Meaning | Confidence |
|---|---|---|
| `+0x10` | the shape (never null) | :proven |
| `+0x74` | the body's name, a level-editor path such as `Greybox`, `Training1`, `Grind1`, `ConstructionSigns04.mesh01` | :proven |
| `+0xA8` | collision filter information; the low 16 bits are `0xFFFF`, the high 16 a group from 0 to 539 | :observed |
| `+0xE8` | motion type: 5 (fixed) 2,021, 3 10,372, 2 396 | :observed |
| `+0xF0` | rotation as three columns at stride 16 (w holds junk) | :proven |
| `+0x120` | translation | :proven |

The 2,021 fixed bodies are 1,758 meshes, 180 cylinders, 42 boxes and 41 convex shapes; the dynamic ones are props and fragments, mostly convex shapes and boxes. :observed
The rotation is orthonormal (to 0.002) with determinant +1 in all bodies, and a vertex `v` goes to `v.x × col0 + v.y × col1 + v.z × col2 + t`: for MIKE's fixed bodies with a non-identity rotation (1,408 samples) this puts them within 0.5 m of the render geometry in every case, the transposed rule in 30%. :proven[all 12,789 bodies]

## Frame

Collision is in the same space as the render placements: no offset, flip or scale. For MIKE's base level, collision and render samples agree with a median distance of 5 mm and 96% within one unit; the best of the eight axis flips and swaps by correlation is the identity. For CHARLIE's `trainingsession1`, 96% are within one unit. :observed
CHARLIE's base file holds one static body named `Greybox`, a coarse proxy of the hangar (floor, boundary walls and dome); the detailed collision is in its layer files. :observed

:::open[What do the flag bits of a triangle mean?]
`0x1`, `0x4`, `0x800`, `0x1000`, `0x2000`, `0x4000` and `0x80000000` are carried through unchanged in the data but are not tied to anything in the engine. The words `+0x04` (always `0x3F80`) and `+0x08` of a material record are also unexplained.
:::

:::open[Where are the rails?]
Grindable geometry is not recognisable in the physics files: there are no cylinders but the cones, and `navsplinedata.hkw` is empty. Rails are probably an SCP table (see the world pages) and perhaps flagged triangles.
:::
