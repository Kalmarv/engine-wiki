---
title: Grass definitions and pivots
description: GrassTypeParam resource references and pivot-driven vegetation deformation.
sources:
  - title: Paramdex
    url: https://github.com/soulsmods/Paramdex/blob/master/ER/Defs/GrassTypeParam.xml
    note: GRASS_TYPE_PARAM_ST field definitions
implementations:
  - name: fromsoft-formats (param.rs)
    url: https://github.com/Kalmarv/fromsoft-formats/blob/main/src/param.rs
---

Vegetation includes ordinary FLVER meshes with pivot attributes as well as Elden Ring's separate
[SpeedTree streams](/engines/fromsoft/vegetation/speedtree/). Pivot members give a deformation origin in model
space, rather than another texture-coordinate set. :observed

Sekiro pivot families include `Translucency_Pivot`, `Pivot_Parent` and `snake_Pivot`. Elden Ring grass, tree and
`Vesitation` families also store Half4 pivots, transformed by their vertex programs as positions.
See [vertex formats](/engines/fromsoft/geometry/vertex-formats/). :observed

## Elden Ring

### Grass type references

Map-part grass configuration names six GrassTypeParam row IDs. Those rows name the detailed and simplified
models and flat or billboard textures, with density, spacing and LOD range. Reading references in m10_00_00_00,
m12_02_00_00 and m60_39_54_00 checks this resolution against `regulation.bin`; it does not establish blade placement.
:observed{games="elden-ring"}

```layout
title: GrassTypeParam resource fields
size: 276
games: [elden-ring]
note: Selected fields of the Paramdex layout; unlisted bytes are not described here. Names are fixed-width UTF-16.
fields:
  - {at: 0, size: 2, type: u16, name: LOD range, level: sourced}
  - {at: 8, size: 4, type: f32, name: base density, level: sourced}
  - {at: 12, size: 32, type: UTF-16, name: model0 name, level: sourced}
  - {at: 44, size: 64, type: UTF-16, name: flat texture name, level: sourced}
  - {at: 108, size: 64, type: UTF-16, name: billboard texture name, level: sourced}
  - {at: 204, size: 4, type: f32, name: spacing, level: sourced}
  - {at: 212, size: 32, type: UTF-16, name: simple model name, level: sourced}
  - {at: 244, size: 32, type: UTF-16, name: model1 name, level: sourced}
```

Empty resource-name fields denote no named resource. The resource-field layout requires at least 276 bytes;
this partial description does not assign meanings to the intervening fields or any appended bytes.
:sourced[Paramdex]{games="elden-ring"}

:::open[How are individual grass blades placed and animated?]
Density, spacing and row references do not specify a demonstrated placement algorithm. The sampled maps establish
which resources are named, not the runtime distribution, random seed, interaction response or complete wind model.
:unknown{games="elden-ring"}
:::
