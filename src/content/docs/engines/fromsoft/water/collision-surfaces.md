---
title: Water collision and region data
description: Water hit classes and why collision metadata is distinct from rendered water.
sources:
  - title: Paramdex
    url: https://github.com/soulsmods/Paramdex
  - title: SoulsFormatsNEXT MSB
    url: https://github.com/soulsmods/SoulsFormatsNEXT/tree/master/SoulsFormats/Formats/MSB
implementations:
  - name: primase collision metadata
    url: https://github.com/Kalmarv/primase/blob/main/worlds/fromsoft/src/collision.rs
---

Water-related collision surfaces have HitMtrlParam classes separate from the materials drawing water. Sekiro's
community names distinguish water puddles, walkable water, diveable water and swimming slopes; Elden Ring's names
include water and several poison or rot surfaces. :sourced[Paramdex]

| Game | Class | Community name | Confidence |
|---|---|---|---|
| Sekiro | 20 | Water Puddle | :sourced[Paramdex]{games="sekiro"} |
| Sekiro | 21 | Water (Walkable) | :sourced[Paramdex]{games="sekiro"} |
| Sekiro | 22 | Water (Diveable) | :sourced[Paramdex]{games="sekiro"} |
| Sekiro | 35 | Water Slope | :sourced[Paramdex]{games="sekiro"} |
| Sekiro | 36 | Water Slope (swimming) | :sourced[Paramdex]{games="sekiro"} |
| Elden Ring | 21 | Water | :sourced[Paramdex]{games="elden-ring"} |
| Elden Ring | 23 / 24 | Shallow Poison Swamp / Poison Swamp | :sourced[Paramdex]{games="elden-ring"} |
| Elden Ring | 46 / 49 | Scarlet Swamp / Lake of Rot | :sourced[Paramdex]{games="elden-ring"} |

The [fsnp shape-key mapping](/engines/fromsoft/collision/materials-and-bodies/) supplies these IDs per collision
triangle where the binding is unambiguous. :observed

:::open[How do water regions, collision and the rendered surface join?]
A class name does not establish water height, volume extent, flow, shader selection, damage application or the
runtime swimming predicate. Collision and region records alone do not yet establish the complete water system.
:::
