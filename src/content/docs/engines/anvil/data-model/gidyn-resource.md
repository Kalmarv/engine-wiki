---
title: "GIDynResource storage"
description: "Cell-owned volume descriptors, encoded streams and probe positions."
games: ["riders-republic"]
sources:
  - title: RRAssetStudio v3
    url: https://www.nexusmods.com/ridersrepublic/mods/5
    note: Independent Riders Republic resource reader.
implementations:
  - name: "anvil-formats (gidyn.rs)"
    url: https://github.com/Kalmarv/anvil-formats/blob/main/src/gidyn.rs
---

GIDynResource (`0xBAE98B30`) belongs to a World and a cell. GridCellDataBlocks list one per USNAT ShortRange finest cell in the checked 16,384-cell population. The one-volume, one-box body profile is validated on 418 offline bodies; its four encoded streams are distinct from render geometry. :observed

```layout
title: "GIDynResource one-volume prefix"
size: 118
games: [riders-republic]
note: "Little-endian. Offsets are relative to this structure."
fields:
  - {"at": 0, "size": 1, "type": "u8", "name": "ManagedObject byte", "level": "unknown", "note": "01."}
  - {"at": 1, "size": 8, "type": "u64", "name": "World ClassID", "level": "observed"}
  - {"at": 9, "size": 4, "type": "u32", "name": "cell id", "level": "observed"}
  - {"at": 13, "size": 4, "type": "u32", "name": "volume count", "value": 1, "level": "observed"}
  - {"at": 17, "size": 12, "type": "object header", "name": "GIDynVolumeData", "level": "observed", "note": "Type 0x684A17AD."}
  - {"at": 29, "size": 12, "type": "object header", "name": "GIDynVolumeDesc", "level": "observed", "note": "Type 0xCE0C489A."}
  - {"at": 41, "size": 12, "type": "f32[3]", "name": "PositionOffset", "level": "observed"}
  - {"at": 53, "size": 4, "type": "u32", "name": "sample count S", "level": "observed"}
  - {"at": 57, "size": 4, "type": "u32", "name": "probe count P", "level": "observed"}
  - {"at": 61, "size": 1, "type": "u8", "name": "IsIndoor", "level": "observed"}
  - {"at": 62, "size": 4, "type": "u32", "name": "subvolume count", "value": 1, "level": "observed"}
  - {"at": 66, "size": 12, "type": "object header", "name": "subvolume", "level": "observed", "note": "Type 0xACC1B118."}
  - {"at": 78, "size": 12, "type": "object header", "name": "voxel box", "level": "observed", "note": "Type 0xE96BB4A2."}
  - {"at": 90, "size": 24, "type": "i32[6]", "name": "voxel minimum and maximum", "level": "observed"}
  - {"at": 114, "size": 4, "type": "u32", "name": "unknown subvolume word", "level": "unknown", "note": "Stored bytes; meaning is not established."}
```

Four buffers follow, each `u32 byte length + stored bytes`, then three u32 decoded-byte lengths, with no trailing bytes in the checked profile. :observed

| Stream | Storage and validated length | Confidence |
|---|---|---|
| V1 | u16 RLE; escape `0xFFFE, count, value`; expands to `5S` words | :observed |
| V2 | Byte RLE; escape `0xFE, count, value`; expands to footer's second size | :observed |
| V3 | u16 RLE voxel-to-probe grid; `0xFFFF` none, low 15 bits probe index; twice voxel count bytes | :observed |
| V4 | P records of four f16 lanes, xyz offsets and zero fourth lane | :observed |

Probe positions equal PositionOffset plus V4's xyz offsets in metres. Footer sizes are `10S`, V2's decoded byte count and twice the voxel-box volume. The observed grid's horizontal extent is 24 × 24, with varying depth. :observed

:::open[What do the encoded sample and visibility values mean?]
Probe positions and framing do not establish irradiance, all flag bits, sample origin or construction of GPU lighting textures. Multi-volume profiles are outside the checked one-volume scope. :unknown
:::

The [lighting interpretation](/engines/anvil/lighting/global-illumination/) is distinct from these volume and stream storage rules.
