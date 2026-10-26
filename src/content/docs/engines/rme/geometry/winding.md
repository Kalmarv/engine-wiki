---
title: Triangle winding
description: "Which way the triangles of a SHRED mesh face: clockwise relative to the stored normals, over all rigid triangles of the disc, and how a reflecting matrix changes it."
implementations:
  - name: primase worlds/shred (convert.rs)
    url: https://github.com/Kalmarv/primase/blob/main/worlds/shred/src/read/convert.rs
---

The index buffer of a mesh is a plain triangle list ([Model libraries](/engines/rme/geometry/model-quartets/)). Nothing in the file says which side of a triangle is the front, so the side is found by comparing the order of
its three indices with the stored [normals](/engines/rme/geometry/vertex-formats/).

For each stored triangle the geometric normal `(b − a) × (c − a)` was computed from the positions in index order, and its sign was compared with the average of the three stored normals. Over all rigid meshes of the disc: :observed

| Result | Triangles |
|---|---:|
| the geometric normal opposes the stored normals | 5,384,944 |
| the geometric normal agrees with the stored normals | 1,469 |
| ambiguous (the stored normals do not decide) | 23,293 |
| degenerate or with a zero average normal | 7,078 |
| stored triangles in all | 5,416,784 |

So 5,384,944 of the 5,386,413 decisive triangles, 99.97%, are wound **clockwise relative to the stored normals**: the indices run in the direction that makes the geometric normal point away from the normal the vertices store. :proven[all stored triangles of the rigid meshes]
The same counts result whether the mesh is read in its own frame or under a mirroring frame. :observed
The 1,469 agreeing triangles are not explained. :unknown

A reader that wants counter-clockwise front faces swaps two indices of every triangle, and does so once more for a placement whose matrix has a negative determinant ([Placements](/engines/rme/geometry/placements/)): the mirror turns a clockwise triangle into a counter-clockwise one. :inferred
