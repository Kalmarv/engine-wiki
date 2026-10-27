---
title: META, XML and identifier hashes
description: Self-describing META blocks, case-sensitive schema hashes, joaat identifiers and binary XML.
games: [gta-v]
sources:
  - title: CodeWalker
    url: https://github.com/dexyfex/CodeWalker
    note: Meta, MetaTypes, Rbf and JenkHash are reference descriptions.
implementations:
  - name: rage-engine-formats (meta.rs)
    url: https://github.com/Kalmarv/rage-engine-formats/blob/main/src/meta.rs
  - name: rage-engine-formats (rbf.rs)
    url: https://github.com/Kalmarv/rage-engine-formats/blob/main/src/rbf.rs
---

META resources describe their own structures, enums and data blocks. A structure description gives its hashed name,
byte size and fields; each field gives a hashed name, offset, kind and referenced type. Maps (`ymap`) and archetype
dictionaries (`ytyp`) use this representation. :proven

The structural census covers every YMAP and YTYP copy in every archive: 19,941 maps and 2,869 archetype files.
Every root, array and pointer decodes through the stored descriptions with no refused files or unreached data-block
bytes. The proven header, field and kind descriptions below have that scope; the separate RBF examples do not.
:proven[all YMAP and YTYP entries]

META's block references pack a 1-based block ID in the low 12 bits and a byte offset in the next 20 bits. An array
of structures can continue at the beginning of the next block when it outgrows one block. :proven

## Hash domains

Schema identifiers are case-sensitive Jenkins hashes: `CMapData` hashes to `0xD3593FA6`. Asset names normally use
lowercase joaat instead. Applying case folding to a schema identifier changes the lookup. :proven

The Jenkins one-at-a-time mix starts with `h = 0`. For each byte: add the byte, add `h << 10`, then XOR `h >> 6`.
After the final byte: add `h << 3`, XOR `h >> 11`, then add `h << 15`; additions wrap at 32 bits.
:sourced[CodeWalker]

The [NG cipher](/engines/rage/archives/rpf7/) has a separate lookup-table-based name hash; it does not share the
plain filename-hash procedure. :sourced[CodeWalker]

## Container descriptions

The following offsets are in the decoded resource's system root, not in the compressed file. :proven

```layout
title: META root header
size: 112
fields:
  - {at: 0, size: 16, type: bytes, name: resource base, level: sourced}
  - {at: 16, size: 4, type: u32, name: identifier, value: "0x50524430", level: proven}
  - {at: 20, size: 2, type: u16, name: header version, value: "0x79", level: proven}
  - {at: 22, size: 1, type: u8, name: encrypted strings flag, level: sourced, note: "0 or 1; CodeWalker's HasEncryptedStrings"}
  - {at: 23, size: 5, type: bytes, name: unknown bytes, level: unknown, note: "zero in accepted resources"}
  - {at: 28, size: 4, type: u32, name: root block ID, level: proven}
  - {at: 32, size: 8, type: pointer, name: structure descriptions, level: proven}
  - {at: 40, size: 8, type: pointer, name: enum descriptions, level: proven}
  - {at: 48, size: 8, type: pointer, name: data block table, level: proven}
  - {at: 56, size: 8, type: pointer, name: name string, level: proven}
  - {at: 64, size: 8, type: pointer, name: encrypted strings, level: sourced, note: "CodeWalker's pointer to the encrypted strings"}
  - {at: 72, size: 2, type: u16, name: structure count, level: proven}
  - {at: 74, size: 2, type: u16, name: enum count, level: proven}
  - {at: 76, size: 2, type: u16, name: block count, level: proven}
  - {at: 78, size: 34, type: bytes, name: unknown tail, level: unknown, note: "zero in accepted resources"}
```

```layout
title: META field description
size: 16
fields:
  - {at: 0, size: 4, type: u32, name: field name hash, level: proven}
  - {at: 4, size: 4, type: u32, name: byte offset, level: proven}
  - {at: 8, size: 1, type: u8, name: kind, level: proven}
  - {at: 9, size: 1, type: u8, name: unknown, level: unknown}
  - {at: 10, size: 2, type: i16, name: reference index, level: proven}
  - {at: 12, size: 4, type: u32, name: reference key, level: proven}
```

| Kind code | Representation | Confidence |
|---|---|---|
| `0x01` | Boolean | :proven |
| `0x10`–`0x15` | Signed/unsigned 8-, 16- and 32-bit integers, in pairs | :proven |
| `0x21`, `0x33`, `0x34` | Float, vec3, vec4 | :proven |
| `0x4A` | Hash | :proven |
| `0x05`, `0x07` | Inline structure, structure pointer | :proven |
| `0x52` | Array | :proven |
| `0x40`, `0x44`, `0x50`, `0x59` | Fixed characters, character pointer, inline data, data block | :proven |
| `0x60`, `0x62`–`0x65` | Enum/flag variants | :proven |

## XML and RBF

Mount and water configuration includes text XML. Other configuration, including `gtxd.ymt`, uses RBF, a binary
element tree beginning with `RBF0`. The extension `.ymt` alone therefore does not identify META. :observed

RBF records use a descriptor-index byte and type byte. A previously unseen descriptor introduces a 16-bit name
length and name. Element-open records carry three 16-bit words, the third counting attributes. :observed

| RBF type/marker | Value | Confidence |
|---|---|---|
| `0x00` | Open element | :observed |
| `0x10` | u32 | :observed |
| `0x20`, `0x30` | True, false | :observed |
| `0x40`, `0x50` | Float, three floats | :observed |
| `0x60` | String with 16-bit length | :observed |
| `FF FF` | Close element | :observed |
| `FD FF` | Text, with 32-bit byte length | :observed |

:::open[What do the unnamed META header and field bytes control?]
Their locations are known, but zero values or a limited value range do not establish their meaning. :unknown
:::
