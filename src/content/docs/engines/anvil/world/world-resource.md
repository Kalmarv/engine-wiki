---
title: "World resource and managers"
description: "World configuration, component list and TerrainParam footer."
games: ["riders-republic"]
sources:
  - title: RRAssetStudio v3
    url: https://www.nexusmods.com/ridersrepublic/mods/5
    note: Independent Riders Republic resource reader.
implementations:
  - name: "primase worlds/anvil (grid.rs)"
    url: https://github.com/Kalmarv/primase/blob/main/worlds/anvil/src/read/grid.rs
---

Beyond [grid descriptions](/engines/anvil/world/grids/), World stores managers and configuration objects, then a separate component list. Registry-guided decoding reaches the count at body offset 4,104 in USNAT patch World and 2,527 in WhiteRoom patch World. Base WorldGraphicData has a different profile not established by that decoding. :observed

```layout
title: "World body (its start)"
size: "var"
games: [riders-republic]
note: "Little-endian. Offsets are relative to this structure."
fields:
  - {"at": 0, "size": 1, "type": "u8", "name": "ManagedObject byte", "value": "01", "level": "unknown", "note": "Stored bytes; meaning is not established."}
  - {"at": 1, "size": 4, "type": "u32", "name": "GridsDesc count n", "level": "observed", "note": "BaseWorld.GridsDesc: an array of embedded GridDescription (3 in every World)"}
  - {"at": 5, "size": "nÂ·(57+2w)", "type": "bytes", "name": "GridDescriptions", "level": "observed", "note": "the GridDescription box"}
  - {"at": "5+n(57+2w)", "size": "var", "type": "fields", "name": "World's stored fields", "level": "observed", "note": "in registry order: FakeEntitiesHandle (link, 9 bytes), StreamFakeEntitiesGrid (enum GridPartition::GridType: 2 USNAT, 3 WhiteRoom), DefaultTransitionPortal (reference, 10), WorldTransitionPortals (array of references: 10 USNAT, 0…"}
  - {"at": "var", "size": 4, "type": "u32", "name": "world component count c", "level": "observed", "note": "47 USNAT, 21 WhiteRoom; not a field of World's class list (written by its own serializer)"}
  - {"at": "var", "size": "var", "type": "objects", "name": "world components", "level": "observed", "note": "c pointers (tag 04; 00 on USNAT's TimeOfDayManager) to objects whose class derives from WorldComponent 0xDD4B9F35: NavigationManager, SoundBankWorldComponent, TimeOfDayManager, GameplayCoordinatorWorldComponent,…"}
  - {"at": "var", "size": 83, "type": "object", "name": "SpaceWorldComponent", "level": "unknown", "note": "The 36 bytes are 00000000 00000000 ffffffff 00000000 e8030000 0000 03(+9 zeros) 00000000: the stored fields' sizes add up to 36 if the bit-field group (Priority, IsInterior, IsUnderground; store 0x171, high kind bits 0x20) takes 6 bytes…"}
  - {"at": "end-24", "size": 24, "type": "object", "name": "TerrainParam", "level": "observed", "note": "an embedded TerrainParam 0xDA4A4039 (u64 id, class, then TileSizeInPixel u32 1024, TileSizeInMeter f32 512.0, TileCountPerSide u32 32) ends both Worlds: 32 x 512 m = 16,384 m, the open world's -8192..8192 extent. in WhiteRoom…"}
```

| Field / structure | Checked representation | Confidence |
|---|---|---|
| FakeEntitiesHandle | Nine-byte link | :observed |
| StreamFakeEntitiesGrid | Enum: USNAT 2, WhiteRoom 3 | :observed |
| DefaultTransitionPortal / WorldTransitionPortals | Reference and reference array; 10 / 0 portals | :observed |
| WorldDataLayerManager | Layer-state management object | :observed |
| WorldGraphicData | Owned rendering configuration | :observed |
| EnableClimate, WorldEngineData, RegionLayoutManager | Stored in that order | :observed |
| WorldComponent list | 47 pointers in USNAT patch, 21 in WhiteRoom patch | :observed |
| OpponentTrailDataRepositoryWorldComponent | Last USNAT component, 15,091,762 bytes | :observed |
| SpaceWorldComponent | 83-byte frame; internal order unresolved | :unknown |

45 of 47 USNAT component bodies and 19 of 21 WhiteRoom bodies decode exactly to the following header. The separate list is not described by World's class field list. :observed

```layout
title: "TerrainParam footer"
size: 24
games: [riders-republic]
note: "Little-endian. Offsets are relative to this structure."
fields:
  - {"at": 0, "size": 8, "type": "u64", "name": "object id", "level": "observed"}
  - {"at": 8, "size": 4, "type": "u32", "name": "type", "value": "0xDA4A4039", "level": "observed"}
  - {"at": 12, "size": 4, "type": "u32", "name": "TileSizeInPixel", "value": 1024, "level": "observed"}
  - {"at": 16, "size": 4, "type": "f32", "name": "TileSizeInMeter", "value": 512.0, "level": "observed"}
  - {"at": 20, "size": 4, "type": "u32", "name": "TileCountPerSide", "value": 32, "level": "observed"}
```

The footer ends both checked patch Worlds; 32 × 512 m matches the 16,384 m open-world side. :observed

:::open[How is SpaceWorldComponent serialized?]
A six-byte bit-field group fits its measured size, but almost all values in both Worlds are zero, leaving field order unresolved. :unknown
:::
