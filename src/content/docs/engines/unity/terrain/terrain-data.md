---
title: Terrain
description: "The Terrain component and its TerrainData: heightmap quantisation, holes, splat layers and alphamaps, tree prototypes and instances, and Sledding Game's terrains."
games: [sledding]
sources:
  - title: Unity scripting reference, TerrainData
    url: https://docs.unity3d.com/ScriptReference/TerrainData.html
    note: GetHeight and the splat and tree structures
implementations:
  - name: unity-formats (terrain.rs)
    url: https://github.com/Kalmarv/unity-formats/blob/main/src/terrain.rs
---

A **Terrain** (class 218) component in a scene points at a **TerrainData** (class 156) in a shared asset file and adds the
drawing settings. The data holds the heightmap, the splat layers with their blend maps, and the trees. Of the games here only
Sledding Game uses terrain; SkateBIRD's scenes have none. :observed{games="sledding"}

## Heightmap

`m_Heightmap` holds `m_Resolution` × `m_Resolution` samples, row `z` then column `x`, as 16-bit integers. A sample is 0 to
32,766 for 0 to 1 of the terrain's height, so `TerrainData.GetHeight` is `h / 32766 × size.y` metres. Samples are
`m_Scale.x` and `m_Scale.z` metres apart from the terrain's position, so the terrain is `(resolution − 1) × scale` wide.
:sourced[Unity scripting reference]

The heightmap also stores two precomputed arrays for drawing, `m_PrecomputedError` (1,365 entries) and
`m_MinMaxPatchHeights` (2,730), over `m_Levels` = 5 levels. :proven{games="sledding"} **Holes** are one byte per cell, `(resolution − 1)²` of them, 0 meaning a hole; a
terrain without holes stores none. :observed{games="sledding"}

## Splat layers

`m_SplatDatabase` stores the terrain layers (`m_TerrainLayers`, references to **TerrainLayer** objects), the blend maps
(`m_AlphaTextures`, textures of RGBA weights, four layers per texel, texel row 0 at z = 0 as Unity stores rows), the blend map
resolution (`m_AlphamapResolution`) and a base map resolution. :observed{games="sledding"}

A **TerrainLayer** (diffuse, normal and mask textures) stores the tile size and offset, a specular colour, metallic,
smoothness, a normal scale, and a min/max remap of the diffuse and the mask channels. :observed{games="sledding"}

## Trees

The tree prototypes and instances are in the data's detail database (`m_DetailDatabase`): `m_TreePrototypes` (each a prefab)
and `m_TreeInstances`. An instance has a position as 0 to 1 of the terrain's size, a width and a height scale, a rotation
about y in radians, a colour (32 bits), and its prototype index. Its world matrix is
`T(terrain position + position × size) · Ry(rotation) · S(width, height, width)`. :observed{games="sledding"}

## Sledding Game's terrains

In build 26054124 the mountain scene (`level1`) draws 25 terrains and has 21,147 terrain tree renderers. :observed{games="sledding"}
The rest of this section was measured on build 25351629, where the mountain scene (`level1`) has nine `Terrain` components, each
with a TerrainData in `sharedassets1.assets`. :proven{games="sledding"}

| Property | Value, for all nine | Confidence |
|---|---|---|
| heightmap | 513 × 513 samples (263,169), scale 1.953125 m × 600 m × 1.953125 m, so 1,000 m wide | :proven{games="sledding"} |
| holes | none | :proven{games="sledding"} |
| splat layers | 3, one blend map of 512 × 512 | :proven{games="sledding"} |
| tree prototypes | 3 | :proven{games="sledding"} |
| detail prototypes (grass) | none | :proven{games="sledding"} |

The nine terrains hold 1,191, 1,742, 991, 764, 1,132, 1,787, 2,575, 1,437 and 702 trees: 12,321 in all.
:proven{games="sledding"} Together they tile a 3 km × 3 km mountain, by their 1,000 m sides and the grid of the scene.
:inferred

Every `Terrain` component states the same drawing settings: draw heightmap, instancing off, trees and foliage drawn to
1,500 m, a heightmap pixel error of 20 and a splat map distance of 1,000 m. :proven{games="sledding"}

The terrain collides through the heightfield; a `TerrainCollider` can point at its own TerrainData, whose heights can differ
from the drawn ones. [Colliders](/engines/unity/collision/colliders/) describes the rule. :observed{games="sledding"}

:::open[The terrain shader]
The terrain material's shader and how the three layers blend with the base map in Sledding Game's URP terrain shader are not
described here.
:::
