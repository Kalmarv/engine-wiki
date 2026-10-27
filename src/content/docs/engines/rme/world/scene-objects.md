---
title: Spot cameras, locators and occluders
description: "Three small section types of the SCP blob: type 3 spot cameras (a spot name and two frames), type 5 locators (one waypoint) and type b occluders (a matrix and a line outline)."
implementations:
  - name: rme-formats (scp_cameras.rs)
    url: https://github.com/Kalmarv/rme-formats/blob/main/src/scp_cameras.rs
---

Besides spot chunks, splines and lights, the [SCP blob](/engines/rme/world/scp-tables/) holds three small kinds of placed object. All numbers are big-endian, and every matrix is a 64-byte row-major affine matrix with the translation in floats 12 to 14, finite and with the fourth column `(0, 0, 0, 1)`. :proven[all 281 camera, 1 locator and 341 occluder matrices]

## Spot cameras (type 3)

A section holds `count` records of 48 bytes from its data offset, then `count × 2` matrices of 64 bytes; its size is `data_offset + count × 176`. The disc has 10 sections, one in each level's base SCP, with 281 records. :proven[all 10 sections]

```layout
title: Spot camera record
size: 48
games: [shred]
fields:
  - {at: 0, size: 4, type: u32, name: id, level: observed, note: "the record's own id: 0x3666B710 in most records, 0x1A570D21 and others in two levels"}
  - {at: 4, size: 4, type: u32, name: pool_leftover, level: unknown, note: "allocator leftovers; varies"}
  - {at: 8, size: 4, type: u32, name: spot_name, level: observed, note: "sdbm of a spot name of the database: BigJumpOne, VertAirTwo, Chlg17_ObjSpot_Cam12_AnyTrick"}
  - {at: 12, size: 4, type: u32, name: pool_leftover, level: unknown}
  - {at: 16, size: 4, type: u32, name: parent, level: observed}
  - {at: 20, size: 4, type: f32, name: value, level: unknown, note: "53.638 in all 281 records"}
  - {at: 24, size: 4, type: u32, name: flag, level: unknown, note: "1 in all 281 records"}
  - {at: 28, size: 4, type: u32, name: frame_offset, level: proven, note: "from the section's start, of a matrix in the array after the records"}
  - {at: 32, size: 4, type: u32, name: second_frame_offset, level: proven, note: "likewise"}
  - {at: 36, size: 12, type: "u32[3]", name: pool_leftover, level: unknown}
```

Both offsets lie in the matrix array in all 281 records. :proven[all 281 records]
The section's loader copies the translations of the two matrices, and the record's offset 20, into the object whose id the record holds. :observed[static reading of the executable]
That the records are **cameras** (the first matrix the camera's frame, the second the frame of the point it looks at) is read from the spot names (`..._Cam12_...`) and from the pair of frames: the second matrix has the linear part `diag(−1, 1, 1)` in 159 of the 281 records and a rotation in the others. The function that uses them was not traced. :inferred

## Locators (type 5)

A section holds `count` records of 16 bytes then `count` matrices; its size is `data_offset + count × 80`. The disc has one section, in the `echo` base SCP, with one record. :proven[all 547 SCPs]

```layout
title: Locator record
size: 16
games: [shred]
fields:
  - {at: 0, size: 4, type: u32, name: class, level: proven, note: "sdbm of RMLocator"}
  - {at: 4, size: 4, type: u32, name: name, level: unknown, note: "sdbm of the locator's name"}
  - {at: 8, size: 4, type: u32, name: kind, level: proven, note: "sdbm of Waypoint"}
  - {at: 12, size: 4, type: u32, name: matrix_offset, level: proven, note: "from the section's start"}
```

The matrix is a scaled rotation whose translation is the origin to within 1e-4. What a waypoint is used for is unknown. :observed

## Occluders (type b)

A section holds `count` records of 16 bytes from its data offset. After them come, for each record in order, a 64-byte matrix and an outline of line segments; the matrices and outlines tile the section exactly. The disc has 9 sections in 9 SCPs with 341 records. :proven[all 9 sections]

```layout
title: Occluder record
size: 16
games: [shred]
fields:
  - {at: 0, size: 4, type: u32, name: name, level: observed, note: "sdbm of RMOccluder or RMOccluder<N>, N below 1000, for 276 of the 341; the other 65 hash names that are not known"}
  - {at: 4, size: 4, type: u32, name: matrix_offset, level: proven, note: "from the section's start"}
  - {at: 8, size: 4, type: u32, name: outline_offset, level: proven, note: "the matrix's offset plus 64"}
  - {at: 12, size: 4, type: u32, name: flags, level: observed, note: "the low 16 bits give the outline's shape; the high 16 vary from record to record and are unknown"}
```

The outline is a list of segments, each two vec4 of x, y, z and w = 1. The low half of the flags says how many: `0x0800` is four segments (128 bytes, the outline of a rectangle; 269 records) and `0x1801` is twelve (384 bytes, the edges of a box; 72 records). No other low half occurs. :proven[all 341 records]
The outline points are in the matrix's own space by the stored values (coordinates from −14.7 to 4.8 in a box of one SCP, ±4 in most), but the engine code that applies them was not found. :inferred
The engine has no section handler for the type. The only consumer found is the Lua binding `set_occluder_enabled`, which names occluders; whether the renderer culls with them is not established. :observed[static reading of the executable]

:::open[What are these objects used for?]
The engine function that uses the spot cameras' frames, the meaning of the camera value 53.638, the waypoint's use and the occluder's high flag half are open.
:::
