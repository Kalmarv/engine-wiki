---
title: Havok containers and compressed meshes
description: Tagfile sections, type compendia, packed vertices, shape keys and custom primitives.
sources:
  - title: Smithbox
    url: https://github.com/vawser/Smithbox
    note: name of the f collision set
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

The shared-vertex index entry is the low 16 bits of the position in `sharedVertices`; the section's `page` byte
supplies the rest: vertex `i` at or above the packed count is `sharedVertices[page × 65536 +
sharedVerticesIndex[first shared + i − packed count]]`. Most sections have page 0; Sekiro has 89 `l`-set sections with
page 1 and Elden Ring 6,233 `l`-set sections with pages 1 to 4. With the page applied, every primitive of those
sections lies inside its [bounding-volume leaf](#bounding-volume-trees); read with the page ignored, 6,746 of 6,746
(Sekiro) and 348,888 of 348,890 (Elden Ring) primitives that use a shared vertex fall outside it.
:proven[every named collision binder]

A primitive stores four indices `[a,b,c,d]`. Equal `c,d` gives triangle `(a,b,c)`; otherwise the quad also gives
`(a,c,d)`. `[0xde,0xad,0xde,0xad]` is a dead primitive. :observed The right-aligned shape key is
`(section << 8) | (primitive << 1) | half`, where `half` selects the quad triangle. Stored keys in the material table
are left-aligned and become this value after shifting right by `32 - numShapeKeyBits`. :observed

The tree stores the key width again. In every non-empty mesh of both games, the shape's `numShapeKeyBits` equals the
tree's `bitsPerKey`, `maxKeyValue` is the largest key of any primitive (custom primitives included, a quad's second
triangle counting `| 1`), and `bitsPerKey` is the bit length of `maxKeyValue + 1`; the three meshes with no sections
(all Elden Ring assets) store 0 for both. :proven[every named collision binder] The bit length of `maxKeyValue`
alone, and that of `((sections − 1) << 8) | ((last section's primitives − 1) << 1)`, are one less than `bitsPerKey` in 12
Sekiro and 973 Elden Ring meshes. :proven[every named collision binder] `numPrimitiveKeys` equals the number of keys (one per triangle,
two per quad) plus the custom primitives in 3,008 of 3,344 Sekiro and 22,228 of 22,897 Elden Ring meshes; the others
store one to a few more, often as many as their dead primitives but not always. :proven[every named collision binder]

The tree class is the 32-bit-packed, 64-bit-shared configuration in both games: Sekiro names it
`hkcdStaticMeshTree<hkcdStaticMeshTreeCommonConfig<hkUint32,hkUint64,11,21>, hknpCompressedMeshShapeTreeDataRun>`,
and Elden Ring's `hkcdDefaultStaticMeshTree` stores `packedVertices` as `unsigned int` and `sharedVertices` as
`unsigned long long`, in every type table that has the class. :proven[every named collision binder] Neither game's
`hknpCompressedMeshShape` (version 6 in Sekiro, 7 with `externShapes` in Elden Ring) has a quad-flatness or
duplicated-edge member; it has a `triangleIsInterior` bit field, and the tree a `primitiveStoresIsFlatConvex` byte
(0, or 255 in 11 Sekiro and 121 Elden Ring meshes). :proven[every named collision binder]

### Bounding-volume trees

The mesh tree and each of its sections carry a static bounding-volume tree: `nodes` and a `domain` box. The mesh-level
tree has 5-byte nodes whose leaves are sections; each section's tree has 4-byte nodes whose leaves are its primitives.
Nodes are stored in pre-order: an internal node's first child follows it, and its second child is `2 × value` nodes
after it. :proven[every named collision binder]

```layout
title: Section tree node (Codec3Axis4, Aabb4BytesCodec)
size: 4
fields:
  - {at: 0, size: 3, type: "u8[3]", name: "x, y, z shrink", level: proven, note: "per axis: high nibble shrinks the minimum side, low nibble the maximum side, by n² ⁄ 226 of the parent's extent"}
  - {at: 3, size: 1, type: u8, name: data, level: proven, note: "bit 0 set: internal, second child at +(data & 0xFE) nodes; clear: leaf, primitive = data >> 1"}
```

```layout
title: Mesh tree node (Codec3Axis5, Aabb5BytesCodec)
size: 5
fields:
  - {at: 0, size: 3, type: "u8[3]", name: "x, y, z shrink", level: proven, note: "as in the section tree"}
  - {at: 3, size: 1, type: u8, name: hiData, level: proven, note: "value = hiData << 8 | loData; bit 15 set: internal, second child at +2 × (value & 0x7FFF) nodes; clear: leaf, section = value"}
  - {at: 4, size: 1, type: u8, name: loData, level: proven}
```

A node's box is its parent's box (the tree's `domain` for the root) shrunk on each axis: with `e` the parent's
extent, `min += e × h² ⁄ 226` and `max −= e × l² ⁄ 226`, where `h` and `l` are the high and low nibbles of that
axis's byte. The root's nibbles are usually zero, not always (36 Sekiro and 911 Elden Ring section roots, 4 Sekiro
and 801 Elden Ring mesh roots are not). :proven[every named collision binder]

Over every tree of both games the nodes form one pre-order tree with every node reached once. Section-tree leaves name
each of the section's primitives exactly once, dead primitives included; mesh-tree leaves name each section once.
Every vertex of every triangle and quad lies inside its leaf's box, and every section's `domain` inside its mesh-tree
leaf's box, to within 16 f32 units in the last place of the coordinate (4 Elden Ring triangles of one asset exceed
that at a coordinate of 4 × 10⁻⁷ m, by 6 × 10⁻⁹ m). That is 21,846,092 Sekiro and 58,628,215 Elden Ring triangles
and quads. :proven[every named collision binder] A divisor of 225 instead of 226 leaves 3% to 51% of them outside
their leaves, depending on the binder set, and swapping the two nibbles' roles nearly all. :proven[every named collision binder]

### Section fields

| Field | Content | Confidence |
|---|---|---|
| `domain` | The box of every vertex the section's triangles and quads use, grown by the shape's `convexRadius` on every side (273,210 of 273,218 Sekiro and 722,324 of 722,374 Elden Ring sections; the others are larger on one side). Its `w` lanes are `1 − convexRadius` and `1 + convexRadius` (to rounding) in map meshes. | :proven[every named collision binder] |
| `codecParms` | Offset (xyz) and scale (xyz) of the packed vertices. Not the domain: the offset equals the domain's minimum in only 1,085 Sekiro and 1,071 Elden Ring sections. In 99.2% of Sekiro and 95.2% of Elden Ring sections with packed vertices, some packed vertex has code 0 and some the top code on every axis, so the codec spans the box of the packed vertices. | :proven[every named collision binder] |
| `leafIndex` | The node index of the section's leaf in the mesh-level tree, in all 273,228 Sekiro and 722,403 Elden Ring sections. | :proven[every named collision binder] |
| `page` | Shared-vertex page, above. | :proven[every named collision binder] |
| `flags` | 1 in exactly the sections that hold a custom primitive or an extern reference (10 Sekiro, 65 Elden Ring), 0 in all others. | :proven[every named collision binder] |
| `layerData` | 0 in every section; Sekiro's `unusedData` likewise. | :proven[every named collision binder] |
| Data runs | Every section of both games has one data run, covering primitives `0` to its count, with value `0xFFFF`. The run value is 16 bits in both games (Sekiro wraps it in `hknpCompressedMeshShapeTreeDataRunData`). | :proven[every named collision binder] |

A section holds at most 127 primitives and 255 vertex slots (packed plus shared) in both games, so a primitive's
index fits the leaf byte's 7 bits. :proven[every named collision binder] Packed vertices belong to one section: rounded
to 1 mm, fewer than 160 of 31.4 million packed positions occur in two sections. Shared vertices are not limited to
those several sections use: Sekiro's `h` set stores none used by a single section, but its `l` set has 4,024 and
Elden Ring 7.69 million of its 19.1 million. :proven[every named collision binder]

### Section ranges

Each section names a run of the tree's packed vertices, of its shared-vertex index entries and of its primitives. The
runs tile the three arrays in section order: a section's runs start where the previous section's end, the first
section's at 0, and the last section's end at the end of each array. Every vertex index of a triangle or quad, and the
first index of every custom primitive, is below the section's packed-vertex count plus its shared-index count. These
hold in every compressed mesh of every named map, object and asset collision binder of both installs: Sekiro's 5,642
tagfiles (3,344 mesh trees, 273,228 sections) and Elden Ring's 25,128 (22,897 mesh trees, 722,403 sections).
:proven[every named collision binder]

The two SDK versions name the runs differently:

| Run | Sekiro (2016.2) | Elden Ring (2018.1) | Confidence |
|---|---|---|---|
| Packed vertices | `firstPackedVertex`, `numPackedVertices` | `firstPackedVertexIndex`, `numPackedVertices` | :proven[every named collision binder] |
| Shared-vertex index entries | first: `sharedVertices.data >> 8`; count: `numSharedIndices` | first: `firstSharedVertexIndex`; no count field, the run ends where the next section's starts | :proven[every named collision binder] |
| Primitives | `primitives.data`: first `>> 8`, count `& 255` | `firstPrimitiveIndex`, `numPrimitives` | :proven[every named collision binder] |

In Sekiro the low byte of `sharedVertices.data` is not a separate count: it equals `numPackedVertices` in all
273,228 sections. :proven[every named collision binder]{games="sekiro"}

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
| Indices `[k,k,4,k]`, words `[0x92, w, lo, hi]` | Extern shape index `lo | (hi << 16)`; `w` is 0 in 244 of the 262 references and 3, 4 or 5 in the rest | :proven[every named collision binder]{games="elden-ring"} |
| Indices `[k,n,c,n]`, words `[h, slot, tag]` with `h & 0xFF == 0x52` | A point set: `h >> 8` vertices stored from `sharedVertices[slot]` on | :proven[every named collision binder] |

No `h` or `l` map binder of either game holds a custom primitive. The point-set records are in object and asset
collision: 27 in Sekiro's objects (among them `o205010` and `o205300`) and 28 in Elden Ring's `_l` assets (among them
`aeg004_545_l`); Elden Ring's 262 extern references are in its assets too. :proven[every named collision binder]

In a point-set record, `n` is the node index of the primitive's own leaf in its section's
[tree](#bounding-volume-trees), in all 55 records. The third index is `n` again in Sekiro's 27 and 3 in Elden Ring's
28. :proven[every named collision binder] The vertices are 32-bit packed positions, two to a 64-bit `sharedVertices`
entry (the even vertex in the high half), with 11, 11 and 10 bits for x, y and z like a section's packed vertices, but
quantised over the box of the primitive's leaf node: scale = leaf extent ⁄ (2047, 2047, 1023), offset = leaf minimum.
:observed Decoded this way, `o205010`'s two records are two cylinders along x (17 and 8 points on each of two circles
of constant radius, 0.20 m and 0.04 m), `o205300`'s are two eight-corner boxes and a 26-point prism, and
`aeg004_545_l`'s are 12-point slabs on three planes of x; the records of a section take consecutive slots and
consecutive shared-index entries. :observed The collision surface is presumably the points' convex hull. :inferred

The first word's high byte is the vertex count (up to 36). Its low byte is `0x52` for a point set and `0x92` for an
extern reference; what its bits mean beyond that is not established. :unknown The third word is
`0x3D4D` on 21 Sekiro records, `0x3C9D`, `0x3CC7` or `0x3C8B` on the other 6, and `0x3C24` on all 28 Elden Ring
records; the section's data run gives these primitives `0xFFFF` like every other. :unknown

:::open[What does the third word of a point-set record mean?]
It repeats across records and objects of both games. Read as a half float it lies between 1.03 and 1.33; nothing
confirms that reading.
:::

## Map collision sets

Both games split a map's collision by set into split binders named `h` (player and world collision), `l` (a coarser
copy) and `f`. Their bodies are compressed meshes, apart from a few convex bodies in `h` and `l`.
:proven[every named collision binder]

Every body of every `f` file is an `hknpExternMeshShape` whose `hknpDefaultExternMeshShapeGeometry` holds an
`hkGeometry`: vertices as `hkVector4` with `w` = 1 and triangles `{a, b, c, material}`. The body's pose is the
identity, its motion type 0, its mass −1 and its motion-properties index `0xFFFF`; every triangle's material is −1 and
every vertex index is in range. That is 12,688 bodies (539,652 vertices, 537,436 triangles) in Sekiro's 1,145 `f`
files and 264,858 bodies (2,233,804 vertices, 1,707,650 triangles, at most 796 to a body) in Elden Ring's 1,850.
:proven[every named collision binder] Smithbox calls the `f` set fall protection, used for enemies.
:sourced[Smithbox]

## Sekiro

### Map collision binders

:only[sekiro] In Ashina Castle (`m11_01_00_00`) the `h` binder holds 228 files with 1,671,788
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
