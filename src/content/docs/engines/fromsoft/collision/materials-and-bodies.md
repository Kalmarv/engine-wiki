---
title: Collision materials and object bodies
description: fsnp material lookup, ambiguous triangle rows, hit classes and rigid-body shapes.
sources:
  - title: Paramdex
    url: https://github.com/soulsmods/Paramdex
  - title: Smithbox
    url: https://github.com/vawser/Smithbox
  - title: Havoc (SoulsAssetPipeline)
    url: https://github.com/Meowmaritus/SoulsAssetPipeline/tree/master/Havoc
  - title: HKLib
    url: https://github.com/The12thAvenger/HKLib
    note: the name of the motion type enumeration
implementations:
  - name: fromsoft-formats collision reader
    url: https://github.com/Kalmarv/fromsoft-formats/blob/main/src/collision.rs
---

Collision appearance and behavior are separate from render materials. Compressed meshes attach HitMtrlParam IDs to
shape keys through `fsnp` tables; object binders also contain convex and capsule bodies with body-local poses.
:observed

An MSB collision part also stores a hit-filter byte. Several parts can name the same collision file while carrying
different filters or event-state conditions; file identity alone does not determine which occurrence is active.
:observed

## Material lookup

The compressed shape's `pParam` references `triangleDataArray` and `primitiveDataArray`. A triangle-data row's
`primitiveDataIndex` selects primitive data whose `materialNameData` supplies the material ID. The shape's
`triangleIndexToShapeKey` table associates keys with rows. All-ones keys are invalid entries. :observed

The triangle-data table can be longer than the key table. The bytes do not establish where the extra, unkeyed rows
belong, and comparing vertex IDs does not uniquely resolve their placement. If there are `b` extra rows, the row for
key-table index `i` can lie in `i..=i+b`; differing candidate materials leave that key's material unresolved.
:observed

Over 15,942 Elden Ring collision files, the tables leave 64,280 triangle rows unkeyed, and 29,210 keys have
candidate rows with differing materials. :observed{games="elden-ring"} Over every named collision binder of the
current installs, the triangle-data tables are longer than their key tables by 175 rows in Sekiro (24 in `h`, 98 in
`l`, 53 in objects) and by 64,204 in Elden Ring (64,198 of them in its 15,942 asset files, 3 in `h`, 3 in `l`).
:proven[every named collision binder]

The mesh's own per-primitive data does not position those rows. Every section of every compressed mesh of both games
has a single data run, covering all its primitives, with value `0xFFFF` (see
[Havok compressed meshes](/engines/fromsoft/collision/havok/#section-fields)), so no primitive carries a value that
could name its row. :proven[every named collision binder]

`fsnpCustomMeshParameter` also stores `vertexDataStride` (0 or 1), `triangleDataStride` (0 or 8) and `version`
(`0x100000` in every mesh). The strides are not the size of a triangle-data row, which is 20 bytes in every type table.
Each primitive-data entry's `triangleData` byte array holds `triangleDataStride` bytes for every triangle-data row that
names it, its `vertexData` array is non-empty exactly when `vertexDataStride` is 1, and its `primitiveData` array is
empty. `triangleDataStride` is 8 in Sekiro's `l` and object meshes and in 2 of its 1,458 `h` meshes, and 0 in the
other `h` meshes and in every Elden Ring mesh. :proven[every named collision binder]

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

### Hit ids in the installs

Over every collision file that carries shape-key materials (Sekiro 4,420 files, 25,954,138 triangles, 1,231,204 of them
with no material; Elden Ring 23,102 files, 67,859,768 triangles, 1,741,768 with none), triangles use 97 distinct ids in
Sekiro and 122 in Elden Ring. :observed Both games' HitMtrlParam holds 51 rows (Sekiro ids 0 to 80 with gaps, Elden Ring
0 to 62). The ids below 100 (42 and 43 of them used) each have a row; the 55 Sekiro and 79 Elden Ring ids of 100 or more
(7.9% and 1.2% of the triangles that have an id; hundreds digits 1, 2 and 4 to 8 in Sekiro, 1, 2 and 4 in Elden Ring) have none, and
every one of them has a class (its id modulo 100) that does. :observed Sekiro's Smithbox names cover 50 of its 51 rows
(row 0 is blank; rows 2 and 25 are named "Unused" and are used by 59,208 and 267 triangles); Elden Ring's cover 18 of 51
and leave 29 of the 46 classes in use unnamed (6.2% of the triangles). :sourced[Smithbox]

Sekiro's row 29 ("None") and row 0 (blank in the community list) are byte-identical in the regulation; row 40, named
"Cloud", differs from them in `disableFallDamage` (1) and `hardnessType` (0), and only two files (the `h` and `l`
collision of one `m25_00` piece, 1,296 triangles each) use it. :observed{games="sekiro"} Dark Souls' numbering (class 29
"Empty", class 40 "Trigger", :sourced[soulstruct-havok]) is not these games'. In Elden Ring the unnamed class 29 is used
by 236,710 triangles in 1,539 files and its row differs from row 0 (`isHardnessForSoundReverb` is 1), so a class that is
an invisible blocker in Sekiro's Ashina Castle is not shown to be one there. :observed{games="elden-ring"}

## Object and asset collision

Where each game keeps object and asset collision is in its section below.

Stored convex cores contain vertices, planes, faces and a convex radius where that shape class supplies them.
`hknpConvexShape` stores vertices without explicit faces or planes; a sphere stores one centre vertex and its radius.
:observed The radius describes a rounded convex shape. Intersecting outward-shifted planes constructs an
approximation and does not reproduce its rounded edges. :inferred Every box, convex polytope, capsule, cylinder and
triangle shape, bodies and extern instances alike, stores exactly as many planes as faces: 8,373 shapes in Sekiro and
20,948 in Elden Ring. :proven[every named collision binder]

Every map body has motion type 0. Among object and asset bodies, only motion type 2 has a positive mass (4,620 bodies
in Sekiro, 17,867 in Elden Ring); otherwise it stores −1 (2,407 and 2,404) or, in 9 Elden Ring bodies, another
negative mass, never 0. Motion type 1 has mass 0 or −1 (706 and 414 bodies), and motion type 0 likewise.
:proven[every named collision binder] So 2 is the dynamic motion and 1 the keyframed one, whose mass is infinite.
:inferred HKLib names the byte's enumeration `hknpMotionType::Enum`: 0 `STATIC`, 1 `KEYFRAMED`, 2 `DYNAMIC`.
:sourced[HKLib] Counted over every distinct tagfile of each install, the bodies are 16,644 static, 642 keyframed and
7,225 dynamic in Sekiro and 286,180, 404 and 26,490 in Elden Ring; every positive mass is on a dynamic body (5,334 and
24,257 bodies) and no keyframed body has one. :observed[every distinct tagfile read]

:::open[What do motion-type values mean at runtime?]
The names fit the mass pattern; a runtime comparison would establish what the engine does with each motion type.
:::

## Sekiro

### Ashina Castle's hit classes

:only[sekiro] By area, Ashina Castle's `h` collision is class 1 (30.4%), 4 (26.0%), 29 (16.6%), 3 (6.9%), 16 (3.5%),
30 (3.2%), 616 (3.1%), 401 (2.2%), 22 (1.2%) and 32 (1.2%). Of its 1,671,788 triangles, 31 have no material.
:observed{games="sekiro"} Its class-29 surfaces are 2,233 large triangles that almost never coincide with a drawn surface:
0.1% of their area lies within 5 cm of one. They are invisible blockers and boundary caps. Leaving them out raises
the share of top-down pixels where collision and the placed render meshes agree within 5 cm from 47% to 53.8%.
:observed{games="sekiro"}

By slope, 25.7% of that collision's area is within 5° of horizontal (43% of it class 29) and 46.9% is steeper
than 75°. :observed{games="sekiro"}

### Object collision

:only[sekiro] An object binder can hold `<object>.hkx` and a broken-state `<object>_1.hkx`. Examined bodies include
compressed meshes, `hknpBoxShape`, `hknpConvexPolytopeShape` and `hknpCapsuleShape`; body poses are in object space.
In Ashina Castle, 207 of 222 object models have their own collision. :observed{games="sekiro"} The object-space
collision lines up with the object's render mesh only once the render vertices are placed by their
[rigid bones](/engines/fromsoft/geometry/nodes-and-skinning/#rigid-and-dynamic-data). :observed{games="sekiro"}

Independent Havoc comparisons cover the sampled Sekiro bodies' names, motion values, poses, convex-core fields and
capsule segments bit for bit. They do not independently validate decoded compressed-mesh triangles or their material
assignments. :observed{games="sekiro"}

## Elden Ring

### Asset collision

:only[elden-ring] An asset `AEGnnn_mmm` has collision in
`asset/aeg/aegnnn/aegnnn_mmm_l.geomhkxbnd.dcx`, with a high-resolution `_h` counterpart for a subset of assets.
:observed{games="elden-ring"}

### Zero-thickness cores

:only[elden-ring] Map and asset files also store cores of zero thickness and radius 0: flat boxes up to 256 m across,
and flat polytopes whose only planes face +Y and −Y. Their planes enclose no volume, so intersecting them gives an
unbounded or degenerate result; the stored faces are the surface. :observed{games="elden-ring"} On thin boxes about 300 m from
their body origin, the stored planes and vertices agree only to within about four f32 ULPs, coarser than a fixed
0.01 mm tolerance. :observed{games="elden-ring"}
