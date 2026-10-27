---
title: Havok containers and compressed meshes
description: Tagfile sections, type compendia, packed vertices, shape keys and custom primitives.
sources:
  - title: HKLib
    url: https://github.com/The12thAvenger/HKLib
  - title: Havoc (SoulsAssetPipeline)
    url: https://github.com/Meowmaritus/SoulsAssetPipeline/tree/master/Havoc
implementations:
  - name: havok-formats Havok tagfile reader
    url: https://github.com/Kalmarv/havok-formats/blob/main/src/tagfile.rs
  - name: havok-formats compressed mesh reader
    url: https://github.com/Kalmarv/havok-formats/blob/main/src/mesh.rs
---

Map collision uses Havok tagfiles with `hknpCompressedMeshShape` geometry and FromSoftware-specific `fsnp` metadata.
Map HKX members share types through a compendium in their split binder; object HKX files can carry their own type
definitions. :observed

| Game | SDK string in examined collision | Confidence |
|---|---|---|
| Sekiro | `20160200` (2016.2) | :observed{games="sekiro"} |
| Elden Ring | `20180100` (2018.1) | :observed{games="elden-ring"} |

Over every tagfile of both installs, Elden Ring also has 42 tagfiles that store `20160200`, among them `f`-set map
collision of `m60` tiles. The type table, item and patch tables, and the counts per version are on
[Havok tagfiles and type tables](/engines/fromsoft/data-model/havok-tagfiles/). :proven{games="elden-ring"}

## Tagfile structure

One `TAG0` root contains `SDKV`, `DATA`, either `TYPE` or `TCRF`, and `INDX` sections. `TYPE` carries class layouts;
`TCRF` names an external compendium by its eight-byte ID. Item and patch tables resolve typed objects and references
into `DATA`; type index zero denotes null. :observed The type table, its hash, and the item and patch tables are
described on [Havok tagfiles and type tables](/engines/fromsoft/data-model/havok-tagfiles/).

```layout
title: Havok section header
size: 8
note: The first word is big-endian; its top two bits are flags, the remaining 30 bits are total section length including this header.
fields:
  - {at: 0, size: 4, type: u32, name: flags and section length, level: observed}
  - {at: 4, size: 4, type: "char[4]", name: section signature, level: observed}
```

Container sections have flags zero and contain child sections rather than raw leaf data. :observed

## Compressed mesh tree

The mesh tree divides primitives into sections. Section-local vertices use packed 11/11/10-bit coordinates, decoded
with section scale and offset; shared vertices use 21/21/22-bit coordinates over the mesh domain's minimum and
maximum. An index below the section's packed-vertex count addresses local vertices; higher indices address its
shared-vertex index array. :observed

A primitive stores four indices `[a,b,c,d]`. Equal `c,d` gives triangle `(a,b,c)`; otherwise the quad also gives
`(a,c,d)`. `[0xde,0xad,0xde,0xad]` is a dead primitive. :observed The right-aligned shape key is
`(section << 8) | (primitive << 1) | half`, where `half` selects the quad triangle. Stored keys in the material table
are left-aligned and become this value after shifting right by `32 - numShapeKeyBits`. :observed

## Custom primitives and extern shapes

Equal second and fourth indices identify a custom primitive, rather than an ordinary triangle or quad. Its first
index addresses data in the shared-vertex index stream, after accounting for the section's packed vertices.
:observed

For first index `k`, the data starts at `sharedVerticesIndex[k - numPackedVertices + firstSharedVertexIndex]` of
its section. Over 80.5 million primitives of Elden Ring asset and map collision and Sekiro object and map collision,
no ordinary triangle or quad has equal second and fourth indices, so the test does not catch real geometry. Read as
a triangle, a custom primitive indexes past the end of the vertex arrays. :observed

| Pattern | Interpretation | Confidence |
|---|---|---|
| Indices `[k,k,4,k]`, words `[146,w,lo,hi]` | Extern shape index `lo | (hi << 16)`; `w` is uninterpreted | :observed{games="elden-ring"} |
| First word with low byte `0x52`, including `0x2252` | Payload meaning is unresolved | :unknown |

Custom primitives whose first word has low byte `0x52` occur in Sekiro's `o205010` and `o205300` and in Elden Ring's
`aeg004_545_l`. :observed

:::open[What does the 0x52 custom payload represent?]
The record is distinct from triangles and extern references. Interpreting its words as a vertex index and half float
is only a lead; no established geometry interpretation is available.
:::

## Sekiro

### Map collision binders

:only[sekiro] A map's collision is split by set into binders named `h` (player and world collision), `l` (a coarser
copy) and `f` (role not established). In Ashina Castle (`m11_01_00_00`) the `h` binder holds 228 files with 1,671,788
triangles, the `l` binder 228 files with 234,196, and the `f` binder 192 files whose shapes are `hknpExternMeshShape`
around small `hkGeometry` meshes. The `h` files take their type information from `h11_01_00_00.compendium` (`TCM0`).
:observed{games="sekiro"}

Each `h` file's object tree is `hkRootLevelContainer` → `hknpPhysicsSceneData` → `hknpPhysicsSystemData.bodyCinfos[]`.
Each body's shape is an `fsnpCustomParamCompressedMeshShape`: a `hknpCompressedMeshShapeData` mesh tree (sections,
primitives, packed and shared vertices, a bounding-volume tree) and a `pParam` reference to the
`fsnpCustomMeshParameter` that holds the [material tables](/engines/fromsoft/collision/materials-and-bodies/).
:observed{games="sekiro"}

## Elden Ring

### Extern shapes

:only[elden-ring] `externShapes` contains shape references with their own transforms. In the examined data, each
extern shape is referenced exactly once by a custom primitive and the stored scale is one. The transform supplies
three rotation columns and a translation in compressed-mesh space. :observed{games="elden-ring"}

Twenty-two Elden Ring asset collision files use extern shapes, among them `aeg257_001_l`, the lift of the Academy
of Raya Lucaria. The referenced shapes are boxes, convex polytopes and cylinders. Each instance's `hkTransform` is
stored as 16 floats, in the order HKLib reads as `Matrix4x4` M11 to M44. :observed{games="elden-ring"}

### Zero-thickness convex shapes

Elden Ring's map and asset collision includes convex shapes with no volume: boxes with convex radius 0 and one
extent of 0, up to 256 m across, and polytopes whose only planes are `+y` and `−y`, which are flat polygons.
:observed{games="elden-ring"} An intersection of their half-spaces is empty or unbounded, so their colliding surface
is their faces, offset by the convex radius. :inferred

Thin boxes about 300 m from their body's origin have planes that their own vertices miss by up to about four f32
units in the last place; a fixed tolerance of 0.01 mm rejects them. :observed{games="elden-ring"}
