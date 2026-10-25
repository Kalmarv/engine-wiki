---
title: Texture resources and mip chunks
description: The extended texture header, pixel formats, layered storage and streaming identity.
games: [skate]
sources:
  - title: ReSkate texture reader
    url: https://github.com/Dingo-Shenanigans/ReSkate/blob/main/Engine/Resource/texture.cpp
implementations:
  - name: primase worlds/frostbite (texture.rs)
    url: https://github.com/Kalmarv/primase/blob/main/worlds/frostbite/src/texture.rs
---

A Texture resource (`0x6bde20ba`) supplies dimensions, format and mip sizes; its pixels live in the chunk named
by its header. ReSkate reads an extended 180-byte header for resource-metadata versions 12 and 13.
:sourced[ReSkate]

```layout
title: Extended texture header
size: 180
note: Little-endian.
fields:
  - {at: 0, size: 8, type: bytes, name: unknown, level: unknown}
  - {at: 8, size: 4, type: u32, name: texture kind, level: observed, note: "0 2D; 1 cube; 2 volume; 3 array"}
  - {at: 12, size: 4, type: u32, name: format ordinal, level: sourced}
  - {at: 16, size: 4, type: u32, name: unknown, level: unknown}
  - {at: 20, size: 2, type: u16, name: flags, level: sourced}
  - {at: 22, size: 2, type: u16, name: width, level: observed}
  - {at: 24, size: 2, type: u16, name: height, level: observed}
  - {at: 26, size: 2, type: u16, name: depth, level: observed}
  - {at: 28, size: 2, type: u16, name: slices, level: observed}
  - {at: 30, size: 1, type: u8, name: mip count, level: observed}
  - {at: 31, size: 1, type: u8, name: first mip, level: sourced}
  - {at: 32, size: 8, type: bytes, name: unknown, level: unknown}
  - {at: 40, size: 16, type: GUID, name: pixel chunk GUID, level: observed}
  - {at: 56, size: 60, type: "u32[15]", name: mip byte sizes, level: observed}
  - {at: 116, size: 4, type: u32, name: chunk size, level: observed}
  - {at: 120, size: 8, type: u64, name: streaming identity h64, level: observed}
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

All 5,112 normal textures in a measured stock material census use BC7; masks use BC1 or BC3. This is a content
measurement, not a requirement that a normal map use BC7. :observed

The texture streamer uses `h64`, not merely the resource name or GUID, as identity. See
[resource identity](/engines/frostbite/data-model/resource-identity/) and
[texture-handle limits](/engines/frostbite/runtime/limits/).

:::open[Which cube face corresponds to each stored image?]
The mip-major arrangement is measured; cube face orientation and ordering are not established by that check.
:unknown
:::
