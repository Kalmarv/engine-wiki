---
title: Havok 7.1 collision packfiles
description: "The Havok 7.1.0-r1 packfiles that hold a level's collision: the file structure and fixups, how triangle meshes, convex shapes and rigid bodies are stored, the per-triangle surface id, and the frame."
sources:
  - title: HavokLib (PredatorCZ)
    url: https://github.com/PredatorCZ/HavokLib
    note: a third-party Havok reader; it has no physics classes, so it cannot read these files; its packfile header names the header words
  - title: soulstruct-havok (Grimrukh)
    url: https://github.com/Grimrukh/soulstruct-havok
    note: Havok 5.5 and 2010 class tables; the member names of the rigid body and the mesh material record; the MOPP command table of the Demon's Souls and Dark Souls codes
  - title: hkx-rs (kronerm)
    url: https://gitlab.com/kronerm/hkx-rs
    note: a packfile reader and writer for Havok 2014; computes the class signatures it writes
  - title: havok-reflection (zephenryus)
    url: https://github.com/zephenryus/havok-reflection
    note: a dump of Havok 2014.2's runtime class tables from the Switch game The Legend of Zelda, Breath of the Wild (984 classes, MIT); the inputs of the second signature check
  - title: HKX2Builders
    url: https://git.kroner.dev/HKX2/HKX2Builders
    note: lists the 2014.2 signatures that the dump reproduces
implementations:
  - name: "havok-formats (packfile reader, image and writer, class metadata and layout rules)"
    url: https://github.com/Kalmarv/havok-formats/tree/main/src/packfile
  - name: "havok-formats (the MOPP code walker and box query)"
    url: https://github.com/Kalmarv/havok-formats/blob/main/src/mopp.rs
  - name: "primase worlds/shred (collision.rs, conversion of the Havok data)"
    url: https://github.com/Kalmarv/primase/blob/main/worlds/shred/src/read/collision.rs
---

Collision is not stored with the render meshes. Each level has Havok **packfiles**, `.hkw` entries in the `PHYSICS` section of its [PAKs](/engines/rme/archives/pak/) (482 of them) and eight `.HKX` files in `physics` (ragdolls). All 490 are Havok **7.1.0-r1**
packfiles: version 7, 32-bit pointers, big-endian, three sections (`__classnames__`, `__types__`, `__data__`). All 490 parse. :proven[all 490 files]
`__types__` is empty in 482 files; the eight ragdoll files carry the class metadata of the classes they use in it
([below](#class-metadata-in-the-ragdoll-files)). :proven[all 490 files]
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

The first two entries name the Havok generation of a file without reading its layout. A 7.1 file begins `hkClass`
`14425E51`, `hkClassMember` `4A986551`. The packfiles of Sekiro and Elden Ring (little endian, 8-byte pointers, file
version 9 with contents version `hk_2013.1.0-r1` and version 11 with `hk_2014.1.0-r1`) begin `hkClass` `33D42383`,
`hkClassMember` `B0EFA719`, the same two signatures as a dump of Havok 2014.2's class tables from *The Legend of Zelda:
Breath of the Wild* lists, so the pair separates 7.1 from the 2013 to 2014 generation but not 2013.1, 2014.1 and 2014.2
from one another: the file version and the contents-version text in the header do. :proven[all 35 distinct packfiles of
the two installs: 29 of Sekiro, 6 of Elden Ring]

#### How a signature is computed

The signature is the standard CRC-32 (the zlib polynomial) of one byte string, with every integer written
little-endian whatever the file's byte order. The string is the description of the class followed by the description
of each parent up to the root class. :observed[the stored signature of each of the 24 classes of the 490 files, and the signatures of 18 classes of Havok 2014.2 (the Switch game *The Legend of Zelda: Breath of the Wild*) recomputed from a public dump of that game's runtime class tables; all 42 reproduce]

A class description is, in order:

1. the number of implemented interfaces (`i32`);
2. each enum the class declares: its name, then for each item the item's name and its value (`i32`), then the item
   count (`i32`); then the enum count (`i32`);
3. each declared member in declaration order:
   - when the member names a class and neither its type nor its sub-type is a pointer, the description of that
     class and of its parents, in full;
   - when the member has an enum, the enum as in 2;
   - the member's name, then `u16` values for its type, sub-type, the extra value below when there is one, its C-array
     size and its flags;
4. the member count (`i32`).

The type and sub-type are Havok's member type numbers (`void` 0, `pointer` 20, `zero` 19, `enum` 24, `flags` 31).
Two rewrites apply to a member before its name, type and flags are written:

- An enum or flags member has sub-type `void`, and the flags have the enum's storage size in bytes times 8 toggled.
- A member with the serialize-ignored flag (`0x400`) loses the flag and its type becomes `zero`; its old type moves
  to the sub-type, and its old sub-type, when it is not `void`, is written as the extra `u16` after the sub-type. Without
  that `u16`, four of the 18 2014.2 classes (`hkClass`, `hkClassMember`, `hkClassEnum`, `hkpRigidBody`) and five of the
  24 SHRED classes (the same four and `hkpConvexVerticesShape`) do not reproduce. :observed[18 and 24 signatures recomputed with and without the value]

The implemented-interface count is a field of every runtime class, but the public dump does not list it. It is 1 for
`hkBaseObject` (so for every chain that ends in the base object), `hkpShapeCollection` and `hkpShapeContainer`, and 0
for every other class in the chains of these 42 signatures (81 classes in the SHRED chains). With 0 for the three, 19 of
the 24 SHRED signatures and 13 of the 18 2014.2 signatures fail; with 1, all reproduce. :observed[the 7.1 class tables give 1 for exactly these three of the 81 classes the 24 signatures hash; for 2014.2 each value is the only one of 0 to 3 that reproduces the signatures of the classes that depend on it]

Havok 2014.2 stores 18 signatures that can be compared with SHRED's. Three are the same in both versions (the three
classes that did not change) and fifteen differ, as a CRC over the class description predicts: :observed[18 of 18 recomputed from the public dump; the 2014.2 values equal those a 2014.2 reader library lists]

| Class | 7.1.0-r1 | 2014.2 | |
|---|---|---|---|
| `hkClass` | `14425E51` | `33D42383` | differs |
| `hkClassMember` | `4A986551` | `B0EFA719` | differs |
| `hkClassEnum` | `8A3609CF` | `8A3609CF` | same |
| `hkClassEnumItem` | `CE6F8A6C` | `CE6F8A6C` | same |
| `hkRootLevelContainer` | `2772C11E` | `2772C11E` | same |
| `hkpPhysicsData` | `C2A461E4` | `47A8CA83` | differs |
| `hkpPhysicsSystem` | `FF724C17` | `B3CC6E64` | differs |
| `hkpRigidBody` | `AA8C3B19` | `CD2E69E5` | differs |
| `hkpConvexVerticesShape` | `4E8AB2B7` | `C21C8B5A` | differs |
| `hkpBoxShape` | `3444D2D5` | `DCA2D1A7` | differs |
| `hkpCapsuleShape` | `DD0B1FD3` | `FDA179F3` | differs |
| `hkpSphereShape` | `0795D9FA` | `37AA32C9` | differs |
| `hkpListShape` | `A1937CBD` | `F2EC3ED5` | differs |
| `hkpCylinderShape` | `3E463C3A` | `FAAE1F08` | differs |
| `hkpConvexTranslateShape` | `5BA0A5F7` | `A3F8BF6A` | differs |
| `hkpConstraintInstance` | `4FB4E6BB` | `DA4CE91E` | differs |
| `hkpRagdollConstraintData` | `17A4D42F` | `ED9648F7` | differs |
| `hkpLimitedHingeConstraintData` | `1C566B11` | `75AAE5A3` | differs |
In the 482 files with an empty `__types__` section the files do not describe their own classes: the member layouts below follow Havok 7.1's member order and each was checked against the data. :observed
The eight ragdoll files do describe the classes they use, and every member offset they state is the one the layout rules
give ([below](#class-metadata-in-the-ragdoll-files)). :proven[all 544 classes of the eight files]

### Class metadata in the ragdoll files

The eight ragdoll files (`RAGDOLL`, `RAGDOLLB`, `RAGDOLLF`, `RAGDOLLFB` and the four `AVATAR_` ones) fill their `__types__`
section: 80 objects each, 68 `hkClass` (the classes of the file's objects, their ancestors and the structs their members
hold) and 12 `hkClassEnum`. :proven[all eight files] `__classnames__` lists 16 names in each: the four reflection classes and
the 12 classes of the file's data objects; the metadata objects are not listed under their own names, and the other 56
classes have no signature in the file. :proven[all eight files] The metadata objects are laid out like any other object, in
the same pointer width and byte order, and their fixups (local and global) point inside the section.

```layout
title: hkClass
size: 48
games: [shred]
fields:
  - {at: 0, size: 4, type: ptr, name: name, level: proven, note: "a string"}
  - {at: 4, size: 4, type: ptr, name: parent, level: proven, note: "another hkClass, or null"}
  - {at: 8, size: 4, type: u32, name: object size, level: proven, note: "the class's size in bytes"}
  - {at: 12, size: 4, type: u32, name: implemented interfaces, level: proven, note: "0 in 520 classes, 1 in 16, 4 in 8"}
  - {at: 16, size: 8, type: "ptr, u32", name: declared enums, level: proven, note: "an array of 20-byte hkClassEnum structs, and its length"}
  - {at: 24, size: 8, type: "ptr, u32", name: declared members, level: proven, note: "an array of 24-byte hkClassMember structs, and its length"}
  - {at: 32, size: 4, type: ptr, name: default struct, value: "null", level: unknown, note: "null in all 544 classes"}
  - {at: 36, size: 4, type: ptr, name: attributes, value: "null", level: unknown, note: "null in all 544 classes"}
  - {at: 40, size: 4, type: u32, name: flags, value: "0", level: unknown, note: "0 in all 544 classes"}
  - {at: 44, size: 4, type: u32, name: described version, level: unknown, note: "0 in 456 classes, 1 in 48, 2 in 8, 3 in 24, 8 in 8"}
```

```layout
title: hkClassMember
size: 24
games: [shred]
fields:
  - {at: 0, size: 4, type: ptr, name: name, level: proven}
  - {at: 4, size: 4, type: ptr, name: class, level: proven, note: "the hkClass of a struct, or of what a pointer or array points to; else null"}
  - {at: 8, size: 4, type: ptr, name: enum, level: proven, note: "an hkClassEnum, or null"}
  - {at: 12, size: 1, type: u8, name: type, level: proven}
  - {at: 13, size: 1, type: u8, name: subtype, level: proven}
  - {at: 14, size: 2, type: u16, name: array size, level: proven, note: "the length of a C array of the type, 0 for none"}
  - {at: 16, size: 2, type: u16, name: flags, level: proven, note: "0, 256, 1024 or 1536"}
  - {at: 18, size: 2, type: u16, name: offset, level: proven, note: "in the class's object"}
  - {at: 20, size: 4, type: ptr, name: attributes, value: "null", level: unknown, note: "null in all 2,296 members"}
```

```layout
title: hkClassEnum
size: 20
games: [shred]
fields:
  - {at: 0, size: 4, type: ptr, name: name, level: proven}
  - {at: 4, size: 8, type: "ptr, u32", name: items, level: proven, note: "an array of 8-byte items (an i32 value and a name string), and its length"}
  - {at: 12, size: 4, type: ptr, name: attributes, level: unknown}
  - {at: 16, size: 4, type: u32, name: flags, level: unknown}
```

Together the eight files state 2,296 members and 240 declared enums. The member types they use are (type number: count)
1: 152, 3: 40, 4: 256, 5: 48, 6: 152, 7: 88, 8: 136, 10: 8, 11: 296, 12: 168, 13: 16, 14: 8, 18: 24, 20: 280, 22: 152,
24: 104, 25: 264, 30: 48, 32: 8 and 33: 48. :proven[the eight files]

Two checks tie the metadata to the rest of the file:

- **Signatures.** The signature stored beside each class name in `__classnames__` is the CRC-32 of the description
  [above](#how-a-signature-is-computed) computed from this metadata: all 96 stored signatures (12 classes in each file)
  recompute, with the interface counts the metadata stores. :proven[all 96]
- **Offsets.** Every member offset and every class size follows from the member lists: a member sits at the next
  multiple of its alignment after the one before; a class starts where its parent's members end; each interface a class
  implements takes one 4-byte table pointer before its first member (`hkBaseObject` implements one and its members
  start at 4, `hkpCollisionFilter` implements four on its 8-byte parent and starts at 24); a C array is its length times
  the element; flags `256` make the member 16-aligned. The sizes and alignments are 1 for types 1, 3 and 4; 2 for 5, 6
  and 32 (a half); 4 for 7, 8 and 11 and for a pointer (20), a string pointer (33) and `ulong` (30); 8 for 10; 16 for
  12 and 13; 48 for 14 (aligned 16); 64 for 18 (aligned 16); 12 for an array (22, aligned 4); an enum (24) is as wide
  as its subtype's integer; a struct (25) is its class. All 2,296 member offsets and 544 class sizes (68 classes in each
  of the eight files) come out as stored. :proven[all 2,296 members and 544 classes]
  No class in these files tells whether a derived class may start in its parent's tail padding: they come out the
  same either way. :observed[the 68 classes]

### Fixups, arrays and padding

These rules hold in every one of the 490 files; each was counted over all of them (82,847 local and 47,763 global fixups, 47,915 objects, 114,784 array headers).

- Every fixup source is 4-byte aligned, and so is every local destination; global destinations and objects (virtual-fixup sources) are 16-byte aligned. :proven[all 490 files]
- Every local and global fixup source lies on a pointer member of its object's class, or of an element of one of its arrays, in the 7.1 member layouts (130,610 of 130,610). The stored word of every pointer slot is 0, fixed up or not (487,981 slots). :proven[all 490 files]
- An `hkArray` is a pointer, a `u32` size and a `u32` capacity word. The capacity word is `size | 0x80000000` in all 114,784 array headers, empty arrays included; an empty array never has a fixup and a non-empty one always has one. :proven[all 490 files]
- Members that Havok does not serialize are written as zeros, except arrays: the three such arrays of every rigid body (`+0x60`, `+0xB4`, `+0xC0`) read `0, 0, 0x80000000` in all 12,789 bodies. :proven[all 490 files]
- Every other byte that belongs to no serialized member is zero: the vtable slots, the alignment gaps inside every object and every array element, and the padding between an object's body, its arrays and its strings, over all 47,915 objects. Bytes that are not zero belong to members: the `userData` word of the material records and the 16-bit word at `+0x1FC` of the rigid bodies (below). :proven[all 490 files]
- The objects are written depth-first from the root, taking each object's pointer slots in offset order and following a slot that owns an array or string into it before the next slot: that is the order of all 47,915 objects. :proven[all 490 files]
- An object is its body (padded to 16 bytes), then the arrays and strings its body's pointers own, each starting on a 16-byte boundary; 82,847 of them, 980 of which are owned by an array's element rather than by the body. Those 980 (the strings of the root container's variant: its name and class name) follow the array at once, from a 2-byte boundary, and each is padded to 16 bytes. :proven[all 490 files]
- The fixup tables end in `0xFFFFFFFF` words up to a 16-byte boundary and have no terminator when they end on one. Local and global fixups are in the order the walk above meets their pointers; virtual fixups ascend by object. The class-name list is the four reflection classes, then each class in the order of its first object. Reading a file's objects, arrays, strings and pointers and writing them out by these rules gives back all 490 files byte for byte (59,692,192 bytes), the eight with class metadata included. :proven[all 490 files]
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
The code is not needed to read the triangles: it is the bounding-volume tree a collision query runs to find which triangles
a box can touch, stored as a bytecode program. Every multi-byte argument is big endian. The program walks a tree of
splits and ends in *terminals*, each a shape key `subpart << (32 − numBitsForSubpartIndex) | triangle`; the mesh's
`numBitsForSubpartIndex` is 12 in all 1,704. :proven[all 1,704]

The 1,705 codes (5,917,936 bytes; the longest is 964,064) execute 68 distinct opcodes and no others, and every path of every
code ends at a terminal. :proven[all 1,705 codes] The command table, which agrees with the one soulstruct documents for
Demon's Souls and Dark Souls codes, :sourced[soulstruct-havok] is ("reached" counts each distinct address and terminal offset a full walk of every code reaches once):

| Opcodes | Command | Reached |
|---|---|---|
| `0x01`-`0x04` | rescale: three frame bytes `x y z`; the query box becomes `(q − (frame << 16)) << opcode` per axis | 28,395 / 22,441 / 13,332 / 9,061 |
| `0x05`, `0x06` | jump forward by the 8-bit or 16-bit argument that follows, counted from the end of the command | 332 / 308 |
| `0x70` | jump to the absolute 32-bit address that follows | 17,269 |
| `0x09`, `0x0A` | add the 8-bit or 16-bit argument to the terminal offset | 27,113 / 31,192 |
| `0x0B` | set the terminal offset to the 32-bit argument | 59,516 |
| `0x10`-`0x12` | split on the x, y or z plane: `left_max right_min right_jump8` | 144,790 / 134,888 / 145,305 |
| `0x13`-`0x1C` | the same on a diagonal plane | 8,098 to 35,386 each |
| `0x20`-`0x22` | split on one value: `value right_jump8` | 1,305 / 904 / 1,192 |
| `0x23`-`0x25` | split with 16-bit jumps: `left_max right_min left_jump16 right_jump16` | 1,669 / 1,021 / 1,903 |
| `0x26`-`0x28` | bounds on the x, y or z axis: `min max` | 163,356 / 150,565 / 165,963 |
| `0x30`-`0x4F` | terminal: key = terminal offset + opcode − `0x30` | 2,763 to 119,525 each |
| `0x50`-`0x53` | terminal: key = terminal offset + the following 8, 16, 24 or 32-bit value | 118,664 / 39,188 / 1,633 / 29,749 |

:proven[all 1,705 codes] No code executes `0x00` (return), `0x07` or `0x08` (longer jumps), `0x0C` (a jump to a numbered
512-byte chunk) or `0x29`-`0x2B` (bounds with 24-bit arguments), which the Demon's Souls and Dark Souls codes use. :proven[all 1,705 codes]

A split sends a query to its left branch (the next command) when the query box's minimum, as the high byte of its
integer coordinate, is at most `left_max`, and to its right branch when the maximum is at least `right_min`; both when
the box straddles. A world position is the unsigned integer `floor((p − offset) × scale)` per axis with the code's
`offset` and `scale` (`+0x10`), and a command compares the high byte (`>> 16`) of the coordinate in the current
frame. Run with a triangle's own box, the code returns that triangle's key for all 637,213 triangles that have a
terminal, along with other keys (33 on average, since a diagonal split is followed on both sides in this model); run
with a box a million metres away it returns nothing for all 1,704. :proven[all 1,705 codes]

The terminals of the 1,704 codes over a mesh are exactly the keys of the mesh's triangles without the degenerate ones. A
triangle is degenerate when the squared edge cross product, taken from either of its first two vertices in `f32` (the sum of
the squares of its three components, each product and sum in the order of the formula), is under 10⁻⁷, or when its three
points are exactly collinear by the identity `|u|² |v|² − (u · v)² = 0` evaluated in `f32` for two of its edges. That
separates all 8,760 triangles the codes leave out from the 637,213 they keep (none of those passes it). The squared
cross product alone separates 8,755: the other five triangles, in three meshes (one each in two, three in a third), have a
squared cross product of 6.3 × 10⁻⁷ to 0.031 and edges up to 39 m, and the identity comes out exactly zero for each of them
because the single-precision rounding of the two large products swallows the small difference. :proven[all 1,705 codes]
The same test, with the same threshold and order of operations, is the one the compressed-mesh builder of Sekiro and Elden
Ring applies to a triangle before keeping it (see [Havok containers and compressed meshes](/engines/fromsoft/collision/havok/)).
:observed[every named collision binder] No terminal names a triangle the mesh lacks. The one code over a list shape has
5 terminals, the keys of its child shapes. :proven[all 1,705 codes]

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
| `+0x5C` | an `f32`: `0x7F7FFFEE` (3.40282 × 10^38, 17 units in the last place below the largest `f32`) in exactly the 2,021 fixed bodies, 0.015 to 0.635 in the dynamic ones (0.635 in 10,620) |
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
| `+0x1A0` | the inverse inertia (xyz) and the inverse mass (w): all zero in the 2,021 fixed bodies, all positive in the 10,768 dynamic ones |
| `+0x1B0`, `+0x1C0` | linear and angular velocity: zero |
| `+0x1D0` to `+0x1FB` | zero |
| `+0x1FC` | a `u16` with 468 different values, 0 in 8,160 bodies; it follows no pattern and looks uninitialised |
| `+0x1FE` | 1.0 as a 16-bit float (the top half of an `f32`) |
| `+0x200` to `+0x21F` | zero; the body is 0x220 bytes and its name string follows it |

The xyz at `+0x1A0` are the inverse of the inertia, not the inertia: for the 587 dynamic bodies whose shape is a box, `x` times the solid box's `m/3 (hy² + hz²)` (`m` the reciprocal of the `w` lane, `h` the half extents) lies between 0.8 and 1.05 in 494 of them, and the quotient of the two is near 1 in none. :observed[587 dynamic box bodies of the 490 files]

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

### Physics data, instances and atoms

The root container holds one named variant, of class `hkpPhysicsData`, named `hkpPhysicsData` in 482 files and `Physics Data` in the 8 ragdoll files. :proven[all 490 files] The `hkpPhysicsData` (0x18 bytes) has a null world pointer at `+0x08` in all 490, so no world object, collision filter object or layer table exists in any file, and an array of systems at `+0x0C`: two systems (482 files) or one (the ragdolls). :proven[all 490 files]
Every rigid body of a file is in exactly one system's body list (12,789 bodies in 100 systems), in data order. The 144 constraints of the ragdoll files sit in the system that holds their two bodies; the 17 of FOXTROT's base file and JULIET's sit in the second system, which has no bodies, and join bodies of the first. :proven[all 490 files]

The members of an `hkpConstraintInstance` are, at their offsets: the owner island (`+0x08`, null), `data` (`+0x0C`), `constraintModifiers` (`+0x10`, null in all 161), `entities` (`+0x14`, `+0x18`: two different rigid bodies), `priority` (`+0x1C`, 1 = `PRIORITY_PSI`), `wantRuntime` (`+0x1D`, 1), `destructionRemapInfo` (`+0x1E`, 0), a small array of listeners (`+0x20`, eight zero bytes), `name` (`+0x28`), `userData` (`+0x2C`, 0) and two zero words (`+0x30`, `+0x34`). :proven[all 161 instances] Each offset equals the one the class metadata of the eight ragdoll files stores. :proven[8 ragdoll files]

The atom type numbers are the ones the ragdoll files' metadata lists as `AtomType`: 1 bridge, 2 set local transforms, 5 ball socket, 12 2d angle, 14 angle limit, 15 twist limit, 16 cone limit, 17 angular friction, 18 angular motor and 19 ragdoll motor. :proven[8 ragdoll files] They are not the numbers of the Sekiro and Elden Ring tagfiles, where 23 is a setup-stabilization atom and the atoms that share a name have more members. :observed[class tables of the two generations]
Each atom is its `u16` type and its members, and the next atom starts where the previous one's class ends. Every other byte of the objects is zero (padding) except the two transforms' fourth lanes. :proven[all 161 data objects] The atoms' members:

| Atom | Members at their offsets (from the atom) | Values in the data |
|---|---|---|
| set local transforms (0x90) | transform A `+0x10`, transform B `+0x50` (each three 16-byte columns and a translation) | the fourth lane of every column of transform A is zero in the 17 hinges of FOXTROT and JULIET and non-zero in the 144 data of the ragdoll files; orthonormal in all 322 |
| ragdoll motor (0x50) | `isEnabled` `+0x02`, `initializedOffset` `+0x04`, `previousTargetAnglesOffset` `+0x06`, `target_bRca` `+0x10` (three columns), three motor pointers `+0x40` | disabled; 96 and 100; equal to transform B's rotation (fourth lanes too); null |
| angular friction (0xC) | `isEnabled` `+0x02`, `firstFrictionAxis` `+0x03`, `numFrictionAxes` `+0x04`, `maxFrictionTorque` `+0x08` | enabled, axis 0; 3 axes with torque 0.7 (56), 2.0 (8) or 3.0 (8) in a ragdoll, 1 axis with 0 (80) or 5.0 (9) in a hinge |
| twist limit (0x14) | `isEnabled` `+0x02`, `twistAxis` `+0x03`, `refAxis` `+0x04`, `minAngle` `+0x08`, `maxAngle` `+0x0C`, `angularLimitsTauFactor` `+0x10` | enabled, axes 0 and 1, tau 0.8; 6 distinct angle pairs, the minimum at most 0 |
| cone limit (0x14) | `isEnabled` `+0x02`, `twistAxisInA` `+0x03`, `refAxisInB` `+0x04`, `angleMeasurementMode` `+0x05`, `memOffsetToAngleOffset` `+0x06`, `minAngle` `+0x08`, `maxAngle` `+0x0C`, tau `+0x10` | the cone: axes 0 and 0, mode 0, offset 0x38, minimum -100.0 in all 72; the planes limit: axes 0 and 1, mode 1, offset 0; tau 0.8 in both |
| angle limit (0x10) | `isEnabled` `+0x02`, `limitAxis` `+0x03`, `minAngle` `+0x04`, `maxAngle` `+0x08`, tau `+0x0C` | enabled, axis 0, tau 1.0; 14 distinct angle pairs, from (-0.0174, 0.0174) to (-4.188, 0.8725) radians |
| angular motor (0x14) | `isEnabled` `+0x02`, `motorAxis` `+0x03`, `initializedOffset` `+0x04`, `previousTargetAngleOffset` `+0x06`, `correspondingAngLimitSolverResultOffset` `+0x08`, `targetAngle` `+0x0C`, motor pointer `+0x10` | disabled, axis 0; 64, 68 and 16; angle 0; null |
| 2d angle (4) | `freeRotationAxis` `+0x02` | 0 |
| ball socket (8) | `bodiesToNotify` `+0x02`, `stabilizationFactor` `+0x03`, `maxImpulse` `+0x04` | 0; 48; the largest `f32` |

:proven[all 161 data objects] No data object holds a motor object, an action or a phantom.
The breakable constraint data (48 bytes to the next object) is, after the 12-byte `hkpConstraintData` header: a bridge atom (type 1 at `+0x0C`, a null function pointer at `+0x10`, a pointer back to the object itself at `+0x14`), the wrapped data (`+0x18`, a limited hinge in all 16), `childRuntimeSize` (`+0x1C`, 80), `childNumSolverResults` (`+0x1E`, 8), `solverResultLimit` (`+0x20`, 25.0 in 12 and 30.0 in 4), and two flags (`+0x24`, `+0x25`, 0), then zero. :proven[all 16] These objects carry no class metadata; their member names are the SDK's. :sourced[Havok SDK headers]

A body's collision filter word at `+0x2C` splits as Havok's group filter splits it (layer in bits 0 to 4, sub-system id in 5 to 9, the sub-system not to collide with in 10 to 14, system group in 16 to 31): in all 12,789 bodies only the layer is set, to 0, 2, 7, 11, 15 or 18. :proven[all 12,789 bodies] No file holds a filter object to say which layers collide. The per-triangle word of a mesh's materials is not such a word (its surface id spans the layer and sub-system fields).

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
