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
reference-readable package population, not proof that every archive entry is a valid TPF. :proven{games="sekiro"}

## Header and descriptors

```layout
title: PC TPF header
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
size: variable
fields:
  - {at: 0, size: 4, type: u32, name: metadata identifier, level: unknown}
  - {at: 4, size: 4, type: u32, name: payload byte length, level: observed}
  - {at: 8, size: payload byte length, type: u32 array, name: metadata words, level: unknown, note: Length is a multiple of four; words are not necessarily floats.}
```

Optional metadata immediately follows its descriptor prefix, so descriptors are not necessarily a fixed-stride
array. Names and payload offsets are file-relative. Payloads start with `DDS `. :observed

The data-size field has two observed producer conventions: length from the end of names, or length from the first
DDS payload. Inter-section padding is zero but has no fixed width; trailing padding is at most 15 zero bytes.
:observed

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
format while its DXGI table uses 16-bit UNORM, and comments call 108–110 sRGB while that table gives linear BC
formats. These mappings cannot establish a runtime colour view. :sourced[SoulsFormatsNEXT]

DDS block-compressed formats identify both block packing and, for DXGI formats, linear or sRGB transfer.
Sekiro area-texture pixel comparisons match an independent BC decoder exactly, and independent C# and Pillow
decoders within one channel level where those readers support the format. Two m25 sky textures are explicit
unsupported-format cases for the C# reader. :observed{games="sekiro"}

BC blocks cover 4×4 texels; a sub-4×4 mip still occupies a whole block. BC1 and BC4 use eight-byte blocks;
BC2, BC3, BC5, BC6H and BC7 use sixteen-byte blocks. :sourced[bcdec]

Normal maps and masks are read as linear data; albedo sampling can require an sRGB view. In Elden Ring's Academy
material sample, 96 GSBlendMap albedo bindings point at DX10 sRGB DDS formats and 57 GSBlendMap normal bindings
at linear formats. This payload correlation does not prove every runtime resource-view format.
:observed{games="elden-ring"}

:::open[Which package-format codes occur in each install?]
The DDS payload provides a concrete pixel-format declaration. An exhaustive per-game mapping from the separate
TPF format byte to that declaration is not established here, nor are all optional metadata word meanings.
:unknown
The conflicting reference descriptions for codes 22 and 108–110 also require comparison with actual DDS payloads
and resource views. :unknown
:::
