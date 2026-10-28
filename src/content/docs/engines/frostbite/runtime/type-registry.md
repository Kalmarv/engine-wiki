---
title: Runtime type registry
description: The static type records of skate.'s executable, the runtime objects built from them and the field entries, tied to the EBX reflection tables.
games: [skate]
---

Every class, structure and enumeration that EBX reflection names has a static record in the executable's initialised
data. A static initializer builds a runtime object from the record at start-up, and the engine chains the objects in a
list. The record carries what the `RFL2` reflection chunk of an EBX document names: the 32-bit name key, the type GUID and
the signature. This page describes build 20260929 of `Skate.exe`; the executable is read as a file, not run.
:observed[executable read statically]

The executable holds 16,198 such records. The `u16` at +4 of a record says what kind of type it is:
10,003 are `0x63` (classes), 2,177 `0x810b` (enumerations), 1,881 `0x45` and 1,648 `0x8045` (structures), 328 `0x391`
(the delegate types of the EBX tables) and 161 `0x36f` (size 8, use not established). :observed[all 16,198 records]
The stock EBX documents name 4,057 distinct type GUIDs (4,060 GUID and signature pairs). 3,914 of those GUIDs have one
record with the same name key at +0 and the same signature at +0x2c, and the GUID at +8 is identical in all 3,914.
:observed[all 328,015 stock documents against the executable] Of the other 143, 131 have a record with the same GUID and
name key whose signature differs from the one the documents store, and 12 have no record at all: the built-in math types
`Vec`, `Vec2`, `Vec2Simd`, `Vec3`, `Vec4`, `Quat`, `Mat4`, `LinearTransform`, `AxisAlignedBox`, `Sqt`, `Color32` and
`IntVec`. :observed[same census]

## Type record

```layout
title: Type record (class)
size: variable
note: "A class record. Structure and enumeration records share bytes 0 to 0x2f and differ after them (table below)."
fields:
  - {at: 0, size: 4, type: u32, name: name key, level: observed, note: "The RFL2 name key of the type; equal to the document's key for 3,914 of 3,914 matched types"}
  - {at: 4, size: 2, type: u16, name: kind flags, level: observed, note: "0x63 for every class"}
  - {at: 6, size: 2, type: u16, name: size, level: observed, note: "Instance size in memory; equals the EBX type size for 2,262 of 2,295 classes, larger in 32 and smaller in one of the others"}
  - {at: 8, size: 16, type: bytes, name: GUID, level: observed, note: "The same byte order as the EBX type GUID"}
  - {at: 24, size: 8, type: pointer, name: kind object, level: unknown, note: "Points into initialised data; 302 distinct values in the executable"}
  - {at: 32, size: 8, type: pointer, name: type object base, level: observed, note: "Address of the runtime type object; the registered object is 0x20 above it"}
  - {at: 40, size: 2, type: u16, name: alignment, level: observed, note: "Equals the EBX alignment for 2,295 of 2,295 classes and 796 of 796 structures"}
  - {at: 42, size: 2, type: u16, name: entry count, level: observed, note: "Fields of a class or structure, members of an enumeration, not counting the super entry"}
  - {at: 44, size: 4, type: u32, name: signature, level: observed, note: "The signature the EBX document stores, except for the 131 types named above"}
  - {at: 48, size: 8, type: pointer, name: super, level: observed, note: "The registered runtime object of the super class; the root class points at its own"}
  - {at: 56, size: 8, type: pointer, name: field array, level: observed, note: "Null when the class has no fields of its own"}
```

| Kind | Flags at +4 | After byte 0x2f |
|---|---|---|
| Class | `0x63` | Super at +0x30, field array at +0x38. :observed |
| Structure | `0x45`, `0x8045` | Function pointers at +0x30 to +0x58, field array at +0x60. :observed |
| Enumeration | `0x810b` | Member array at +0x30; size 4 and alignment 4 in all 698 enumerations that EBX documents use. :observed |

Over the stock EBX types matched above, the entry count at +0x2a equals the number of reflected fields (not counting the
super entry) in 1,873 of the 1,874 classes that have fields (the other lists one field name twice in its EBX table), in
788 of 788 structures that have fields and in 698 of 698 enumerations; 421 classes and 8 structures have no fields and a
null array pointer. :observed[all matched types]
The record's size and the field offsets can differ from the EBX values: the size differs in 33 classes (larger in 32) and
4 structures (smaller in all four), and 60 field entries of 20 asset types (`BoolAsset`, `SpringFloatValueAsset`,
`RigAsset` and others) have an offset 8 to 200 bytes above the EBX offset; every other entry agrees. :observed[all matched types]

## Super class link

The class record's pointer at +0x30 is the address of the super class's registered object: it equals the super record's
type object base plus 0x20 in 2,294 of 2,294 classes whose EBX table lists a super and whose super has a record, and the
one class without a super entry, the root `DataContainer`, points at its own registered object. :observed[all matched classes]
The class constructor copies that pointer into the runtime object at +0x20, so +0x20 of the registered object holds the
super class, not an array type. :observed[constructors read in the executable]
Following the links from each of the 10,003 class records ends, after at most 11 steps, at a class that points at itself
in 9,995 cases; the executable has 193 such roots, and the other 8 links lead to an object that is not a class record.
:observed[all 10,003 class records]

## Runtime object

A static initializer calls a constructor with the runtime object and the record. An initializer of the form
`sub rsp,0x28`, `mov r9d,0xffff`, `lea rdx,[record]`, `lea rcx,[object]`, `call` exists for 4,430 of the records. The
base constructor stores the record pointer at +0, `0xffff` at +8, the record flags with bit 1 cleared at +0xa, `-1` at
+0xc, and links the object into a global list through +0x10 (previous) and +0x18 (next). :observed[constructors read in the executable]
The class constructors then store the record's +0x30 at +0x20 and clear +0x28 to +0x6f. :observed[constructors read in the executable]

```layout
title: Registered runtime object (class)
size: "at least 0x70"
fields:
  - {at: 0, size: 8, type: pointer, name: record, level: observed}
  - {at: 8, size: 2, type: u16, name: list id, level: observed, note: "0xffff for objects that join the global list"}
  - {at: 10, size: 2, type: u16, name: flags, level: observed, note: "The initializer's flag argument with bit 1 cleared"}
  - {at: 12, size: 4, type: u32, name: unknown, level: unknown, note: "Set to 0xffffffff by the base constructor"}
  - {at: 16, size: 8, type: pointer, name: previous, level: observed}
  - {at: 24, size: 8, type: pointer, name: next, level: observed}
  - {at: 32, size: 8, type: pointer, name: super, level: observed}
```

The record's "type object base" at +0x20 is 0x20 below the object the initializer constructs in 3,712 of the 3,720 class
initializers of that form and in all 313 enumeration initializers; 84 of the 242 structure initializers construct an
object 0x20 above the base and the rest 0x28 to 0x38 above it. :observed[initializers read in the executable]
For a class, the 0x20 bytes below the registered object belong to a second, size-8 record (kind flags `0x89`) whose GUID is
the class GUID plus one and whose signature is the class signature: 9,968 of the 10,003 class records have one, and its
pointer at +0x30 is the class's registered object in 9,960 of them. :observed[all class records]

## Field entries

A field array holds 24-byte entries, one per field, in the order of the EBX reflection table (without the super
entry). Enumerations use the same 24 bytes for members.

```layout
title: Field entry (class and structure)
size: 24
fields:
  - {at: 0, size: 4, type: u32, name: name key, level: observed, note: "The RFL2 key of the field name; equal to the document's key, in order, for 1,873 classes and 788 structures"}
  - {at: 4, size: 4, type: u32, name: flags, level: observed, note: "0 for plain fields; 0x88 marks an array field"}
  - {at: 8, size: 2, type: u16, name: offset, level: observed, note: "Byte offset in the instance"}
  - {at: 10, size: 6, type: bytes, name: padding, level: observed, note: "Zero in all 15,490 class and structure entries"}
  - {at: 16, size: 8, type: pointer, name: field type, level: observed}
```

The upper dword of the first qword is flag-like, not part of the key: of the 11,434 class entries 10,267 have 0, 1,124 have
`0x88`, 34 have `0x1000`, 8 have `0x2000` and one has `0x1088`; the 4,056 structure entries have 0 (3,689), `0x88` (342),
`0x2000` (19), `0x1000` (3), `0x10000` (2) and `0x2088` (1). Every entry whose EBX field category is "array" has bit
`0x88` (1,125 of 1,125 class entries, 343 of 343 structure entries) and no other entry does. :observed[all matched classes and structures]
The offset at +8 equals the EBX offset in 11,375 of 11,434 class entries and 4,055 of 4,056 structure entries, and the
qword's upper 48 bits are zero in every one. :observed[same census]

The field type pointer of a plain class or structure field is the registered object of the field's type (4,198 of the
4,198 that point at a type record); the pointer of an array field is the type object base, 0x20 below the registered
object (1,106 of the 1,106 that point at a type record). The other 9,824 plain and 362 array pointers lead to objects that
no type record claims. :observed[all matched classes and structures]

Enumeration members are entries whose first qword is the member name's key (upper dword zero in all 4,096), whose second
qword is zero, and whose third qword is the member value as a signed 64-bit number: the low 32 bits equal the EBX value in
4,096 of 4,096 members, and the 12 members whose value is `0xFFFFFFFF` or `0x80000000` in EBX are sign-extended.
:observed[all 698 matched enumerations]

## Names

The executable stores keys and no names for its types and fields. The stock EBX tables name 4,115 of the 16,198 records by
key (3,916 are the documents' own types; 199 more share a key with a named type or field), and 11,919 of the 29,173
distinct field keys of classes and structures. :observed[all 328,015 stock documents against the executable]

The key depends only on the lower-cased name. The tables hold 21,560 distinct keys and 21,560 distinct lower-cased names,
one key per lower-cased name; 47 keys carry two spellings that differ only in case (`ID` and `Id`, `Min` and `min`,
`X` and `x`). :observed[all names of the stock EBX tables]

A type that exists in both skate. and Battlefield 2042 has the same GUID in both: 1,232 of the 4,057 stock type GUIDs occur in
a published type listing of Battlefield 2042 (20,151 types and 40,680 field lines, each field line giving the GUID of the
field's type and its name), and 1,228 of the 1,232 carry the same name; the other four are `ObstructionAudioPatchTraitData`,
`AudioSubPatchAsset`, `SpatialAudioPatchTraitData` and `VelocityAudioPatchTraitData`, which the listing calls
`...Sound...`. :observed[stock GUIDs against the listing] The name keys differ: the listing's table for that game gives
`DataContainer` the key `0x8ad044b9`, this executable `0x5ad26088`. :sourced[a published Battlefield 2042 string table]
The listing's GUIDs also occur in 5,119 of the executable's 16,198 records. :observed[all records]

Fields keep their declaration order between the two games. Aligning the listing's field type GUIDs with the executable's
(the type a field entry points at, or for a primitive the type GUID that the EBX field of the same key gives) as a longest
common subsequence reproduces the EBX field name for 1,688 of the 1,695 aligned fields whose type GUID occurs once in both
lists, 203 of 204 whose repeated type lies between such fields and the lists are equal there, and 630 of 724 whose type
repeats otherwise. :observed[aligned fields whose key the EBX tables name, 1,248 shared records]
The listing carries no enumerators.

:::open[Is anything stored in the runtime object between +0x28 and +0x6f after start-up?]
The constructors zero that range and no static source fills it; whether a later pass stores an array type or a derived
list there is not established by reading the executable.
:::

:::open[Which function produces the 32-bit name key?]
The key is not the djb2-XOR hash, FNV-1 or FNV-1a (32 and 64 bit), CRC-32, Adler-32, MD5, SHA-1, SHA-2, SHA-3, BLAKE2,
CityHash, FarmHash, xxHash64, XXH3 or Murmur3 x64 of the name in the usual seeds, taken lowercased, as written or
uppercased, as UTF-8, UTF-8 with a terminator, UTF-16 or UTF-32, and not Murmur3-32, Murmur2 or xxHash32 with any 32-bit
seed for the name `Vec2` over UTF-8 and UTF-16LE, each with and without a terminator. The key has no linear or additive structure and no
locality in its low bits, so it ends in a full finalizer. :observed[21,610 stock name and key pairs]
None of the 74,296 functions of the executable that load a byte returns the key of `Vec2`, `WpsDistance` or the empty
name when run on it under emulation, and the two case-insensitive string hashers the executable does contain (a djb2-XOR
hash and a table-driven FNV-1 hash) give other values for all 21,610 pairs. The executable stores the keys only as data
and immediates, never next to the names. :observed[functions run under emulation]
:::
