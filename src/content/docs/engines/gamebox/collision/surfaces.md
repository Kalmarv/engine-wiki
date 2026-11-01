---
title: Collision surfaces
description: "CPlugSurfaceGeom, the collision shape of a tree: its chunk, the shape kinds (mesh, ellipsoid, box), the mesh's cooked triangles and octree, and the material ID that follows."
games: [tmnf]
sources:
  - title: GBX.NET
    url: https://github.com/BigBang1112/gbx-net
    note: version 2.5.0; CPlugSurfaceGeom and its surface readers
---

A tree's collision shape is a `CPlugSurfaceGeom`: a box, an ellipsoid or a triangle mesh, the mesh stored cooked, with a plane
per triangle and an octree over them. :observed[the install's packs and three TMUnlimiter maps]

## Chunk 0x0900F004

| Order | Field | Type | Confidence |
|---|---|---|---|
| 1 | Ident | ident | :observed |
| 2 | Bounding box | `BoxAligned`: centre, then half-size (six `f32`) | :observed |
| 3 | Surface kind | `i32` | :observed |
| 4 | The shape | by kind, below | :observed |
| 5 | Material ID | `i16` | :observed |

This is the order in the surfaces TMUnlimiter maps embed. :observed[three maps] The packs' 812 surfaces are of surface
version 0 and store no surface index; their kinds are 801 meshes, 8 ellipsoids and 3 boxes. :observed[812 nodes of the packs]

| Kind | Shape | Confidence |
|---|---|---|
| 1 | Ellipsoid: a `vec3` | :observed |
| 6 | Box: a `BoxAligned` | :observed |
| 7 | Mesh | :observed |

The box reads as centre and half-size: in the 77 meshes of three TMUnlimiter maps it equals the vertices' bounds that way.
:observed[77 meshes]

### Mesh (version 3)

| Order | Field | Type | Confidence |
|---|---|---|---|
| 1 | Vertices | counted `vec3` | :observed |
| 2 | Triangles | counted 32-byte records: a `vec4` plane, three `i32` vertex indices, an `i16` surface index and two `u8` | :observed |
| 3 | Octree | version 3, counted 32-byte cells | :observed |

:observed[the 77 meshes of three maps]

## In pack files

Reading this chunk in a pack also makes a dummy write of `f32(centreX − halfSizeX)`, little-endian, right after the box: in
GBX.NET's terms the box's `X − X2`, its first and fourth floats. :observed[the writes GBX.NET makes over the install's packs]

:::open[What are the triangle's two bytes and the octree's cells?]
The triangle record's last two bytes and the 32-byte octree cells are read and accounted for; their meaning is not established.
Nor is it written down here how the packs' surface version 0 differs from the order above.
:::
