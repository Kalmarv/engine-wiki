---
title: Collision materials and object bodies
description: fsnp material lookup, ambiguous triangle rows, hit classes and rigid-body shapes.
sources:
  - title: Paramdex
    url: https://github.com/soulsmods/Paramdex
  - title: Smithbox
    url: https://github.com/vawser/Smithbox
  - title: Havoc
    url: https://github.com/PredatorCZ/Havoc
implementations:
  - name: primase collision reader
    url: https://github.com/Kalmarv/primase/blob/main/worlds/fromsoft/src/collision.rs
---

Collision appearance and behavior are separate from render materials. Compressed meshes attach HitMtrlParam IDs to
shape keys through `fsnp` tables; object binders also contain convex and capsule bodies with body-local poses.
:observed

## Material lookup

The compressed shape's `pParam` references `triangleDataArray` and `primitiveDataArray`. A triangle-data row's
`primitiveDataIndex` selects primitive data whose `materialNameData` supplies the material ID. The shape's
`triangleIndexToShapeKey` table associates keys with rows. All-ones keys are invalid entries. :observed

The triangle-data table can be longer than the key table. The bytes do not establish where the extra, unkeyed rows
belong, and comparing vertex IDs does not uniquely resolve their placement. If there are `b` extra rows, the row for
key-table index `i` can lie in `i..=i+b`; differing candidate materials leave that key's material unresolved.
:observed

:::open[How are unkeyed fsnp rows positioned?]
A vertex-ID heuristic can select one assignment, but a row of new vertex IDs fits multiple triangles. Such an
assignment is not independent proof. A runtime shape-key-to-material query or another discriminating observation is
needed where candidate rows disagree.
:::

## Hit classes

Community row names distinguish surface families, with different numbering in the two games.
:sourced[Paramdex]

| Class | Sekiro | Elden Ring | Confidence |
|---|---|---|---|
| 0 | — | None | :sourced[Smithbox] |
| 1 | Stone | Stock | :sourced[Smithbox] |
| 2 | — | Rock | :sourced[Smithbox] |
| 3 | Dirt | Sand | :sourced[Smithbox] |
| 4 | Wood | Wood | :sourced[Smithbox] |
| 5 | Grass | Dirt | :sourced[Smithbox] |
| 11 | Iron | Iron Grate | :sourced[Smithbox] |
| 21 | Water (Walkable) | Water | :sourced[Smithbox] |
| 22 | Water (Diveable) | — | :sourced[Smithbox] |
| 29 | None | — | :sourced[Smithbox] |
| 36 | Water Slope (swimming) | — | :sourced[Smithbox] |

Reducing an ID modulo 100 groups repeated class numbers; treating the higher digits as flags is an inference, not a
decoded bitfield. :inferred A class named “None” does not by itself establish an invisible blocker in another game.
:inferred

## Object and asset collision

:only[sekiro] An object binder can hold `<object>.hkx` and a broken-state `<object>_1.hkx`. Examined bodies include
compressed meshes, `hknpBoxShape`, `hknpConvexPolytopeShape` and `hknpCapsuleShape`; body poses are in object space.
In Ashina Castle, 207 of 222 object models have their own collision. :observed{games="sekiro"}

:only[elden-ring] An asset `AEGnnn_mmm` has collision in
`asset/aeg/aegnnn/aegnnn_mmm_l.geomhkxbnd.dcx`, with a high-resolution `_h` counterpart for a subset of assets.
:observed{games="elden-ring"}

Stored convex cores contain vertices, planes, faces and a convex radius where that shape class supplies them.
`hknpConvexShape` stores vertices without explicit faces or planes; a sphere stores one centre vertex and its radius.
:observed The radius describes a rounded convex shape. Intersecting outward-shifted planes constructs an
approximation and does not reproduce its rounded edges. :inferred

Independent Havoc comparisons cover the sampled Sekiro bodies' names, motion values, poses, convex-core fields and
capsule segments bit for bit. They do not independently validate decoded compressed-mesh triangles or their material
assignments. :observed{games="sekiro"}

:::open[What do motion-type values mean at runtime?]
Values 0, 1 and 2 fit static, dynamic and keyframed bodies in the sampled objects, but that labeling remains inferred
until a runtime comparison establishes it.
:::
