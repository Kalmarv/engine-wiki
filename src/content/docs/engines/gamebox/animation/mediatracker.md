---
title: MediaTracker triangles and key functions
description: "The keyed data of map files: the MediaTracker's 2-D and 3-D triangle blocks with their per-key vertex positions, and the key-function classes CFuncKeys and CFuncKeysReal."
sources:
  - title: GBX.NET
    url: https://github.com/BigBang1112/gbx-net
    note: version 2.5.0; class IDs, chunk lists and the handwritten and generated readers
---

A map's MediaTracker clips are made of blocks, and some blocks animate by keys: a list of times, and for each time a full set of
values. The triangle blocks key the corners of a coloured mesh; the key functions are curves of plain numbers.
:inferred[from the classes and their chunks below]

## Classes

| Class | ID | Derives from | Confidence |
|---|---|---|---|
| `CGameCtnMediaBlockTriangles` | `0x03029000` | | :sourced[GBX.NET] |
| `CGameCtnMediaBlockTriangles2D` | `0x0304B000` | `CGameCtnMediaBlockTriangles` | :sourced[GBX.NET] |
| `CGameCtnMediaBlockTriangles3D` | `0x0304C000` | `CGameCtnMediaBlockTriangles` | :sourced[GBX.NET] |
| `CFuncKeys` | `0x05002000` | | :sourced[GBX.NET] |
| `CFuncKeysReal` | `0x0501A000` | `CFuncKeys` | :sourced[GBX.NET] |

`0x05002000` is `CFuncKeys`, the base class, not `CFuncKeysReal`. :sourced[GBX.NET]

## Triangle blocks

The 2-D and 3-D triangle blocks carry no triangle chunk of their own: both read chunk `0x03029001` of their base class, in the
order below. "Counted" means a 32-bit count followed by that many items. :sourced[GBX.NET]

| Order | Field | Type | Confidence |
|---|---|---|---|
| 1 | Key times | counted `f32` | :sourced[GBX.NET] |
| 2 | Position rows, columns | two `u32`: rows equal the number of keys, columns the number of vertices | :sourced[GBX.NET] |
| 3 | Positions | rows × columns `vec3` (three `f32`), row by row: every vertex's position at the first key, then at the second | :sourced[GBX.NET] |
| 4 | Vertex colours | counted `vec4` | :sourced[GBX.NET] |
| 5 | Triangles | counted triples of `i32` vertex indices | :sourced[GBX.NET] |
| 6 | Pick mode | `i32` | :sourced[GBX.NET] |
| 7 | Pick plane normal, position | two `vec3` | :sourced[GBX.NET] |

So a triangle block is one mesh whose topology and colours are fixed and whose vertices move from key to key.
:inferred[from the layout]

A strict reader of this layout and GBX.NET agree on every byte of the 42 `Triangles2D` and 36 `Triangles3D` nodes found in the
81 downloaded maps both could read. :observed[81 maps]

## Key functions

`CFuncKeys` stores the key positions: chunk `0x05002001` holds the X values (counted `f32`) and chunk `0x05002003` an
identifier. `CFuncKeysReal` reads those and adds chunk `0x0501A001`: the Y values (counted `f32`) and an `i32` interpolation
mode. :sourced[GBX.NET]

Of 100 maps of the 2026 top-downloads list, one holds `CFuncKeysReal` nodes, three of them, and it reaches them through
[TMUnlimiter's version 7 extension data](/engines/gamebox/world/tmunlimiter/); the map's ordinary clip graph does not lead to them. :observed[100 maps]

:::open[What do the pick fields and interpolation values mean?]
The pick mode, the pick plane and the values of the interpolation mode carry GBX.NET's names only; what the game does with them
is not established.
:::
