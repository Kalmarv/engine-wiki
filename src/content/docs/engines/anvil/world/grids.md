---
title: "World grids and cell listings"
description: "GridLayouts, hierarchical partitions and resource listings."
games: ["riders-republic"]
sources:
  - title: RRAssetStudio v3
    url: https://www.nexusmods.com/ridersrepublic/mods/5
    note: Independent Riders Republic resource reader.
implementations:
  - name: "primase worlds/anvil (grid.rs)"
    url: https://github.com/Kalmarv/primase/blob/main/worlds/anvil/src/read/grid.rs
---

A World lists GridDescriptions pairing GridLayouts with GridPartition references. Each partition stores every cell level; an occupied cell names a GridCellDataBlock listing associated resources. All eight partitions and all 66,359 blocks in the six-archive census consume exactly to their ends. :proven

| USNAT grid | Finest cell side | Finest dimension | Levels / cells | Confidence |
|---|---:|---:|---|---|
| TerrainWorldSmall | 128 m | 128 × 128 | 8 / 21,845 | :observed |
| ShortRange | 128 m | 128 × 128 | 8 / 21,845 | :observed |
| LongRange | 512 m | 32 × 32 | 6 / 1,365 | :observed |

All three have lower-left `(-8192, -8192, 0)` and span 16,384 m per side. WhiteRoom's populated grid has 32 m cells, corner `(-128, -128, 0)` and finest dimension eight. :observed

```layout
title: "GridDescription (embedded, 57 + 2w bytes, xn)"
size: "57 + 2w bytes"
games: [riders-republic]
note: "Little-endian. Offsets are relative to this structure."
fields:
  - {"at": 0, "size": 8, "type": "u64", "name": "id", "level": "observed"}
  - {"at": 8, "size": 4, "type": "u32", "name": "type", "value": "0xAFE5F9B4", "level": "observed"}
  - {"at": 12, "size": 8, "type": "u64", "name": "GridLayout id", "value": "0", "level": "observed"}
  - {"at": 20, "size": 4, "type": "u32", "name": "GridLayout type", "value": "0x7DB083ED", "level": "observed"}
  - {"at": 24, "size": "2·w", "type": "i16xw", "name": "DefaultLoadingDistances", "level": "observed", "note": "GridLayout.DefaultLoadingDistances (registry kind 0x0297: fixed array, element 0x05, count 4): USNAT patch (640, 640, 640, 640), (256, 256, 512, 256), (4096, 4096, 5120, 5120); base adds a fifth (640, 256, 4096); WhiteRoom (0, 0, 0, 0[, 95]) and 95s. Units by reading metres"}
  - {"at": "24+2w", "size": 4, "type": "i32", "name": "CellSize", "level": "observed", "note": "GridLayout.CellSize (registry i32): 128, 128, 512 in USNAT; 32 in the WhiteRoom grid that has cells"}
  - {"at": "28+2w", "size": 12, "type": "i32·3", "name": "BottomLeftX, BottomLeftY, BottomLeftZ", "level": "observed", "note": "GridLayout.BottomLeftX/Y/Z (registry i32 each): (-8192, -8192, 0) in USNAT, (-128, -128, 0) in WhiteRoom"}
  - {"at": "40+2w", "size": 4, "type": "i32", "name": "GridDimensionLevel0", "level": "observed", "note": "GridLayout.GridDimensionLevel0 (registry i32): 128, 128, 32 in USNAT; 8 in WhiteRoom"}
  - {"at": "44+2w", "size": 3, "type": "bool x3", "name": "IsSingleLevelGrid, IgnoreCustomLoadingRange, IgnoreRegionLayoutLoadingRange", "level": "observed", "note": "three plain bools (registry kind 0, store 0x80, 0x84, 0x88), 0 0 0 in all 12 grids (so their order is the record order, untested)"}
  - {"at": "47+2w", "size": 10, "type": "ref", "name": "Grid", "level": "observed", "note": "GridDescription.Grid: a reference to the grid (SpatialTopology: a GridPartition), or none (03 + 9 zeros)"}
```

DefaultLoadingDistances is a fixed array without a stored count: five u16 values in base Worlds and four in patch Worlds, measured on all 12 layouts. The runtime descriptor names four elements; an older writing class version explains the base profile but is inferred. The three bools are always zero, so their individual order follows metadata without a value-based discriminator. :observed :inferred

```layout
title: "GridPartition body"
size: "var"
games: [riders-republic]
note: "Little-endian. Offsets are relative to this structure."
fields:
  - {"at": 0, "size": 1, "type": "u8", "name": "tag", "value": "01", "level": "observed"}
  - {"at": 1, "size": 4, "type": "u32", "name": "level count", "level": "observed", "note": "8 in the open world's ShortRange and TerrainWorldSmall"}
  - {"at": 5, "size": 4, "type": "u32", "name": "cell count c", "level": "observed", "note": "the levels' squared dimensions summed (21,845 for 8 levels from 128)"}
  - {"at": 9, "size": "21·c", "type": "bytes", "name": "cells", "level": "observed", "note": "the GridCell box; a cell's number is its position: level 0 first, row by row from the bottom-left (the notes' best fit)"}
  - {"at": "9+21c", "size": 4, "type": "u32", "name": "zero", "value": "0", "level": "unknown", "note": "Stored bytes; meaning is not established."}
```

```layout
title: "GridCell (21 bytes, \u00d7c)"
size: 21
games: [riders-republic]
note: "Little-endian. Offsets are relative to this structure."
fields:
  - {"at": 0, "size": 8, "type": "u64", "name": "id", "value": "0", "level": "observed"}
  - {"at": 8, "size": 4, "type": "u32", "name": "type", "value": "0x3435AD40", "level": "observed"}
  - {"at": 12, "size": 1, "type": "u8", "name": "tag", "value": "00", "level": "observed"}
  - {"at": 13, "size": 8, "type": "u64", "name": "data block", "level": "observed", "note": "a GridCellDataBlock's ClassID, or 0: an empty cell"}
```
```layout
title: "GridCellDataBlock body"
size: "17 + 10n bytes"
games: [riders-republic]
note: "Little-endian. Offsets are relative to this structure."
fields:
  - {"at": 0, "size": 1, "type": "u8", "name": "tag", "value": "01", "level": "observed"}
  - {"at": 1, "size": 4, "type": "u32", "name": "object count n", "level": "observed"}
  - {"at": 5, "size": "10·n", "type": "ref·n", "name": "objects", "level": "observed", "note": "Entities, EntityGroups, GIDynResources and others, in stored order"}
  - {"at": "5+10n", "size": 4, "type": "u32", "name": "NumberOfObjectsToActivate", "level": "observed", "note": "GridCellDataBlock.NumberOfObjectsToActivate (registry u32): n less the references to GIDynResources, on every block measured"}
  - {"at": "9+10n", "size": 8, "type": "u64", "name": "key", "level": "observed", "note": "its cell's number (equal to its position in the GridPartition), or a DataLayer's ClassID"}
```

Cells are finest-level-first, then successively coarser levels. Within each level they are row-major: after subtracting the level start, `x = k mod dimension`, `y = k div dimension`. This order gives overlapping world bounds on 7,769 of 7,803 sampled listings, far more than the examined alternatives. :observed

A resource may overlap a cell without its origin lying inside it and can appear in multiple listings. Coarser levels contain ordinary buildings and rivers as well as distant proxies; finest cells alone are not a complete spatial query. :observed

The 44,320-block USNAT census resolves 644,541 reference occurrences: 594,255 Entity, 30,000 EntityGroup, 16,384 GIDynResource, 3,901 ProceduralEntityGroup and one ProxyTextures. These are references, not unique resources. :observed

A block's final key is normally its cell index; layer-owned blocks instead carry a DataLayer ClassID. The preceding word equals count minus GIDynResource references on all 44,320 checked USNAT blocks. :proven[USNAT block corpus]

:::open[Why do 34 sampled bounds miss their cells?]
The remaining non-overlapping listings have not been explained; the overlap relationship is not a universal invariant. :unknown
:::
