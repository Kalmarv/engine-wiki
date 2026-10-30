---
title: Placements and matrices
description: "How a level puts meshes in the world: the 48-byte placement records of an SCP, the 64-byte matrices they point at, instancing, and the mirror matrices."
implementations:
  - name: rme-formats (scene.rs)
    url: https://github.com/Kalmarv/rme-formats/blob/main/src/scene.rs
---

A level's meshes live in its [model library](/engines/rme/geometry/model-quartets/) with their own local coordinates; the **SCP** of the same quartet says where each is placed. The first table of the SCP is a list of
**placements**, each naming a mesh by its id and pointing at the 4×4 matrix that carries it into the level. The same mesh is placed many times: CHARLIE's base level has 85 placements of 54 meshes. :observed

The SCP starts with a header whose words at `0x10` and `0x14` are the placement count and the offset of the table. Its other tables (nodes, spots, splines, lights) are described with the world.

```layout
title: SCP header (placement fields)
size: 24
games: [shred]
note: Only the placement table is described here; the header continues to 0x48 and holds further tables.
fields:
  - {at: 0, size: 4, type: u32, name: magic, value: "0xBABF003C", level: proven}
  - {at: 4, size: 4, type: u32, name: unknown, level: unknown}
  - {at: 8, size: 2, type: u16, name: header_size, value: "0x0048", level: observed}
  - {at: 10, size: 2, type: u16, name: load_flags, level: observed, note: "0 on disc; the loader sets bit 1 for borrowed storage and bit 4 once its offsets are relocated"}
  - {at: 12, size: 4, type: u32, name: unknown, level: unknown}
  - {at: 16, size: 4, type: u32, name: placement_count, level: proven, note: "85 in CHARLIE, 3,440 in MIKE"}
  - {at: 20, size: 4, type: u32, name: placement_offset, level: proven, note: "0x50 in CHARLIE"}
```

## Placement record

```layout
title: Placement record
size: 48
games: [shred]
note: The executable relocates the words at 0x00, 0x28 and 0x2C of each record to pointers when it loads the SCP.
fields:
  - {at: 0, size: 4, type: u32, name: matrix_offset, level: proven, note: "absolute offset in the SCP of a 64-byte matrix"}
  - {at: 4, size: 4, type: u32, name: unknown, level: unknown}
  - {at: 8, size: 4, type: u32, name: mesh_id, level: proven, note: "joins the MLP resource table and the mesh's own id"}
  - {at: 12, size: 4, type: u32, name: name_hash, level: observed, note: "case-sensitive sdbm of the object's name; task icons carry a task identifier from MAIN.DB"}
  - {at: 16, size: 24, type: "u8[24]", name: opaque, level: unknown, note: "ids, flags and sentinels"}
  - {at: 40, size: 4, type: u32, name: pointer, level: observed, note: "relocated by the loader; target not decoded here"}
  - {at: 44, size: 4, type: u32, name: pointer, level: observed, note: "relocated by the loader; target not decoded here"}
```

All 168,887 placements of the 657 quartets, those with skinned meshes included, name an id that exists in the MLP of their own quartet. The join is by id, not by position. :proven[all 657 quartets]
Repeated ids are instancing: nothing in the SCP merges them or gives a placement a parent. :observed
The word at `0x0C` names the placed object: for the task objects of a level it is the sdbm of one of the `IDENTIFIERS` of a task or session in [MAIN.DB](/engines/rme/data-model/main-db/). :observed[CHARLIE's 227 challenge-session placements]
That the game activates a task's icon through this join is read from the names, not followed in the running game. :inferred

## Matrix

A matrix is sixteen big-endian `f32`, four rows of four. For a mesh position `p` and the stored floats `m`, the position in the level is

```
world[k] = p.x * m[k] + p.y * m[4+k] + p.z * m[8+k] + m[12+k],      k = 0, 1, 2
```

That is, the first three rows are the axes and the fourth the translation (a row-vector convention). :proven[all 168,887 placements]
Every matrix is finite and affine: `m[3] = m[7] = m[11] = 0` and `m[15] = 1`. Translation, rotation, non-uniform scale and reflection all occur. :proven[all 168,887 placements]
The mesh-local matrix in each mesh's metadata is the identity in every case, so nothing further is applied before the placement. :proven[all 21,309 resources]

Reflections are real: the first placement of CHARLIE has `m = diag(−1, 1, 1, 1)`. A reflection reverses the winding of the mesh it places, so a reader that ignores the matrix's sign loses it ([Triangle winding](/engines/rme/geometry/winding/)). :observed

Units are not stated anywhere in the data; vertex positions reach about ±6,300 in a single mesh. :unknown

## Handedness and projection

The world frame is **left-handed with Y up and +Z forward**. The running game's camera matrices, read from its memory while a level was loaded, show it: the view matrix's 3×3 part has determinant +1; the player, who stands in front of the camera, has view-space z = +2.456; moving along world +X moves the projected point to the right (normalised device x +0.309); and the projection's second diagonal term is positive (y up). :proven[camera matrices read live in the running game; the convention does not depend on the scene]
A reader that works in a right-handed frame has to mirror Z, which also reverses triangle winding ([Triangle winding](/engines/rme/geometry/winding/)). :inferred
The projection is a row-major perspective matrix with a vertical field of view of 65.81° (98° horizontally at 16:9). :observed[one live capture]

The root matrices of the level data are `diag(−1, 1, 1)`; they are probably the mirror from the authoring tools' right-handed frame into this one. :inferred
