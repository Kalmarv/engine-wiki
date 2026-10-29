---
title: Havok tagfiles and type tables
description: "The TAG0 tagfile and TCM0 compendium as both games ship them: SDK versions, the type table and its hash, item and patch tables, and how values are stored."
sources:
  - title: HKLib
    url: https://github.com/The12thAvenger/HKLib
    note: 2018.1 tagfile reader and a registry of 2018.1 type names, versions and hashes
  - title: soulstruct-havok
    url: https://github.com/Grimrukh/soulstruct-havok
    note: tagfile reader and writer for FromSoftware games; its packed-integer, string-encoding and type-hash assumptions are compared below
  - title: TagTools
    url: https://github.com/blueskythlikesclouds/TagTools
    note: 2016 tagfile reader and writer
implementations:
  - name: havok-formats tagfile writer
    url: https://github.com/Kalmarv/havok-formats/blob/main/src/tagfile_write.rs
  - name: havok-formats tagfile reader
    url: https://github.com/Kalmarv/havok-formats/blob/main/src/tagfile.rs
  - name: havok-formats type table reader
    url: https://github.com/Kalmarv/havok-formats/blob/main/src/types.rs
---

Both games store their Havok data (map and object collision, animation, skeletons, cloth, behaviours) mostly as Havok
tagfiles: a `TAG0` file that carries its own type table, or names an external `TCM0` type compendium by an eight-byte
id. The type table describes every class the file's objects use, so a reader takes each layout from the file itself
rather than from a built-in class list. [Collision](/engines/fromsoft/collision/havok/) and
[animation](/engines/fromsoft/animation/havok-clips/) build on this container. :observed

The facts on this page come from a census that opened every entry of both installs' archives (Sekiro's 8,765 entries;
Elden Ring's 97,118 base-game and `sd` entries, the DLC archive not installed), decoded DCX, opened every BND4 binder
and every split `bhd`/`bdt` binder, and read every Havok file found. One Sekiro entry, a map-piece binder of two FLVER
models, is stored shorter than its DCX header states and was read only far enough to list its members.

| | Sekiro | Elden Ring |
|---|---|---|
| Tagfiles (distinct; copies) | 19,137; 20,581 | 68,722; 81,013 |
| Compendia (distinct; copies) | 16; 409 | 36; 2,890 |
| Tagfiles naming a compendium | 15,176 | 46,793 |
| Distinct type tables | 229 | 875 |
| Types in them | 84,566 | 373,202 |
| Stored type hashes | 20,180 | 90,033 |
| Packfiles (distinct) | 29 | 6 |

The counts are :proven{games="sekiro elden-ring"} over the archives as described.

## SDK versions

| SDK string | Sekiro | Elden Ring |
|---|---|---|
| `20150100` (2015.1) | 1 tagfile | none |
| `20160200` (2016.2) | 19,136 tagfiles | 42 tagfiles |
| `20180100` (2018.1) | none | 68,680 tagfiles |

Counts over every distinct tagfile of each install. :proven{games="sekiro elden-ring"}

All three versions share one section grammar: the type table, item table, patch table and value encoding below read
every tagfile of all three, and the stored type hashes recompute on all of them. :proven{games="sekiro elden-ring"}
Only the class layouts differ, and each file states its own.

## Sections

A `TAG0` holds `SDKV`, `DATA`, `TYPE` or `TCRF`, and `INDX` (`ITEM`, then `PTCH`). A `TCM0` holds `TCID` (its
eight-byte ids) and `TYPE`. :proven{games="sekiro elden-ring"} Every type table of both games has the sub-sections
`TPTR`, `TSTR`, `TNA1`, `FSTR`, `TBDY`, `THSH`, `TPAD`, in that order, except the 2015.1 file, which names two of them
`TNAM` and `TBOD`. :proven{games="sekiro elden-ring"} The section header is described on the
[collision page](/engines/fromsoft/collision/havok/#tagfile-structure).

## Packed integers

Type-table numbers are variable-length, big-endian within the integer: the first byte's high bits give the width.

| First byte | Width | Value bits |
|---|---|---|
| `00`–`7F` | 1 | 7 |
| `80`–`BF` | 2 | 14 |
| `C0`–`DF` | 3 | 21 |
| `E0`–`E7` | 4 | 27 |
| `E8`–`EF` | 5 | 35 |
| `F0`–`F7` | 8 | 59 |
| `F8` | 6 | 40 |
| `F9` | 9 | 64 |

Over all 1,539,516 packed integers of Sekiro's type tables and 6,937,782 of Elden Ring's, only the 1-, 2-, 3- and
5-byte forms occur, the 5-byte form only for template value parameters, and every integer is written in the shortest
form that holds it. :proven{games="sekiro elden-ring"} A writer that always picks the shortest form reproduces the
stored bytes.

A first byte `C3` is an ordinary 3-byte integer. In Elden Ring it appears 872 times, every time as a field-count word
of `0x30001`: three properties and one field (below). :proven{games="elden-ring"} A reader that takes `C3 00 01` as
the value 1 gets the field count right by accident and loses the property count; the value is 196,609. Sekiro has no
`C3` first byte. :proven{games="sekiro"}

## Type table

`TNA1` lists, for every type after the null type 0, its name (an index into `TSTR`) and its template parameters: a
name and a value each. A parameter whose name starts with `t` takes a type index; one starting with `v` takes a
number. :proven{games="sekiro elden-ring"}

`TBDY` holds one record per type: the type index, the parent's index, a presence word, then the optional parts the
presence word announces, in this order. :proven{games="sekiro elden-ring"}

| Presence bit | Part | Stored as |
|---|---|---|
| 1 | format word | packed integer |
| 2 | subtype (element or pointee type) | type index |
| 4 | version | packed integer |
| 8 | size, then alignment word | two packed integers |
| 16 | type flags | packed integer |
| 32 | field count word, then fields | packed integer; per field a name (`FSTR` index), field flags, offset, type index |
| 64 | interfaces | count; per interface a type index and a number |
| 128 | attribute string | never present |

:proven{games="sekiro elden-ring"} A zero byte where a record's type index would be is skipped: Sekiro's tables
contain 294 such bytes and Elden Ring's 1,297. :observed{games="sekiro elden-ring"}

The subtype (bit 2) occurs only on pointer types (format kind 6) and array types (kind 8). :proven{games="sekiro elden-ring"}
Every one of them stores its own format word: 25,275 pointer and 20,192 array types in Sekiro's 229 distinct tables,
111,486 and 91,351 in Elden Ring's 875, and none takes its kind from a parent. :proven{games="sekiro elden-ring"}

### Field count word

The low 16 bits count the field records that follow; the high 16 bits count properties, which store no records here.
:proven{games="sekiro elden-ring"} (Every field record is consumed exactly and every stored hash recomputes from the
fields read this way.)

### Type flags

Presence bit 16 announces a type-flags word: a bit set, not a single "abstract" value. :proven{games="sekiro elden-ring"}
The values stored, over every type of both installs:

| Value | Bits | Types it is stored on | Confidence |
|---|---|---|---|
| 0 | none | `T*` | :proven{games="elden-ring"} |
| 1 | not serialisable | `void`, `hkPtrAndInt` | :proven{games="sekiro elden-ring"} |
| 3 | not serialisable, abstract | `hclAction`, `hclConstraintSet` and other `hcl` bases | :proven{games="sekiro elden-ring"} |
| 16 | interface | `hkContainerHeapAllocator`, `hkHashMap`, `hkcdStaticTree::AabbTreeBase` | :proven{games="sekiro elden-ring"} |
| 64 | weak pointer | `hkViewPtr`; in Elden Ring also `T*` | :proven{games="sekiro elden-ring"} |
| 144 | interface, own vtable | `hkBaseObject` | :proven{games="sekiro elden-ring"} |
| 147 | not serialisable, abstract, interface, own vtable | `hclSetupMeshSection`, `hkbVerifiable` | :proven{games="sekiro elden-ring"} |
| 256 | attribute | `hkbRoleAttribute` | :proven{games="sekiro elden-ring"} |

The values are proven; the bit names (1 not serialisable, 2 abstract, 16 interface, 64 weak pointer, 128 own vtable,
256 attribute) are HKLib's. :sourced[HKLib] A stored 0 is not the same as an absent word: Elden Ring stores an
explicit 0 on 24,150 pointer types. :proven{games="elden-ring"}

### Size and alignment word

The alignment number's low 12 bits are the alignment in bytes; bits 12–15 are 0 on every type except
`hkCompressedMassProperties` (3, alignment 8) and `hkpConstraintAtom` (15, alignment 16).
:proven{games="sekiro elden-ring"} Read as a requested alignment, 3 is 2³ = 8 bytes and 15 a four-real (16-byte)
request. :inferred A reader that keeps the whole number as the alignment gets 12,296 and 61,456 for those two types.

### Field flags

Every field record of both installs has flags `0x20` set; the values are `0x20` to `0x25`.
:proven{games="sekiro elden-ring"}

| Value | Count (Sekiro; Elden Ring) | Example field |
|---|---|---|
| `0x20` | 83,295; 375,836 | `hkRootLevelContainer.namedVariants` |
| `0x21` | 1,573; 6,924 | `hknpWorldCinfo.userBodyBuffer`, `hkDefaultPropertyBag.locked` |
| `0x22` | 49,241; 230,392 | `hkArray.m_data` |
| `0x23` | 1,623; 5,221 | `hkPropertyBag.bag` |
| `0x24` | 11,365; 43,158 | `hkRootLevelContainer::NamedVariant.name` |
| `0x25` | 1,938; 5,683 | `hkReferencedObject.memSizeAndFlags` |

The bits are named as the 2018 SDK's declaration-flag enumeration names them in HKLib (`DECL_NOT_SERIALIZABLE`,
`DECL_PROTECTED`, `DECL_PRIVATE`, `DECL_DATA_FIELD`). :sourced[HKLib]

| Bit | Name | What the files show | Confidence |
|---|---|---|---|
| `0x01` | not serialisable | The member keeps its offset in the type table, but its bytes read zero every time they are read: 183 such members in Sekiro's tables (1,737,907 reads) and 205 in Elden Ring's (13,901,700 reads), a run of structs read by its first 16 elements. | :observed[every distinct tagfile read of both installs] |
| `0x02` | protected | Of the 196 combinations of class, member and flags that both a type table of either game and the Havok 6.6 SDK's public headers declare, the 3 the headers put under `protected:` all store `0x22`. | :observed[the 196 combinations] |
| `0x04` | private | Of the 17 combinations the headers put under `private:`, 16 store `0x24`; the 17th, `hkFlags.storage`, is stored `0x24` by most instances of the template and `0x22` by one. Reading the two bits the other way round fails on 19 of these 20 non-public combinations. | :observed[the 196 combinations] |
| `0x20` | data field | Set on every field record. | :proven{games="sekiro elden-ring"} |

A member the headers put under `public:` stores neither access bit in 174 of 176 combinations; the two others are
`hkxVertexFloatDataChannel.perVertexFloats` (stored `0x22`) and `hkReferencedObject.memSizeAndFlags` (stored `0x25`).
:observed[the 196 combinations] Bits 1 and 2 are never set together, and the bits `0x08` (hidden), `0x10` (property
field) and `0x40` (custom setter) are set on no record of either install. :proven{games="sekiro elden-ring"}

### Enumerated members

The type tables name the enumeration of an enumerated member (`hkaAnimationBinding::BlendHint`,
`hclClothData::Platform`) but list none of its items, so the values below are what the tagfiles store and the names
are HKLib's, from its 2018.1 classes. :sourced[HKLib] Counts are over every distinct tagfile read (Sekiro 19,127, of
which 11 more cannot be read: ten name a compendium that lies in another binder and one archive entry is a truncated
envelope; Elden Ring 68,722).

| Member | Stored values | Confidence |
|---|---|---|
| `hkaAnimation.type` (`AnimationType`, a 32-bit enum) | Each class stores one value in all its animations: `hkaInterleavedUncompressedAnimation` 1 `HK_INTERLEAVED_ANIMATION` (Sekiro 2,443; Elden Ring 153), `hkaSplineCompressedAnimation` 3 `HK_SPLINE_COMPRESSED_ANIMATION` (11,571; 48,628), `hkaQuantizedAnimation` 4 `HK_QUANTIZED_COMPRESSED_ANIMATION` (Sekiro 431). The values 0, 2, 5 and 6 occur in no tagfile. | :observed[every distinct tagfile read] |
| `hkaAnimationBinding.blendHint` (`BlendHint`, 32 bits) | 0 `NORMAL` (Sekiro 14,121; Elden Ring 44,645), 1 (321; 4,136), 2 (Sekiro 3, all in `c9520`). The names of 1 and 2 are `ADDITIVE_PARENT_SPACE` and `ADDITIVE_CHILD_SPACE` in the 2018.1 SDK and `ADDITIVE_DEPRECATED` and `ADDITIVE` in the 2014 one; Sekiro's 2016.2 lies between, and the files do not say. See [Havok clips](/engines/fromsoft/animation/havok-clips/). | :observed[every distinct tagfile read] |
| `hkaAnimatedReferenceFrame.frameType` (`hkaReferenceFrameTypeEnum`) | Not stored: declared with flags `0x21` and 0 in all 6,865 reference frames of Sekiro and 20,609 of Elden Ring. HKLib names 0 `REFERENCE_FRAME_UNKNOWN`, 1 `REFERENCE_FRAME_DEFAULT`, 2 `REFERENCE_FRAME_PARAMETRIC`. | :observed[every distinct tagfile read] |
| `hknpBodyCinfo.motionType` (`hknpMotionType::Enum`, a byte) | 0 `STATIC` (Sekiro 16,644 bodies; Elden Ring 286,180), 1 `KEYFRAMED` (642; 404), 2 `DYNAMIC` (7,225; 26,490). Only motion type 2 has a positive mass (5,334 and 24,257 bodies); type 1 has mass 0 or −1. See [bodies](/engines/fromsoft/collision/materials-and-bodies/). | :observed[every distinct tagfile read] |
| `hknpShape.type` (`hknpShapeType::Enum`) | Each shape class stores one value: `hknpConvexShape` 0 `CONVEX` (Sekiro 2; Elden Ring 9), `hknpConvexPolytopeShape` 1 `CONVEX_POLYTOPE` (1,446; 3,326), `hknpSphereShape` 2 `SPHERE` (5; 8), `hknpCapsuleShape` 3 `CAPSULE` (1,924; 7,107), `hknpCylinderShape` 4 `CYLINDER` (Elden Ring 97), `hknpTriangleShape` 5 `TRIANGLE` (3; 3), `hknpBoxShape` 6 `BOX` (5,210; 16,798), `hknpCompressedMeshShape` and the games' `fsnpCustomParamCompressedMeshShape` 9 `COMPRESSED_MESH` (3,426; 21,406), `hknpExternMeshShape` 10 `EXTERN_MESH` (12,498; 264,840). | :observed[every distinct tagfile read] |
| `hclClothData.targetPlatform` (`Platform`, 32 bits) | 2 `HCL_PLATFORM_X64` in all 610 cloth datas of Sekiro and 2,692 of Elden Ring. The enumeration has one bit per platform. | :observed[every distinct tagfile read] |
| `hclShape.type` (`hclShapeType`) | Not stored: 0 in every shape (Sekiro 268, Elden Ring 3,460); the class names the shape type: `hclSphereShape` 0 `HCL_SHAPE_TYPE_SPHERE`, `hclPlaneShape` 1, `hclCapsuleShape` 2, `hclTaperedCapsuleShape` 3, `hclConvexGeometryShape` 9 `HCL_SHAPE_TYPE_CONVEX_GEOMETRY`. | :observed[every distinct tagfile read] |

## Type hash (`THSH`)

`THSH` stores a 32-bit hash for some types. Each stored hash is a chained CRC-32 of the type's own description,
recomputable from the type table alone. :proven{games="sekiro elden-ring"} Every one of the 20,180 stored hashes in
Sekiro and the 90,033 in Elden Ring recomputes as follows, so the hash checks the whole type-table reading at once:
names, templates, versions, sizes, alignment words, type flags, field names, offsets and types, and parents.

Each step continues a standard CRC-32 (reflected polynomial `0xEDB88320`, the register inverted before and after
each step) from the previous result; numbers enter as four little-endian bytes and names as their bytes without a
terminator. For type `T`:

1. Start from the parent's hash, or 0 without a parent.
2. Interfaces (if present): per interface, the interface type's name, then its stored number.
3. Format word (if present). For a fixed-size array (kind 8 with bits 5–6 equal to 1), then the element type's hash.
4. The name.
5. Template parameters: for a type parameter, the parameter type's name and then its own template parameters, the same
   way; for a value parameter, the value.
6. Version (if present).
7. Size and alignment (if present): `size | alignment word << 16`.
8. Type flags (if present).
9. Fields (if present): every data field of `T` and of the classes it derives from, the root class's first, each as
   its name, its offset and the hash of the field's type. Field flags and the property count are not included.

:proven{games="sekiro elden-ring"} Step 9 hashes the inherited fields again although the parent's hash already
covers them; a derived class does not match without them.

### Hash and identity

Within one SDK version of a game, a type's full name (its template arguments expanded) has one layout and one hash in
every file: 1,248 full names over Sekiro's 228 tables of 2016.2, and 1,397 over Elden Ring's 871 tables of 2018.1, with
one exception. :proven{games="sekiro elden-ring"} The hash changes when the layout changes: across SDK versions, and
for Elden Ring's `hkcdSimdTree::Node`, which one 2018.1 table stores at version 1 beside the version 2 of every other.
:proven{games="elden-ring"} No name and hash pair stands for two layouts, and no layout has two hashes, in either
game. :proven{games="sekiro elden-ring"} A class is
therefore identified by its name and version together with its stored layout. Different hashes for the same name mean
a different layout, not a file-specific value.

HKLib's 2018.1 registry gives the same name, version and hash for every hash stored in Elden Ring's 2018.1 files
(89,917 of 89,918, all but that version 1 node) and in one further compendium that no file names (48 of 48).
:proven{games="elden-ring"} The registry is an independent list.

## Item table

`ITEM` is a list of 12-byte records; item 0 is the null item and item 1 the root object. :proven{games="sekiro elden-ring"}

```layout
title: ITEM record
size: 12
fields:
  - {at: 0, size: 3, type: "u24", name: type index, level: proven}
  - {at: 3, size: 1, type: u8, name: kind and flags, level: proven, note: "high nibble the kind, low nibble flags; 0x10 or 0x20 on every item"}
  - {at: 4, size: 4, type: u32, name: offset in DATA, level: proven}
  - {at: 8, size: 4, type: u32, name: element count, level: proven}
```

The null item is all zero in every file. Every other item's kind byte is `0x10` or `0x20`. Kind 1 (`0x10`) is a single
object reached through a pointer, and the root. Kind 2 (`0x20`) is a run of elements: an array's contents or a
string's characters, including runs of one. No item is reached both ways, and none is unreferenced.
:proven{games="sekiro elden-ring"}

| Kind byte | Reached through | Sekiro | Elden Ring |
|---|---|---|---|
| `0x10` | the root | 19,137 | 68,722 |
| `0x10` | a pointer (count 1) | 249,104 | 2,072,320 |
| `0x20` | an array | 750,413 | 3,187,651 |
| `0x20` | a string | 1,812,521 | 2,002,240 |

:proven{games="sekiro elden-ring"} Every item of kind `0x10` holds exactly one object: the count is 1 on all 268,241
Sekiro and 2,141,042 Elden Ring items of that kind, the root's included, and item 1 is always of kind `0x10`.
:proven{games="sekiro elden-ring"}

## Patch table

`PTCH` lists, per type, the DATA offsets of the item references stored in slots of that type. In both installs:

- the record's type is the slot's own type: the pointer, array or string type of the member, never the class holding
  it;
- records are in ascending type order, and each record's offsets are ascending and distinct;
- every slot holding a nonzero item index is listed, and no slot holding index 0 (a null pointer, an empty array, a
  null string) is;
- no listed offset falls outside a reference slot.

:proven{games="sekiro elden-ring"} An empty string is stored as an item holding only its terminator, so it has a
nonzero index and a patch; a null string has index 0. Sekiro has 12,408 empty strings and Elden Ring 51,693.
:proven{games="sekiro elden-ring"} One Sekiro tagfile has no `PTCH` because it holds no reference. :observed{games="sekiro"}

## Order and layout of `DATA`

A tagfile's items are numbered and laid out by one walk of the object graph from the root; no stock file departs from it,
and a writer that applies the rules below to the items of a file reproduces that file byte for byte. Applied to the items of each of them, with the sections in the order `SDKV`, `DATA`, `TYPE` or
`TCRF`, `INDX` (`ITEM`, then `PTCH` when the file has a reference) and the type section as it was, they make `ITEM`, `PTCH` and
`DATA` identical to the file's for all 19,137 distinct tagfiles of Sekiro (15,176 with a
compendium, 3,960 with their own types, the one of SDK 2015.1) and all 68,722 of Elden Ring (46,793 and 21,929).
:proven{games="sekiro elden-ring"}

- **The walk.** Objects (kind `0x10`) are taken from a first-in first-out queue that starts with the root. An object is
  laid out when it is taken; then the runs (kind `0x20`) it refers to are laid out level by level: all the runs the
  object refers to, then all the runs those refer to, and so on. An object found on the way (through a pointer, in the
  object or in a run) joins the end of the queue. :proven{games="sekiro elden-ring"}
- **Numbering.** An item gets the next index when the walk first meets a reference to it: the references of the item
  being processed, in one order: every reference that is not a string first, then the strings; within each group by the
  slot's offset in one element of the item's type, and then by element. So the elements of a run give all their first
  members' references before the second members', and a name string of every element is numbered after every pointer and
  array. A run is laid out in the order of its numbers. :proven{games="sekiro elden-ring"}
- **Alignment.** The root is at offset 0. An object starts on a multiple of the larger of 2 and its type's alignment. A
  run that an array refers to starts on a multiple of 16, one that a string refers to on a multiple of 2. The padding
  between items is zero, and `DATA` ends on a multiple of 16 with zero bytes. :proven{games="sekiro elden-ring"}
- **Patches.** `PTCH` is made from the references: for every slot that holds a nonzero index, the slot's type and its
  offset in `DATA`, sorted by the two. :proven{games="sekiro elden-ring"}
- **Section framing.** Every section's length word counts its eight header bytes; `SDKV`, `DATA`, `ITEM`, `PTCH` and the
  type table's `TCRF` carry the leaf flag, `TAG0`, `INDX` and `TYPE` do not. :proven{games="sekiro elden-ring"}

## Values

- **Pointers and strings** store the item index in the low four bytes of their 8-byte slot; the high four bytes are
  zero in every slot. :proven{games="sekiro elden-ring"}
- **`hkArray`** (16 bytes) stores the item index in its first four bytes; the remaining 12 bytes (the run-time size
  and capacity) are zero in every one of Sekiro's 2,445,776 arrays and Elden Ring's 5,165,095. The element count comes
  from the item. `hkPropertyBag` (8 bytes, an array type) likewise has zero after its index.
  :proven{games="sekiro elden-ring"}
- **`hkRelArray`** is 4 bytes in a tagfile and holds an item index, like `hkArray`, not an inline length and offset.
  Each of Sekiro's 34,339 and Elden Ring's 109,341 `hkRelArray` slots holds 0 or the index of an item of its element
  type. :proven{games="sekiro elden-ring"} The members that use it include `hknpConvexPolytopeShape`'s vertices,
  planes, faces and indices.
- **Real numbers** have two formats: `float` (format word `0x174605`, 228 types in Sekiro's tables and 875 in Elden
  Ring's) and `hkHalf16` (`0x74605`, 56 and 215 types). :proven{games="sekiro elden-ring"} No table of either game
  stores a double or any other width. :proven{games="sekiro elden-ring"} A half is the top 16 bits of a `float`, not an
  IEEE binary16: every `hknpMaterial` of Sekiro's `h` collision of one area (173 materials) and of one Elden Ring tile
  (1) stores `dynamicFriction` and `staticFriction` `0x3F00`, `restitution` `0x3ECC` and
  `massChangerHeavyObjectFactor` `0x3F80`, which read as top halves are 0.5, 0.5, 0.3984375 (0.4 with the low 16 bits
  of its `float` dropped) and 1.0, and read as binary16 would be 1.75, 1.75, 1.699 and 1.875.
  :observed{games="sekiro elden-ring"}
- **Integers** are stored with the width in bits 10 and up of the format word and the sign in bit 9 (`0x200`); no
  integer type of either game sets bit 8 (`0x100`). A string type's format word is `0x3` in both games and also `0x83`
  in Elden Ring (1,744 types, 21,971 members), never with bits 5 and 6 set. :proven{games="sekiro elden-ring"}
- **Strings** are UTF-8. Every string with a byte of `0x80` or above decodes as UTF-8: 37 in Sekiro and 1,971 in Elden
  Ring, all of them `hkStringPtr` values (the ones examined are Japanese object names). Of them, 36 and 1,709 are not
  valid Shift-JIS.
  :proven{games="sekiro elden-ring"}

## Packfiles, versions 9 and 11

The packfiles of both games (Sekiro's 29 and Elden Ring's 6 distinct files) use the same container as
[Tony Hawk's SHRED](/engines/rme/collision/havok-packfiles/) with 8-byte pointers and little-endian words: layout bytes
`08 01 00 01` at `0x10` in all 35 files, three sections `__classnames__`, `__types__` and `__data__`, a contents version of
`hk_2013.1.0-r1` (file version 9: 6 files) or `hk_2014.1.0-r1` (version 11: 29 files). :proven{games="sekiro elden-ring"}

- **Version 9** has 48-byte section headers, the words `0` and `0xFFFFFFFF` at `0x38` and `0x3C`, and the first
  section starts at `0xD0`. :proven{games="sekiro elden-ring"}
- **Version 11** has 64-byte section headers (the last 16 bytes `0xFF`) and `0` at `0x38`. At `0x3C` two 16-bit fields hold 21
  and the size of a region of that many bytes between the root header and the first section header: 16 in 28 of the 29 files,
  where it holds `14 00` and zeros; the other file stores 0 and has no region. :proven{games="sekiro elden-ring"}
- `__types__` is empty in all 35 (its start is the data section's start and its offsets are 0), so the files carry no class
  metadata; the class names start with `hkClass` `33D42383` and `hkClassMember` `B0EFA719`. :proven{games="sekiro elden-ring"}
- Fixups follow the SHRED rules with 8-byte pointers: sources 8-aligned, objects and global targets 16-aligned (365 objects
  and 354 global fixups). A local target is 2-byte aligned: of 2,526 local fixups 43
  point to a place that is not a multiple of 4 and none to an odd one, the strings of an array of strings, which follow
  each other from 2-byte boundaries and are padded to 16 bytes only after the last. :proven{games="sekiro elden-ring"}
- Writing a file's objects, arrays, strings and pointers out by the SHRED page's ordering rules gives back all 35 files byte
  for byte. :proven{games="sekiro elden-ring"}

## Class versions

Where the two games' collision classes differ, from the type tables of every file:

| Class | Sekiro | Elden Ring | Difference |
|---|---|---|---|
| `hknpCompressedMeshShape` | 6 | 7 | Elden Ring adds `externShapes` |
| `hknpCompressedMeshShapeData` | 1 | 2 | Elden Ring adds `hasSimdTree` |
| `hknpBodyCinfo` | 6 | 8 (6 in its 2016.2 files) | 8 adds `dragProperties` and `activationPriority` |
| `hknpPhysicsSystemData` | 2 | 3 (2 in its 2016.2 files) | 3 drops `referencedObjects` |
| `hknpMaterial`, `hknpMotionProperties` | 4 | 5 (4 in its 2016.2 files) | |
| `hknpWorldCinfo` | 11 | 13 (11 in its 2016.2 files) | |
| `hknpExternMeshShape` | 2 | 3 (and 2) | |
| `hkcdSimdTree` | 1 | 3 (and 1) | |

:proven{games="sekiro elden-ring"} `hknpConvexPolytopeShape` (4), `hknpShape` (4), `hknpCompositeShape` (2),
`hknpPhysicsSceneData` (1), `hkaSkeleton` (6), `hkaAnimation` (3) and `hkaAnimationBinding` (3) have the same version
in both. Neither game has an `hknpMotion` or `hknpDebrisShape` type. :proven{games="sekiro elden-ring"}

## Sekiro

### The 2015.1 clip

:only[sekiro] One tagfile, `chr/c1090/hkx/a000_205000.hkx` in `c1090.anibnd.dcx`, stores `20150100`. Its own type table
describes `hkReferencedObject` as 16 bytes with no version and no `propertyBag`, where 2016.2 has version 3 and 24
bytes. Every class derived from it is 8 bytes smaller: `hkaAnimation` 56 instead of 64, `hkaSkeleton` 136 instead of
144, `hkaSplineCompressedAnimation` 176 instead of 184. :proven{games="sekiro"} Read with its own type table, the file
is an ordinary spline-compressed clip: 54 transform tracks, 36 frames in one block, every track decoded.
:observed{games="sekiro"} Ten other tagfiles reference compendia held in a different binder from their own.
:proven{games="sekiro"}

### Packfiles and older tagfiles

:only[sekiro] Sekiro also ships 29 distinct Havok packfiles (38 copies). There are 26 version 11 (`hk_2014.1.0-r1`): 25 in
seven weapon and full-body binders `parts/*.partsbnd.dcx` (skeletons, animations and `_c` files), and a behaviour file
`c9996.hkx` in ten `chr/*.behbnd.dcx`. Three are version 9 (`hk_2013.1.0-r1`): the face animations of `facegen/facegen.fgbnd.dcx`.
All are little-endian with 8-byte pointers (layout bytes `08 01 00 01`). :proven{games="sekiro"} The same ten
behaviour binders also hold a `c9996.hkt` in the older binary tagfile format (magic `1E 0D B0 CA CE FA 11 D0`).
:proven{games="sekiro"}

## Elden Ring

### 2016.2 files

:only[elden-ring] 42 tagfiles store `20160200`, among them `f`-set map collision of `m60` tiles. They use three type
tables, whose `hknp` classes carry the 2016.2 versions given in parentheses in the table above. :proven{games="elden-ring"}

### Packfiles

:only[elden-ring] Elden Ring ships six packfiles, all face animation: three version 11 (`hk_2014.1.0-r1`) in
`parts/fg_a_0000_m.partsbnd.dcx` and three version 9 (`hk_2013.1.0-r1`) in `facegen/facegen.fgbnd.dcx`. It has no
binary `.hkt` tagfiles. :proven{games="elden-ring"}

