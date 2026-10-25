---
title: Map areas and parent tiles
description: Sekiro area names and Elden Ring's nested open-world tile coordinates.
implementations:
  - name: primase Elden Ring rules
    url: https://github.com/Kalmarv/primase/blob/main/worlds/fromsoft/src/elden/mod.rs
---

Maps have names such as `m11_01_00_00`; layout files live at `map/mapstudio/<map>.msb.dcx`, with resources under
`map/<map>/`. :observed

| Sekiro map prefix | Area | Confidence |
|---|---|---|
| `m11_00` | Ashina Outskirts | :observed{games="sekiro"} |
| `m11_01` | Ashina Castle | :observed{games="sekiro"} |
| `m11_02` | Ashina Reservoir | :observed{games="sekiro"} |
| `m13_00` | Abandoned Dungeon | :observed{games="sekiro"} |

These names are matched through collision map-name IDs and location-message entries. :observed{games="sekiro"}

## Open-world grid

:only[elden-ring] `m60` and `m61` use 256 m level-0 tiles. A tile `mAA_XX_ZZ_00` has parents at levels 1 and 2,
with indices `(XX >> L, ZZ >> L)` and side lengths 512 m and 1,024 m. Larger assets belonging to a small tile can
be placed in a parent layout, with names prefixed by the small tile's name. :observed{games="elden-ring"}

The small tile centre's coordinate in a level-`L` parent's frame, independently for X and Z, is
`(i - (p << L)) × 256 + 128 - (256 << L)/2`, where `i` is the small index and `p = i >> L`.
:observed{games="elden-ring"}

For `m60_39_54_00`, the level-1 parent is `m60_19_27_01`, with centre offset `(128,-128)` m in X/Z. The level-2
parent is `m60_09_13_02`, with offset `(384,128)` m. :observed{games="elden-ring"}

Parent tiles need not contain collision: `m60_22_22_01` has three map pieces, no collision part and no corresponding
high-resolution map collision binder. :observed{games="elden-ring"}

:::open[When does each tile become resident or visible?]
Nested layout coordinates establish placement relationships. They do not establish streaming radii, hysteresis,
parent-child draw overlap or the runtime residency budget.
:::
