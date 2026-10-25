---
title: Terrain and layer graphs
description: San Vansterdam's native terrain layers and their distinction from mesh materials.
games: [skate]
---

San Van's ground uses Frostbite TerrainData with 36 layers and a cooked layer-graph virtual texture.
Its 5,492 measured terrain decals belong to this native terrain system, separately from mesh decal materials
and environment decal volumes. :observed

Terrain/compositor parameter depots can use `<asset>.layergraphs_shaderblockdepot` names and the same depot
container as level materials. The measured depot samples reproduce byte for byte, but that does not establish
the terrain graph or virtual-texture page layout. :observed

Studio's mesh-based surface materials do not provide an established authoring route for stock TerrainData.
Replacing a ground surface with a mesh is therefore a different representation from the native terrain system.
:observed

:::open[How are the terrain graph and virtual-texture pages encoded?]
Layer count and cooked-system identity are measured; the complete graph, page tables and blend evaluation are
not decoded here. :unknown
:::
