---
title: Vertex formats and UV selection
description: "The mesh's vertex-format mask, the attribute order in the MMP and MGP streams, the packed CMP vectors and half-float UVs, and the four UV selector bytes of a submesh."
sources:
  - title: RPCS3 RSXVertexFetch.glsl
    url: https://github.com/RPCS3/rpcs3/blob/master/rpcs3/Emu/RSX/Program/GLSLSnippets/RSXProg/RSXVertexFetch.glsl
    note: how the RSX decodes the CMP (packed 11:11:10) vertex component
  - title: RPCS3 CgBinaryProgram.h
    url: https://github.com/RPCS3/rpcs3/blob/master/rpcs3/Emu/RSX/Program/CgBinaryProgram.h
    note: the field layout of a Cg binary program's parameter records
implementations:
  - name: primase worlds/shred (convert.rs)
    url: https://github.com/Kalmarv/primase/blob/main/worlds/shred/src/read/convert.rs
---

What a vertex holds is set by the mesh's **vertex-format mask**, the `u32` at offset `0x8C` of its [metadata](/engines/rme/geometry/model-quartets/). The engine keeps a table of 13 attribute kinds, one per mask bit, and builds the GPU
vertex declaration from the mask, so each attribute has a fixed type and a place in one of two streams: position and normal stay in the MMP; everything else is in the MGP. :observed[static reading of the executable]
Every rigid mesh has the flag `0x80000` in its mask, which selects the packed variant of each attribute (packed vectors and half-float UVs). :proven[all 17,897 rigid meshes]

Types below are the RSX's: `F` 32-bit float, `SF` 16-bit half float, `UB` unsigned byte, `CMP` a packed 32-bit vector. All are big-endian.

## Attributes

| Mask bit | Attribute | Stream, offset | Type, count | Confidence |
|---|---|---|---|---|
| 0 (`0x1`) | position | MMP +0 | F, 3 | :proven |
| 1 (`0x2`) | vertex colour | MGP, first when present | UB, 4 | :observed |
| 2 (`0x4`) | normal | MMP +12 | CMP, 1 | :proven |
| 3 (`0x8`) | tangent-frame vector A | MGP, after colour | CMP, 1 | :inferred |
| 4 (`0x10`) | tangent-frame vector B | MGP, after A | CMP, 1 | :inferred |
| 5 (`0x20`) | UV set 0 | MGP, next present | SF, 2 | :proven |
| 6 (`0x40`) | UV set 1 | MGP, next present | SF, 2 | :observed |
| 7 (`0x80`) | UV set 2 | MGP, next present | SF, 2 | :observed |
| 8 (`0x100`) | UV set 3 | MGP, next present | SF, 2 | :observed |
| 9 (`0x200`) | extra attribute A (trees) | MGP, next present | SF, 4 | :unknown |
| 10 (`0x400`) | extra attribute B (trees) | MGP, next present | SF, 4 | :unknown |
| 11 (`0x800`) | two 16-bit integers | not in any rigid mesh | S32K, 2 | :observed[executable's table only] |
| 12 (`0x1000`) | four half floats | not in any rigid mesh | SF, 4 | :observed[executable's table only] |

The MGP offsets are not fixed: they start at 0 and each present bit appends its size in the order of the table. The MMP stride is the position and normal rounded up to 16 bytes; the MGP stride is the sum, not rounded. :observed
Position and index decoding does not depend on the other attributes. The naming of A and B as tangent and binormal rests on their slots, their presence in pairs and the shader families that use them. :inferred
Without the flag `0x80000` the table uses `F, 3` vectors, `F, 2` UVs and `F, 4` extras. No rigid mesh has this variant, so nothing is claimed for it. :observed

The executable declares the vertices to the RSX with the type and count above (it writes the vertex-array methods `0x1740 + 4·attribute` with `(frequency<<16)|(stride<<8)|(count<<4)|type` and `0x1680 + 4·attribute` with the offset),
which fixes the encodings. :observed[static reading of the executable]
The attribute registers are 0 for position, 2 normal, 3 colour, 8 to 11 UV sets, 12 and 13 the extras, 14 vector B and 15 vector A. :observed

### The layouts on the disc

16 masks occur among the 17,897 rigid meshes. In the notation N = the normal at MMP +12, C = colour, A and B = the two tangent-frame vectors, U0 to U3 = UV sets, X and Y = the tree extras: :proven[all 17,897 rigid meshes]

| Mask | Meshes | MGP stride | MGP order |
|---|---:|---:|---|
| `00080005` | 2,387 | 0 | none |
| `00080007` | 2 | 4 | C |
| `00080025` | 1,506 | 4 | U0 |
| `00080027` | 37 | 8 | C, U0 |
| `0008003d` | 3,127 | 12 | A, B, U0 |
| `0008003f` | 35 | 16 | C, A, B, U0 |
| `00080065` | 1,172 | 8 | U0, U1 |
| `00080067` | 1 | 12 | C, U0, U1 |
| `0008007d` | 2,708 | 16 | A, B, U0, U1 |
| `000800e5` | 191 | 12 | U0, U1, U2 |
| `000800fd` | 3,324 | 20 | A, B, U0, U1, U2 |
| `000800ff` | 10 | 24 | C, A, B, U0, U1, U2 |
| `000801e5` | 3 | 16 | U0, U1, U2, U3 |
| `000801fd` | 2,134 | 24 | A, B, U0, U1, U2, U3 |
| `000801ff` | 1,239 | 28 | C, A, B, U0, U1, U2, U3 |
| `000807fd` | 21 | 40 | A, B, U0, U1, U2, U3, X (24), Y (32) |

The table's strides explain every MMP and MGP stride on the disc with no mismatch, over 6,232,816 stored vertices and 27,213 rigid submeshes. :proven[all 17,897 rigid meshes]
The 21 meshes with stride 40 use tree materials (branch, frond and leaf-mesh vertex programs). Extra A has x, y, z roughly in [−0.96, 0.94] and a w in [−3.14, 2.99]; extra B looks like a position and has w = 0. What they mean (an axis and angle, a pivot, wind) is not known. :observed

## The packed vectors (CMP)

A `CMP` component is one big-endian `u32` that the GPU decodes into three components with w = 1:

```
x = signed 11 bits at bits 0..10      y = signed 11 bits at bits 11..21      z = signed 10 bits at bits 22..31
normal = (x * 32/32767, y * 32/32767, z * 64/32767)
```

For example `0x001FF800` is `(0, 32736/32767, 0)`. It is *not* 10:10:10:2 and not an SNORM scaled by 1023 or 511; the scale follows the RSX fetch code in RPCS3 and agrees with the decode of the 6,232,816 normals. :proven
Every nonzero normal is within 0.005 of unit length (largest length 1.00001); 11,488 normals are the zero vector, which the stock data contains. :proven[all 17,897 rigid meshes]
Tangent-frame A is often shorter than unit length (1,743,419 of 4,930,385 vectors are off by more than 0.005); every nonzero B is unit. A reader should not normalise them and call that a lossless decode. :observed

Vertex colour is four successive bytes divided by 255 in component order. All values lie in [0, 1]. What a channel means (ambient occlusion, blend weight, tint, alpha) depends on the material, and no byte reordering is applied. :observed

## UV sets and the selector bytes

UV values are half floats and run to hundreds of repeats (the extremes are about −807 to 512), consistent with tiling textures. The V axis is top-origin relative to a decoded texture image. :observed

A submesh does not name its UV sets directly. The four bytes at submesh offset `0x38` are *selectors*: byte *i* says which **stored** UV set feeds logical texture coordinate *i* (UV0 to UV3, vertex attributes 8 to 11), and `0xFF` keeps the default, the stored set of the same index. :observed[static reading of the executable]
The selector bytes on the disc are 0, 1, 2, 3 and 255, in 189 distinct combinations; the commonest are `ffffffff` (4,261 submeshes), `00000201` (3,490), `00000001` (3,138) and `00000000` (2,554). :proven[all 27,213 rigid submeshes]
A shader's requested declaration may leave a logical UV out; the engine then emits no attribute for it. :observed
For example a material of CHARLIE's with selectors `00 00 02 01` takes UV0 and UV1 from stored set 0, UV2 from stored set 2 and UV3 from stored set 1. :observed

The base-colour texture is the one in the material's sampler slot `0x95591c40`, and is sampled with logical UV0. A render of CHARLIE and OSCAR with these rules puts window, roof and road textures where the geometry expects them. :observed

:::open[What do the shader inputs call these attributes?]
The vertex programs' parameter tables are stripped of names and semantics (every record is a constant register), so POSITION, NORMAL, TEXCOORD and TANGENT are not recoverable from them. Only the input mask in each program's header is. The names above come from the engine's declaration table and conventional slots.
:::
