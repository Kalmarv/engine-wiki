---
title: Texture resources and mip chunks
description: The extended texture header, pixel formats, layered storage and streaming identity.
games: [skate]
sources:
  - title: ReSkate texture reader
    url: https://github.com/Dingo-Shenanigans/ReSkate/blob/main/Engine/Resource/texture.cpp
implementations:
  - name: frostbite-formats (texture.rs)
    url: https://github.com/Kalmarv/frostbite-formats/blob/main/src/texture.rs
---

A Texture resource (`0x6bde20ba`) supplies dimensions, format and mip sizes; its pixels live in the chunk named
by its header. The stock install holds 61,618 distinct texture headers (78,566 resources), every one of them 180 bytes;
the 16-byte resource metadata is `0x0c`, the header's flags as a `u32`, and two zero words in all of them.
:proven[all stock texture resources] ReSkate reads an extended 180-byte header for resource-metadata versions 12 and 13.
:sourced[ReSkate]

```layout
title: Extended texture header
size: 180
note: Little-endian.
fields:
  - {at: 0, size: 4, type: u32, name: compressed offset of the mip 1 block, level: observed, note: "Byte offset in the chunk CAS range of the 64 KiB block that holds the first byte of mip 1; zero in 21,978 of 61,618 stock textures"}
  - {at: 4, size: 4, type: u32, name: compressed offset of the mip 2 block, level: observed, note: "As the word at 0, for mip 2"}
  - {at: 8, size: 4, type: u32, name: texture kind, level: observed, note: "0 2D; 1 cube; 2 volume; 3 array"}
  - {at: 12, size: 4, type: u32, name: format ordinal, level: sourced}
  - {at: 16, size: 4, type: u32, name: unknown, level: unknown, note: "Zero in all 61,618 stock textures"}
  - {at: 20, size: 2, type: u16, name: flags, level: sourced, note: "Only the values 0x0000, 0x0001, 0x0009 and 0x0020 occur; the resource metadata repeats them"}
  - {at: 22, size: 2, type: u16, name: width, level: observed}
  - {at: 24, size: 2, type: u16, name: height, level: observed}
  - {at: 26, size: 2, type: u16, name: depth, level: observed}
  - {at: 28, size: 2, type: u16, name: slices, level: observed}
  - {at: 30, size: 1, type: u8, name: mip count, level: observed}
  - {at: 31, size: 1, type: u8, name: first mip, level: sourced}
  - {at: 32, size: 1, type: u8, name: streaming mip floor, level: inferred, note: "Never below the first mip (byte 31): equal in 60,033 stock textures and 1 to 5 larger in 1,585"}
  - {at: 33, size: 1, type: u8, name: repeated mip count, level: proven, note: "Equals the mip count in all 61,618 stock textures"}
  - {at: 34, size: 6, type: bytes, name: unknown, level: unknown}
  - {at: 40, size: 16, type: GUID, name: pixel chunk GUID, level: observed}
  - {at: 56, size: 60, type: "u32[15]", name: mip byte sizes, level: observed}
  - {at: 116, size: 4, type: u32, name: chunk size, level: observed}
  - {at: 120, size: 4, type: u32, name: resource name hash, level: proven, note: "djb2-XOR of the lowercase resource name in all 61,618 stock textures"}
  - {at: 124, size: 4, type: u32, name: h64 high half, level: unknown, note: "19,803 distinct values over 25,719 distinct names; not a hash of any part of the name"}
  - {at: 128, size: 52, type: bytes, name: texture group region, level: observed, note: Includes the group name; not all trailing bytes have an established meaning.}
```

| Ordinals | Pixel storage | Confidence |
|---|---|---|
| `18`, `20` | RGBA8, four bytes per texel | :sourced[ReSkate] |
| `23`, `24` | BGRA8, four bytes per texel | :sourced[ReSkate] |
| `54`–`57` | BC1, eight bytes per 4×4 block | :sourced[ReSkate] |
| `58`, `59` | BC2, sixteen bytes per block | :sourced[ReSkate] |
| `60`, `61` | BC3, sixteen bytes per block | :sourced[ReSkate] |
| `66`, `67` | BC7, sixteen bytes per block | :sourced[ReSkate] |

Block-compressed levels occupy `ceil(width/4) * ceil(height/4) * block_bytes`, with at least one block on each
axis. Levels halve each dimension down to one. :sourced[ReSkate]

Arrays and cubes store all images of one mip together, followed by all images of the next mip. A downsample
comparison validates this arrangement on 559 decodable layered textures. Their chunk size is
`sum(mip_sizes) * layer_count`. The nine measured volume textures have one mip; its size describes the whole
volume, including a `128³` BC7 texture occupying 2,097,152 bytes. :observed

The kind word holds only 0 (59,220 textures), 1 (21), 2 (145) and 3 (2,232). The two words at offset 0 are the byte
offsets, inside the chunk's CAS range, of the 64 KiB blocks that start the data of mips 1 and 2 (the block that
contains the first byte of the mip, where the mip does not begin on a block boundary): in all 39,632 textures where the
words are not both zero, each names such a block; they are zero in 21,978 textures, among them 16,198 whose chunk is
a single block. :proven[all stock texture resources] Why they are zero in 5,213 textures whose chunk has several
blocks is not established. :unknown
The low 32 bits of the `h64` at offset 120 are the djb2-XOR hash of the texture's lowercase resource name in all
61,618 headers (25,719 distinct names), the same hash [resource names](/engines/frostbite/data-model/resource-identity/)
use elsewhere. :proven[all stock texture resources]

When `first_mip > 0`, the bundle manifest can describe only the lower-resolution tail of a chunk, at a logical
offset corresponding to earlier mip bytes. The TOC chunk table locates the whole mip chain, including all images.
Treating the manifest tail as a complete texture gives a size mismatch rather than evidence of corrupt pixels.
:observed

Across 987 texture references from fifteen bundles, the depot reference's second GUID resolves an EBX
TextureAsset or TextureArrayAsset and its Resource field resolves a Texture resource. Only 353 of those
assets/resources are in the material's own bundle; 634 are found in other install bundles. The streamable
texture-set bytes contain neither the resource id nor the referenced GUID in that sample. :observed

All 5,112 normal textures in a measured stock material census use BC7; masks use BC1 or BC3. This is a content
measurement, not a requirement that a normal map use BC7. :observed

The texture streamer uses `h64`, not merely the resource name or GUID, as identity. See
[resource identity](/engines/frostbite/data-model/resource-identity/) and
[texture-handle limits](/engines/frostbite/runtime/limits/).

:::open[Which cube face corresponds to each stored image?]
The mip-major arrangement is measured; cube face orientation and ordering are not established by that check.
:unknown
:::
