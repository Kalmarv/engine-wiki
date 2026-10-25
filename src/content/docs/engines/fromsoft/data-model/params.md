---
title: PARAM tables and regulation
description: Parameter containers, external row definitions and NPC display-mask layouts.
sources:
  - title: Paramdex
    url: https://github.com/soulsmods/Paramdex
  - title: SoulsFormatsNEXT PARAM and regulation decryption
    url: https://github.com/soulsmods/SoulsFormatsNEXT
implementations:
  - name: primase PARAM reader
    url: https://github.com/Kalmarv/primase/blob/main/worlds/fromsoft/src/param.rs
---

A PARAM is a numbered table of fixed-width rows. The file names its param type and data version, but does not carry
the definitions of individual row fields. Paramdex supplies community definitions of those fields for each game
and revision. :sourced[Paramdex]

| Game | Container | Confidence |
|---|---|---|
| Sekiro | `param/gameparam/gameparam.parambnd.dcx` in the archives | :observed{games="sekiro"} |
| Elden Ring | `regulation.bin` beside the executable | :observed{games="elden-ring"} |

:only[elden-ring] Regulation uses AES-256-CBC, with the first 16 stored bytes supplying the IV; decrypted bytes hold
a DCX envelope around a binder. The examined regulation uses ZSTD. Public decryption material is supplied by
SoulsFormatsNEXT. :sourced[SoulsFormatsNEXT]{games="elden-ring"}

## Shared PARAM envelope

The examined NPC tables use little-endian integers, 64-bit row offsets, an offset to the ASCII param-type name and
UTF-16 row names. Empty stored row names are distinct from the descriptive names supplied by community lists.
:observed

```layout
title: PARAM header for the examined tables
size: 64
fields:
  - {at: 0, size: 4, type: u32, name: strings offset, level: sourced, note: Individual string pointers remain authoritative}
  - {at: 4, size: 2, type: u16, name: padding, level: observed, value: 0}
  - {at: 6, size: 2, type: u16, name: unknown, level: unknown, note: Observed 1 in both NPC tables}
  - {at: 8, size: 2, type: u16, name: data version, level: observed}
  - {at: 10, size: 2, type: u16, name: row count, level: observed}
  - {at: 12, size: 4, type: u32, name: padding, level: observed, value: 0}
  - {at: 16, size: 8, type: u64, name: param type string offset, level: observed}
  - {at: 24, size: 20, type: "u8[20]", name: padding, level: observed, value: 0}
  - {at: 44, size: 1, type: u8, name: big endian, level: sourced, note: Zero in examined tables}
  - {at: 45, size: 1, type: u8, name: format flags 1, level: sourced, note: "0x85; low bit meaning unresolved"}
  - {at: 46, size: 1, type: u8, name: format flags 2, level: sourced, note: "0x07; bit 0 selects UTF-16 names"}
  - {at: 47, size: 1, type: u8, name: unknown, level: unknown, note: Retained in the header}
  - {at: 48, size: 8, type: u64, name: row data start, level: observed}
  - {at: 56, size: 8, type: u64, name: padding, level: observed, value: 0}
```

```layout
title: PARAM row index entry
size: 24
fields:
  - {at: 0, size: 4, type: i32, name: row ID, level: observed}
  - {at: 4, size: 4, type: u32, name: padding, level: observed, value: 0}
  - {at: 8, size: 8, type: u64, name: row data offset, level: observed}
  - {at: 16, size: 8, type: u64, name: row name offset, level: observed, note: Zero means no name}
```

## NpcParam

Every row's ID and all 32 `modelDispMask` bits in both examined NPC tables match an independent SoulsFormats decode
using the corresponding Paramdex definition. This does not validate the meanings of every other row field. :proven

| Property | Sekiro | Elden Ring | Confidence |
|---|---|---|---|
| Param type | `NPC_PARAM_ST` | Same | :proven |
| Data version | 14 | 9 | :proven |
| Row size | 896 bytes | 736 bytes | :proven |
| Masks 0–15 | Bytes 334, 335 | Bytes 330, 331 | :proven |
| Masks 16–31 | Bytes 338, 339 | Bytes 334, 335 | :proven |

The bits select a model's marked meshes; the enemy placement supplies the NPC row. See
[character parts and masks](/engines/fromsoft/data-model/character-parts/). :sourced[SoulsFormatsNEXT]

:::open[How do PARAM revisions affect fields beyond the checked masks?]
Definitions can remove or introduce fields at regulation versions. A matching type name or data-version number
alone does not establish the offsets of every field across updates.
:::
