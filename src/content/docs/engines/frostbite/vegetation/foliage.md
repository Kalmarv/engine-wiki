---
title: Foliage instances and LOD tiers
description: Measured stock vegetation and the Studio foliage material domain.
games: [skate]
---

The measured San Van scene has 78,067 placed vegetation instances. Trees use six LOD tiers and grass uses two.
These instance counts are not equivalent to the number of MeshSets, member meshes or spatial cull ids.
:observed

Studio's `foliage` domain clones a Kentia-palm Cards donor material. This identifies an available material route;
it does not establish that the compiler reproduces all stock vegetation placement, wind or culling systems.
:observed

Foliage meshes converted from Sekiro render black in game in the `foliage` domain, with or without a normal map,
and lit in the `surface` domain; trees converted from GTA V render lit in the `foliage` domain.
:observed[three-way in-game comparison]

:::open[What does the foliage domain need that the black meshes lack?]
The same meshes preview lit outside the game, which points at the domain's shading. :inferred Which vertex or
material inputs the foliage programs read, and which of them the black meshes are missing, is not established. :unknown
:::

:::open[How does stock wind deformation depend on material and vertex data?]
The measured instance and LOD census does not establish the deformation inputs or simulation rules. :unknown
:::
