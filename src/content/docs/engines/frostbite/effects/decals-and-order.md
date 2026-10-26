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

## How stock content layers surfaces

Decal-class programs test depth GreaterEqual without writing it, use a hardware depth bias of 200 with
slope-scaled bias 0.1, and draw only where stencil bit `0x08` is set; opaque programs and the depth prepass write
stencil `0xfe`. A decal therefore draws pulled toward the camera, and only over an opaque surface that has marked
the stencil. :observed A blended, decal-class material with nothing opaque behind it does not appear, which
matches the observed disappearance of alpha-blend world geometry. :inferred The state decode is under
[render-state bytes](/engines/frostbite/shaders/bindings-and-input-layouts/#render-state-bytes).

San Van uses two arrangements. :observed

- **Overlay sections.** Blended overlays, stickers and grime are extra sections in the same MeshSet as their base,
  on decal-class programs: for example tuples (1088, 2077) prop trim decals, (1727, 2718) the HVAC decal row,
  (230, 1934) stickers and (235, 616) `default_decalmesh_atlas`. They are coincident with the base: of 852,043
  overlay triangles, 215,236 lie exactly on it and the median offset is +0.48 mm. They have no depth or shadow
  twin section; the overlay sections are absent from the twins in 2,618 of 3,001 LODs. :observed
- **Decal meshes.** Plot `*_decal_*` meshes are mostly ordinary depth-writing programs, for example
  (438, 1466, 3220, 3347): 1466 tests GreaterEqual and writes, 3220 tests Equal after the prepass. They float above
  the surface: matched against the opaque surface of the same cell StaticModelGroup over 80,033 of 99,670
  triangles, the offset is p25 2.3, median 4.1 and p75 7.7 mm (p5 0.94, p95 16.5 mm), never exactly zero. Stacked
  decal sections in one MeshSet differ by about 6 mm. :observed

No measured stock layer relies on a coplanar depth-writing surface. :observed

Exactly coplanar opaque surfaces still occur. Over 4,225,065 opaque triangles of six cells, 11,003 of 652,283
same-facing opaque overlaps are exactly zero apart. 4,528 directed pairs (2,264 unordered) are bit-identical copies,
all `cmn_veg_needlepalm_a` section 0 against section 1 under different keys. 6,475 directed pairs (6,191 unordered)
are coplanar with different triangulation, 6,280 of them `buildinggeneratorv2pg` pieces (different keys in 6,434
pairs, the same key in 41); both sides of every such pair write depth. :observed

In game, two bit-identical opaque copies of the same triangles do not flicker, but which material shows differs
between builds: at equal depth the later draw wins. A re-triangulated coplanar copy fights in bands. :observed

## Stock program properties

| Programs | Property | Confidence |
|---|---|---|
| 1444 (row 1444/3612) | Stock decal state; Float3 positions; no shadow section | :observed |
| 825, 1891, 3096 (alpha-tested cutout row) | Half4 positions relative to the object origin: 3.9 mm steps at 4–8 m, 31 mm at 32–64 m | :observed |
| 819 | Equal depth test after the prepass | :observed |
| 3560 | Depth prepass; writes stencil `0xfe`, the mark decals test | :observed |
| 1262 | Shadow pass, depth bias −10 and slope −4 | :observed |

The cutout row's Half4 positions mean that a cutout layer a few millimetres over its base can round onto or below
it. :inferred

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
| Separate objects with identical world bounds (exact ties, or origins 1 mm apart) | Order changes with camera position and between level loads; stable over time from a fixed viewpoint | :observed |
| Separate objects, identical horizontal bounds, lifts 4/8/12 mm | Lowest layer draws last, deterministically in the measured runs | :observed |
| Bounds offset horizontally by 1 m | Back-to-front order by bounds distance; the small lifts do not decide it | :observed |
| Bounds padded 1 m apart behind the surface along its normal | Nearest-bounds layer on top in 20 of 20 panels (two levels, ten viewpoints at 7–80 m), and one order across three launches and two builds | :observed |
| Bounds 2 m apart along the normal with one common origin | Nearest-bounds layer on top in 9 of 9 views; identical bounds with origins 1 m apart do not follow the origins | :observed |
| FrontToBackSortEnable or SortBySystemOrderUserSlotEnable changed | No measured effect on these arrangements | :observed |

Separate decal-class objects are ordered by their bounds, not their origins. :observed Sorting transparent
objects by coarse bounds depth explains these outcomes, but the actual sort-key construction is not decoded.
:inferred

:::open[Do millimetre lifts give overlays a stable order?]
One measurement finds layers with identical horizontal bounds lifted 4, 8 and 12 mm drawing in a deterministic
order. A later fixture series finds identical or near-identical bounds changing order as the camera moves, and
treats millimetre lifts as giving no order. :observed Whether the lifted layers' bounds differed enough to sort
in the first measurement is not established. :unknown
:::

With `Mesh.ForceLod`, a decal over a base whose LOD1 deviates by ±20 mm shows the base through 0.17 of its area
at LOD1 and 0.42 at LOD2, against 0.04 (grid lines only) at LOD0: overlays coincident with LOD0 separate from
coarser LODs of their base. :observed

Studio's cell cuts can split sibling overlay ranks into different bounds, causing whole-layer changes with view
angle even when the unsplit input objects share bounds. :observed

San Van also contains 489 placed EffectReferenceObjectData instances in the measured scene. This count does
not decode the effect graphs behind those references. :observed
