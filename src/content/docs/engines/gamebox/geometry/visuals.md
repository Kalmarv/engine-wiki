---
title: Solids, trees and visuals
description: "How a block's or object's geometry is stored: CPlugSolid and its CPlugTree hierarchy, the visual classes, the geometry flags, the packed and unpacked vertex layouts, index buffers, sprites, 2-D quads and texture coordinates."
games: [tmnf]
sources:
  - title: GBX.NET
    url: https://github.com/BigBang1112/gbx-net
    note: version 2.5.0; the Plug classes, their chunks and its pack-file extraction
---

A model is a `CPlugSolid` whose tree of `CPlugTree` nodes places visuals, surfaces and lights. A visual holds the vertices:
positions and, by its geometry flags, normals, colours and texture coordinates, packed into 32-bit words in the game's own
packs and stored as plain floats in the visuals TMUnlimiter maps embed. :observed[the install's packs and three TMUnlimiter maps]

The counts below are a census of the 1,670 pack files of the install whose classes all read, as GBX.NET extracts them.
:observed[1,670 pack files]

## Solids and trees

`CPlugSolid` (`0x09005000`) has exactly the chunks `0x09005000`, `0x0900500E`, `0x09005010`, `0x09005011` and `0x09005012` in
all 684 files that hold one. :observed[684 files]

A `CPlugTree`'s children are a [deprecated node list](/engines/gamebox/data-model/nodes/#deprecated-node-lists) in its chunk
`006`. A tree's location is a 3 × 4 transform whose 3 × 3 part is stored row by row and applied as `M × v`: rotated fence trees
land inside the block's 0 to 32 m square only that way. :observed[the Stadium fence trees]

| Class | Chunks | Confidence |
|---|---|---|
| `CPlugTreeLight` (845 nodes) | `CPlugTree`'s, then `0x09062004`, a reference to a `CPlugLight` | :observed |
| `CFuncTreeSubVisualSequence` (24 nodes) | `0x0500B005`, `0x05031001` (an ident), `0x05031002` (a reference to a `CFuncKeysNatural`), `0x05031003` | :observed |
| `CFuncKeysNatural` | `0x05002001` (counted `f32`), `0x05002003` (an ident), `0x05030000` (counted integers) | :observed |
| `CPlugDecoratorSolid` (`0x090A3000`, 2 files) | A deprecated node list of `CPlugDecoratorTree` (`0x090A2000`, 5 nodes, only chunk `0x090A2009`) | :observed |

## Geometry flags

`CPlugVisual` chunk `0x0900600E` stores the geometry flags as a `u32`. :observed

| Bit | Meaning | Confidence |
|---|---|---|
| 3, 4 | Static geometry with indices | :observed |
| 5 | Vertices store a normal | :observed |
| 6 | Vertices store a colour | :observed |
| 7 | Normals (and tangents) are packed | :observed |
| 8 | Colours are packed | :observed |
| 9 | Explicit attributes: bits 5 and 6 say what a vertex stores | :observed |

The 8,863 `CPlugVisualIndexedTriangles` nodes of the packs store `0x398` (984 nodes: no normals, no colours), `0x3B8` (7,428:
normals) or `0x3F8` (451: normals and colours): bits 7, 8 and 9 always set. None has vertex streams. :observed[8,863 nodes]
The 232 visuals embedded in three TMUnlimiter maps store `0x78`, with bits 7 to 9 never set. :observed[three maps]

## Vertices

`CPlugVisual3D` chunk `0x0902C004` holds the vertices, interleaved. :observed

| Flags | Vertex | Confidence |
|---|---|---|
| Bits 7 to 9 set (the packs) | `vec3` position; a packed normal (`u32`) if bit 5; a packed colour (`u32`) if bit 6 | :observed[8,863 nodes] |
| `0x78` (embedded in maps) | `vec3` position, `vec3` normal, `vec4` RGBA colour, all `f32` | :observed[232 visuals] |

The embedded visuals' normals have unit length in all 232. :observed[232 visuals]

A packed normal is three signed 10-bit fields, x in bits 0 to 9, y in 10 to 19 and z in 20 to 29, each divided by 511. A packed
colour is ARGB bytes divided by 255: alpha in bits 24 to 31, red 16 to 23, green 8 to 15, blue 0 to 7. :observed

The same chunk's tangent and bitangent arrays hold 0 entries or one per vertex, 4 bytes each when bit 7 is set; 6,291 nodes
have them. :observed[the packs] How they are packed is not established. :unknown

A visual has 0 to 3 sets of texture coordinates; a set of version 0 is two `f32` per vertex. :observed

### Texture coordinates

Texture coordinates have their origin at the image's bottom-left, v pointing up. A DDS image decodes top row first, so a
consumer with a top-left origin samples at (u, 1 − v). :observed[campaign map A01] With v as stored, the quad of
`StadiumStartLogo` has v = 1 on its upper edge and every sign's text (the TrackMania United banner, the START barriers) is
drawn upside down; with 1 − v all read upright. :observed[campaign map A01]

## Bounding boxes

A visual's or surface's `BoxAligned` (six `f32`) is the centre and then the half-size, not a minimum and maximum: it equals the
positions' bounds in all 232 visuals and 77 surface meshes of three TMUnlimiter maps. :observed[three maps]

## Index buffers

`CPlugVisualIndexed` chunk `0x0906A001` is a boolean and then a `CPlugIndexBuffer` [stored in place](/engines/gamebox/data-model/nodes/#nodes-stored-in-place),
with no node index or class ID; its indices are `u16`. :observed

## Sprites and 2-D quads

`CPlugVisualSprite` (`0x09010000`, 54 nodes, the clouds) has only two chunks of its own besides its base classes': `0x09010005`
(the sprite flags, `0x41`: a rotated quad and a texture atlas; a global direction `vec3` and a pivot `vec2`) and `0x09010006`
(the atlas grid, two `u16`). :observed[54 nodes] Its geometry flags are `0x3B0`, the packed-normal bit set, yet a vertex's normal
slot is three `f32` (size and rotation): the files read to their end only that way. :observed[54 nodes]

`CPlugVisualQuads2D` (`0x0904B000`) has no chunk of its own: its vertices, a `vec2` position, a `vec2` normal and four `f32` of
colour, are `CPlugVisual2D` chunk `0x0904A000`. :observed

:::open[How are tangents packed?]
The 4-byte tangents and bitangents of packed visuals are stored and accounted for, but their encoding is not read.
:::
