---
title: Decals, vertex opacity and overlay order
description: Distinct decal systems, stock opacity semantics and bounds-dependent overlay ordering.
games: [skate]
---

San Van uses several systems that can all look like decals: terrain layer-graph decals, environment decal
volumes, mesh decal materials and terrain layer blending. A measured scene contains 5,492 terrain decals,
9,381 environment volumes from 92 templates and 378 mesh-decal keys. Studio map materials reach mesh decals,
not all these systems. :observed

The inspected settings disable projected Frostbite decals (`Decal.Enable 0`) while enabling the surface-decal
grid. `VisualTerrain.DecalOffsetY` is `0.04` m; `DecalZPassDrawDistance` is 30. Surface-decal grid sizes are
1 m and 0.25 m with LargeDecalThreshold `2`. :observed

## Vertex opacity

Stock decal rows 1727 and 2718 read per-vertex opacity from **Color0.r**. Measured constant red values 0.25,
0.5 and 0.75 progressively increase visibility, independently of the other colour channels. Exact
`(0,0,0,0)` is a sentinel that draws fully opaque, so it differs from `(0,0,0,1)`. :observed

These rows use Half4 positions relative to an object origin. Around 100 m from that origin, half-float spacing
is 62.5 mm; distant local coordinates can therefore introduce visible steps in overlay geometry. :observed

## Draw order

The following controlled arrangements are measured in game on ReSkate 2.1.0-pre. They establish the stated
outcomes, rather than a general sorting algorithm. :observed

| Arrangement | Result | Confidence |
|---|---|---|
| Layers are sections of one MeshSet | Order varies between launches, stays the same across views within a launch | :observed |
| Separate coplanar objects with identical bounds | Order varies between launches | :observed |
| Separate objects, identical horizontal bounds, lifts 4/8/12 mm | Lowest layer draws last, deterministically in the measured runs | :observed |
| Bounds offset horizontally by 1 m | Back-to-front order by bounds distance; the small lifts do not decide it | :observed |
| FrontToBackSortEnable or SortBySystemOrderUserSlotEnable changed | No measured effect on these arrangements | :observed |

Sorting transparent objects by coarse bounds depth explains these outcomes, but the actual sort-key construction
is not decoded. :inferred

Studio's cell cuts can split sibling overlay ranks into different bounds, causing whole-layer changes with view
angle even when the unsplit input objects share bounds. :observed

San Van also contains 489 placed EffectReferenceObjectData instances in the measured scene. This count does
not decode the effect graphs behind those references. :observed
