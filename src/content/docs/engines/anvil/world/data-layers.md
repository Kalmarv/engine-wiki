---
title: "DataLayers and world state"
description: "Layer actions, active-layer state and reset buffers."
games: ["riders-republic"]
sources:
  - title: RRAssetStudio v3
    url: https://www.nexusmods.com/ridersrepublic/mods/5
    note: Independent Riders Republic resource reader.
implementations:
  - name: "primase worlds/anvil (entity.rs)"
    url: https://github.com/Kalmarv/primase/blob/main/worlds/anvil/src/read/entity.rs
---

DataLayers distinguish event, season and user-content layouts on the same ground. Entities and groups contain DataLayerFilters. In the measured campus cell, distinct event layouts explain overlapping ramps and bowls; grids do not separate those states. :observed

DataLayer (`0x41813744`) has a two-byte body in the checked DataPC population, without member lists. Layer-owned GridCellDataBlocks instead carry a layer ClassID as their final key. :observed

```layout
title: "DataLayerAction (25 bytes, \u00c3\u2014k)"
size: 25
games: [riders-republic]
note: "Little-endian. Offsets are relative to this structure."
fields:
  - {"at": 0, "size": 8, "type": "u64", "name": "id", "value": "0", "level": "observed"}
  - {"at": 8, "size": 4, "type": "u32", "name": "type", "value": "0xE31593E1", "level": "observed"}
  - {"at": 12, "size": 1, "type": "u8", "name": "tag", "value": "00", "level": "observed"}
  - {"at": 13, "size": 8, "type": "u64", "name": "DataLayer", "level": "observed", "note": "a DataLayer 0x41813744's ClassID"}
  - {"at": 21, "size": 4, "type": "u32", "name": "action", "level": "observed", "note": "0 or 1"}
```

| Action | Interpretation | Confidence |
|---|---|---|
| 0 | Entity present while layer enabled | :inferred |
| 1 | Entity present while layer disabled | :inferred |

That polarity fits 360 zero actions and 47 one actions among 556 placeable campus-cell Entities: event structures use zero, replaced ordinary furniture uses one. This is content evidence rather than execution of the layer manager. :observed

The base and patch USNAT WorldDataLayerManagers name `EVE_BMX_Back2School` in their serialized active-layer lists. An assumption that all event layers initially start off does not follow from the data. :observed

```layout
title: "GameStateData tail"
size: "25 + L1 + L2 bytes"
games: [riders-republic]
note: "Little-endian. Offsets are relative to this structure."
fields:
  - {"at": 0, "size": 1, "type": "u8", "name": "tag", "value": "00", "level": "observed"}
  - {"at": 1, "size": 8, "type": "u64", "name": "id", "level": "observed"}
  - {"at": 9, "size": 4, "type": "u32", "name": "type", "value": "0x7313743E", "level": "observed"}
  - {"at": 13, "size": 4, "type": "u32", "name": "PropertyCount", "level": "observed", "note": "GameStateData.PropertyCount (registry u32): 9 273,240, 8 94,437, 7 88,147, 10 10,261, 13 9,777, 3 9,038"}
  - {"at": 17, "size": 4, "type": "u32", "name": "DescBuffer length L1", "level": "observed", "note": "GameStateData.DescBuffer is an array of bytes: its length. L1 = 130 273,240, 116 94,437, 102 88,147, 144 10,261"}
  - {"at": 21, "size": "L1", "type": "bytes", "name": "DescBuffer", "level": "observed", "note": "the property descriptors (one record per property: the length is a multiple of PropertyCount); the records are not decoded"}
  - {"at": "21+L1", "size": 4, "type": "u32", "name": "DataBuffer length L2", "level": "observed", "note": "GameStateData.DataBuffer is an array of bytes: its length, 169 273,215, 168 94,437, 167 88,105, 170 10,237"}
  - {"at": "25+L1", "size": "L2", "type": "bytes", "name": "DataBuffer", "level": "observed"}
```

ResetData is null or inline GameStateData. Registry names identify PropertyCount, DescBuffer and DataBuffer; 490,803 measured Entity tails end exactly at these buffers. Descriptor length fits `4 + 14 × PropertyCount` in checked profiles; internal descriptor semantics remain unresolved. :observed

:::open[Which layers are active in each mode and save state?]
Stored lists do not establish all live transition logic. Event-name prefixes alone cannot define the default playable world. :unknown
:::
