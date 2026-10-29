---
title: Textures (THP and TXP)
description: "A texture is a header entry (THP, 84 bytes around a CellGcmTexture) and a pixel entry (TXP): formats, swizzle, mip chains, cube maps, volumes, and the prefetch and streamed copies."
sources:
  - title: RPCS3 (Emu/RSX/Common/TextureUtils.cpp, Utils/image_utils.hpp)
    url: https://github.com/RPCS3/rpcs3
    note: the RSX texture layouts (linear pitch, 128-byte alignment of non-linear cube faces, 3D interleave of swizzled volumes)
  - title: NV_texture_compression_vtc
    url: https://registry.khronos.org/OpenGL/extensions/NV/NV_texture_compression_vtc.txt
    note: the layout of block-compressed volume textures
implementations:
  - name: rme-formats (texture.rs)
    url: https://github.com/Kalmarv/rme-formats/blob/main/src/texture.rs
  - name: primase toolkit/texcodec (gcm.rs)
    url: https://github.com/Kalmarv/primase/blob/main/toolkit/texcodec/src/gcm.rs
---

A texture is two [PAK](/engines/rme/archives/pak/) entries with one name: a `.thp` header of 84 bytes that wraps the PS3's own texture descriptor (`CellGcmTexture`), and a `.txp` with the pixels, a chain of mip levels from the largest to the smallest.
There are 27,446 headers and 28,046 pixel entries on the disc; none is compressed in the PAK. :proven[all 336 PAKs]
A header normally has its pixels in the same section. 97 headers in `MAIN` and `CACHE_MAIN` (Scaleform UI) have them in `LOCAL` and `CACHE_LOCAL`, and 600 pixel entries named `<name>_m1.txp` have no header (the tail of a cube map, below). :proven[all 336 PAKs]

All numbers are big-endian.

## Header

```layout
title: THP header
size: 84
games: [shred]
note: The CellGcmTexture descriptor starts at 0x3C and ends the header.
fields:
  - {at: 0, size: 4, type: "u8[4]", name: magic, value: "AF AF 00 03", level: proven}
  - {at: 4, size: 4, type: u32, name: header_size, value: "0x54", level: proven}
  - {at: 8, size: 4, type: u32, name: gcm_offset, value: "0x003C0000", level: proven, note: "the 0x3C is the offset of the descriptor"}
  - {at: 12, size: 4, type: u32, name: sentinel, value: "0xBEEFFACE", level: proven}
  - {at: 16, size: 2, type: u16, name: kind, level: unknown, note: "1 for 2D, 4 for every cube header, 2 for volumes"}
  - {at: 18, size: 2, type: u16, name: unknown, level: unknown, note: "16 for B8; 1 or 2 for ARGB; 2 for DXT1; 4 or 8 for DXT5"}
  - {at: 20, size: 2, type: u16, name: width, level: proven, note: "equals the descriptor's width in all headers"}
  - {at: 22, size: 2, type: u16, name: height, level: proven}
  - {at: 24, size: 2, type: u16, name: pitch, level: observed, note: "bytes per row of the base level for swizzled textures; linear ones differ"}
  - {at: 26, size: 2, type: u16, name: mip_count_shifted, level: observed, note: "mip count << 8 when there is more than one mip"}
  - {at: 28, size: 4, type: u32, name: identifier, level: unknown, note: "not the PAK entry's hash (0 of 27,446 match); its last byte follows the last letter of the name"}
  - {at: 32, size: 4, type: "char16[2]", name: leaked_text, level: unknown, note: "two UTF-16 characters of name text, or 0 (8,661 headers)"}
  - {at: 36, size: 16, type: "u32[4]", name: tail_ends, level: observed, note: "cumulative byte ends of the mip levels above the prefetch tail; 0 for unused"}
  - {at: 52, size: 4, type: u32, name: zero, level: observed}
  - {at: 56, size: 4, type: u32, name: gcm_offset_again, value: "0x3C", level: observed}
  - {at: 60, size: 1, type: u8, name: format, level: proven}
  - {at: 61, size: 1, type: u8, name: mip_count, level: proven}
  - {at: 62, size: 1, type: u8, name: dimension, level: proven, note: "2 for 2D, 3 for a volume"}
  - {at: 63, size: 1, type: u8, name: cubemap, level: proven, note: "1 for a cube"}
  - {at: 64, size: 4, type: u32, name: remap, level: proven, note: "channel selectors, see below"}
  - {at: 68, size: 2, type: u16, name: width, level: proven}
  - {at: 70, size: 2, type: u16, name: height, level: proven}
  - {at: 72, size: 2, type: u16, name: depth, level: proven}
  - {at: 74, size: 1, type: u8, name: location, level: proven, note: "0 in every header"}
  - {at: 75, size: 1, type: u8, name: pad, level: proven, note: "0"}
  - {at: 76, size: 4, type: u32, name: pitch, level: proven}
  - {at: 80, size: 4, type: u32, name: offset, level: proven, note: "0 in every header"}
```

Most of the descriptor is what the console's graphics library defines, so its meaning is :sourced[RPCS3 and the PS3 graphics headers] and its values are checked here. The remaining header words (`kind`, the 16-bit word after it, the identifier and the leaked text) have no known use.

### Formats

The descriptor's format byte takes the following values; adding `0x20` marks the texture as **linear** (stored row by row at a pitch) instead of swizzled. No other formats, and no unnormalised (`0x40`) flag, occur. :proven[all 27,446 headers]

| Format | Meaning | Swizzled | Linear (`+0x20`) |
|---|---|---:|---:|
| `0x86` | DXT1 (BC1) | 12,674 | 310 |
| `0x88` | DXT5 (BC3) | 10,007 | 339 |
| `0x81` | B8, one byte per pixel (the remap makes it grey) | 2,474 | 0 |
| `0x85` | A8R8G8B8 | 1,631 | 11 |

The remap is `0xAAE4` in 24,972 headers and `0xA9FF` in all 2,474 B8 headers. :proven[all 27,446 headers]
2D textures number 26,628 and volumes 818; 1,200 headers have the cube flag (600 cube maps, each header appearing in two sections). :proven[all 27,446 headers]
Mip counts run from 1 to 12 (10 mips: 7,959 headers; 9: 7,376; 1: 4,215; 8: 3,153; 11: 2,721). :proven[all 27,446 headers]
The commonest sizes are 512 × 512 (7,293), 256 × 256 (6,111), 128 × 128 (4,426) and 1024 × 1024 (2,529); UI textures are linear and may be any size (1280 × 720, 355 × 280, 27 × 27). :proven[all 27,446 headers]

## Pixels

The size of every mip level follows from the header: DXT is `ceil(w/4) × ceil(h/4) × 8` bytes (DXT1) or `× 16` (DXT5), at least one block; B8 is `w × h`; ARGB is `4 × w × h`. A swizzled texture's chain is these sizes added from the largest level down. :proven[27,349 pixel entries; 0 mismatches]
A linear texture uses the base level's pitch for every mip level: each level occupies the pitch times its row count (`ceil(h/4)` rows for DXT, `h` for ARGB). :proven[all 657 linear pixel entries]
Swizzled levels are in Morton (Z) order, with the bits of x on the even positions and y on the odd; once the shorter side is used up, the remaining bits of the longer one continue linearly. DXT blocks keep PC byte order. :observed[decoded and inspected]
Decoded B8 (ambient occlusion maps), ARGB (art, in A, R, G, B byte order), DXT1 (brick), DXT5 (normal maps), and linear DXT and ARGB (1280 × 720 screens) were rendered and looked correct. :observed

### Cube maps

A cube map has six faces one after another in the chain; the faces of a swizzled cube are aligned to 128 bytes. :sourced[RPCS3]
The padding is between faces only: each face's mip chain is padded up to a multiple of 128 bytes before the next face, and nothing follows the sixth. A 256 × 256 DXT1 face with 9 mips is a 43,704-byte chain at a stride of 43,776, so the cube is 5 × 43,776 + 43,704 = 262,584 bytes; its tail faces are 10,936 bytes at a stride of 11,008, 65,976 bytes in all. Dividing a cube's size by six does not give the face stride. :proven[all 600 cube maps, 3,600 faces]
Each cube appears in `TEXTURES_STREAMED` as `<name>.txp` plus `<name>_m1.txp` (the tail), and the tail equals the prefetch copy exactly: 600 of 600 pairs, 3,600 faces, with face strides of 43,776 and 11,008 bytes. :proven[all 600 cube maps]

### Prefetch and streamed copies

The `TEXTURES_PREFETCH` section holds a header and a pixel entry of the same name as the streamed texture. The header is the same and still states the full size, but the pixels are only the mip levels whose smaller side is at most 128 (a one-mip texture keeps its one mip). :proven[all 9,342 non-cube pairs]
The prefetch pixels are byte-for-byte the last bytes of the streamed chain in all 9,342 pairs (8,934 2D textures and 408 volumes). :proven[all 9,342 non-cube pairs]
The game can therefore draw with the small levels at once and stream in the large ones. :inferred

The same texture name in several PAKs always has the same bytes: of 10,725 distinct (section, name) pairs, 3,386 appear in two or more PAKs and all of those copies are identical. The 27,349 pixel entries hold 3,699,042,026 bytes; their distinct contents total 1,656,966,483 bytes, so 55.2% of the pixel bytes are duplicates. :proven[all 336 PAKs]

## Volume textures

818 headers are volumes. All have one mip: 771 are DXT 128 × 128 × 4 (750 DXT5, 21 DXT1) and 47 are A8R8G8B8 32 × 32 × 32. :proven[all 336 PAKs]
The uncompressed volumes interleave the bits of x, y and z in Morton order, skipping an axis once its bits are used up. The compressed ones use the VTC arrangement, which groups the blocks of four z-planes. :sourced[RPCS3 and NV_texture_compression_vtc]
Both layouts were decoded; adjacent z-slices of the result are smoother than the same pixels shuffled in 797 of 818 volumes (21 tie, none is worse), and the 47 ARGB volumes read as colour lookup tables only with the axis order x, y, z. :observed
The prefetch and streamed copies of the 408 volumes that have both decode to the same volume. :observed

:::open[What do the unknown header words do?]
The two 16-bit words at offset 16, the identifier at 28 and the two characters at 32 are consistent within a texture but have no use that was found. The identifier cannot be the entry hash.
:::
