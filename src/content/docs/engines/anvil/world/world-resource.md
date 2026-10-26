---
title: "World resource and managers"
description: "World configuration, component list and TerrainParam footer."
games: ["riders-republic", "shaun-white-skateboarding"]
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
  - {"at": 5, "size": "n·(57+2w)", "type": "bytes", "name": "GridDescriptions", "level": "observed", "note": "the GridDescription box"}
  - {"at": "5+n(57+2w)", "size": "var", "type": "fields", "name": "World's stored fields", "level": "observed", "note": "Manager links and configuration objects in registry order; detailed below."}
  - {"at": "var", "size": 4, "type": "u32", "name": "world component count c", "level": "observed", "note": "47 USNAT, 21 WhiteRoom; not a field of World's class list (written by its own serializer)"}
  - {"at": "var", "size": "var", "type": "objects", "name": "world components", "level": "observed", "note": "Pointers to WorldComponent-derived classes; tag 04 normally, 00 for USNAT TimeOfDayManager."}
  - {"at": "var", "size": 83, "type": "object", "name": "SpaceWorldComponent", "level": "unknown", "note": "83-byte observed frame; internal 36-byte SpaceSection field order unresolved."}
  - {"at": "end-24", "size": 24, "type": "object", "name": "TerrainParam", "level": "observed", "note": "Embedded type 0xDA4A4039; last 24 bytes of both checked patch Worlds."}
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

## World roots in Shaun White Skateboarding

:only[shaun-white-skateboarding]

Each world of Shaun White Skateboarding is stored in its own forge, not in a partition grid. Entry 1 of 24 forges is that forge's world root, named for the level, and its object id is the world's id. :observed{games="shaun-white-skateboarding"}[the 33 forges' first objects]

| Forge | World root | World id | Cell entries |
|---|---|---|---:|
| `DataPC_01.forge` | `01` | `0x47AF3893` | 253 |
| `DataPC_02.forge` | `02` | `0x47AF38BE` | 300 |
| `DataPC_03.forge` | `03` | `0x47AF38E9` | 209 |
| `DataPC_04.forge` | `04` | `0x47AF3914` | 222 |
| `DataPC_05.forge` | `05` | `0x817B7E55` | 112 |
| `DataPC_06.forge` | `06` | `0x47AF396A` | 389 |
| `DataPC_04_Stronghold.forge` | `04_Stronghold` | `0x8B56B7D1` | 34 |
| `DataPC_SW.forge` | `SW` | `0x954D44AF` | 8 |
| `DataPC_01_A_FYM.forge` | `01_A_FYM` | `0x9FC586C0` | 6 |
| `DataPC_01_B_FYM.forge` | `01_B_FYM` | `0x47AF39EB` | 5 |
| `DataPC_02_FYM.forge` | `02_FYM` | `0x47AF3A16` | 3 |
| `DataPC_03_FYM.forge` | `03_FYM` | `0x47AF3A41` | 5 |
| `DataPC_04_FYM.forge` | `04_FYM` | `0x47AF3A6C` | 3 |
| `DataPC_02_Multi.forge` | `02_Multi` | `0x84798472` | 5 |
| `DataPC_03_Multi.forge` | `03_multi` | `0x8CC64B8E` | 20 |
| `DataPC_04_Multi.forge` | `04_Multi` | `0x8F9A90C4` | 6 |
| `DataPC_05_Multi.forge` | `05_MULTI` | `0x89FC9A5A` | 4 |
| `DataPC_03_Robot_01.forge` | `03_Robot_01` | `0x9E0AB2DF` | 8 |
| `DataPC_03_Robot_02.forge` | `03_Robot_02` | `0x9E0AB2FF` | 7 |
| `DataPC_04_Robot_01.forge` | `04_Robot_01` | `0x9E0AB31F` | 7 |
| `DataPC_04_Robot_02.forge` | `04_Robot_02` | `0x9E0AB33F` | 6 |
| `DataPC_05_Robot_01.forge` | `05_Robot_01` | `0x9E0AB35F` | 6 |
| `DataPC_Customization.forge` | `Customization` | `0x50C54007` | 6 |
| `DataPC_Main_Menu.forge` | `Main_Menu` | `0x8FE659E3` | 0 |

Each of those forges has its own world root with its own world id, so none of the variant forges is a bare overlay on a base level. :observed
The cell entries of all forges add up to 1,624. The remaining forges, `DataPC.forge`, `DataPC_extra.forge` and seven `DataPC_*CustomizationData.forge`, hold bootstrap, interface and character data rather than a world. :observed

The ids of levels 01 to 04 and 06 step by `0x2B`; 05 is a different id, and the id `0x47AF393F` that the step would give is not a world root. :observed
