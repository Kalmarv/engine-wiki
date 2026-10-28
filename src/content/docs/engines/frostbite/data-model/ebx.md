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

The file GUID of an import names its target document, whose name is in the manifest of the bundle that holds it.
The 328,015 stock EBX payloads carry 185,301 distinct file GUIDs, each with the same manifest name wherever it occurs
(no GUID has two names). :proven[all 328,015 payloads] The stock documents hold 865,673 import references to 147,320
distinct file GUIDs; 865,671 references (147,318 GUIDs) name a document some bundle of the install holds, and two
GUIDs, one reference each, name none. :proven[all 328,015 payloads]

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

The type registry is a list of runtime objects built from static records in the executable. A class object stores its
super class at +0x20; the record that the object points to holds the field count at +0x2a and the field array at +0x38
(+0x60 for a structure); each field entry is 24 bytes with a 32-bit name key, flags, a 16-bit offset and the field's type
object. :observed See [Runtime type registry](/engines/frostbite/runtime/type-registry/) for the layouts and the
census against the stock EBX tables.

The typed property copy at `Skate+0x4657040` dispatches on the field types while a level loads; C strings
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
:proven[all 21,610 name and key pairs of the 328,015 documents] The function that produces the key is not established; the
[type registry page](/engines/frostbite/runtime/type-registry/) lists what it is not. :unknown

**Type lists.** An instance names its type by a slot of the `EFIX` type list. For all 1,724,470 instances the slot is
also the index of the reflection type with the same GUID and signature. The `EFIX` list is shorter than the reflection
type list in 327,533 documents (equal in length in 482); it is an ordered subsequence of the reflection list in
280,741 documents and not in 47,274, and in 40,325 documents it names a type GUID that has no reflection entry.
:proven[all 328,015 documents]

**Type references.** A type-reference field (code `0x19`) holds a 32-bit value which, shifted right by two, indexes
the `EFIX` type list, not the reflection list: of 512,711 type references that name a type, all are below the
`EFIX` list length, 119,136 are not below the reflection list length, and in only 1,104 of the 393,575 that are, the
`EFIX` entry and the reflection entry at that index have the same GUID. :proven[all 328,015 documents]

Counting the 408 values of delegate fields, which read the same way, 513,119 values name a type. 503,606 of them name a
slot past the end of the `EFIX` signature list (a document's list of type GUIDs can be longer than its list of
signatures), and 499,474 name a GUID that the document's own reflection list does not hold; the other 13,645 find their
type there by GUID, 9,513 of them by GUID and signature. :proven[all 328,015 documents] A table of every reflected
type's GUID and name over all the documents names the GUID of 70,044 of the references, each with one name (56,399 of
them only through the reflection lists of other documents); the other 443,075 name a GUID that no document reflects.
:proven[all 328,015 documents] The resolved names fit their fields: the 1,609 values of
`AudioPatchRequiredTraitEntry.TraitDataTypeRef` name 11 types, all with names ending in `TraitData`, where the
reflection entry at the same index would name none of them; `ExpressionPortData.PortType` names `Mat4`, `Quat` and
`Vec3`, and `DataModelFieldData.FieldType` names `DataModelReference`, `LinearTransform`, `Vec2`, `Vec3` and
enumeration types. :observed[the 70,044 references that resolve]

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

**Floats.** 213 stock documents hold a float that is not finite: 1,784 NaN values and one infinity, all in 32-bit float
fields. The NaNs are components of `Vec4` (`x` 513, `y` 474, `z` 424, `w` 373) and the infinity (`0x7f800000`) is an
`AINetNode.Height`. Every NaN has its quiet bit set, none is a signalling NaN; 1,664 are `0xffffffff` and the others are
patterns such as `0xffff0000`, `0xffffcbcb` and `0xffffff00` with arbitrary low bits. :proven[all 328,015 documents]

## Writing documents back

Laying each of the 328,015 stock payloads out again from its typed values gives a document that reads back to the same
values in every one, floats compared by their bit patterns (the 213 documents with a NaN or an infinity included), and
219,809 of them come back byte for byte. :proven[all 328,015 distinct stock payloads] The stock bundle-reference table
and level-class document retain identical bytes; the description document differs in layout under the reference writer.
Byte equality and semantic equality are therefore separate properties. :observed

:::open[How complete is reflection for every installed document?]
Instances whose EFIX type has no reflection descriptor cannot be fully interpreted from the document alone.
The available round-trip evidence does not establish exhaustive coverage of every installed EBX class. :unknown
:::
