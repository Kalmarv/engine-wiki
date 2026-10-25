---
title: "Runtime class registry"
description: "Class descriptors, stored field kinds and confidence in CRC-based names."
games: ["riders-republic"]
sources:
  - title: RRAssetStudio v3
    url: https://www.nexusmods.com/ridersrepublic/mods/5
    note: Independent Riders Republic resource reader.
implementations:
  - name: "primase worlds/anvil (component_types.rs)"
    url: https://github.com/Kalmarv/primase/blob/main/worlds/anvil/src/read/component_types.rs
---

The inspected runtime image contains class-registration strings and field metadata absent from the packed executable's disk image. A registration string whose CRC-32 matches the id corroborates a class name; an arbitrary matching word does not. :observed

| Name evidence | What it establishes | Confidence |
|---|---|---|
| Runtime class-registration string, matching CRC-32 | Class name in the inspected image | :observed |
| AnvilToolkit, ACExplorer, ReForger or Blacksmith list | A tool's name for a hash in its supported game | :sourced[community readers] |
| Wordlist or generated string CRC match | Candidate; accidental 32-bit collisions remain possible | :inferred |
| RRAssetStudio `Selector`, `MATERIAL_SET` | Display labels for BuildTable `0x22ECBE63` | :sourced[RRAssetStudio] |
| RRAssetStudio `LODMultiMesh` | Label for LODSelector `0x51DC6B80` | :sourced[RRAssetStudio] |
| RRAssetStudio `MipMap` | Label for CompiledMip `0x1D4B87A3` | :sourced[RRAssetStudio] |

Stored fields normally serialize base-class-first and in descriptor order; flag `0x02000000` marks stored fields. Animation, Bone and Visual have custom serialization behavior. ManagedObject-derived bodies carry an extra leading byte. These relationships are checked against real bodies. :observed

```layout
title: "Runtime class descriptor prefix"
size: 40
games: [riders-republic]
note: "Little-endian. Offsets are relative to this structure."
fields:
  - {"at": 0, "size": 8, "type": "pointer", "name": "field records", "level": "observed"}
  - {"at": 8, "size": 16, "type": "bytes", "name": "unknown", "level": "unknown", "note": "Stored bytes; meaning is not established."}
  - {"at": 24, "size": 8, "type": "pointer", "name": "name string", "level": "observed"}
  - {"at": 32, "size": 4, "type": "u32", "name": "base type id", "level": "observed"}
  - {"at": 36, "size": 4, "type": "u32", "name": "own type id", "level": "observed"}
```
```layout
title: "Runtime field record"
size: 56
games: [riders-republic]
note: "Little-endian. Offsets are relative to this structure."
fields:
  - {"at": 0, "size": 4, "type": "u32", "name": "flags", "level": "observed"}
  - {"at": 4, "size": 4, "type": "u32", "name": "field-name CRC-32", "level": "observed"}
  - {"at": 8, "size": 4, "type": "u32", "name": "target class id", "level": "observed"}
  - {"at": 12, "size": 2, "type": "u16", "name": "fixed-array count", "level": "observed"}
  - {"at": 14, "size": 2, "type": "u16", "name": "kind", "level": "observed"}
  - {"at": 16, "size": 2, "type": "u16", "name": "element kind", "level": "observed"}
  - {"at": 18, "size": 38, "type": "bytes", "name": "unknown", "level": "unknown", "note": "Stored bytes; meaning is not established."}
```

Field arrays end at the next array or descriptor, not at the first apparently invalid record. A nonzero fixed-array count at offset 12 is valid. :observed

| Kind | Checked serialized representation | Confidence |
|---|---|---|
| `0x0A` | f32 | :observed |
| `0x11`, `0x1F` | Eight bytes | :observed |
| `0x12` | Nine-byte link: tag + u64 | :observed |
| `0x13`, `0x16` | Owned / embedded object: u64 + type + body | :observed |
| `0x14` | Tagged pointer | :observed |
| `0x17` | Fixed array; descriptor count, no serialized count | :observed |
| `0x18` | Buffer: u32 count + elements, including object buffers | :observed |
| `0x19` | Enum u32 | :observed |
| `0x1A` | u32 byte count + chars + NUL; empty string is only the count | :observed |
| `0x1B` | UTF-16 count + units + NUL unit; empty string is only the count | :observed |
| `0x1C` | Ten-byte resource reference | :observed |
| `0x1D` | u32 count + descriptor-selected elements | :observed |
| `0x00C0` | Pure-bool group after the class's other fields | :observed |

Enum descriptors are 16 bytes: pointer, enum-name CRC-32, count. Each target entry is eight bytes: value u32 and enumerator-name CRC-32 u32. An integer and hash remain readable when the spelling is unknown. :observed

:::open[Which serializers depart from registry order?]
The metadata is not a complete serialization program. Custom orders and shader-constant blocks require class-specific evidence; an unknown class cannot safely be decoded solely from field names. :unknown
:::
