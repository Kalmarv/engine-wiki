---
title: Terrain height and node storage
description: FloorHeightData, the terrain quadtree, TNL block coding and detailed height samples.
games: [riders-republic]
implementations:
  - name: primase Anvil floor reader
    url: https://github.com/Kalmarv/primase/blob/main/worlds/anvil/src/read/floor.rs
  - name: primase Anvil node reader
    url: https://github.com/Kalmarv/primase/blob/main/worlds/anvil/src/read/tnl.rs
  - name: primase Anvil terrain block decoder
    url: https://github.com/Kalmarv/primase/blob/main/worlds/anvil/src/read/tnl_code.rs
---

The open world's ground has two representations: a whole-world FloorHeightData grid and detailed TNLChunk tiles addressed by TerrainNodeLayer. The detailed tiles include heights, colour, material IDs and other terrain rasters. :observed

## FloorHeightData

The USNAT floor grid is 8192×8192 cells at 2 metres per cell, covering x and y from −8192 to +8192 metres. Its 4,194,304 blocks each encode 4×4 height words. Both stored FloorHeightData bodies, including WhiteRoom's empty one, close exactly with the grammar below. :proven[all two bodies and USNAT block count]

```layout
title: FloorHeightData body
size: variable
fields:
  - {at: 0, size: 4, type: bytes, name: stored header, level: unknown, note: "01 00 00 00 in both bodies"}
  - {at: 4, size: 4, type: f32, name: cell side in metres, level: observed, note: "2 in USNAT; 0 in the empty WhiteRoom grid"}
  - {at: 8, size: 1, type: u8, name: stored byte, level: unknown, note: "0 in both bodies"}
  - {at: 9, size: "8 × block count", type: "FloorBlock[]", name: blocks, level: proven}
  - {at: "body length - 51", size: 51, type: bytes, name: trailer, level: observed}
```

```layout
title: Floor height block
size: 8
fields:
  - {at: 0, size: 2, type: u16, name: low endpoint, level: observed}
  - {at: 2, size: 2, type: u16, name: high endpoint, level: observed}
  - {at: 4, size: 4, type: u32, name: sixteen two-bit indices, level: observed, note: "cell (row,column) uses bits 2*(4*row+column)"}
```

The reconstructed word is `lo+(hi-lo)*index/3`; blocks and cells run row-major with row along y. Every block has `lo<=hi`. Border continuity discriminates this order from a transposed one. :proven[endpoint ordering] :observed[border comparison]

The trailer holds zero u32, f32 scale .0618794 (`0x3D7D7540`), f32 338.86, float3 origin (−8192,−8192,−3584), zero u32, dimensions 8192,8192, and 15 further bytes. The scale's interpretation as metres per word agrees within .16% with a robust fit to 20,000 ground-related entities; the vertical offset of about 925–929 metres is a fit, not a stored decoded origin. :observed[trailer and fit] :inferred[vertical offset]

```layout
title: FloorHeightData trailer
size: 51
fields:
  - {at: 0, size: 4, type: u32, name: stored word, level: unknown, note: "0"}
  - {at: 4, size: 4, type: f32, name: height scale, level: observed, note: "0.0618794; interpretation supported by the entity fit"}
  - {at: 8, size: 4, type: f32, name: unnamed float, level: unknown, note: "338.86"}
  - {at: 12, size: 8, type: float2, name: grid XY origin, level: observed, note: "-8192, -8192"}
  - {at: 20, size: 4, type: f32, name: stored Z origin, level: unknown, note: "-3584; relation to decoded height unresolved"}
  - {at: 24, size: 4, type: u32, name: stored word, level: unknown, note: "0"}
  - {at: 28, size: 8, type: "u32[2]", name: cell dimensions, level: proven, note: "8192, 8192 in USNAT"}
  - {at: 36, size: 15, type: bytes, name: remaining fields, level: unknown, note: "01 01; u32 4; f32 2; 01; u32 1 in USNAT"}
```

## TerrainNodeLayer and TNLChunk

The layer contains byte 1, u32 count n, n 25-byte items and n repeated as a u32. All 87,381 node positions fill a nine-level quadtree: level L starts at `(4^L-1)/3`, and its local index is row-major over `2^L` columns. Leaf level 8 has 256×256 nodes of 64 metres. :proven[whole layer and all node positions]

```layout
title: TerrainNodeLayer item
size: 25
fields:
  - {at: 0, size: 2, type: u16, name: stored word, level: unknown, note: "retained without an established meaning"}
  - {at: 2, size: 10, type: bytes, name: stored prefix, level: unknown, note: "retained without an established meaning"}
  - {at: 12, size: 4, type: u32, name: quadtree position, level: proven}
  - {at: 16, size: 1, type: u8, name: stored byte, level: unknown, note: "0 throughout the layer"}
  - {at: 17, size: 8, type: u64, name: TNLChunk identity, level: proven}
```

A chunk contains byte 1, u32 body length minus 5, u16 `0xFEED`, u16 tag, nine length-prefixed blocks, two f32 height bounds and a 32-byte material mask. Leaf chunks append a tenth length-prefixed block. The tag's version is `tag&0x3FF` = `0x14`, flags `tag&0x7C00` = `0x1C00`, and bit 15 indicates the tenth block. Tags are `0x1C14` internal and `0x9C14` leaf. :proven[all chunk framing]

| File block | Data / runtime destination | Confidence |
|---:|---|---|
| 0 | Height residuals → 132×132 heights | :proven[whole-node decode] |
| 1 | LZ4 planar BC1 → far colour t17 | :observed[decoder and upload] |
| 2 | Material ID → low byte of t16 | :observed[loader and decoded-node checks] |
| 3 | Region/flags → high byte of t16; low nibble is region | :observed[loader and shader] |
| 4 | Grass weight; constant `0x60` over every node | :proven[constant raster census] |
| 5 | Grass group override; `0xFE` means use the material's group | :observed[loader and picker] |
| 6 | Constant zero, decoded and not copied into the final node | :proven[constant census] :observed[builder] |
| 7 | Third channel of t18; coarse nodes force `0xFF` where block-3 bit `0x20` is set | :observed[loader] |
| 8 | LZ4 planar BC4 → t19, sampled as an occlusion multiplier | :observed[upload and shader] |
| Leaf block 10 | Height-coded physics snow depth, subtracted as `value/255` metres | :observed[45 decoded leaves and physics reader] |

## Block coding

Blocks 0 and 2–7 start with a little-endian u32 N. Stream A is bytes 4 through N, and B is the remainder. A uses the H.264 CABAC arithmetic mechanism with range 510, 50 contexts initialized to state 0/MPS 0 and the standard LPS/state tables. B supplies big-endian raw bits. Arithmetic reads may run past the nominal A boundary into B, as in the engine decoder. :proven[all 611,667 coded blocks; raw-bit lengths and independent node invariants]

The unpacked runtime image holds the standard H.264 tables in its read-only data, rangeTabLPS at RVA `0x292BDF0` and transIdxLPS at RVA `0x292EF70`; the executable on disk contains neither, because its code and data are packed. :observed[runtime image and on-disk executable]

Rasters start B with chunk length, palette count and palette bytes. Samples traverse an order-8 Hilbert curve, first step +x, clipped to 132×132. A context-8 decision marks uniform chunks; other samples use unary rank lengths, raw suffix bits and a one-based adaptive symbol list. A rank above one swaps with rank/2. :proven[all six raster blocks of every one of the 87,381 nodes]

Heights use unary prefix contexts `min(j,15)`, a raw suffix, `v=2^k-1+suffix`, and signed reconstruction `(v+1)/2` for odd v or `-v/2` for even v. Accumulations down the first column, across the first row, vertically for later rows, then horizontally reconstruct the raster. World height is `decoded × 5000 × 2^(8-L-20)`. :observed[engine decoder] :proven[all 87,381 nodes' height-bound and edge checks]

All 611,667 coded blocks decode across the detailed quadtree; palettes, material masks, height bounds, raw-bit lengths and four-sample neighbour strips supply independent invariants. Each tile has a 128-sample core and four samples shared with its +x/+y neighbours. :proven[whole-node validation]

The BC tiles decompress to 8,712 bytes: 1,089 eight-byte blocks, with all endpoint portions followed by all index portions. Re-interleaving these planes yields ordinary BC1 or BC4 blocks. Both blocks 1 and 8 have the expected decoded size on every one of the 87,381 nodes. :proven[all 174,762 BC tile blocks]

The terrain's physical sample origin is offset by (2,2) in the 132×132 tile; this differs from treating the first stored sample as the visible 128×128 core's corner. :observed[physics builder and sampled surfaces]

:::open[Which unresolved floor and terrain fields have runtime meaning?]
FloorHeightData's 338.86, its stored z origin, the eight zero-height cells in the first row, and the exact floor-to-rendered-surface relation remain unresolved. The last eight bytes of coded B streams are not consumed by the inspected node loader or decoder; their producer and purpose are unknown. :unknown
:::
