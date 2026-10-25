---
title: Meshes
description: "How a Unity Mesh object stores vertices, indices and submeshes: channels in interleaved streams, compressed meshes, topologies, streamed vertex data."
games: [skatebird, sledding, peak, big-walk]
sources:
  - title: Unity scripting reference, Mesh and VertexAttributeFormat
    url: https://docs.unity3d.com/ScriptReference/Mesh.html
    note: channel, format and topology numbering
  - title: UnityPy (MeshHelper)
    url: https://github.com/K0lb3/UnityPy
    note: reader of the vertex data and the compressed mesh
implementations:
  - name: primase worlds/unity (read/mesh.rs)
    url: https://github.com/Kalmarv/primase/blob/main/worlds/unity/src/read/mesh.rs
---

A **Mesh** (class 43) holds the vertices of one or more submeshes. Each submesh is a run of indices into the shared
vertices; a renderer's material *i* draws submesh *i*
([scenes](/engines/unity/data-model/scenes-and-hierarchy/#materials-and-submeshes)). The vertex data is either laid out in
channels over interleaved streams, or compressed into bit-packed arrays. :observed

## Vertex channels

A mesh has up to 14 channels, always in this order of the `m_Channels` table: `Vertex`, `Normal`, `Tangent`, `Color`,
`TexCoord0` to `TexCoord7`, `BlendWeight`, `BlendIndices`. :sourced[Unity scripting reference]
Each channel names the **stream** it lives in, its **offset** in a vertex of that stream, a **format** and a
**dimension**. A stream's stride is the sum of its channels' sizes; the streams follow one another in the vertex data, each
starting on a 16-byte boundary. :observed

| Format id | Name | Bytes per component | Confidence |
|---|---|---|---|
| 0 | Float | 4 | :observed |
| 1 | Float16 | 2 | :observed |
| 2 | UNorm8 | 1 | :observed |
| 3 | SNorm8 | 1 | :sourced[Unity scripting reference] |
| 4 | UNorm16 | 2 | :observed |
| 5 | SNorm16 | 2 | :observed |
| 6 | UInt8 | 1 | :observed |
| 7 | SInt8 | 1 | :sourced[Unity scripting reference] |
| 8 | UInt16 | 2 | :observed |
| 9 | SInt16 | 2 | :sourced[Unity scripting reference] |
| 10 | UInt32 | 4 | :observed |
| 11 | SInt32 | 4 | :sourced[Unity scripting reference] |

The vertex data is inside the mesh, or streamed: `m_StreamData` then names a range of the `.resS` beside the file
([StreamingInfo](/engines/unity/archives/player-data-folder/)). :observed{games="skatebird sledding"} SkateBIRD's playground
(`level12`) has 95 meshes, 85 of them readable by scripts (`m_IsReadable`) and 10 not; the unreadable ones keep their vertex
data in the stream file all the same. :observed{games="skatebird"}

Some channels have more components than the data uses. SkateBIRD's `TexCoord0` often has four components (the mesh stores
u, v and two more); the first two are the texture coordinates. :observed{games="skatebird"} A normal is three components;
the stored vertex can pad it to four. :observed

## Compressed meshes

A mesh can store its vertices in `m_CompressedMesh` instead: arrays of **PackedBitVector**s. A packed vector has `n` items of
`bits` bits each, little-endian bit order, and each item decodes to `start + item * (range / (2^bits − 1))` in float. :sourced[UnityPy]

| Content | Storage | Confidence |
|---|---|---|
| positions | packed floats, 3 per vertex | :observed{games="sledding"} |
| texture coordinates | packed floats; `m_UVInfo` has a nibble per channel: bit 2 set means present, the low two bits are the dimension minus 1 | :observed{games="sledding"} |
| normals | x and y packed, z rebuilt from the unit length with a stored sign: `z = sqrt(1 − x² − y²)`, or `(x, y, 0)` normalised when that is negative | :observed{games="sledding"} |
| tangents | x and y packed, z as for normals, and a sign for `w` | :observed{games="sledding"} |
| colours | packed floats, 4 per vertex | :observed{games="sledding"} |
| indices | packed integers | :observed{games="sledding"} |

Over the meshes of Sledding Game's `level1` read by an independent decoder, the stored channels and index buffers of
552 meshes agree bit for bit, and 74 compressed meshes agree to the quantisation of their packed vectors: the dequantised
values differ only by the f32 against f64 rounding. :observed{games="sledding"}

:::open[Skin weights of compressed meshes]
A compressed mesh can also hold bone weights (`m_Weights` in the compressed mesh). The readers used here do not decode them,
and no mesh of the installs measured is known to use them.
:::

## Indices and submeshes

Indices are 16-bit or 32-bit. A submesh is `firstByte` (a byte offset into the index buffer), `indexCount`, `topology` and
`baseVertex`; **the base vertex is added to every index** of the submesh. :observed A decoder that
ignores it reads the wrong vertices for any submesh whose base vertex is not 0. :inferred

| Topology | Id | Notes | Confidence |
|---|---|---|---|
| Triangles | 0 | | :observed |
| Quads | 2 | four indices per quad | :observed |
| Lines | 3 | | :observed |
| Line strip | 4 | one segment per consecutive pair | :observed |
| Points | 5 | | :observed |

A submesh without indices draws nothing. A mesh none of whose submeshes has indices has no geometry. :observed

## Non-finite values

Meshes can store non-finite numbers. A non-finite position leaves a primitive impossible to place; a non-finite normal or
tangent has no direction; a non-finite texture coordinate or colour has no value. Materials carry the same trap: a shader
parameter such as SkateBIRD's `_CameraFadeParams` can store infinity as a sentinel. :observed{games="skatebird"}

## Orientation

Triangles' front faces are clockwise in Unity's left-handed frame. :sourced[Unity scripting reference] See [the frame](/engines/unity/data-model/scenes-and-hierarchy/#the-frame)
for what mirroring it into a right-handed frame does to winding, normals and tangents.

## Geometry of the games

SkateBIRD's playable-level meshes are ProBuilder output and statically batched combined meshes; there are no LODs, no
terrain and no lightmaps, and the playable extent is 200 to 400 m with about 150,000 triangles per level.
:observed{games="skatebird"} Sledding Game and PEAK use `LODGroup`s ([scenes](/engines/unity/data-model/scenes-and-hierarchy/)).
:observed{games="sledding peak"}
