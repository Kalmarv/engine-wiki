---
title: Swatch textures (.pb and .swatchbin)
description: The Forza Horizon 6 texture container, its header, pixel formats, quality tiers, sampling rules, the normal map convention and the placeholder textures the data contains.
---

A texture is a [Grub bundle](/engines/forzatech/data-model/grub-bundle/) holding a `TXCB` blob with the mip chain, whose
`TXCH` metadata is the PC texture content header. Track textures are `.pb` files named
`<name>_<guid>_qualityN.pb` (some use a short id instead of a GUID, such as `_bclr_tupfjgh`); shared engine textures are
`.swatchbin` entries in zips. :observed A texture's game path is
`game:\media\<rel>\<name>_<guid>.swatchbin`, which is what material parameters hash ([Materials](/engines/forzatech/materials/materialbin/)). :observed

All counts are from a recorded census of the Tokyo track `Brio` (169,351 world textures in `GeoChunk0` to `GeoChunk3`); the
install is no longer available. :observed

## Header

```layout
title: TXCH metadata
size: variable
games: [fh6]
note: "Offsets are from the start of the TXCH metadata. Little-endian."
fields:
  - {at: 24, size: 4, type: u32, name: width, level: observed}
  - {at: 28, size: 4, type: u32, name: height, level: observed}
  - {at: 32, size: 4, type: u32, name: depth, level: observed}
  - {at: 36, size: 2, type: u16, name: slices and platform, level: observed, note: "14 bits slices, 2 bits platform"}
  - {at: 38, size: 1, type: u8, name: mip count, level: observed}
  - {at: 39, size: 1, type: u8, name: flags, level: observed, note: "1 cube, 2 premultiplied"}
  - {at: 40, size: 4, type: u32, name: transcoding, level: observed, note: "0 on all 169,351 world textures"}
  - {at: 44, size: 4, type: u32, name: encoded colour profile, level: observed}
  - {at: 48, size: 4, type: u32, name: target colour profile, level: observed, note: "1 = sRGB"}
  - {at: 52, size: 4, type: u32, name: address mode, level: observed, note: "0 wrap, 1 clamp, 2 mirror"}
  - {at: 56, size: 4, type: u32, name: slices offset, level: observed, note: "→ { u32 encoding, u32 mips offset, u32 next }; mips offset → mip count × { u32 size, u32 offset, u32 next }, offsets into the TXCB data"}
```

The pixel format is `transcoding ≤ 1 ? encoding : transcoding − 2`, and it is sRGB only when the target profile is 1. :observed
Transcoding 1 ("BcBlockRle") exists in the enum but no FH6 PC texture uses it. :observed

| Value | Format |
|---|---|
| 0 | BC1 |
| 1 | BC2 |
| 2 | BC3 |
| 3 / 4 | BC4 UNORM / SNORM |
| 5 / 6 | BC5 UNORM / SNORM |
| 7 / 8 | BC6H UF16 / SF16 |
| 9, 22 | BC7 (22 = high-quality encode) |
| 10 / 11 / 12 | R32G32B32A32 float / R16G16B16A16 UNORM / R16G16B16A16 float |
| 13 | R8G8B8A8 |
| 14 / 15 | B5G6R5 / B5G5R5A1 |
| 19 / 20 / 21 | R8 / A8 / R8G8 |

All rows :observed. The header parse reproduces every BC mip-0 size exactly over all 169,351 textures; loading each strictly
(exactly one `TXCB` blob with `TXCH`, mip 0 inside the data with exactly the format's size, transcoding other than 1, address
mode 0 to 2) fails on none. :observed

The address mode over the 169,351 textures is 0 (wrap) for 71,302 and 1 (clamp) for 98,049; mode 2 never occurs. Clamp is on
the per-cell terrain maps (`mainmap_*`, `submap_*`, `autouberglossmap_*`, whose half-texel border makes neighbouring cells share
edge texels) and on most `ub_*` far-LOD swatches; tiling surfaces, detail maps, normal maps and swatch-tint palettes are
wrap. :observed Whether the run-time sampler of every slot honours the texture's own mode is not established; materials also
carry sampler-state parameters. :unknown

## Quality tiers

The quality tiers `_qualityN` are the same image at different sizes (q1 smallest, up to q5 for terrain cell maps); every
texture has at least its q1 tier in `GeoChunk0`. :observed A texture id in other files is
`PVSTextureIndex << 4 | (quality − 1)`. :observed

## Sampling rules

A shader reads a texture according to its stored format: `*_SRGB` formats are converted from sRGB to linear by the GPU, all
others are read raw. A decoder keeps each texture's format and picks the colour space from it, not from what the slot is
used for. :observed BC4 and BC5 **SNORM** have signed endpoints (−127..127 → −1..1, D3D palette rules, −128 clamps to −127);
decoding them as UNORM corrupts the data (the `environment` deposit maps are BC4 SNORM). :observed

Several data maps are sRGB (`Mask_MetalnessATexture`, `ubershader_default_roughnessmetala`, the road `roadmodneutral`
modulate); the `projection_lod` `*_rough` maps are BC5 SNORM. Filtering happens after the per-texel decode on the GPU, which
differs from filtering an 8-bit sRGB image first by up to 0.29 at a 0/1 edge of a metal mask and up to 0.07 for colour.
:observed

Formats with no 8-bit path (BC6H HDR emissive maps and lightmaps, R16G16B16A16) are in use by the game; BC6H carries the
emissive and lightmap data. :observed

## Normal maps

Every family except `snow` decodes a tangent-space normal map the same way:

```
x = 2·s.r − 1,  y = 2·s.g − 1,  z = sqrt(saturate(1 − x² − y²))        blue and alpha are not normal data
n = T·x − B·y + N·z,   B = cross(N, T) · T.w                           N, T = normalised world normal and tangent
```

`s` is the sampled value, so a SNORM map gives `x = 2v − 1` on the signed value. :observed On the game's meshes `T = +dP/du`
and `cross(N, T) × w = +dP/dv`, with D3D's v pointing down the image (73,176 triangles of 242 meshes, 99.6% agree); so `−B·y`
makes green+ point to the top of the image: the maps are Y+ ("OpenGL"), and green is not inverted. :observed Two independent
checks agree: a Blender-style tangent frame on 1,997 real triangles puts green as stored a median 0.03° from the game's
normal against 34° inverted; and of the 209 Tokyo normal maps where a curl-free test is decisive, 197 are Y+ and 12 Y−.
:observed

`snow` reads its normal map raw (`normalize(s.rgb)` in tangent space, no `2v − 1`): its shipped map averages (0.5, 0.5, 1),
which tilts every normal about 35° toward T + B. :observed

## Placeholder and default textures

The data contains textures that stand in for missing art. Markers: near-uniform images in a saturated colour (red, green,
magenta, olive, cyan), images of 8 px or less, and names containing `default`, `testb`, `flat`, `placeholder`, `debug` or
`missing`. Early road dashes and facade dashes of the Tokyo map were such placeholders; the red `ubershader_default_diffusea`
on road decals is the default of the `TerrainGlossTexture` slot (0xAE91CDD4), a wetness and gloss map that never reaches the
colour in dry weather. :observed The engine's neutral modulate texture `greyscale_grey128` has RGB 127/255, which is a
brightness and saturation shift of 0.002, below one 8-bit step. :observed A window glass default is `#2A3038`. :inferred

215 texture paths referenced by car materials are in no archive of the install (referenced 396 times from materials of 142
cars: mostly badge and symbol labels, `car_standard` alpha, normal and roughness maps, interior LOD maps, the
`pg_hatchback_lip_ao` back normal of seven lamp lenses); what the engine binds for a missing texture is run-time only.
:observed In the world, 81 distinct texture hashes of the Tokyo core are in no archive (festival banners, flags,
projection-LOD textures). :observed

## Other texture containers

Livery decals (`media\Livery\Decals.zip`: 270 BC7 sRGB `decalNNN.swatchbin`, `DecalsHiRes.zip`: 188) and livery masks
(2,048 × 1,024 BC4 UNORM per region in each car archive) use the same container. :observed The pause-map tiles are 1,024 px
swatches ([The map](/engines/forzatech/world/coordinates-and-cells/)). :observed

:::open[What does the second encoded colour profile field mean?]
Offset 44 (`encoded colour profile`) is read and kept; only the target profile (offset 48, 1 = sRGB) selects a format.
:::
