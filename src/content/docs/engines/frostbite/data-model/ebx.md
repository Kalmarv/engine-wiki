---
title: EBX documents and reflection
description: RIFF chunks, object instances, typed fields and references in skate.'s EBX data.
games: [skate]
sources:
  - title: ReSkate EBX reader and writer
    url: https://github.com/Dingo-Shenanigans/ReSkate/tree/main/Engine/Resource
implementations:
  - name: frostbite-formats (ebx/mod.rs)
    url: https://github.com/Kalmarv/frostbite-formats/blob/main/src/ebx/mod.rs
---

EBX documents store typed objects: level entities, blueprints, texture assets, mesh assets and configuration.
Reflection describes the classes and fields; fixup tables identify references that must be resolved when the
document loads. :sourced[ReSkate]

## RIFF envelope

```layout
title: EBX RIFF header
size: 12
fields:
  - {at: 0, size: 4, type: "char[4]", name: magic, value: RIFF, level: observed}
  - {at: 4, size: 4, type: u32le, name: file length minus eight, level: observed}
  - {at: 8, size: 4, type: "char[4]", name: form, level: observed, note: "EBX followed by zero, or EBXS"}
```

Each following RIFF chunk has a four-byte tag and a little-endian 32-bit payload size. Odd payload sizes have one
padding byte. EBXD's object payload starts at 16-byte alignment; ordinary data offsets are relative to that aligned
payload start unless a particular field specifies otherwise. :sourced[ReSkate]

| Chunk | Role | Confidence |
|---|---|---|
| `EBXD` | Object payload, arrays, boxed data and strings | :sourced[ReSkate] |
| `EFIX` | File GUID; type GUIDs/signatures; instance, pointer and resource-reference offsets; imports | :sourced[ReSkate] |
| `EBXX` | Array and boxed-value records | :sourced[ReSkate] |
| `REFL`, `RFL2` | Reflection variants describing types and fields | :sourced[ReSkate] |

An import is a pair of 16-byte GUIDs: file then class instance. Internal pointers name an instance of the same
document; external pointers name an import. A resource reference instead carries a 64-bit resource id.
:sourced[ReSkate]

```layout
title: EBXX array record
size: 16
note: Little-endian.
fields:
  - {at: 0, size: 4, type: u32, name: data offset, level: sourced}
  - {at: 4, size: 4, type: u32, name: element count, level: sourced}
  - {at: 8, size: 4, type: u32, name: array hash, level: sourced}
  - {at: 12, size: 2, type: u16, name: encoded element type, level: sourced}
  - {at: 14, size: 2, type: u16, name: class reference, level: sourced, note: "EFIX type slot for structures; otherwise 0xffff"}
```

## Field types

After shifting the stored encoded type right by one, the category occupies the low nibble and the field type is
`(encoded >> 4) & 0x1f`. Category `4` denotes an array. Strings retain their stored bytes and are not guaranteed
to be valid UTF-8. :sourced[ReSkate]

| Type code | Meaning | Confidence |
|---|---|---|
| `0x00`–`0x05` | Inherited, DB object, structure, pointer, array, fixed array | :sourced[ReSkate] |
| `0x06`–`0x09` | String, C string, enumeration, file reference | :sourced[ReSkate] |
| `0x0a`–`0x10` | Boolean; signed/unsigned 8-, 16-, 32-bit integers | :sourced[ReSkate] |
| `0x11` | Signed 64-bit integer | :observed |
| `0x12` | Unsigned 64-bit integer | :observed |
| `0x13`–`0x17` | Float32, Float64, GUID, SHA-1, resource reference | :sourced[ReSkate] |
| `0x18`–`0x1c` | Function, type reference, boxed-value reference, interface, delegate | :sourced[ReSkate] |

The two 64-bit codes are the other way round from ReSkate's reading (unsigned then signed). The game's own field names
decide it: the fields of `CompareInt64EntityData` (`A`, `B`) and `PropertyCastEntityData.Int64Value` have code
`0x11`, and the fields of `CompareUint64EntityData` (`A`, `B`), `ConditionalU64EntityData` (`ValueIfTrue`,
`ValueIfFalse`), `PropertyCastEntityData.Uint64Value` and `PropertyDebugEntityData.Uint64Value` have code `0x12`; no
field named for the other signedness has either code. :observed[all 328,015 distinct stock documents] Nearly all values
of those fields are zero, so the stock values themselves do not show the signedness; the 64-bit hash and key fields
(`ShaderInstanceKey`, `PortKey`, `ResourceNameHash` and others) use both codes, and 17,750 of 77,112 values of code
`0x12` have the top bit set. :observed

For the 16-bit codes the table's reading holds on the data: a code `0x0d` field read as signed holds `-1` (`ParentSlot`
is `0xffff` in 150 of 164 values) and a range of -1,350 to 1,080 (`SequenceAnimation.StartTime`, beside `StartInTime`
and `EndInTime` fields of 0 to 1,350 and 0 to 1,625), and the code `0x0e` fields with the top bit set are flag words
and tables (`NodeIndexAndFlags`, `FieldFlagOverride0`, `Data`; 25,701 of 487,929 values over 233 fields). Nothing in
the names or values of either code argues for the other signedness. :observed[all 328,015 distinct stock documents]

## Runtime reflection

The running game keeps its own reflection registry. In build 20260929 the symbol registry is at
`Skate+0x765d318` and the settings manager global at `+0x7482ce0`. Getter `+0x18d95e0` and setter `+0x18d9c50`
have the signature `bool(manager, const char* name, type_or_0, const void* value)`. :observed

```layout
title: Runtime type descriptor fields
size: variable
note: Runtime memory.
fields:
  - {at: 32, size: 8, type: pointer, name: super TypeInfo, level: observed}
  - {at: 42, size: 2, type: u16, name: field count, level: observed}
  - {at: 56, size: 8, type: pointer, name: field array, level: observed, note: "Also seen at +0x60"}
```

```layout
title: Runtime field descriptor
size: 24
fields:
  - {at: 0, size: 8, type: u64, name: name hash, level: observed}
  - {at: 8, size: 2, type: u16, name: field offset, level: observed}
  - {at: 10, size: 6, type: bytes, name: unknown, level: unknown}
  - {at: 16, size: 8, type: pointer, name: field TypeInfo, level: observed}
```

The typed property copy at `Skate+0x4657040` dispatches on these field types while a level loads; C strings
(type code 7) are copied through `strlen`, so a C-string offset pointing outside its document's payload becomes
a pointer past the end of the loaded object. :observed See the
[crash catalogue](/engines/frostbite/runtime/crashes/#level-root-ebx).

## Stock documents

The install's bundle manifests list 746,856 EBX documents; they share 328,015 distinct stored payloads, and every one
of those reads, all with the `RFL2` reflection chunk (none with `REFL`); 16,456 are the `EBXS` form.
:proven[all 328,015 distinct stock payloads]

**Reflection names.** `RFL2` stores each type and field name under a 32-bit key. The key is not the name's djb2-XOR hash,
case-exact or lowercased: none of the 21,561 distinct keys equals either hash of its name. The key ignores case: 49 keys
are shared by two names that differ only in case (`Min` and `min`, `Y` and `y`, `Metadata` and `MetaData`), and no key is
shared by names that differ in anything else; the empty name has the key `0x7f52aefb`.
:proven[all 21,610 name and key pairs of the 328,015 documents] The function that produces the key is not established.
:unknown

**Type lists.** An instance names its type by a slot of the `EFIX` type list. For all 1,724,470 instances the slot is
also the index of the reflection type with the same GUID and signature. The `EFIX` list is shorter than the reflection
type list in 327,533 documents (equal in length in 482); it is an ordered subsequence of the reflection list in
280,741 documents and not in 47,274, and in 40,325 documents it names a type GUID that has no reflection entry.
:proven[all 328,015 documents]

**Type references.** A type-reference field (code `0x19`) holds a 32-bit value which, shifted right by two, indexes
the `EFIX` type list, not the reflection list: of 512,711 type references that name a type, all are below the
`EFIX` list length, 119,136 are not below the reflection list length, and in only 1,104 of the 393,575 that are, the
`EFIX` entry and the reflection entry at that index have the same GUID. :proven[all 328,015 documents] The referenced
types that have no reflection entry belong to fields such as `GetScoreFunction`, `TraitDataTypeRef` and
`ExpressionConstantTypeRefPatch.Value`, which suggests function and type-information classes. :inferred

**Other tables.** The `EFIX` tail after the section offsets is a count and a list of offsets; the count is nonzero in
4,170 documents, each offset lies in the payload outside every `EBXX` boxed value, and in 3,966 of those documents the
list is a subset of the offsets of the boxed-value reference fields; 204 documents list an offset that is not such a
field. :observed[all 328,015 documents]

**Enumerations.** An enumeration field stores a 32-bit value; the type its class reference names lists its members as
fields, and each member's offset slot holds the member's value. Of 3,368,510 enumeration values over 605 enumeration
types, 3,368,509 are the value of a member; the exception is one `AudioCollisionCategory` of 16,908,288. No enumeration
type has zero members. :proven[all 328,015 documents]

**Strings.** Of 1,429,646 `CString` and `FileRef` slots, none holds the displacement `0xffffffff`: every string slot
points at a stored string. :proven[all 328,015 documents]

**Alignment.** The types of instances have alignment 8 (1,253,988 instances) or 16 (470,482); no instance type has
alignment 4. The distance from an instance to the next instance start is never smaller than the type size; it equals the
size for 1,528,729 instances, the size rounded up to 16 for 175,544, and is larger for 20,197. :proven[all 328,015 documents]

**Document names.** The primary (first) instance of every document has a `Name` string. The manifest names the document in
lowercase; the `Name` equals it in 57,501 documents, differs from it only in case in 269,550, and differs by more in
964 (962 of them have a suffix after the manifest name, such as `_InstanceClass`; two have an empty `Name`).
:proven[all 328,015 documents] The `Name` therefore carries the document's original casing.

**Floats.** Stock documents hold 212 documents with a NaN and one with an infinite float value. :proven[all 328,015 documents]

## Writing documents back

Rewriting three stock documents preserves their typed values. The stock bundle-reference table and level-class
document also retain identical bytes; the description document differs in layout under the reference writer.
Byte equality and semantic equality are therefore separate properties. :observed

:::open[How complete is reflection for every installed document?]
Instances whose EFIX type has no reflection descriptor cannot be fully interpreted from the document alone.
The available round-trip evidence does not establish exhaustive coverage of every installed EBX class. :unknown
:::
