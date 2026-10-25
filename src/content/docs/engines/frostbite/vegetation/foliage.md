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

:::open[How does stock wind deformation depend on material and vertex data?]
The measured instance and LOD census does not establish the deformation inputs or simulation rules. :unknown
:::
