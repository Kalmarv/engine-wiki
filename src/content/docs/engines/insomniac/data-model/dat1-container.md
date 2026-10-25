---
title: Assets and the DAT1 container
description: The 36-byte asset wrapper, LZ4 compression, and the DAT1 container whose tagged sections hold every Sunset Overdrive asset type.
sources:
  - title: ALERT wiki (DAT1)
    url: https://github.com/Tkachov/ALERT/wiki/DAT1
    note: the DAT1 header and section table; section tags are CRC32 of a section name
  - title: ALERT
    url: https://github.com/Tkachov/ALERT
    note: Python dat1lib; GPL-3
---

Almost every Sunset Overdrive asset is a **DAT1** container: a header listing tagged sections, a string block, and the sections' data. An asset
of each type (model, texture, zone, material, ...) has its own set of sections, and sections with the same tag share a format. :sourced[ALERT wiki]
In the archive each asset has a 36-byte wrapper in front of its DAT1. :observed

The census below is over the PC build 3373500 (4,936 zones, 8,780 models, 42,841 textures and the rest); it was recorded and is no longer
re-checkable. :observed

## Asset wrapper

```layout
title: Asset wrapper
size: 36
games: [sunset-overdrive]
note: Little-endian. Precedes the DAT1 in the archive.
fields:
  - {at: 0, size: 4, type: u32, name: type magic, level: observed, note: "e.g. 0x6AE15C79 for .model; the same magic names all assets of one extension. ALERT suggests it is a build version of the type rather than the type"}
  - {at: 4, size: 4, type: u32, name: DAT1 size, level: observed, note: "uncompressed size of the DAT1, excluding these 36 bytes"}
  - {at: 8, size: 4, type: u32, name: payload length, level: observed, note: "bytes of payload after the DAT1: the SD pixel bytes for a texture, 0 for zones and models"}
  - {at: 12, size: 24, type: "u8[24]", name: zero, value: 0, level: observed, note: "zero in all 42,841 textures and every zone and model checked"}
```

When an asset is compressed it is **one raw LZ4 block** that covers the DAT1 and its payload together, to be decompressed to `DAT1 size + payload
length`; a stored asset is the DAT1 bytes as they are. :observed Over 42,841 textures the decompressed tail equals the payload length in every case
(42,341 compressed, 500 stored); all 4,936 zones are compressed with no tail; all 8,780 models are compressed. :observed An LZ4 decoder's
output equals ALERT's own decoder byte for byte on two zones. :observed

Tools that decompress to the DAT1 size alone fail on textures with an LZ4 error: the payload is part of the block. :observed

## DAT1

```layout
title: DAT1 header
size: variable
games: [sunset-overdrive]
note: Little-endian. Offsets are relative to the DAT1 magic.
fields:
  - {at: 0, size: 4, type: u32, name: magic, value: "0x44415431 (DAT1)", level: sourced, note: "ALERT wiki"}
  - {at: 4, size: 4, type: u32, name: type, level: sourced, note: "repeats the wrapper's type magic"}
  - {at: 8, size: 4, type: u32, name: size, level: sourced, note: "DAT1 size without the 36 wrapper bytes"}
  - {at: 12, size: 2, type: u16, name: section count, level: sourced}
  - {at: 14, size: 2, type: u16, name: unknown count, level: sourced, note: "rarely non-zero"}
  - {at: 16, size: "12 × section count", type: "section[]", name: sections, level: sourced, note: "u32 tag (CRC32 of the section name), u32 offset, u32 size"}
  - {at: "next", size: "8 × unknown count", type: "u8[8][]", name: unknowns, level: sourced}
```

A string block of zero-terminated strings follows the header and ends where the section with the lowest offset starts; sections are aligned to 16 bytes
relative to the DAT1 magic. :sourced[ALERT wiki] The sections used by each asset type are on the pages for [models](/engines/insomniac/geometry/model/),
[textures](/engines/insomniac/textures/texture/), [zones](/engines/insomniac/world/zone/) and [collision](/engines/insomniac/collision/havok-hknp/);
the toc's own are on [The toc and the archives](/engines/insomniac/archives/toc-and-archives/). Section tags are CRC32 values of a name, so a
section is identified by its tag (`283D0383`, `06ABCAB2`, ...), not by a name in the file. :sourced[ALERT wiki]

## Asset types

| Extension | Count | Holds | Confidence |
|---|---|---|---|
| `.level` | 1 | the one level, `levels/sunset_city/sunset_city.level` | :observed |
| `.zone` | 4,936 | the hexagonal tiles of the city and overlays, with their placements ([Zones](/engines/insomniac/world/zone/)) | :observed |
| `.zone_physics` | 1,112 | Havok collision per zone ([Havok collision](/engines/insomniac/collision/havok-hknp/)) | :observed |
| `.zone_static` | 419 | "Zone Decal Built File": decals | :observed |
| `.model` | 8,780 | geometry ([Models](/engines/insomniac/geometry/model/)) | :observed |
| `.texture` | 52,624 | pixels ([Textures](/engines/insomniac/textures/texture/)) | :observed |
| `.material`, `.materialgraph` | 6,924, 1,012 | material template, shader, texture and scalar parameters | :sourced[ALERT wiki] |
| `.actor`, `.config`, `.lightgrid`, `.wem` | 2,568, 2,536, 46,816, 265,887 | actors, binary JSON-like configs, light grids, Wwise audio | :sourced[ALERT wiki] |

The `.wem` audio assets have no real filename: their ids are not hashes of a path. :sourced[ALERT wiki] Whether asset ids are a hash of the path
in Sunset Overdrive (CRC64 in later games, 32-bit here) is not established. :unknown

:::open[Is the type magic an asset type or a build version?]
All assets of one extension share a magic here, but in later games the magic of an extension changes between updates (ALERT's `.material` in Rift Apart),
which suggests it is a version of the built data and not a type. Sunset Overdrive has one build, so the two cannot be told apart.
:::
