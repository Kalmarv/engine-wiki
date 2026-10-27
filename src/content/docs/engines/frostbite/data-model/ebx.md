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
| `0x0a`–`0x12` | Boolean; signed/unsigned 8-, 16-, 32-bit integers; unsigned then signed 64-bit integers | :sourced[ReSkate] |
| `0x13`–`0x17` | Float32, Float64, GUID, SHA-1, resource reference | :sourced[ReSkate] |
| `0x18`–`0x1c` | Function, type reference, boxed-value reference, interface, delegate | :sourced[ReSkate] |

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

## Writing documents back

Rewriting three stock documents preserves their typed values. The stock bundle-reference table and level-class
document also retain identical bytes; the description document differs in layout under the reference writer.
Byte equality and semantic equality are therefore separate properties. :observed

:::open[How complete is reflection for every installed document?]
Instances whose EFIX type has no reflection descriptor cannot be fully interpreted from the document alone.
The available round-trip evidence does not establish exhaustive coverage of every installed EBX class. :unknown
:::
