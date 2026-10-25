---
title: BND4 and split binders
description: File groups, optional names and IDs, compressed members, and BHF4/BDF4 pairs.
sources:
  - title: SoulsFormatsNEXT Binder formats
    url: https://github.com/soulsmods/SoulsFormatsNEXT/tree/master/SoulsFormats/Formats
implementations:
  - name: primase binder reader
    url: https://github.com/Kalmarv/primase/blob/main/worlds/fromsoft/src/read/binder.rs
---

A **binder** groups related files: a character's models, an animation set, or a map's collision. BND4 holds the index
and payload together; BHF4 holds an index whose payload is in a separate BDF4 file. The outer archive and any
[DCX envelope](/engines/fromsoft/archives/dcx/) are separate layers. :observed

Every top-level BND4 member of both installed archive sets decodes to the same bytes as SoulsFormats or
SoulsFormatsNEXT. This establishes member contents, not the runtime purpose of every binder flag. :proven

## Header and member records

The header selects integer endianness, flag-bit ordering, name encoding and optional record fields. Names and signed
IDs are independently optional; a member need not have both. :sourced[SoulsFormatsNEXT]

```layout
title: BND4 or BHF4 header
size: 64
note: Integer byte order is selected at offset 9. Offsets are file-relative.
fields:
  - {at: 0, size: 4, type: "char[4]", name: magic, level: observed, note: BND4 or BHF4}
  - {at: 4, size: 2, type: "u8[2]", name: unknown booleans, level: unknown, note: Each is 0 or 1}
  - {at: 6, size: 3, type: "u8[3]", name: padding, level: observed, value: 0}
  - {at: 9, size: 1, type: u8, name: big endian, level: sourced}
  - {at: 10, size: 1, type: u8, name: bit ordering flag, level: sourced}
  - {at: 11, size: 1, type: u8, name: padding, level: observed, value: 0}
  - {at: 12, size: 4, type: u32, name: member count, level: proven}
  - {at: 16, size: 8, type: u64, name: header size, level: observed, value: 64}
  - {at: 24, size: 8, type: "char[8]", name: version string, level: sourced}
  - {at: 32, size: 8, type: u64, name: member record size, level: proven}
  - {at: 40, size: 8, type: u64, name: header end, level: observed, note: Zero in BHF4}
  - {at: 48, size: 1, type: u8, name: Unicode names, level: sourced}
  - {at: 49, size: 1, type: u8, name: format flags, level: sourced}
  - {at: 50, size: 1, type: u8, name: extended mode, level: sourced}
  - {at: 51, size: 5, type: "u8[5]", name: padding, level: observed, value: 0}
  - {at: 56, size: 8, type: u64, name: hash table offset, level: sourced}
```

```layout
title: Member record
size: variable
note: Optional fields appear in the order listed; format flags are shown after bit-order normalization.
fields:
  - {at: 0, size: 1, type: u8, name: member flags, level: sourced, note: Bit 0 marks compression}
  - {at: 1, size: 3, type: "u8[3]", name: padding, level: observed, value: 0}
  - {at: 4, size: 4, type: i32, name: sentinel, level: unknown, note: Observed -1}
  - {at: 8, size: 8, type: u64, name: stored size, level: proven}
  - {at: 16, size: "8 if format & 0x20", type: u64, name: decoded size, level: sourced}
  - {at: after decoded size, size: "8 if format & 0x10 else 4", type: offset, name: payload offset, level: proven}
  - {at: after payload offset, size: "4 if format & 2", type: i32, name: member ID, level: proven}
  - {at: after member ID, size: "4 if format & 0x0c", type: u32, name: name offset, level: sourced}
  - {at: after name offset, size: "8 if format equals 4", type: "i32 + u32", name: alternate ID and zero padding, level: sourced}
```

Compressed members contain either zlib data or a DCX envelope. A decoded member may itself start with DCX; member
compression and an inner envelope are distinct. :observed Names are NUL-terminated UTF-16 when the Unicode flag is
set; the non-Unicode form is a narrow string. :sourced[SoulsFormatsNEXT]

## Split payload

BHF4 records point into BDF4, while names and the lookup table remain in BHF4. Map `.hkxbhd`/`.hkxbdt` collision
pairs and `.tpfbhd`/`.tpfbdt` texture pairs use this arrangement. :observed

```layout
title: BDF4 payload header
size: 48
fields:
  - {at: 0, size: 4, type: "char[4]", name: magic, value: BDF4, level: observed}
  - {at: 4, size: 2, type: "u8[2]", name: unknown booleans, level: unknown, note: Each is 0 or 1}
  - {at: 6, size: 3, type: "u8[3]", name: padding, value: 0, level: observed}
  - {at: 9, size: 1, type: u8, name: big endian, level: sourced}
  - {at: 10, size: 1, type: u8, name: bit ordering flag, level: sourced}
  - {at: 11, size: 5, type: "u8[5]", name: padding, value: 0, level: observed}
  - {at: 16, size: 8, type: u64, name: declared header size, level: unknown, note: Observed 48 or 64}
  - {at: 24, size: 8, type: "u8[8]", name: version bytes, level: sourced}
  - {at: 32, size: 16, type: "u8[16]", name: padding, value: 0, level: observed}
```

:::open[What do the unknown binder booleans control?]
Their stored values are validated as booleans, but member-byte agreement does not establish their runtime meaning.
:::
