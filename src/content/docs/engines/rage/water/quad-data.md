---
title: Water quad data
description: World and island water files, authored surface rectangles, triangle types and wave/calming regions.
games: [gta-v]
sources:
  - title: CodeWalker
    url: https://github.com/dexyfex/CodeWalker
    note: Water configuration reference.
implementations:
  - name: primase worlds/gta (water.rs)
    url: https://github.com/Kalmarv/primase/blob/main/worlds/gta/src/read/water.rs
---

Water surfaces are authored in XML separately from map drawables. The world file is
`common.rpf/data/levels/gta5/water.xml`, with tuning in `common.rpf/data/watertune.xml`. Island water uses
`water_heistisland.xml` and `watertune_heistisland.xml` under the title update's corresponding common-data paths.
:observed

The documented world/island state selects one water file at a time. Loading Cayo Perico does not imply that both
files' surfaces are simultaneously active. :observed

Water quads are axis-aligned rectangles in east/north coordinates at a stored height `z`. The sea is at zero in the
inspected data; lakes, rivers and pools can lie above it. A quad also carries `a1`–`a4`, invisibility, limited-depth
and no-stencil flags. :observed

Number the corners as 0=`(minX,minY)`, 1=`(maxX,minY)`, 2=`(minX,maxY)`, 3=`(maxX,maxY)`. The type selects the
following footprint. :observed

| Type | Footprint | Confidence |
|---|---|---|
| 0 | Whole rectangle | :observed |
| 1 | Corners 0, 1, 2 | :observed |
| 2 | Corners 0, 3, 2 | :observed |
| 3 | Corners 1, 3, 2 | :observed |
| 4 | Corners 0, 1, 3 | :observed |

Separate calming quads store wave dampening over rectangles, while wave quads store amplitude and direction.
Tuning includes a `SpecularFalloff` value for the water shader. :observed

The [foam material effects](/engines/rage/materials/vertex-colours/) are a separate rendering feature; an effect
named `water_*foam` does not establish an additional quad-defined water body. :observed

:::open[How do all quad flags and corner values affect the final surface?]
The fields are retained as authored, but their complete CPU and shader interpretation is not established here.
:unknown
:::
