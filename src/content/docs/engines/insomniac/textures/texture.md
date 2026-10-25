---
title: Textures (.texture)
description: "The Sunset Overdrive texture asset: its 36-byte header, SD pixels in the asset and HD mips in a separate stream asset, formats, mip-chain sizes and cube maps."
sources:
  - title: ALERT (Tkachov)
    url: https://github.com/Tkachov/ALERT
    note: texture/header.py, the Sunset Overdrive branch, is the origin of the header field names
---

A `.texture` is stored as two assets with the same id. The **SD asset** (span 0) is a wrapper, a [DAT1](/engines/insomniac/data-model/dat1-container/) with one
section and the standard-definition pixels after it; the optional **HD stream** (span 1, `Built Type` `stream` in `layout.csv`) holds only the extra high-resolution
mips with no wrapper or DAT1. The pixels are DDS-ordered mip chains. :observed

The 52,624 named texture assets are 42,841 span-0 textures and 9,783 span-1 HD streams; ALERT reports 42,840. 28,916 of the 42,841 are
`levels/.../envprobes/*.texture`, leaving 13,925 other textures. :observed These figures are from a recorded census of the PC build 3373500; the install is no
longer available. :observed

## Header

The only section of a span-0 texture is `4EDE3593`, 36 bytes (present in 42,841 of 42,841): :observed

```layout
title: Texture header (section 4EDE3593)
size: 36
games: [sunset-overdrive]
note: Little-endian. Layout from ALERT's Sunset Overdrive branch.
fields:
  - {at: 0, size: 4, type: u32, name: SD length, level: observed, note: "SD pixel bytes; equals the wrapper's payload length"}
  - {at: 4, size: 4, type: u32, name: HD length, level: observed, note: "HD stream bytes; 0 = no stream"}
  - {at: 8, size: 4, type: "u16[2]", name: "HD width, height", level: observed}
  - {at: 12, size: 4, type: "u16[2]", name: "SD width, height", level: observed}
  - {at: 16, size: 2, type: u16, name: array size, level: observed, note: "1 (42,714), 4 (109), 2 (8), 8 (6), 16 (2), 32 (2)"}
  - {at: 18, size: 1, type: u8, name: flags, level: observed, note: "0x40 = cube map; 0x80 = sRGB (inferred)"}
  - {at: 19, size: 1, type: u8, name: planes, level: unknown, note: "4 (28,913), 0 (10,451), 1 (1,873), 18 (1,476), 2 (128)"}
  - {at: 20, size: 2, type: u16, name: DXGI format, level: observed}
  - {at: 22, size: 2, type: u16, name: zero, value: 0, level: observed}
  - {at: 24, size: 4, type: u32, name: unknown, level: unknown, note: "0 except 37 assets with float-like values, e.g. 0xBF000000 = −0.5f"}
  - {at: 28, size: 1, type: u8, name: SD mip count, level: observed}
  - {at: 29, size: 1, type: u8, name: zero, value: 0, level: observed}
  - {at: 30, size: 4, type: u32, name: unknown, level: unknown, note: "0x01010001 (38,217), 0x03030001 (4,478), ..."}
  - {at: 34, size: 1, type: u8, name: unknown, level: unknown, note: "1 (42,381), 3 (459), 2 (1)"}
  - {at: 35, size: 1, type: u8, name: HD mip count, level: observed, note: "0 (33,058), 1 (2,643), 2 (7,140)"}
```

## Pixel data

With bytes per 4 × 4 block (8 for BC1 and BC4, 16 for BC5, BC6H and BC7) or per pixel for the uncompressed formats, and each mip halving down to a minimum of one
block, the size of the chain times the array size equals the SD length for 42,592 textures and six times it (cube maps) for the other 249; the HD chain times
the array size equals the HD length for 9,783 of 9,783. :observed The HD mips sit above the SD ones: `HD width = SD width << HD mips` (7,140 textures are 4× with two HD mips, 2,643 are 2× with one). :observed
The HD stream is one raw LZ4 block that decompresses to exactly the HD length (9,615 of 9,615) or, when its size equals the HD length, is stored (168 of 168). :observed

Flag `0x40` marks the cube maps exactly: it is set on the 249 textures whose SD length is six times the chain, and on no other (234 under `textures/`, 9 under
`atmospheres/`). :observed

| DXGI | Format | Textures (span 0) | Confidence |
|---|---|---|---|
| 95 | BC6H UF16 | 29,146 (28,911 are environment probes) | :observed |
| 98 | BC7 UNORM | 11,238 | :observed |
| 83 | BC5 UNORM | 1,885 | :observed |
| 80 | BC4 UNORM | 467 | :observed |
| 28 | R8G8B8A8 UNORM | 92 | :observed |
| 71 | BC1 UNORM | 6 | :observed |
| 49 | R8G8 UNORM | 5 | :observed |
| 61 | R8 UNORM | 1 | :observed |
| 10 | R16G16B16A16 float | 1 | :observed |

No `*_SRGB` DXGI code appears. :observed The sRGB bit appears to be flag `0x80`: it is set on 4,326 of 4,357 `_c` (colour) textures, 3 of 1,847 `_n`, and 0 of 1,601 `_g`. :inferred
Path suffixes (`_c` colour BC7 with the sRGB bit, `_n` normal BC5, `_g` gloss or mask BC7 linear) come from counts of path suffixes only. :inferred
The minimap `ui/textures/hud/map/minimap.texture` (id `0D9CD9DA`) is BC7, 4688 × 3364, 1 mip, no HD stream; its SD length 15,770,432 is 1172 × 841 × 16. :observed

:::open[What is the slice order of array textures with mips, and the cube face order?]
Array textures seen have one mip, which does not discriminate slice-major (DDS) from mip-major layout. The face order of the 249 cube maps is assumed to be the DDS
order (+X −X +Y −Y +Z −Z) and was not checked.
:::

:::open[What do the planes byte and the header fields at 24, 30 and 34 mean?]
All are stored and counted; none has an established meaning.
:::
