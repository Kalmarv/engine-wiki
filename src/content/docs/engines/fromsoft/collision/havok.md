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
  - name: havok-formats extern mesh reader
    url: https://github.com/Kalmarv/havok-formats/blob/main/src/extern_mesh.rs
  - name: havok-formats bounding-volume tree decoder
    url: https://github.com/Kalmarv/havok-formats/blob/main/src/bvtree.rs
  - name: havok-formats simd tree decoder
    url: https://github.com/Kalmarv/havok-formats/blob/main/src/simdtree.rs
  - name: havok-formats compressed mesh writer
    url: https://github.com/Kalmarv/havok-formats/blob/main/src/mesh_write.rs
  - name: havok-formats interior flags
    url: https://github.com/Kalmarv/havok-formats/blob/main/src/interior.rs
  - name: havok-formats degenerate-triangle test
    url: https://github.com/Kalmarv/havok-formats/blob/main/src/degenerate.rs
  - name: havok-formats quad pairing
    url: https://github.com/Kalmarv/havok-formats/blob/main/src/quads.rs
  - name: havok-formats primitive tree and cut
    url: https://github.com/Kalmarv/havok-formats/blob/main/src/stock_tree.rs
  - name: havok-formats bounding-volume tree encoder
    url: https://github.com/Kalmarv/havok-formats/blob/main/src/bvtree_write.rs
  - name: havok-formats simd tree writer
    url: https://github.com/Kalmarv/havok-formats/blob/main/src/simd_write.rs
  - name: havok-formats extern mesh writer
    url: https://github.com/Kalmarv/havok-formats/blob/main/src/extern_write.rs
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

`sharedVerticesIndex` is an array of `hkUint16` in the type tables of both games. :proven[every named collision binder]
The page only matters where it is above 0: every section of every `h` set and of every object and asset collision file
has page 0, where the offset adds nothing, so a decoder that adds `page × 65536` to every section and one that ignores
the page agree there. In each install one tagfile holds all the sections above page 0: Sekiro's `l` binder of area
m10_00_00_00 (89 sections, 6,980 triangles) and Elden Ring's `l` binder of area m14_00_00_00 (6,233 sections, 507,001
triangles). With the page applied, every triangle of every compressed mesh in both installs (25,397,391 Sekiro and
66,239,498 Elden Ring, a quad counting as two) lies inside its section's `domain` to within 16 µm, and all of those
6,980 and 507,001 strictly inside it. :proven[every named collision binder]

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

### Shape-level members

Besides its data, a compressed mesh shape stores members that follow from the mesh. `numTriangles` and `numConvexShapes`
are 0 in every mesh of both installs. :proven[every named collision binder] The `connectivity` object of the data
(`headers`, `localLinks` and `globalLinks`, the links between a triangle's edges and its neighbours) is empty in every
mesh of both installs. :proven[every named collision binder]

`triangleIsInterior` is a bit field of `maxKeyValue + 1` bits in `ceil(bits ⁄ 32)` words. Its bits are set only on the keys
of triangles and quads, never on a key no primitive has nor on a custom primitive's: between 32% and 48% of the triangle
keys, depending on the binder set, and in 362 Sekiro and 5,777 Elden Ring meshes on none at all. :proven[every named collision binder]

A mesh that has any bit set has them from one pass over the finished mesh, run on the vertices as their codes decode
(`code × scale + offset` in single precision; a shared vertex's scale is the extent of the tree `domain` times the
single-precision value of `1 ⁄ 2,097,151`, `1 ⁄ 4,194,303` for z). The pass reproduces every bit of every such mesh from
those vertices alone: 25,383,271 keys in 2,982 Sekiro meshes (8,080,712 set) and 65,846,233 keys in 17,122 Elden Ring
meshes (25,136,262 set), with no key wrong. :proven[every named collision binder] It has four steps.

1. *Neighbours.* The triangles are visited in key order, a triangle's edges in vertex order (`a b`, `b c`, `c a`; a quad's
   halves are `a b c` and `a c d`). An edge is paired with the same two vertices in the opposite direction when one has
   been visited and is still unpaired, the latest such, and then neither is unpaired; an edge nobody pairs waits. A
   vertex is identified by its section and slot when it is packed, by its entry in the shared-vertex index (the page
   not counted) when it is shared. The edge between a quad's two halves is paired directly. A quad is *flat* when the
   tree's `primitiveStoresIsFlatConvex` byte ANDed with the quad's second vertex slot is more than its fourth: a flat quad
   is one polygon `a b c d` with the four outer edges, and its bit is kept under its first half's key. A triangle or
   polygon that has a missing neighbour on any edge is never set. :proven[every named collision binder]
2. *Convex edges.* A triangle's raw normal is `(b − a) × (c − a)` (a polygon's, that of its first three corners). An edge
   from corner `p` to the next corner `q`, with `e` the unit vector from `p` to `q` and `m` the unit normal of the
   triangle across the edge, is convex when `e · (n × m)` is more than the single-precision epsilon `2⁻²³`. :proven[every named collision binder]
3. *Order.* Each triangle with all its neighbours gets the weight `|n| + 10 × (its convex edges)`, `|n|` being the length of
   its raw normal (twice its area); the triangles are sorted ascending by weight with a quicksort that takes the middle
   element as pivot, swaps elements strictly on the wrong side and is not stable, so triangles of equal weight, which are
   many, come out in the order that procedure gives. :proven[every named collision binder]
4. *Marking.* In that order a triangle is set unless one of its convex edges meets a triangle that is already set, or one
   whose unit normal makes an angle of more than 70° with its own (`n · m` below the single-precision cosine). :proven[every named collision binder]

The arithmetic is single-precision in the order of the operations, with a unit vector made from the reciprocal square root
estimate `r` of its squared length `s` by one Newton step, `(3 − (r s) r)(r ⁄ 2)`. Which edges are convex is often decided
by a rounding step, and the estimate decides it: an estimate that reproduces every bit is the reciprocal square root of
the middle of a cell of `2¹³` units in the last place of `s` (cells that share an exponent parity and the top ten
mantissa bits), rounded to the nearest multiple of `2¹¹` units in the last place of the result. An exact reciprocal
square root, or the table of one current processor, leaves some hundreds of bits per million wrong. :observed[every named collision binder]
That table is a fit to the bits, not a copy of the table of the machine that made the files. :inferred

The source vertex indices of the games' own layer are in the `triangleDataArray` of the shape's `pParam`
(`fsnpCustomMeshParameter`), one entry per source triangle with `vertexIndexA`, `B`, `C`, `primitiveDataIndex` and
`triangleDataIndex`. :observed{games="sekiro"}

The shape's `triangleIndexToShapeKey` (the games' own `fsnpCustomParamCompressedMeshShape`) holds, for each triangle of the
source mesh, its key left-aligned in 32 bits with the `32 − numShapeKeyBits` low bits all ones. Every word of the 3,333
Sekiro and 22,778 Elden Ring meshes that have the member is that, names a primitive that exists (a quad's second half
included), and no key appears twice. Its length equals the number of triangles the mesh decodes to in 2,414 Sekiro and
19,330 Elden Ring meshes and differs in the others. :proven[every named collision binder]

### Triangles the stock tool leaves out

A source row of the shape's `pParam` can have no key in `triangleIndexToShapeKey`, and then no triangle in the mesh. A test
that the stock tool applies to a triangle before keeping it is the one the MOPP codes of Tony Hawk's SHRED show (see
[Havok packfiles](/engines/rme/collision/havok-packfiles/)): the triangle is degenerate when the sum of the squares of the
components of its edge cross product, worked out from either of its first two vertices in `f32`, is under a threshold of
10⁻⁷, or when its points are exactly collinear by `|u|² |v|² − (u · v)² = 0` in `f32`. Every triangle the meshes keep passes
it: none of the 24,704,951 kept triangles of Sekiro and 66,147,210 of Elden Ring is degenerate by it. :observed[every named collision binder]
Of the rows without a key whose three source vertices a kept row also uses (taking the position from that row), it calls
13,345 of 87,100 degenerate in Sekiro (15%) and 267,763 of 549,405 in Elden Ring (49%); in Sekiro's object meshes 1,994 of 2,270 (88%).
:observed[every named collision binder] A threshold of 10⁻⁶ would call 2,574 of the kept triangles of Sekiro's objects degenerate.
:observed{games="sekiro"} The positions here are the ones the files keep after quantising, so a thin triangle can pass or fail by
rounding.

In the object meshes (370 of Sekiro, 48 of Elden Ring) 2,270 and 63 of the rows without a key have all three vertices known;
the test calls 1,994 (88%) and 15 (24%) of them degenerate. Of the others (276 and 48), none has a repeated source vertex
index, 19 and 1 have the same three positions as a kept row, and 10 and 6 have a repeated position. The second and third
corners of a kept triangle come as close as 0.45 mm (Sekiro) and 1.6 mm (Elden Ring) from each other, and 1,697 of the 238,179
kept triangles of Sekiro have them within 1 cm, against 2 of the 276, so merging vertices within a distance does not
separate the two. Their sums of squared cross-product components run from 10⁻⁷ to 1, like those of the thin kept
triangles. :observed[the object meshes of both games]
:::open[Why else does the stock tool leave a source row out?]
The test above accounts for most of the left-out rows of Sekiro's objects but for 12% of them, for about three quarters of
the left-out rows of Elden Ring's objects, and for 85% (Sekiro) and 51% (Elden Ring) of those of the map meshes whose
vertices are known; 27,874 and 538,167 more use a vertex no kept row uses. Neither duplicates, repeated vertex indices nor
merging vertices within a distance explains the object rows. A reading of the stock tool suggests that it tests every
primitive again after cutting the sections, on the vertices as they are stored, and starts over without the ones that fail
(so a triangle can fall to the test only after quantising); the stored vertices of a left-out row are not known, which
makes that untestable from the files. :inferred
:::

### Which triangles are joined into quads

Of the triangles of the source mesh the games join pairs into quad primitives: 3,507,426 quads in Sekiro and 7,568,285 in
Elden Ring, so about 28% and 23% of the triangles are quad halves. A quad's two source triangles are the entries of the
`triangleDataArray` whose `triangleIndexToShapeKey` words give keys that differ in the half bit only; both are in one
section. :proven[every named collision binder]

A rule that picks most of the same pairs from the source triangles of a mesh, in `pParam` row order:

1. A vertex is its position (the bits of the three floats); the vertices are numbered in the order the rows first use
   them. Each triangle's edges `n` (from corner `n` to the next) are records of the two vertex numbers, lower first,
   sorted by them with the unstable quicksort of the interior pass. :observed[every named collision binder]
2. For each record in that order, the first later record on the same two vertices that runs the edge the other way, has
   another vertex opposite it, belongs to a triangle of the same `primitiveDataIndex`, and is the third edge of one
   triangle and the first edge of the other, makes a candidate pair. The triangle with the third edge is the quad's first
   half (`a b c`), the other the second (`a c d`). :observed[every named collision binder]
3. A candidate costs `(U − B) + (U − A)` where `A` and `B` are the surface measures (`ez·ey + ey·ex + ex·ez` of the
   extents, single precision) of the two triangles' boxes and `U` that of the box of both. The candidates are sorted by
   cost with the same quicksort and taken in that order, a candidate whose triangle is already taken being skipped.
   :observed[every named collision binder]

Run on all the rows of a mesh at once, the pairs it makes include 3,484,191 of the 3,507,426 stock quads of Sekiro
(99.3%; 99.5% of the 3,502,384 it makes are stock quads) and 7,501,872 of the 7,568,285 of Elden Ring (99.1%; 99.3% of
the 7,550,979 it makes). In every pair that is a stock quad, the triangle with the third edge is the stock first half.
1,690 of the 3,333 Sekiro meshes and 18,022 of the 22,778 Elden Ring meshes come out with exactly their stock quads.
:observed[every named collision binder] Sekiro's object meshes come out lowest, 27,928 of 32,485 (86.0%). Pairing each
section's rows on their own, with the stock sections as given, finds a little more (99.4% and 99.2%; 88.7% of the Sekiro
objects); in a sketch of that, 3,549 of the 3,678 Sekiro object pairs missed lie on an edge that at least three
triangles share, 107 on an edge of two, and 22 have different primitive data. :observed{games="sekiro"}

Vertices named by the source indices of the rows (rather than by position) find 38% of the Sekiro object quads, so the
source mesh repeats vertices that the pairing treats as one. :observed{games="sekiro"} Simpler rules were tried first and
agreed with the stock quads less well (the counts were not kept): pairing in row order, by the longest shared edge, by
coplanarity, and by cost alone over all adjacent pairs rather than third edge with first edge. :observed{games="sekiro"}

The source indices are not one numbering of the whole mesh. In 63 of the 370 Sekiro object meshes and 8 of the 48 Elden
Ring object meshes that were dumped, rows use one index for corners more than half a metre apart; in one Sekiro mesh the
rows from the 83rd on start again at index 0 on another part. The indices are local to parts of the source mesh, so they
cannot serve as the stock tool's vertex numbers, and the meshes whose rows do this are matched well (98.7% of their 2,009
Sekiro quads). :observed[the object meshes of both games]

Most of the misses are in three meshes. Of the 4,556 Sekiro object pairs the rule misses, 4,405 are in three of the 370 object
meshes (`o009093`, `o009092`, `o009101`, with 33,497, 40,116 and 6,220 rows); in them 73% of the 16,327 stock quads are found,
and in the other 367 meshes 99.1% (16,007 of 16,158). Those three repeat their triangles: the same three corners are
used up to 23 times (11,829 of the 33,497 triangles of the first are an extra copy of another, against 355 of 14,237 in
the next largest, `o009097`). Where copies share an edge their pairs cost exactly the same, so which copy joins which is
decided by the order of the sort alone. Counting a pair by the positions of its two triangles, so that it does not matter
which copy is used, the rule agrees with 29,607 of the 32,485 stock pairs of the objects (91.1%, against 86.0% by row).
:observed{games="sekiro"} Naming the vertices by the representative a merge of equal positions would give (the lowest
in the order of an unstable sort by x, using the source indices) instead of by first use does not change this: 84.9% of
the pairs by row against 86.0%, the same with a merge distance of 1 mm or 1 cm. :observed{games="sekiro"} The stock tool
appears to run such a merge before pairing, but the files do not keep the vertices it saw, and where the source indices are
local to parts the representatives cannot be rebuilt. :inferred

A sign test that a reading of the stock tool shows for a pair, of the volume the quad's four corners span, does not separate
the stock pairs from the other candidates in the object meshes: 20,801 of the 32,463 stock pairs among the candidates fail
it (64%) and 24,365 of the 38,410 others (63%). :observed{games="sekiro"} The first later record is the only one that makes a
candidate, as the rule has it: making a candidate of every record that fits finds more stock pairs (88.3%) but makes 33,233
pairs for 32,485 stock. :observed{games="sekiro"}

:::open[Which pair does the stock tool take among copies of one triangle?]
The three object meshes above are matched in 73% of their quads, and the rest of the objects in 99.1%. Where a mesh repeats
a triangle the candidates are equal and the pair that is taken depends on the order of the records, which follows from
the stock tool's vertex numbers and from the order of its sort; the files keep neither, so which copy joins which is not
known.
:::

Every section names exactly one data run, and it is `{0xFFFF, 0, the section's primitive count}`; every run of the
tree's `primitiveDataRuns` is named by some section. In Sekiro the section's `dataRuns.data` word is the first run
`<< 8` plus the run count (always 1). The list repeats a run in 1,136 Sekiro and 4,289 Elden Ring meshes, so a run is
not found by its section's position alone. :proven[every named collision binder]

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

Over every tree of both games the nodes form one pre-order tree with every node reached once: an internal node's second
child lies inside its subtree, and a leaf is the last node of its subtree. Section-tree leaves name each of the
section's primitives exactly once, dead primitives included; mesh-tree leaves name each section once, and each section's
`leafIndex` is the node of its leaf. A second decoder, written after the rules were found, counts the same trees and
leaves on both installs: 3,344 Sekiro and 22,899 Elden Ring mesh trees, 273,228 and 722,405 section trees, 21,847,369
and 58,630,675 section-tree leaves. :proven[every named collision binder]

Every vertex of every triangle and quad lies inside its leaf's box, and every section's `domain` inside its mesh-tree
leaf's box, to within 16 f32 units in the last place of the largest magnitude among the coordinate, the box's bounds and
the tree's `domain` on that axis. That is 21,846,092 Sekiro and 58,628,330 Elden Ring triangles and quads, 21,748,039 and
58,537,786 of them inside exactly and the rest within 2.8 units (Sekiro) and 16 units (Elden Ring). :proven[every named collision binder]
Measured at the coordinate's own magnitude alone, 7 Elden Ring triangles of two assets exceed 16 units: 4 of
`aeg228_107_l` at z ≈ 4 × 10⁻⁷ m, by 6 × 10⁻⁹ m, in a section whose z reaches −0.24 m, and 3 of `aeg260_415_l`, by
4.5 × 10⁻⁷ m at z ≈ 0.2 m, in a section whose z reaches −25 m; at the magnitude of the section's `domain` all 7 are
within 0.5 unit. :proven[every named collision binder] The vertices are computed from the section's `domain` (an offset plus
a code times a scale), which would make its magnitude the one that sets their rounding. :inferred A divisor of 225
instead of 226 leaves 3% to 51% of them outside their leaves, depending on the binder set, and swapping the two
nibbles' roles nearly all. :proven[every named collision binder]

A node's box can come out inverted, its minimum above its maximum on an axis, when the nibbles take more than the whole
extent of a box that is already thin: 13,490 Sekiro and 18,577 Elden Ring section-tree nodes, none in a mesh tree, by at
most 73 μm in Sekiro and 51 μm in Elden Ring. The triangles under them lie within the 16 units above. :proven[every named collision binder]

The stored nibbles follow the floor of a square root. For a node below a parent box of extent `e`, `h` is the largest
nibble with `parent min + e × h² ⁄ 226` not past the minimum of what lies below the node, and likewise `l` on the maximum
side, where what lies below is the union of the boxes of the node's leaves, a leaf's box being its primitive's vertices
grown by the shape's `convexRadius`. Applied from the root down on the stored topology, with each section's stored
`domain` as the root's parent and each parent's box computed from its own nibbles, this gives the stored bytes of
18,363,654 of the 21,241,946 inner nodes (86.5%), 16,123,721 of 21,786,968 leaves (74.0%) and all but 35 of 272,471 roots in
Sekiro, and of 51,652,581 of 57,042,426 inner nodes (90.6%), 47,318,288 of 58,482,843 leaves (80.9%) and all but 177 of
719,647 roots in Elden Ring; the 677 and 1,635 sections that hold a dead or custom primitive, which has no box, are left
out. :observed[every section tree with a box for each primitive] Where a node differs, it differs by one nibble in about
four cases of five. :observed[every section tree with a box for each primitive] With each node's box taken from its stored parent instead,
93% of the inner nodes and 86% of the leaves of Sekiro's object trees match, and every difference of one nibble in
them lies within half a codec step of the boundary between the two nibbles: the files' trees look to have been built
from the vertices before they were quantised, the rule being applied here to the vertices after. :observed{games="sekiro"}

The topology is partly a rule. A mesh's trees are the pieces of one tree over all its primitives: a section is a subtree
cut where it has 127 primitives or fewer, and of the pairs of sibling sections in the mesh trees 99,158 of 99,164 (Sekiro)
and 274,861 of 274,943 (Elden Ring) hold more than 127 primitives together. :observed[every section and mesh tree with a box
for each primitive]

A subtree of 16 leaves or fewer is built from the bottom: joining always the two nodes whose union has the least surface
area (the sum of the products of the extents; the leaf boxes are the primitives' decoded vertices grown by the convex
radius) gives the stock subtree exactly in 1,591,211 of the 2,043,084 maximal subtrees of 3 to 16 leaves of Sekiro (78%) and
4,101,023 of 5,454,605 of Elden Ring (75%), and 18,624,635 of the 19,692,840 inner nodes inside the Sekiro ones (94.6%)
and 49,443,727 of 52,922,096 of Elden Ring's (93.4%). The rate falls with the size, from 98% of the subtrees of 3 leaves
to 67% of 16 leaves (Sekiro; Elden Ring 98% to 66%), and drops to 8.9% (8.6%) at 17 leaves and under 1% by 33. Another
metric (volume, perimeter, squared diagonal, or the increase over the children's surfaces) reproduces fewer of
the nodes (51% to 81% in a Sekiro sample against 91% for the surface). :observed[every section tree with a box for each primitive]

Above 16 leaves the splits are not a surface-area split along one axis, though they cost within a few percent of one
(half of the 7,597 top-level splits of one Sekiro map cost 2% or less over the best; 91% within 10%, and 82% to 93% of the
stock splits are separable by the centres along one axis; the stock split is the best one in 329 of 7,940 splits of 40
meshes, and a binned surface-area split of 8 to 64 bins over the centres or the boxes, either of two costs, is the stock
split in 0.5% to 7% of 2,851). :observed{games="sekiro"} The median split along the longest axis that earlier tools use costs
1.34 times the stock trees' inner-node surface in Sekiro and 1.32 in Elden Ring; a surface-area split down to 16 leaves with
the bottom-up merge below costs 0.92 of the stock's. :observed[every section tree with a box for each primitive]

A rule that reproduces most of the stock trees from the leaves' boxes is the following, each step in single precision and
in the order written. The leaves are the quads in the order the pairing takes them, then the other source triangles in row
order, a leaf's box being its vertices' box grown by the shape's `convexRadius`. :observed[every named collision binder]

1. *Insertion.* The leaves are put one at a time into a binary tree. A leaf descends from the root, growing every box it
   passes to hold it, into the child for which the product of two numbers is smaller (the first child on a tie): the
   squared distance between the centres of that child's box and the leaf's box, and the sum of the extents along the three
   axes of both boxes. Where it stops at a leaf, the two become the children of a new node.
2. *Rebuild.* With three leaves or more, the leaves are listed left to right and the tree is built again from the list. A
   list of more than 16, and the whole list whatever its length, is split: its leaves go into 32 bins on each axis by the place
   of their box's centre in the list's box (times 32, plus one half, truncated, kept within 0 to 31), each bin holding the union
   of its boxes and its count. A bin costs, on its axis, the surface of the union of the bins up to it times their count, plus
   the surface of the union from it on times theirs; the split is the occupied bin of least cost (the first on a tie, axes
   in order, bins from the lowest). The bins before it make the first list and the bins after it the second, each in the order
   of the list; the bin itself goes whole to the side that is empty if exactly one is, and otherwise is sorted by the centres
   of its leaves on the axis (with the quicksort of the interior pass) and divided at half, the lower half to the first list. A
   list of 16 or fewer is joined from the bottom: the two entries whose union has the least surface (the first pair in list
   order on a tie) become the children of a new node that takes the first one's place, the last entry fills the second one's,
   until one is left.
3. *Refinement.* Every node below the root whose two children both have children is looked at in pre-order: the two ways of
   exchanging a grandchild between the children (the first child keeps its first grandchild and takes the other child's first,
   or second, grandchild) are costed by the sum of the surfaces of the two new children, and the cheaper (the second on a tie)
   is made if it costs less than the present sum; passes repeat until none changes anything. Then every node below the root
   has its larger child, by surface, first.
4. *The cut.* A queue starts with the root. An entry with 127 leaves or fewer and at most 255 distinct vertices is a section;
   any other is replaced by its first child, and its second child goes to the end of the queue. The sections are numbered in
   queue order, a section's tree is its subtree, and the mesh tree is the part above the sections.

It is not the stock tool in every detail. The files hold the vertices after they were quantised and the stock tool worked from
the ones before, and a box rounded the other way can send a leaf to another bin or another child. :inferred On the 2,613
Sekiro and 14,218 Elden Ring meshes with two sections or more, the cut gives exactly the stock sections in their stock order
in 592 (23%) and 4,577 (32%), and the mesh tree above them is the stock mesh tree in all of those; 202,885 of the 264,453 stock
sections of those Sekiro meshes (77%) and 441,322 of the 713,169 of Elden Ring (62%) are among the sections it finds. :observed[every named collision binder]
Among the sections the cut finds, take the stock inner nodes whose leaves also make a node of the cut tree: the same ordered shape
is there for this share of Sekiro (Elden Ring) nodes by their number of leaves: 2 leaves 95.6% (94.1%), 3 to 4 94.7% (92.9%), 5 to 8 90.6% (88.5%), 9 to 16
84.8% (81.0%), 17 to 32 75.1% (70.1%), 33 to 64 62.4% (55.7%), 65 or more 45.4% (38.3%); the cut tree lacks a stock node's leaf set in 2% to 8% (2% to 11%) of them. :observed[every named collision binder] Of the two-leaf nodes that the cut tree shares with the stock tree, the larger child comes first, as the stock tool has it, in
4,752,371 of the 4,758,134 of Sekiro whose boxes differ by 1% or more in surface (99.9%), and in 10,146,348 of
10,151,611 of Elden Ring's; where the surfaces are equal in single precision the cut tree has the stock order in 78%
(77%). :observed[every named collision binder] Moving every decoded vertex of a section by a random amount of up to half a codec step
(the same for equal positions) before the same steps lowers the sections found among the Sekiro object meshes from 1,457
to 1,138 of 2,384, and the meshes in exact stock order from 119 to 86 of 155, so a rounding of that size matters at that
scale. :observed{games="sekiro"} The whole shape of a stored section tree, child order included, is that of the
corresponding subtree of the cut tree in 1,093 of 1,597 such sections of Sekiro's objects (68%). :observed{games="sekiro"}

The numbering of a section's primitives is neither the tree's pre-order nor the order of the source rows: in all 2,592
section trees of Sekiro's objects with two primitives or more (that have a source row for every primitive), the payloads do not
increase along the pre-order, and in 2,591 of them the first source rows of the primitives do not increase with the primitive
index. :observed{games="sekiro"} Nor does a simple key give it. In the 2,593 Sekiro object sections with six primitives or
more, no more than 10 have their primitives increasing, or decreasing, in the minimum, the maximum or the centre of their boxes
on any axis, none in the first source row, and 3 of the 2,201 sections that hold both quads and triangles put the quads
before the triangles. A pre-order of the stored tree, with the second child first, or a breadth-first order, forwards or
backwards, gives it in 10 or fewer of 2,610 section trees. Of the 1,597 stock sections of three leaves or more that the cut above finds (and whose numbers run from 0), 1 has the
order of its leaves in the cut tree, forwards or backwards, at any of four stages of the build (after the insertion, after
the rebuild, after the refinement, at the end) as its numbering, and sorting the primitives, taken in row order, with the stock quicksort by
one of those keys gives it in no more than 1 of 699 sections of 4 to 64 primitives. The children of every node cover
consecutive ranges of numbers in 13 of 2,610 section trees (in 51% of the two-leaf nodes, 22% of the three-leaf and 5% of
the four-leaf nodes), as in small regular sections whose leaves read `5, 4, 7, 6, 1, 0, 3, 2` in pre-order. :observed{games="sekiro"}

:::open[How does the stock tool number a section's primitives?]
No order tried gives the numbering, and it does not follow the stored tree. A reading of the stock tool suggests that a
leaf gets its number when it is put into the section's tree, so the numbering comes from the order in which the section's
primitives are handed to that build, which the files do not show. :inferred
:::

A node's first child is the one with the larger union box: in 20,184,136 nodes of Sekiro against 417,276 with the smaller
(913,005 have two boxes of one surface, 834,964 of them two leaves, and of the rest with unequal leaf counts the first child
has more leaves in 37,033 and fewer in 7,311); Elden Ring 53,597,280, 1,699,537, 2,465,256 and 2,279,779 (119,836 and
21,641). :observed[every section tree with a box for each primitive] The leaf payloads, the primitive indices of a section,
do not increase along the pre-order in any of the 2,610 section trees of Sekiro's objects that have three or more nodes: a
leaf's payload is its primitive's index in the section, whose order is not the tree's. :observed{games="sekiro"}

### Simd tree

Every compressed mesh of both games, 3,344 Sekiro and 22,899 Elden Ring, also holds a `simdTree`: an `hkcdSimdTree`
whose nodes each hold four boxes and four data words, a second bounding-volume tree over the mesh's primitives.
:proven[every named collision binder]

```layout
title: Simd tree node (hkcdSimdTree::Node; 112 bytes in Sekiro, which has no flags)
size: 128
fields:
  - {at: 0, size: 16, type: "f32[4]", name: lx, level: proven, note: "minimum x of each of the four lanes' boxes; hx, ly, hy, lz and hz follow at 16-byte steps"}
  - {at: 16, size: 16, type: "f32[4]", name: hx, level: proven}
  - {at: 32, size: 16, type: "f32[4]", name: ly, level: proven}
  - {at: 48, size: 16, type: "f32[4]", name: hy, level: proven}
  - {at: 64, size: 16, type: "f32[4]", name: lz, level: proven}
  - {at: 80, size: 16, type: "f32[4]", name: hz, level: proven}
  - {at: 96, size: 16, type: "u32[4]", name: data, level: proven, note: "one word per lane; the encoding differs by game, below"}
  - {at: 112, size: 1, type: u8, name: isLeaf, level: proven, games: [elden-ring], note: "all four lanes are leaves (or empty)"}
  - {at: 113, size: 1, type: u8, name: isActive, level: proven, games: [elden-ring], note: "0 in every node"}
```

Node 0 is a sentinel and the root is node 1. The sentinel has four empty lanes: a lane is empty when its box has its
minimum above its maximum (about `+3.4 × 10³⁸` and `−3.4 × 10³⁸`) and its data holds nothing. A lane is empty
exactly when its box is. A lane holds a child node, whose index is always above its node's, or a leaf; every node from 2
on is the child of exactly one lane. :proven[every named collision binder]

| | Sekiro | Elden Ring | Confidence |
|---|---|---|---|
| Empty lane | data `0` | data `0` in a node with `isLeaf` clear, `0xFFFFFFFF` in one with it set | :proven[every named collision binder] |
| Child lane | even, non-zero data: child node = `data >> 1` | `isLeaf` clear: child node = `data` | :proven[every named collision binder] |
| Leaf lane | odd data: shape key = `data >> 1` | `isLeaf` set: shape key = `data` | :proven[every named collision binder] |
| Mixed node | a node can hold child and leaf lanes together | no: `isLeaf` is one flag for the node | :proven[every named collision binder] |

A leaf names one primitive by the shape key of its first half: a triangle's key, and for a quad the key of its first
triangle (the second half has no leaf). The leaves of a tree name each triangle, quad and custom primitive of the mesh
exactly once and no dead primitive: 21,686,014 Sekiro and 58,578,382 Elden Ring leaves, 35 of the Elden Ring ones custom primitives.
:proven[every named collision binder] A tree can have no leaf: 15 Sekiro meshes and 347 Elden Ring ones, which are 344
meshes with `hasSimdTree` clear and 3 empty meshes (no primitive, `hasSimdTree` set). In Elden Ring `hasSimdTree` is set in every mesh whose tree has leaves and clear in the
rest. :proven[every named collision binder]{games="elden-ring"}

A child lane's box is exactly the union (componentwise minimum and maximum) of the boxes of the lanes of the node it
names, in all 10,839,251 Sekiro and 22,785,723 Elden Ring child lanes. A leaf's box is exactly the box of its
primitive's vertices (a quad's four) in all 21,686,014 Sekiro leaves and in 58,575,737 of the 58,578,347 Elden Ring
leaves of triangles and quads; the 657 others are larger and the 1,953 others fall short by at most 16 units at the
magnitude of the section's `domain`, none by more. :proven[every named collision binder]

The tree object has `isCompact` in Elden Ring: 1 in every mesh whose tree has leaves and, in the others, a byte of any
value from 0 to 246 rather than a boolean. :proven[every named collision binder]{games="elden-ring"} The mesh data's
`hasSimdTree` is 0 or 1 in all of them. :proven[every named collision binder]{games="elden-ring"}

The nodes of a simd tree are numbered by a rule that differs by game. In Elden Ring a node's children are numbered in lane
order when the node is taken from a stack: the root's children are 2 to 5, then the last of them is taken and its
children get the next numbers, then the one before it, and so on; a node of leaves counts as a child like any other. In
Sekiro the nodes are numbered as a depth-first walk from the root reaches them, taking a node's lanes from the last to
the first: the root's last child is node 2, and a node's last child follows it. Both rules held on every simd tree of 300
nodes or fewer: 278,433 Elden Ring trees (the compressed meshes and the version 3 extern meshes) and 959 Sekiro ones.
:observed


### Section fields

| Field | Content | Confidence |
|---|---|---|
| `domain` | The box of every vertex the section's triangles and quads use, grown by the shape's `convexRadius` on every side (273,210 of 273,218 Sekiro and 722,324 of 722,374 Elden Ring sections; the others are larger on one side). Its `w` lanes are `1 − convexRadius` and `1 + convexRadius` (to rounding) in map meshes. | :proven[every named collision binder] |
| `codecParms` | Offset (xyz) and scale (xyz) of the packed vertices. Not the domain: the offset equals the domain's minimum in only 1,085 Sekiro and 1,071 Elden Ring sections. In 99.2% of Sekiro and 95.2% of Elden Ring sections with packed vertices, some packed vertex has code 0 and some the top code on every axis, so the codec spans the box of the packed vertices. | :proven[every named collision binder] |
| `leafIndex` | The node index of the section's leaf in the mesh-level tree, in all 273,228 Sekiro and 722,405 Elden Ring sections. | :proven[every named collision binder] |
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
tagfiles (3,344 mesh trees, 273,228 sections) and Elden Ring's 25,130 (22,899 mesh trees, 722,405 sections).
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
extern reference: the low nibble is 2 in both, bits 4 and 5 are 1 (the points are 32-bit codes) and bits 6 and 7 are the
number of words after the slot, 1 in a point set and 2 in an extern reference, whose two words are the index. A record is
`2 +` that many words long, and in a section the next record starts where the previous one ends in all 17 pairs of
consecutive records in Sekiro and 223 of the 225 in Elden Ring. :observed The meaning of the bits is read off the record lengths; whether the engine reads
them so is not known. :inferred The third word is
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
every vertex index is in range. That is 12,688 bodies (539,652 vertices, 537,436 triangles, none with a repeated
corner) in Sekiro's 1,145 `f` files and 264,858 bodies (2,233,804 vertices, 1,707,650 triangles, none with a repeated
corner, at most 796 to a body) in Elden Ring's 1,850. :proven[every named collision binder] A reader that follows the
class tables of each file takes all of them: the geometry class of the 2016.2 files (all of Sekiro's, and 67 of Elden
Ring's `f` files) lacks the `useTriangleMaterialAsShapeTag` flag that the 2018.1 class (the other 1,783 Elden Ring
files) carries. :proven[every `f` binder of both installs]

The binders are named `f<area>.hkxbhd` with a `.hkxbdt` payload, in the area's folder (`/map/<area>/` in Sekiro,
`/map/<mXX>/<area>/` in Elden Ring), and their members `f<area>_<model>.hkx`, with the binder's compendium beside
them. Sekiro has nine such binders (nine of its ten maps) and Elden Ring 603; every one is named by the games' map
names. A map part names its collision model by the number of its `h` file, and the `f` file with the same model number
is the part's mesh of this set: 1,087 of Sekiro's 1,145 `f` files have an `h` file of the same model with triangles
and are measured below, 12 have none, and 327 `h` files have no `f` file. :observed{games="sekiro"}

Some `f` files hold no body at all: a tagfile of 808 bytes (Sekiro) or 824 (Elden Ring) whose `bodyCinfos` is empty, so
0 vertices and 0 triangles. Counted from the tagfiles' stored array lengths, Ashina Castle's binder has 192 files, 185
with triangles and 7 without (models 4900, 5100, 12200, 15800, 15900, 16500 and 16600); Hirata Estate's has 140 with 2
(11500 and 11600); Stormveil Castle's has 98 with 43; Raya Lucaria's has 71 with 14. :observed{games="sekiro elden-ring"}

The `f` meshes lie in the same frame as the `h` collision beside them. Measured over every vertex of the 1,087 paired
Sekiro files (1,554,264 vertices, each against the nearest triangle of the `h` file of its model, exact to 4 m), 22.8%
lie within 1 cm of an `h` triangle, 41.3% within 5 cm, 72.6% within 25 cm and 97.2% within 1 m; the same vertices
swapped in y and z lie within 1 m of one for 0.6%, and measured against an `h` file of another model, 1.0%.
:observed{games="sekiro"} Sekiro's `f` meshes are therefore a coarser shell that follows the `h` surface and does not
coincide with it (a minority of vertices lie on it). :observed{games="sekiro"} In the Elden Ring legacy dungeons
(`m10` to `m16`) the shell follows `h` more loosely: 68.6% of `m10_00`'s `f` vertices lie within 2 m, 87.4% of `m15`'s
and 77.9% of `m16`'s. :observed{games="elden-ring"} The dungeons `m30`, `m31`, `m32`, `m34` and `m35` store one-triangle placeholders in
their `h` and `l` files and keep their real collision in `f` (tens of thousands of triangles per file), so there is
nothing beside them to compare with. :observed{games="elden-ring"} In the open-world `m60` tiles `f` and `h` share the tile's horizontal extent (±128 in x and z) but not the vertical
range, and no three-dimensional distance relates them: over 14 paired files of two tile groups (`m60_34_5`, `m60_41_3`;
150,648 `f` vertices), 0.1% lie within 1 m of an `h` triangle, against 1.2% for an `h` file of another tile.
:observed{games="elden-ring"} Ignoring the height, 56.6% of the vertices lie within 1 m of an `h` triangle's footprint,
against 20.1% for another tile's; the control is high because the vertices on the tile's border exist in every tile, so
this shows a shared tile frame in x and z and no more. :observed{games="elden-ring"}

Smithbox calls the `f` set fall protection, used for enemies. :sourced[Smithbox] Whether the player collides with
the `f` meshes is not established. :unknown

### Extern mesh bounding volumes

The `boundingVolumeData` of an `hknpExternMeshShape` (an `hknpExternMeshShapeData`) takes one of two forms, by the version
of its class. Version 2, in all 12,688 Sekiro bodies and 40 Elden Ring ones, has an `aabbTree` and a simd tree that is only
its two empty nodes. Version 3, in 264,816 other Elden Ring bodies with a triangle (and two without), has the simd tree
alone, with `isCompact` 1 in every one that has a triangle. :proven[every `f` binder of both installs]

The `aabbTree` is a static tree like the others with 6-byte nodes (`hkcdStaticTree::Codec3Axis6`): the three nibble bytes,
then `hiData` (a byte) and `loData` (a 16-bit little-endian word) with `value = (hiData & 0x7F) << 16 | loData`. Bit 7
of `hiData` set is an internal node whose second child is `2 × value` nodes after it; clear is a leaf for triangle
`value`. A tree of `n` triangles has `2n − 1` nodes and its leaves name each triangle once, in all 12,728 trees.
:proven[every `f` binder of both installs] The nibbles shrink the box the same way as in the other trees, from the tree's
`domain`, which is the box of the mesh's vertices: 515,025 of Sekiro's 537,436 leaves hold their triangle exactly and
the rest fall short by at most 0.15 mm; 369 of the 386 triangles of the Elden Ring trees hold theirs, the rest short by
at most 4 μm. :observed[every `f` binder of both installs]

The simd form has one leaf per triangle, keyed by the triangle's index in the `hkGeometry`; a node holds four lanes that
are all leaves or all children, with exactly the boxes of the other simd trees (a leaf's box is the triangle's vertex box).
In meshes of up to 32 triangles a node of leaves holds four consecutive keys; in larger meshes the groups follow the
geometry in a way that was not decoded: the keys read in lane order are 0 to `n − 1` in 195,662 of 264,816 trees.
:observed{games="elden-ring"}

`numShapeKeyBits` is `bitlen(n)` for the version 2 form and `bitlen(n) + 1` for version 3 (`n` the triangle count), in
all 12,728 and 264,816 bodies with a triangle. :proven[every `f` binder of both installs]

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
