---
title: Navigation meshes
description: The nvmhktbnd binders of Sekiro and Elden Ring - Havok AI navmeshes, Sekiro's cluster graph, Elden Ring's query tree and user edges.
sources:
  - title: Smithbox
    url: https://github.com/vawser/Smithbox
    note: draws hkaiNavMesh faces and the graph; names the binder "navmesh"
implementations:
  - name: havok-formats navmesh reader
    url: https://github.com/Kalmarv/havok-formats/blob/main/src/navmesh.rs
  - name: havok-formats polygon triangulator
    url: https://github.com/Kalmarv/havok-formats/blob/main/src/polygon.rs
---

Every map has a `*.nvmhktbnd.dcx` binder beside its other map files: a [BND4](/engines/fromsoft/archives/bnd4/) of Havok
tagfiles, one for each navigation region of the map, that hold the walkable surface the AI plans paths over. The members
are named by the build path they were made at (`…\navimesh\bind6\n10_00_00_00_000700.hkx`; Elden Ring also has members
whose name starts with `o`). A tagfile's root is an `hkRootLevelContainer` whose named variants are `hkai*` objects, each
named for its class. :observed

Over the 10 Sekiro and 695 Elden Ring navmesh binders (every one the archives hold, found from the dictionaries and the
maps' names), all 1,509 and 7,438 member tagfiles read with a strict reader. Each carries its own type table, so no
compendium is needed, and the class layouts below are the same in both games (`hkaiNavMesh` is 208 bytes, version 16, in
both). :proven

| | Sekiro | Elden Ring |
|---|---|---|
| Binders | 10 | 695 |
| Tagfiles (SDK) | 1,509 (`20160200`) | 7,438 (`20180100`) |
| Faces | 279,053 | 6,317,094 |
| Edges (user edges) | 1,160,836 (0) | 26,313,941 (2,597,337) |
| Vertices | 454,816 | 13,306,284 |
| Tagfiles whose mesh has no face | 94 | 4,027 |
| `hkaiDirectedGraphExplicitCost` | 1,509 | none |
| `hkaiStaticTreeNavMeshQueryMediator` (nodes) | none | 6,021 (12,630,777) |
| `hkaiUserEdgeSetupArray` (setups) | 430 (1,463) | 188 (673) |
| Confidence | :proven{games="sekiro"} | :proven{games="elden-ring"} |

Each tagfile holds exactly one `hkaiNavMesh` and at most one object of each other class. In Sekiro every tagfile also holds
the graph (1,079 with only that, 430 with the user-edge setups too). In Elden Ring every mesh with faces has a mediator, with
the user-edge setups in 188 of them; 1,417 tagfiles hold an empty mesh alone and 2,610 an empty mesh with an empty tree.
:proven

## The mesh

`hkaiNavMesh` holds `faces`, `edges`, `vertices` (four floats each; the fourth is not part of the data), `faceData` and
`edgeData` (`faceDataStriding` and `edgeDataStriding` words a face or edge, 1 in every mesh with faces), an `aabb`, an
`erosionRadius` (0 everywhere), a `userData` word (0, except 1 in 40 Elden Ring meshes), an empty `streamingSets` array
and a pointer to clearance-cache seeding data that this page does not describe (present in 1,415 Sekiro and 6,053 Elden
Ring tagfiles). :proven

```layout
title: hkaiNavMesh::Face
size: 16
note: Both games.
fields:
  - {at: 0, size: 4, type: i32, name: startEdgeIndex, level: proven, note: "the face's first regular edge; the faces' ranges follow one another from 0"}
  - {at: 4, size: 4, type: i32, name: startUserEdgeIndex, level: proven, note: "-1 when the face has no user edges"}
  - {at: 8, size: 2, type: i16, name: numEdges, level: proven, note: "3 or more"}
  - {at: 10, size: 2, type: i16, name: numUserEdges, level: proven}
  - {at: 12, size: 2, type: i16, name: clusterIndex, level: proven, note: "Sekiro 0 up to the graph's node count; Elden Ring -1 on every face"}
  - {at: 14, size: 2, type: u16, name: padding, level: proven, value: "0xCDCD", note: "on all 6,596,147 faces"}
```

```layout
title: hkaiNavMesh::Edge
size: 20
note: Both games.
fields:
  - {at: 0, size: 4, type: i32, name: a, level: proven, note: "vertex the edge starts at"}
  - {at: 4, size: 4, type: i32, name: b, level: proven, note: "vertex it ends at"}
  - {at: 8, size: 4, type: u32, name: oppositeEdge, level: proven, note: "0xFFFFFFFF on the mesh boundary, else the index of an edge of the mesh"}
  - {at: 12, size: 4, type: u32, name: oppositeFace, level: proven, note: "0xFFFFFFFF together with oppositeEdge, else the face that owns that edge"}
  - {at: 16, size: 1, type: u8, name: flags, level: unknown, note: "4 on every regular edge; 20 or 52 on user edges"}
  - {at: 17, size: 1, type: u8, name: paddingByte, level: proven, value: "0"}
  - {at: 18, size: 2, type: hkHalf16, name: userEdgeCost, level: proven, value: "0", note: "on all 27,474,777 edges"}
```

A face is a ring: its edges, `numEdges` from `startEdgeIndex`, chain from `a` to `b` and the last returns to the
first edge's `a`; every edge of a mesh belongs to exactly one face. The edges of a mesh are the faces' regular edges in
face order and then the user edges. A regular edge's `oppositeEdge` is the edge of the face on its other side, and that
edge's opposite is this one, with the owning face in `oppositeFace`. The two need not be each other's reverse (`a` and `b`
swapped): that holds for all but 266 of Sekiro's 842,440 and 274,614 of Elden Ring's 18,446,796 regular edges that have an
opposite. :proven

Faces wind counter-clockwise seen from above (+y), except 199 of Sekiro's and 8,835 of Elden Ring's, and degenerate faces
(zero area; 2,061 in Elden Ring). :proven About 5 % of Sekiro's faces (13,019) and 2 % of Elden Ring's (135,629) are not
convex seen from above, and a face's corners lie up to 0.65 m (Sekiro) and 1.38 m (Elden Ring) off its mean plane, so
a fan from one corner is wrong for some faces. Cutting each face into triangles by ear clipping in the plane of its
Newell normal, dropping only cuts with no area in 3-space, gives 602,658 triangles in Sekiro and 11,079,642 in Elden
Ring, none turned against its face, with the projected area of the triangles equal to the face's within 1e-9 of it and
their area vectors adding up to the face's within 2e-11 of it on every face; two zero-area faces of Elden Ring have no
ear. :proven Some corners are straight seen along the normal's largest axis but step off the face's plane: a
triangulation that drops every cut with no area in the projection plane loses their triangles (208 in Sekiro, 3,826 in
Elden Ring) and leaves gaps in the surface. :proven

The `aabb` contains every vertex of every mesh with faces and is never tight. Its fourth lanes hold a margin, minus on the
minimum and plus on the maximum (1.1 in every Sekiro mesh; 2, 2.4 or 8 in Elden Ring's). In Sekiro the box is the
vertices' bounds grown by the margin in 785 of 1,415 meshes with faces and larger in the rest; in Elden Ring that holds in
39 of 3,411. :proven

`faceData` words are bit sets: Sekiro's are 0, 1, 4 and 5, Elden Ring's are 18
distinct values built from bits 0, 6, 12, 16, 17, 20, 24 and 28. What the bits mean is not shown by the files.
:unknown{games="sekiro elden-ring"} `edgeData` is 0 on every regular edge. :proven

## Sekiro: the cluster graph

Every Sekiro tagfile has an `hkaiDirectedGraphExplicitCost`: `positions` (one a node), `nodes` and `edges`, with no node
or edge data (stride 0) and no streaming sets. The nodes' edge ranges tile the edges in node order, an edge's `target` is a
node, every edge's `flags` is 0 and its cost a half float. :proven{games="sekiro"}

```layout
title: hkaiDirectedGraphExplicitCost::Node
size: 8
games: [sekiro]
fields:
  - {at: 0, size: 4, type: i32, name: startEdgeIndex, level: proven, note: "each node's edges start where the previous node's end"}
  - {at: 4, size: 4, type: i32, name: numEdges, level: proven}
```

```layout
title: hkaiDirectedGraphExplicitCost::Edge
size: 8
games: [sekiro]
fields:
  - {at: 0, size: 2, type: hkHalf16, name: cost, level: proven}
  - {at: 2, size: 2, type: u16, name: flags, level: proven, value: "0"}
  - {at: 4, size: 4, type: u32, name: target, level: proven, note: "a node index"}
```

The graph is the cluster graph of the mesh in its file: it has one node for each `clusterIndex` of the faces
(numbered from 0, every number used), and an edge from cluster x to cluster y exactly when an edge of a face of x has its
opposite in a face of y, once and in both directions. This holds in all 1,509 tagfiles (20,803 nodes, 52,200 edges). A
node's position lies within 10 m of the mean of its faces' centres in all but 3 of the 20,803 nodes and inside the
mesh's `aabb` in every tagfile. :proven{games="sekiro"}

## Elden Ring: the query tree and user edges

An `hkaiStaticTreeNavMeshQueryMediator` names the tagfile's mesh and an `hkcdStaticAabbTree` over its faces. The tree is
stored in pre-order, like the trees of compressed collision meshes, with 6-byte nodes: three axis-nibble bytes, `hiData`
and `loData`. The node's data is `hiData << 16 | loData`; bit 23 set is an internal node whose second child is
`2 × (data & 0x7FFFFF)` nodes on, clear is a leaf for the face `data`. The first child of an internal node is the next
node. The axis bytes shrink the parent's box as in the 4- and 5-byte trees (the high nibble from the minimum side, the
low from the maximum, by `extent × nibble² / 226`), and the root decodes from the tree's `domain`. :proven{games="elden-ring"}

```layout
title: hkcdCompressedAabbCodecs::Aabb6BytesCodec
size: 6
games: [elden-ring]
fields:
  - {at: 0, size: 3, type: "u8[3]", name: xyz, level: proven, note: "per axis: high nibble shrinks from the minimum side, low nibble from the maximum"}
  - {at: 3, size: 1, type: u8, name: hiData, level: proven}
  - {at: 4, size: 2, type: u16, name: loData, level: proven}
```

On the 3,411 trees of meshes with faces, every tree is valid under this rule, has one leaf for each face and `2 × faces - 1`
nodes, and every corner of a face lies inside its leaf's box within 0.5 mm. The 2,610 trees of meshes without faces have no
node, and a domain of `±FLT_MAX`. A mediator's `navMesh` is the tagfile's mesh in all 6,021. :proven{games="elden-ring"}

Elden Ring meshes have user edges: edges after the regular ones that join a face to a face elsewhere. The endpoints of a
user edge are vertices of the mesh that are not corners of the face that owns the edge. Their `flags` are 20 or 52 (the
flag values 16 and 32 are set on user edges only), their `edgeData` is never 0 (its low byte is 2, 4, 18 or 20; the
second byte has 163 values; nothing above it is set), and the opposite of a user edge is a user edge, in another face in
all but 50 of 2,595,002 cases; the 2,335 user edges with no opposite all have flags 52. 837,953 of the 6,317,094 faces own
user edges, 1 to 56 each. In 82 of the 1,696 meshes that have user edges they follow the faces in face order, in the other
1,614 they do not. :proven{games="elden-ring"} What the flag bits and the `edgeData` bytes mean is not shown by the files.
:unknown{games="elden-ring"}

Each `hkaiUserEdgeSetupArray` holds `edgeSetups`: two oriented boxes (a transform and half extents), two user-data words,
the two directional costs, the two world-up vectors, `direction`, `space` and `forceAlign`. `worldUpA` is (0, 1, 0) in
all of them; `forceAlign` is 1 in all; `direction` is 1 or 3; `space` is 0 or 1 in Elden Ring and 1 in Sekiro. Sekiro
tagfiles carry the arrays too, though their meshes have no user edges. :observed

A box's `transform` is stored as a flat array of 16 floats, not as a class: the rotation's three columns of four floats,
then the translation and one more float. The columns' xyz are orthonormal in all 4,272 boxes (2,926 in Sekiro, 1,346 in
Elden Ring); the fourth float of each column is padding, 0 in every Elden Ring box and stale data in all but 2 of Sekiro's;
the float after the translation is 0 in every Sekiro box and not 0 in any Elden Ring one; the half extents are positive in
all. :proven

:::open[Which navmesh data do the `.nva` files hold?]
The dictionaries name a `.nva.dcx` file beside many Elden Ring navmesh binders. It is not a Havok tagfile and is not
read here.
:::

:::open[What are the bits of an edge's `flags` and of the face and edge data words?]
The values are listed above; no file names them.
:::
