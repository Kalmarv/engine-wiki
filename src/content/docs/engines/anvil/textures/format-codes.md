---
title: Texture format codes
description: Anvil image codecs, storage sizes, channel-order disagreements and sRGB interpretation.
games: [riders-republic]
implementations:
  - name: primase Anvil texture format mapping
    url: https://github.com/Kalmarv/primase/blob/main/worlds/anvil/src/read/texture.rs
---

The numeric format in TextureMap selects a pixel codec; its separate transfer flag controls colour-space treatment. Storage size alone cannot distinguish codecs with the same block or pixel size. :observed

| Code | Codec | Storage | Evidence and confidence |
|---:|---|---|---|
| 0 | BGRA8 UNORM | 4 bytes/pixel | The built-in normal's `ff 80 80 ff` is a flat normal only in BGRA order; skin palettes corroborate it. :observed |
| 1 | RGBA8 SNORM | 4 bytes/pixel | A noise map is exactly the 256-entry Perlin gradient table when read as signed bytes: two components ±127 and one zero. :observed |
| 2, 3 | BC1 | 8 bytes/4×4 block | Storage census and independently decoded real samples agree. :observed |
| 4 | BC2 | 16 bytes/block | Storage and independent real-sample decoders agree. :observed |
| 5 | BC3 | 16 bytes/block | Storage and independent real-sample decoders agree. :observed |
| 6 | BC4 UNORM | 8 bytes/block | Storage and independent real-sample decoders agree. :observed |
| 7 | BC5 UNORM | 16 bytes/block | Storage and independent real-sample decoders agree. :observed |
| 8 | BC6H unsigned float | 16 bytes/block | Together with code 9, all 2,066,602 examined blocks are valid BC6H and decode to coherent maps. :observed |
| 9 | BC6H signed float | 16 bytes/block | Signed SH-transfer maps agree with this interpretation. :observed |
| 10 | BC7 | 16 bytes/block | Real-sample output agrees byte-for-byte with two independent decoders. :observed |
| 11 | A8 UNORM | 1 byte/pixel | The engine's resource-creation record uses DXGI 65, A8_UNORM, for the matching map. :observed |
| 12 | R8 UNORM | 1 byte/pixel | Independent real-sample decodes agree. :observed |
| 15 | Codec unresolved | 4 bytes/pixel in three of four maps | Size fits do not establish channel meaning. :unknown |
| 20 | RGBA16 float | 8 bytes/pixel | Storage and independent half-float sample decoding agree. :observed |

Code 0 has conflicting third-party names, BGRA8 versus RGBA8; the normal and palette content discriminates them. Code 11 also has conflicting A8 versus R8 labels; the engine's DXGI creation record discriminates that case. These disagreements concern channel interpretation, not byte length. :observed[tool tables and discriminating content/runtime records]

The storage census fills each supported image's held mip sizes. Earlier storage-only failures include layered images, zero mip counts, image-less debug maps and additional codecs; a failure of a flat-only interpretation does not establish corrupt image data. :observed

## Transfer flag

For formats with sRGB views, flag 1 requests sRGB and flag 0 linear. Runtime resource formats corroborate the flag rather than a label-based role heuristic. A format lacking an sRGB variant does not become sRGB merely because the flag is set. :observed[resource-format comparisons]

Normal and surface channels are commonly packed together in BC7. A census of texture properties includes 9,111 direct normal-labelled BC7 bindings, 23 BC5 bindings and exceptions with flag 1 on normal-labelled maps. Texture roles must therefore come from the template and shader, separately from the codec. :proven[texture-property join counts]

:::open[What is format 15?]
Three of its four stored maps fit four bytes per pixel, but the codec is not established. The remaining map's framing also needs a separate explanation. :unknown
:::
