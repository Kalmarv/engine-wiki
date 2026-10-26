---
title: TPF texture packages
description: PC package headers, variable descriptors, DDS payloads and pixel decoding evidence.
sources:
  - title: SoulsFormatsNEXT
    url: https://github.com/soulsmods/SoulsFormatsNEXT/tree/master/SoulsFormats/Formats/TPF
    note: TPF reference reader
  - title: bcdec
    url: https://github.com/iOrange/bcdec
    note: Independent BC pixel decoder
implementations:
  - name: primase worlds/fromsoft (tpf.rs)
    url: https://github.com/Kalmarv/primase/blob/main/worlds/fromsoft/src/tpf.rs
---

PC TPF packages contain named DDS payloads, including their mip chains and any cubemap faces or volume slices.
The package's format byte is metadata beside the DDS; the DDS also declares its own pixel format. :observed

Sekiro's whole-install comparison visits packages inside ordinary and split binders, compares independent
metadata and DDS payloads, and accounts for entries both readers reject. The evidence is exhaustive for the
reference-readable package population: 14,481 packages holding 30,613 textures. One archive entry is refused
before its contents can be inspected; none of those 14,481 package records is refused. The proof does not
cover the unread archive payload. :proven{games="sekiro"}

## Header and descriptors

The separate layouts mark the complete Sekiro package census as Proven and Elden Ring's sampled PC packages
as Observed. No whole-install Elden Ring TPF comparison is established here. :observed{games="elden-ring"}

```layout
title: PC TPF header
games: [sekiro]
size: 16
fields:
  - {at: 0, size: 4, type: char, name: magic, value: 'TPF\0', level: proven}
  - {at: 4, size: 4, type: u32, name: data size, level: proven}
  - {at: 8, size: 4, type: u32, name: texture count, level: proven}
  - {at: 12, size: 1, type: u8, name: platform, value: 0, level: sourced, note: PC.}
  - {at: 13, size: 1, type: u8, name: package flags, level: unknown, note: Accepted values 0 through 3; complete semantics not established.}
  - {at: 14, size: 1, type: u8, name: name encoding, level: proven, note: 1 is UTF-16; checked other cases use byte strings.}
  - {at: 15, size: 1, type: u8, name: reserved, value: 0, level: proven}
```

```layout
title: PC TPF header
games: [elden-ring]
size: 16
fields:
  - {at: 0, size: 4, type: char, name: magic, value: 'TPF\0', level: observed}
  - {at: 4, size: 4, type: u32, name: data size, level: observed}
  - {at: 8, size: 4, type: u32, name: texture count, level: observed}
  - {at: 12, size: 1, type: u8, name: platform, value: 0, level: sourced, note: PC.}
  - {at: 13, size: 1, type: u8, name: package flags, level: unknown, note: Accepted values 0 through 3; complete semantics not established.}
  - {at: 14, size: 1, type: u8, name: name encoding, level: observed, note: 1 is UTF-16; checked other cases use byte strings.}
  - {at: 15, size: 1, type: u8, name: reserved, value: 0, level: observed}
```

```layout
title: PC TPF texture descriptor prefix
games: [sekiro]
size: 20
fields:
  - {at: 0, size: 4, type: u32, name: payload offset, level: proven}
  - {at: 4, size: 4, type: u32, name: payload length, level: proven}
  - {at: 8, size: 1, type: u8, name: package format code, level: sourced}
  - {at: 9, size: 1, type: u8, name: texture kind, level: proven, note: 0 image; 1 cube; 2 volume.}
  - {at: 10, size: 1, type: u8, name: mip count, level: proven}
  - {at: 11, size: 1, type: u8, name: texture flags, level: unknown, note: 0 or 1 in supported PC descriptors.}
  - {at: 12, size: 4, type: u32, name: name offset, level: proven}
  - {at: 16, size: 4, type: u32, name: optional metadata present, level: proven}
```

```layout
title: PC TPF texture descriptor prefix
games: [elden-ring]
size: 20
fields:
  - {at: 0, size: 4, type: u32, name: payload offset, level: observed}
  - {at: 4, size: 4, type: u32, name: payload length, level: observed}
  - {at: 8, size: 1, type: u8, name: package format code, level: sourced}
  - {at: 9, size: 1, type: u8, name: texture kind, level: observed, note: 0 image; 1 cube; 2 volume.}
  - {at: 10, size: 1, type: u8, name: mip count, level: observed}
  - {at: 11, size: 1, type: u8, name: texture flags, level: unknown, note: 0 or 1 in supported PC descriptors.}
  - {at: 12, size: 4, type: u32, name: name offset, level: observed}
  - {at: 16, size: 4, type: u32, name: optional metadata present, level: observed}
```

```layout
title: Optional TPF metadata
games: [sekiro]
size: variable
fields:
  - {at: 0, size: 4, type: u32, name: metadata identifier, level: unknown}
  - {at: 4, size: 4, type: u32, name: payload byte length, level: proven}
  - {at: 8, size: payload byte length, type: u32 array, name: metadata words, level: unknown, note: Length is a multiple of four; words are not necessarily floats.}
```

```layout
title: Optional TPF metadata
games: [elden-ring]
size: variable
fields:
  - {at: 0, size: 4, type: u32, name: metadata identifier, level: unknown}
  - {at: 4, size: 4, type: u32, name: payload byte length, level: observed}
  - {at: 8, size: payload byte length, type: u32 array, name: metadata words, level: unknown, note: Length is a multiple of four; words are not necessarily floats.}
```

Optional metadata immediately follows its descriptor prefix, so descriptors are not necessarily a fixed-stride
array. Names and payload offsets are file-relative. Payloads start with `DDS `.
:proven[all 14481 packages]{games="sekiro"} :observed{games="elden-ring"}

The data-size field has two observed producer conventions: length from the end of names, or length from the first
DDS payload. Inter-section padding is zero but has no fixed width; trailing padding is at most 15 zero bytes.
:proven[all 14481 packages]{games="sekiro"} :observed{games="elden-ring"}

## Pixel formats and colour transfer

SoulsFormatsNEXT's package-format table includes the following mappings. These describe its header reconstruction
rules across formats, not a census of which codes Sekiro or Elden Ring actually ships. :sourced[SoulsFormatsNEXT]

| TPF codes | Reference DDS mapping | Confidence |
|---|---|---|
| 0, 1, 25, 29 | BC1 / DXT1 | :sourced[SoulsFormatsNEXT] |
| 3 | BC2 / DXT3 | :sourced[SoulsFormatsNEXT] |
| 5, 23, 33 | BC3 / DXT5 | :sourced[SoulsFormatsNEXT] |
| 24, 103 | BC4 / ATI1 | :sourced[SoulsFormatsNEXT] |
| 36, 104 | BC5 / ATI2 | :sourced[SoulsFormatsNEXT] |
| 100, 113, 115 | BC6H unsigned float | :sourced[SoulsFormatsNEXT] |
| 102, 106, 107 | BC7 linear | :sourced[SoulsFormatsNEXT] |
| 112 | BC7 sRGB | :sourced[SoulsFormatsNEXT] |
| 6 | B5G5R5A1 | :sourced[SoulsFormatsNEXT] |
| 8, 9, 105 | RGBA8, BGRA8, RGBA8 respectively | :sourced[SoulsFormatsNEXT] |

The reference source is internally inconsistent on some remaining codes: its comments call 22 a half-float
format while its DXGI table uses 16-bit UNORM, and comments call 108â€“110 sRGB while that table gives linear BC
formats. These mappings cannot establish a runtime colour view. :sourced[SoulsFormatsNEXT]

DDS block-compressed formats identify both block packing and, for DXGI formats, linear or sRGB transfer.
Sekiro area-texture pixel comparisons match an independent BC decoder exactly, and independent C# and Pillow
decoders within one channel level where those readers support the format. Two m25 sky textures are explicit
unsupported-format cases for the C# reader. :observed{games="sekiro"}

BC blocks cover 4Ã—4 texels; a sub-4Ã—4 mip still occupies a whole block. BC1 and BC4 use eight-byte blocks;
BC2, BC3, BC5, BC6H and BC7 use sixteen-byte blocks. :sourced[bcdec]

Normal maps and masks are read as linear data; albedo sampling can require an sRGB view. In Elden Ring's Academy
material sample, 96 GSBlendMap albedo bindings point at DX10 sRGB DDS formats and 57 GSBlendMap normal bindings
at linear formats. This payload correlation does not prove every runtime resource-view format.
:observed{games="elden-ring"}

:::open[Which package-format codes occur in each install?]
The DDS payload provides a concrete pixel-format declaration. An exhaustive per-game mapping from the separate
TPF format byte to that declaration is not established here, nor are all optional metadata word meanings.
:unknown
The conflicting reference descriptions for codes 22 and 108â€“110 also require comparison with actual DDS payloads
and resource views. :unknown
:::

## Sekiro

### Map textures

Map textures are stored one per TPF in the split binders `/map/mXX/mXX_000N.tpfbhd`/`.tpfbdt`, each with a
low-resolution `_l` twin; other textures are in `/other/*.tpf` and in objects' own TPFs. :observed{games="sekiro"} The `m11`
archives hold 3,522 textures, mostly 256 to 1,024 px, with sky and cloud textures up to 2,048 × 512.
:observed{games="sekiro"}

| Role | DDS format | Textures | Confidence |
|---|---|---:|---|
| Albedo `_a` | DXGI 72, BC1 sRGB | 749 | :observed{games="sekiro"} |
| Normal `_n` | DXGI 98, BC7 | 723 | :observed{games="sekiro"} |
| Metallic `_m` | BC4 | 59 | :observed{games="sekiro"} |
| Mask `_3m` | BC1 | 130 | :observed{games="sekiro"} |
| Foliage and sky albedo | DXGI 99, BC7 sRGB | 8 | :observed{games="sekiro"} |
| `m11_00_water_v` | BC5 | 2 | :observed{games="sekiro"} |

129 of Ashina Castle's 347 BC1 albedos use BC1's punch-through mode: in a three-colour block, index 3 is
transparent black, so a decoder that ignores the mode loses their alpha. :observed{games="sekiro"}
