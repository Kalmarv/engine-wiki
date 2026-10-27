---
title: "Runtime class registry"
description: "Class descriptors, stored field kinds and confidence in CRC-based names."
games: ["riders-republic", "shaun-white-skateboarding"]
sources:
  - title: RRAssetStudio v3
    url: https://www.nexusmods.com/ridersrepublic/mods/5
    note: Independent Riders Republic resource reader.
  - title: ACExplorer
    url: https://github.com/gentlegiantJGC/ACExplorer
  - title: ReForger
    url: https://github.com/QuilLeeR/ReForger
  - title: Blacksmith
    url: https://github.com/theawesomecoder61/Blacksmith
implementations:
  - name: "primase worlds/anvil (component_types.rs)"
    url: https://github.com/Kalmarv/primase/blob/main/worlds/anvil/src/components/component_types.rs
---

The inspected runtime image contains class-registration strings and field metadata absent from the packed executable's disk image. A registration string whose CRC-32 matches the id corroborates a class name; an arbitrary matching word does not. :observed

The registration table is built while the game starts. A guest-memory snapshot taken at the main menu holds the plaintext class names, and their CRC-32 values name 604 of the 607 forge type ids that no tool or dictionary had named; a snapshot about 50 seconds after process start, at the splash screen, holds none of them. :observed

A dictionary word with a matching CRC-32 can be an accidental collision: 25 of 298 ids previously named from word lists had a different registered class, for example `0x7AAB07A6` is CameraManager rather than `unexaminable`, and `0x18A4E465` is DBAIEquipmentSet rather than `clip_max_yremainders`. :observed

| Name evidence | What it establishes | Confidence |
|---|---|---|
| Runtime class-registration string, matching CRC-32 | Class name in the inspected image | :observed |
| AnvilToolkit, ACExplorer, ReForger or Blacksmith list | A tool's name for a hash in its supported game | :sourced[ACExplorer, ReForger, Blacksmith] |
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

## Shaun White Skateboarding

:only[shaun-white-skateboarding]

The class of an object is the CRC-32 of its class name, and the forge's name records do not carry it (see [forge archives](/engines/anvil/archives/forge/)). Level 01 holds 59 classes; 41 of them have a name in the Assassin's Creed II schema of a community tool, the rest are known only by id unless a name below matches. :observed[level 01]

The names below were checked by computing the CRC-32 of each name and comparing it with the stored id. :proven[the CRC-32 equals the id for every name listed]

| Class | Id | Role | Id equals CRC-32 of the name |
|---|---|---|---|
| `GridCellDataBlock` | `0xAC2BBF68` | First object of a level cell; lists the cell's objects | :proven |
| `Entity` | `0x0984415E` | Placement and component list | :proven |
| `CompiledMesh` | `0xFC9E1595` | Vertex and index data of a mesh | :proven |
| `SKGenericMaterial` | `0xB71F6261` | The material class of every drawn surface | :proven |
| `TextureMap` | `0xA2B7E917` | A texture with its pixels | :proven |
| `CompiledTextureMap` | `0x13237FE9` | The pixel part of a texture, embedded in a TextureMap | :proven |
| `TextureMapSpec` | `0x989DC6B2` | A material's reference to a TextureMap | :proven |
| `MeshShape` | `0xB22B3E61` | Triangle collision shape | :proven |
| `InertComponent` | `0x0E5A450A` | Rigid body of a static prop | :proven |
| `RigidBody` | `0x228F402A` | Embedded in an InertComponent | :proven |
| `CollisionFilterInfo` | `0x43EF99C2` | Collision layer box | :proven |
| `SWCollisionMaterial` | `0xEF0C7E58` | Surface type of a collision triangle | :proven |
| `SkyLight` | `0x77EEEBB4` | The level's sun and ambient colour | :proven |
| `SWSkateGuidanceSystem` | `0x5CDCA222` | Grind edges of an entity | :proven |
| `SWSkateFreeFormGuidanceSystem` | `0x359BE54E` | Free-form grind edges | :proven |
| `Animation` | `0x0FA3067F` | Block-allocator class | :proven |
| `NavMeshManager` | `0x0B4CE0E0` | Block-allocator class | :proven |
| `RealTreeComponent` | `0x7338CDF5` | A procedural tree on an entity | :proven |
| `ActivateRealTreeGrowthEvent` | `0xCB394D43` | Event that grows the trees | :proven |
| `LightMapData` | `0xAA9C9CB4` | Baked light map reference | :proven |
| `VertexLightData` | `0x37542FA0` | Per-instance baked vertex colours | :proven |
| `CompositeLightingStaticComponent` | `0x95DC9CD6` | Baked spherical-harmonic lighting | :proven |

The name of the class `0x3C6C77C8` (the box that begins every component), the surface-object classes other than `SWCollisionMaterial`, `0x9C878790` and `0x4497D578` are not known. :unknown

The material class name is present in the game executable; the CRC-32 of the name does not match the property hashes the material's fields use, which are separate hashes of qualified names such as the `InfluenceHidePixelMode` property (`0x7DACF81C`). :observed
The role of each class is read from the contents of its objects in the cells. :observed
