---
title: Havok 7.1 collision packfiles
description: "The Havok 7.1.0-r1 packfiles that hold a level's collision: the file structure and fixups, how triangle meshes, convex shapes and rigid bodies are stored, the per-triangle surface id, and the frame."
sources:
  - title: HavokLib (PredatorCZ)
    url: https://github.com/PredatorCZ/HavokLib
    note: a third-party Havok reader; it has no physics classes, so it cannot read these files; its packfile header names the header words
  - title: soulstruct-havok (Grimrukh)
    url: https://github.com/Grimrukh/soulstruct-havok
    note: Havok 5.5 and 2010 class tables; the member names of the rigid body and the mesh material record
  - title: hkx-rs (kronerm)
    url: https://gitlab.com/kronerm/hkx-rs
    note: a packfile reader and writer for Havok 2014; computes the class signatures it writes
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

The file has a 64-byte header, then section headers at `0x40 + 48 × i`.

```layout
title: Packfile header
size: 64
games: [shred]
note: Big-endian. Every value here is the same in all 490 files but the two offsets at 0x1C and 0x24.
fields:
  - {at: 0, size: 8, type: "u8[8]", name: magic, value: "57 E0 E0 57 10 C0 C0 10", level: proven}
  - {at: 8, size: 4, type: u32, name: user tag, value: "0", level: unknown, note: "0 in all 490 files; HavokLib names it userTag"}
  - {at: 12, size: 4, type: u32, name: file version, value: "7", level: proven}
  - {at: 16, size: 4, type: "u8[4]", name: layout rules, value: "4, 0, 1, 1", level: proven, note: "pointer size 4, big-endian (0), reuse padding and empty-base optimisation on"}
  - {at: 20, size: 4, type: u32, name: section count, value: "3", level: proven}
  - {at: 24, size: 4, type: u32, name: contents section, value: "2", level: proven, note: "the index of __data__"}
  - {at: 28, size: 4, type: u32, name: contents offset, level: proven, note: "the root object (an hkRootLevelContainer) in __data__"}
  - {at: 32, size: 4, type: u32, name: class-name section, value: "0", level: proven, note: "the index of __classnames__"}
  - {at: 36, size: 4, type: u32, name: root class name, level: proven, note: "the offset of the root object's class name in __classnames__"}
  - {at: 40, size: 16, type: "char[16]", name: contents version, value: "Havok-7.1.0-r1", level: proven, note: "the 14 characters, a NUL, then one 0xFF byte"}
  - {at: 56, size: 8, type: "u32[2]", name: unused, value: "FF FF FF FF FF FF FF FF", level: unknown, note: "0xFF in all 490 files. HavokLib reads a flags word here, then two int16 predicate fields (maxpredicate, predicateArraySizePlusPadding) that are -1, -1 when a file has no predicate block"}
```

The values above hold in all 490 files, and every file's contents offset and root class name lead to its
`hkRootLevelContainer`. :proven[all 490 files]
The header words at `0x38` belong to later packfile versions: HavokLib reads a flags word and the two predicate fields
there for every version, and with `-1, -1` no predicate block follows, as in these files. :sourced[HavokLib]

```layout
title: Packfile section header
size: 48
games: [shred]
note: Offsets in the seven words are relative to `start`.
fields:
  - {at: 0, size: 19, type: "char[19]", name: tag, level: proven, note: "__classnames__, __types__, __data__"}
  - {at: 19, size: 1, type: u8, name: padding, value: "0xFF", level: proven, note: "0xFF in all 1,470 section headers; the tag bytes after its NUL are zero"}
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

### Class names and signatures

The class-name section always begins with `hkClass`, `hkClassMember`, `hkClassEnum` and `hkClassEnumItem`, then names
the classes of the file's objects. Over the 490 files it names 24 classes, and each name carries one signature in
every file that lists it: :proven[all 490 files]

| Class | Signature | Class | Signature |
|---|---|---|---|
| `hkClass` | `14425E51` | `hkpStorageExtendedMeshShapeMeshSubpartStorage` | `5AAD4DE6` |
| `hkClassMember` | `4A986551` | `hkpConvexVerticesShape` | `4E8AB2B7` |
| `hkClassEnum` | `8A3609CF` | `hkpConvexVerticesConnectivity` | `63D38E9C` |
| `hkClassEnumItem` | `CE6F8A6C` | `hkpConvexTranslateShape` | `5BA0A5F7` |
| `hkRootLevelContainer` | `2772C11E` | `hkpBoxShape` | `3444D2D5` |
| `hkpPhysicsData` | `C2A461E4` | `hkpCylinderShape` | `3E463C3A` |
| `hkpPhysicsSystem` | `FF724C17` | `hkpSphereShape` | `0795D9FA` |
| `hkpRigidBody` | `AA8C3B19` | `hkpCapsuleShape` | `DD0B1FD3` |
| `hkpMoppBvTreeShape` | `90B29D39` | `hkpListShape` | `A1937CBD` |
| `hkpMoppCode` | `924C2661` | `hkpConstraintInstance` | `4FB4E6BB` |
| `hkpStorageExtendedMeshShape` | `3D52E7D2` | `hkpRagdollConstraintData` | `17A4D42F` |
| `hkpLimitedHingeConstraintData` | `1C566B11` | `hkpBreakableConstraintData` | `7034BDB6` |

A signature is a CRC-32 over a description of the class (its members' names, types and flags and its enums, with
those of its parents), not over its name, so it identifies the class definition a file was written with: a file whose
`hkpRigidBody` carries another signature has another rigid-body layout. :sourced[hkx-rs]
The `__types__` section is empty, so the files do not describe their own classes. The member layouts below follow Havok 7.1's member order and each was checked against the data. :observed

### Fixups, arrays and padding

These rules hold in every one of the 490 files; each was counted over all of them (82,847 local and 47,763 global fixups, 47,915 objects, 114,784 array headers).

- Every fixup source is 4-byte aligned, and so is every local destination; global destinations and objects (virtual-fixup sources) are 16-byte aligned. :proven[all 490 files]
- Every local and global fixup source lies on a pointer member of its object's class, or of an element of one of its arrays, in the 7.1 member layouts (130,610 of 130,610). The stored word of every pointer slot is 0, fixed up or not (487,981 slots). :proven[all 490 files]
- An `hkArray` is a pointer, a `u32` size and a `u32` capacity word. The capacity word is `size | 0x80000000` in all 114,784 array headers, empty arrays included; an empty array never has a fixup and a non-empty one always has one. :proven[all 490 files]
- Members that Havok does not serialize are written as zeros, except arrays: the three such arrays of every rigid body (`+0x60`, `+0xB4`, `+0xC0`) read `0, 0, 0x80000000` in all 12,789 bodies. :proven[all 490 files]
- Every other byte that belongs to no serialized member is zero: the vtable slots, the alignment gaps inside every object and every array element, and the padding between an object's body, its arrays and its strings, over all 47,915 objects. Bytes that are not zero belong to members: the `userData` word of the material records and the 16-bit word at `+0x1FC` of the rigid bodies (below). :proven[all 490 files]
- Local fixups are listed in ascending source order, which in every file is also ascending destination order. Global fixups are in ascending source order in every file; in 100 files that is not the destination order. Virtual fixups are in ascending object order. :proven[all 490 files]
- The class-name entries are followed by `0xFF` up to the next 16-byte boundary: 4 to 15 bytes. The names never end on a 16-byte boundary in these files, so they do not show what follows names that do. :proven[all 490 files]

### Classes on the disc

The 490 files hold these objects, and no others: `hkRootLevelContainer` 490, `hkpPhysicsData` 490, `hkpPhysicsSystem` 972, `hkpRigidBody` 12,789, `hkpStorageExtendedMeshShape` 1,758 with 6,445 `MeshSubpartStorage`, `hkpMoppBvTreeShape` 1,705 with as many `hkpMoppCode`, `hkpConvexVerticesShape` 8,780 (and 8,751 connectivity objects), `hkpBoxShape` 1,971, `hkpConvexTranslateShape` 1,400, `hkpCylinderShape` 199, `hkpCapsuleShape` 96, `hkpSphereShape` 16, `hkpListShape` 10, and `hkpConstraintInstance` 161 (144 in the ragdolls, 1 in FOXTROT's base file, 16 in JULIET's) with 72 ragdoll, 89 limited-hinge and 16 breakable constraint data. :proven[all 490 files]

## Triangle meshes

A mesh is a `hkpStorageExtendedMeshShape` (usually under a MOPP tree) with one or more subparts; 83 files have them. Together: 1,758 shapes, 6,445 subparts, **855,428 vertices and 646,081 triangles**. :proven[all 490 files]

- Each subpart's storage has `vertices` (16 bytes each: `x, y, z, 0`, local to the shape) and `indices32`; the 8- and 16-bit index arrays and the 8-bit material indices are empty everywhere. :proven[all 6,445 subparts]
- A triangle is **four** `u32` of the index array, `(v0, v1, v2, 0)`; the fourth is 0 in all 646,081 triangles and the index stride of the subpart is 16 bytes. The index count (2,584,324) is therefore four times the triangle count. :proven[all 646,081 triangles]
- The triangle's material is `materials[materialIndices16[i]]`. `materialIndices16` holds one `u16` per triangle. :proven[all 6,445 subparts]
- The shape's `aabbHalfExtents` and `aabbCenter` (at `+0x90`, `+0xA0`) contain every vertex (tolerance 0.06), `weldingInfo` has one `u16` per triangle, and a subpart's `triangleOffset` is the number of triangles before it. :proven[all 1,758 shapes]
- The 16 bytes at `+0x80`, before the box, are four `f32` 1.0 in every shape: the shape's `scaling`, which is never anything but one. :proven[all 1,758 shapes]
- The 96 bytes at `+0x20` are a subpart record held in the shape itself, a byte-for-byte copy of subpart 0 except its `triangleOffset` (`+0x4C`): that word is 0 in the 1,722 shapes with one subpart and holds unrelated non-zero values in the 36 with more. Nothing in the shape reads it. :proven[all 1,758 shapes]

The `trianglesSubparts` array (`+0xB4`) holds 96-byte subpart records. Every byte that the fields below do not name is
zero in all 6,445 of them. :proven[all 6,445 subparts]
The field names come from the class's member list. :sourced[soulstruct-havok]

```layout
title: Triangles subpart
size: 96
games: [shred]
fields:
  - {at: 0, size: 1, type: u8, name: type, value: "0", level: sourced, note: "0 (triangles) in all 6,445"}
  - {at: 1, size: 1, type: u8, name: materialIndexStridingType, value: "2", level: sourced, note: "2 in all 6,445: 16-bit material indices, the only ones the storage holds"}
  - {at: 2, size: 2, type: i16, name: materialStriding, value: "12", level: proven, note: "the size of a material record"}
  - {at: 4, size: 4, type: u32, name: materialIndexBase, value: "0", level: sourced, note: "a pointer, zero with no fixup: the storage holds the indices"}
  - {at: 8, size: 2, type: u16, name: materialIndexStriding, value: "2", level: proven}
  - {at: 10, size: 2, type: u16, name: numMaterials, level: proven, note: "the storage's material count"}
  - {at: 12, size: 4, type: u32, name: materialBase, value: "0", level: sourced, note: "a pointer, zero"}
  - {at: 16, size: 4, type: u32, name: materialClass, value: "0", level: sourced, note: "a pointer, zero"}
  - {at: 20, size: 4, type: u32, name: numTriangleShapes, level: proven, note: "the storage's triangle count"}
  - {at: 24, size: 4, type: u32, name: vertexBase, value: "0", level: sourced, note: "a pointer, zero"}
  - {at: 28, size: 4, type: u32, name: vertexStriding, value: "16", level: proven}
  - {at: 32, size: 4, type: u32, name: numVertices, level: proven, note: "the storage's vertex count"}
  - {at: 36, size: 12, type: "u8[12]", name: padding, value: "0", level: proven}
  - {at: 48, size: 16, type: "f32[4]", name: extrusion, value: "0, 0, 0, 0", level: sourced, note: "zero in all 6,445"}
  - {at: 64, size: 4, type: u32, name: indexBase, value: "0", level: sourced, note: "a pointer, zero"}
  - {at: 68, size: 4, type: u32, name: indexStriding, value: "16", level: proven, note: "four u32 a triangle"}
  - {at: 72, size: 1, type: u8, name: stridingType, value: "3", level: sourced, note: "3 in all 6,445: 32-bit indices, the only ones the storage holds"}
  - {at: 73, size: 1, type: i8, name: flipAlternateTriangles, value: "0", level: sourced}
  - {at: 74, size: 2, type: "u8[2]", name: padding, value: "0", level: proven}
  - {at: 76, size: 4, type: u32, name: triangleOffset, level: proven, note: "the triangles of the earlier subparts"}
  - {at: 80, size: 4, type: u32, name: userData, value: "0", level: sourced, note: "zero in all 6,445"}
  - {at: 84, size: 12, type: "u8[12]", name: padding, value: "0", level: proven}
```

After `weldingInfo` (`+0xCC`) the shape holds, in all 1,758 shapes: a welding-type byte `0` at `+0xD8` (then three zero bytes), a collision filter word `0` at `+0xDC`, a count at `+0xE0`, the triangle radius `0.001` (an `f32`) at `+0xE4`, eight zero bytes at `+0xE8`, the `meshStorage` array at `+0xF0` and an empty second storage array at `+0xFC` (`0, 0, 0x80000000`); the shape is 0x110 bytes. The bytes at `+0x14` and `+0x15` are `1, 1`. :proven[all 1,758 shapes]
The count at `+0xE0` is the triangle total in 1,277 shapes and smaller in 481 (637,321 against 646,081 triangles over all shapes), never larger. :proven[all 1,758 shapes]
Its place in Havok's member order makes it the shape's cached number of child shapes. :inferred
Which triangles it leaves out is not known: no test of degenerate area, repeated indices, material bits or welding value counts the difference in more than 130 of the 481 shapes. :observed

```layout
title: Material record
size: 12
games: [shred]
note: 7,909 records in the subpart storages; `materials` is an array of them at +0x44 of the storage. The halves are the top 16 bits of an f32.
fields:
  - {at: 0, size: 4, type: u32, name: filterInfo, level: observed, note: "the per-triangle word; its bits 3 to 8 are the surface id"}
  - {at: 4, size: 2, type: half, name: restitution, value: "0x0000 (0.0)", level: sourced, note: "0.0 in all 7,909 records"}
  - {at: 6, size: 2, type: half, name: friction, value: "0x3F80 (1.0)", level: sourced, note: "1.0 in all 7,909 records"}
  - {at: 8, size: 4, type: u32, name: userData, level: sourced, note: "not cleared when written: 0 in 1,630 records, 2 in 535, otherwise heap bytes"}
```

Every record holds restitution 0 and friction 1, so the meshes carry no per-triangle physics material beyond the
filter word. :proven[all 7,909 records]

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
| `hkpConvexVerticesShape` | `+0x10` radius, `+0x20/+0x30` box, `+0x40` vertices as `FourVectors` (48 bytes: `x[4], y[4], z[4]`; vertex *j* is lane *j* mod 4 of group *j* / 4), `+0x4C` vertex count, `+0x50` a word that is 0 with no fixup, `+0x54` the plane equations (an array of `nx, ny, nz, d`), `+0x60` the connectivity (null in 29 shapes); `+0x64` to `+0x6F` zero | :proven[all 8,780] |
| `hkpBoxShape` | `+0x10` radius, `+0x20` half extents | :proven[all 1,971] |
| `hkpSphereShape` | `+0x10` radius | :proven[all 16] |
| `hkpCapsuleShape` | `+0x10` radius, `+0x20` and `+0x30` the two axis ends; the `w` of both ends equals the radius | :proven[all 96] |
| `hkpCylinderShape` | `+0x10` convex radius, `+0x14` radius, `+0x20/+0x30` axis ends, `+0x40/+0x50` perpendiculars | :proven[all 199] |
| `hkpConvexTranslateShape` | `+0x18` child (a box 1,384 times, a sphere 16), `+0x20` translation | :proven[all 1,400] |
| `hkpListShape` | `+0x18` an array of 16-byte child records: the child pointer, then three words that are 0 in all 41 records; `+0x24` and `+0x26` two `u16` 0; `+0x30/+0x40` a box; `+0x50` 32 bytes of `0xFF` | :proven[all 10] |
| `hkpMoppBvTreeShape` | `+0x14` the MOPP code, `+0x34` the child (an extended mesh 1,704 times, a list once) | :proven[all 1,705] |

The vertices of all 8,780 convex shapes lie inside and touch their stored box, which confirms the structure-of-arrays layout. :proven[all 8,780 shapes]
`+0x08` of every shape is 0, except in 583 convex-vertices shapes (all of them on box-inertia bodies) and 45 meshes, where it is 1; `+0x0C` is 0 in all 15,935 shapes. :proven[all 15,935 shapes]

### Convex planes and faces

The connectivity object (`hkpConvexVerticesConnectivity`, 8,751 of them) holds the faces: a `u16` vertex-index array at `+0x08` and a `u8` vertices-per-face array at `+0x14`, whose sum is the index count. :proven[all 8,751]
A shape has at least as many planes as faces (as many in 4,178 shapes, more in 4,573). The planes come in face order first: 250,164 of the 254,882 face/plane pairs point the same way (cosine above 0.999), and in 7,587 shapes every pair does. Of the 19,663 planes past the faces, 19,087 lie clear of the hull, 306 touch it and 270 cut it. :proven[all 8,751 shapes with faces]

Most stored planes are clean: in 8,550 shapes every normal has unit length, and in 8,558 no vertex lies more than 0.001 outside a plane once it is normalised (in 8,439 of them the largest distance is between -0.01 and 0). :proven[all 8,780 shapes]
The rest are not exact hull faces: in 221 shapes all normals share one length other than 1 (from 0.46 to 2.19), in 9 the lengths differ, and 222 shapes have a vertex outside a normalised plane, 161 of them by more than 0.1; 177 of the 222 are shapes with non-unit normals. :proven[all 8,780 shapes]
No single scale of the vertices or the planes makes the violating shapes consistent, so a reader should rebuild those hulls from the vertices. :observed

### MOPP code

An `hkpMoppCode` is a 48-byte body followed by its code bytes. `+0x10` holds an offset and a scale (four `f32`); `+0x20` the code (a byte array whose data starts at `+0x30`, right after the body, and the object ends where the code ends); `+0x2C` a byte that is 0; every other byte of the body is zero. :proven[all 1,705]
For the 1,704 trees over a mesh, the offset is the minimum corner of the mesh's stored box, and the scale times the box's largest extent is 0.99 × 2^24. :proven[all 1,704]
The cylinders (180 of them fixed) are the `ConstructionMarker_*` traffic cones; they are not rails. :observed
The MOPP code is a search tree over the mesh and is not needed to read the triangles. It is not decoded.

## Rigid bodies

Each of the 12,789 `hkpRigidBody` objects (560 to 608 bytes with its name) places one shape in the level. Every walk from a body to its shape tree succeeds. :proven[all 12,789 bodies]

| Offset | Meaning | Confidence |
|---|---|---|
| `+0x10` | the shape (never null) | :proven |
| `+0x2C` | the collision filter word (`collisionFilterInfo` of the body's collidable): 0 in 148 bodies, 2 in 1,933, 7 in 8,741, 11 in 1,953, 15 in 1, 18 in 13; the high 16 bits are 0 in every body | :proven[all 12,789 bodies] |
| `+0x74` | the body's name, a level-editor path such as `Greybox`, `Training1`, `Grind1`, `ConstructionSigns04.mesh01` | :proven |
| `+0xA8` | `storageIndex`, a `u16` with 540 values from 0 up; not a filter | :proven[all 12,789 bodies] |
| `+0xAA` | `contactPointCallbackDelay`, a `u16`: `0xFFFF` in every body | :proven[all 12,789 bodies] |
| `+0xE8` | motion type: 5 (fixed) 2,021, 3 10,372, 2 396 | :observed |
| `+0xF0` | rotation as three columns at stride 16 (w holds junk) | :proven |
| `+0x120` | translation | :proven |

The names of `+0x2C`, `+0xA8` and `+0xAA` are the members' names in Havok's rigid-body class, whose order places
them there. :sourced[soulstruct-havok]

The rest of the body holds, in all 12,789 bodies: :proven[all 12,789 bodies]

| Offset | Contents |
|---|---|
| `+0x28`, `+0x2A` | bytes: 1 in every body; 0 in fixed bodies and 4 in dynamic ones |
| `+0x5C` | an `f32`: the largest `f32` (3.4 × 10^38) in exactly the 2,021 fixed bodies, 0.015 to 0.635 in the dynamic ones (0.635 in 10,620) |
| `+0x84` to `+0x8B` | zero |
| `+0x9C` | `f32` 1.0 |
| `+0xD0` to `+0xD2` | zero |
| `+0xD4` | a number: `0xFFFFFFFF` in exactly the 148 bodies whose filter word at `+0x2C` is 0, otherwise a number from 1 to 1,101 |
| `+0xDE`, `+0xDF` | bytes 3 and 1 |
| `+0xE0` | the motion, 0x120 bytes (the motion type at `+0xE8` is its first member) |
| `+0xE9`, `+0xEA` | 15, then two `u16` `0xC000` |
| `+0x130`, `+0x140` | the centre of mass twice (equal, `w` 0): the transform applied to the local centre of mass at `+0x170` |
| `+0x150`, `+0x160` | the rotation twice as a unit quaternion `x, y, z, w` (equal; the same rotation as the matrix at `+0xF0`) |
| `+0x180` | zero |
| `+0x190` | a radius (`f32`, positive) |
| `+0x194`, `+0x198` | two damping factors: 0 and 0.05 in fixed bodies and in most dynamic ones, up to 0.6 in a few |
| `+0x19C` to `+0x19E` | 127, 127, then 1 in fixed bodies and 2 in dynamic ones |
| `+0x1A0` | inertia (xyz) and inverse mass (w): all zero in the 2,021 fixed bodies, all positive in the 10,768 dynamic ones |
| `+0x1B0`, `+0x1C0` | linear and angular velocity: zero |
| `+0x1D0` to `+0x1FB` | zero |
| `+0x1FC` | a `u16` with 468 different values, 0 in 8,160 bodies; it follows no pattern and looks uninitialised |
| `+0x1FE` | 1.0 as a 16-bit float (the top half of an `f32`) |
| `+0x200` to `+0x21F` | zero; the body is 0x220 bytes and its name string follows it |

The radius at `+0x190` is not a strict bound: for 2,051 of the 10,758 dynamic bodies with a convex shape it is smaller than the distance from the centre of mass to the farthest vertex plus the convex radius (by more than 10% in 141 of them). :proven[all 12,789 bodies]

The 2,021 fixed bodies are 1,758 meshes, 180 cylinders, 42 boxes and 41 convex shapes; the dynamic ones are props and fragments, mostly convex shapes and boxes. :observed
The rotation is orthonormal (to 0.002) with determinant +1 in all bodies, and a vertex `v` goes to `v.x × col0 + v.y × col1 + v.z × col2 + t`: for MIKE's fixed bodies with a non-identity rotation (1,408 samples) this puts them within 0.5 m of the render geometry in every case, the transposed rule in 30%. :proven[all 12,789 bodies]

## Systems and constraints

An `hkpPhysicsSystem` is 0x44 bytes: arrays of bodies (`+0x08`), constraints (`+0x14`), actions and phantoms (`+0x20`, `+0x2C`, empty everywhere), a name (`+0x38`, set only in the ragdoll files), a zero word (`+0x3C`) and a byte at `+0x40` that is 0 or 1, followed by three zero bytes. :proven[all 972]
Every `.hkw` file has two systems: the first has the byte 0 and holds the file's bodies (in 92 files; empty in 390), the second has the byte 1 and no bodies (one constraint in one file, 16 in another). Each ragdoll file has one named system with the byte 1, its bodies and 17 or 19 constraints. :proven[all 490 files]

An `hkpConstraintInstance` (0x38 bytes) points to its data at `+0x0C` and to two rigid bodies at `+0x14` and `+0x18`; the bytes at `+0x1C` are `1, 1, 0`, and every instance has a name at `+0x28`. :proven[all 161]
The constraint data are chains of atoms, each starting with a `u16` type. The type sequences are the same in every object of a class: :proven[all 177]

| Class | Size | Atom types at their offsets |
|---|---|---|
| `hkpRagdollConstraintData` (72) | 0x140 | 2 at `+0x10`, 19 at `+0xA0`, 17 at `+0xF0`, 15 at `+0xFC`, 16 at `+0x110`, 16 at `+0x124`, 5 at `+0x138` |
| `hkpLimitedHingeConstraintData` (89) | 0xE0 | 2 at `+0x10`, 18 at `+0xA0`, 17 at `+0xB4`, 14 at `+0xC0`, 12 at `+0xD0`, 5 at `+0xD4` |
| `hkpBreakableConstraintData` (16) | 0x28 | 1 at `+0x0C`; the data it wraps at `+0x18` (a limited hinge in all 16) |

The first atom (type 2) holds two transforms at `+0x20` and `+0x60`; their rotations are orthonormal in all 161 ragdoll and limited-hinge data. :proven[all 161]

## Frame

Collision is in the same space as the render placements: no offset, flip or scale. For MIKE's base level, collision and render samples agree with a median distance of 5 mm and 96% within one unit; the best of the eight axis flips and swaps by correlation is the identity. For CHARLIE's `trainingsession1`, 96% are within one unit. :observed
CHARLIE's base file holds one static body named `Greybox`, a coarse proxy of the hangar (floor, boundary walls and dome); the detailed collision is in its layer files. :observed

:::open[What do the flag bits of a triangle mean?]
`0x1`, `0x4`, `0x800`, `0x1000`, `0x2000`, `0x4000` and `0x80000000` are carried through unchanged in the data but are not tied to anything in the engine.
:::

:::open[What does a mesh's count at +0xE0 leave out?]
It equals the triangle total in 1,277 meshes and is smaller in 481. Degenerate triangles, repeated indices, material bits and welding values do not account for the difference.
:::

:::open[Where are the rails?]
Grindable geometry is not recognisable in the physics files: there are no cylinders but the cones, and `navsplinedata.hkw` is empty. Rails are probably an SCP table (see the world pages) and perhaps flagged triangles.
:::
