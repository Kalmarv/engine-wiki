---
title: Swatch textures (.pb and .swatchbin)
description: The Forza Horizon 6 texture container, its header, pixel formats, quality tiers, sampling rules, the normal map convention and the placeholder textures the data contains.
---

A texture is a [Grub bundle](/engines/forzatech/data-model/grub-bundle/) holding a `TXCB` blob with the mip chain, whose
`TXCH` metadata is the PC texture content header. Track textures are `.pb` files named
`<name>_<guid>_qualityN.pb` (some use a short id instead of a GUID, such as `_bclr_tupfjgh`); shared engine textures are
`.swatchbin` entries in zips. :observed A texture's game path is
`game:\media\<rel>\<name>_<guid>.swatchbin`, which is what material parameters hash ([Materials](/engines/forzatech/materials/materialbin/)). :observed The `SourceHash` of the track's
[asset manifest](/engines/forzatech/data-model/asset-manifest/#sourcehash) is the same hash. :proven

A texture bundle holds exactly one blob, `TXCB`, with exactly one metadata record, `TXCH` version 0. :proven[every texture of the install]
The `TXCB` blob's version names the header: 0.0 the PC header below, 2.0 the Durango (Xbox One) header. :proven[every texture of the install]

The install (build 25588841) holds 318,129 textures: 169,351 `.pb` in `GeoChunk0` to `GeoChunk3`, all PC, and in its zips
22,251 `.pb` and 126,527 `.swatchbin`, of which 148,767 are PC and 11 are Durango (all `.swatchbin` in `WeatherTextures.zip`).
The file extension does not tell the container: a zip holds both. Every one of them reads under
the rules below with no refusal and no byte of any header unaccounted for. :proven[all 318,129 textures]

## Header

```layout
title: TXCH metadata (PC)
size: variable
games: [fh6]
note: "Offsets are from the start of the TXCH metadata. Little-endian. The header ends exactly after the last mip record."
fields:
  - {at: 0, size: 4, type: u32, name: slice list offset, value: "0x38", level: proven}
  - {at: 4, size: 4, type: u32, name: first mip record link, level: proven, note: "the offset of the first mip record plus 4"}
  - {at: 8, size: 16, type: "u8[16]", name: guid, level: proven, note: "a Windows GUID; the (last) GUID in the file name when the name holds one, on 219,951 of the 220,008 textures whose name holds one; 54 of the other 57 (car scene textures in five car zips) hold 00000000-0000-0000-0000-000000000001 and the last 3 (the `test*_diff` swatches of DefaultTextures and a cinematic library) all hold 25C29A40-AA32-4334-933F-DC8EB3D663A0"}
  - {at: 24, size: 4, type: u32, name: width, level: proven}
  - {at: 28, size: 4, type: u32, name: height, level: proven}
  - {at: 32, size: 4, type: u32, name: depth, level: proven, note: "1, or the number of layers every mip holds (9, 60 and 128 occur); it does not shrink from mip to mip"}
  - {at: 36, size: 2, type: u16, name: slice count, level: proven, note: "1, the array size or 6 for a cube; at most 128"}
  - {at: 38, size: 1, type: u8, name: mip count, level: proven}
  - {at: 39, size: 1, type: u8, name: flags, level: observed, note: "0, 1, 4, 5 or 6; bit 0 set only on 6-slice textures"}
  - {at: 40, size: 4, type: u32, name: transcoding, level: proven, note: "0 on every texture"}
  - {at: 44, size: 4, type: u32, name: second colour profile, level: unknown, note: "equal to the colour profile at 48 on every texture"}
  - {at: 48, size: 4, type: u32, name: colour profile, level: proven, note: "0 linear, 1 sRGB; selects the sRGB DXGI format where one exists"}
  - {at: 52, size: 4, type: u32, name: address mode, level: observed, note: "0 on every texture of a zip; 0 or 1 on the GeoChunk .pb (1 on 98,049 of 169,351)"}
  - {at: 56, size: 4, type: u32, name: slice list offset again, value: "0x40", level: proven}
  - {at: 60, size: 4, type: u32, name: slice list link, value: "0x44", level: proven}
  - {at: 64, size: "12 per slice", type: bytes, name: slice records, level: proven, note: "{ u32 encoding, u32 offset of the slice's first mip record, u32 next slice record offset + 4 or 0xFFFFFFFF on the last }"}
  - {at: "after the slice records", size: "12 per mip per slice", type: bytes, name: mip records, level: proven, note: "{ u32 size, u32 offset into the TXCB data, u32 next mip record offset + 4 or 0xFFFFFFFF on the very last }; one list runs through every slice, largest mip first"}
```

The slice count is a whole u16: bits 14 and 15 are 0 on every texture (no platform bits). :proven[all 318,118 PC textures]
A mip record's size is the bytes its format needs for that level, times the depth: `max(1, width >> level)` by
`max(1, height >> level)` pixels, a block-compressed level a whole number of 4 × 4 blocks and at least one. :proven[every mip of every slice of all 318,118 PC textures]
The mips follow one another in the `TXCB` data with nothing between, from offset 0 to the end of the data, slice by slice. :proven[all 318,118 PC textures]
An independent reading of where the mips lie, ForzaTools.TexConv's DDS writer read back by BCnEncoder.Net (which takes each
mip's size from the DXGI format alone), gives the same bytes for every mip of a sample of textures of depth 1. :observed[a sample of PC textures]
Flag bit 0 is set only on textures of 6 slices (cube maps), and not on every texture of 6 slices. :proven[all 318,118 PC textures]
Whether the other flag bits mean "premultiplied" or anything else is not established. :unknown

The pixel format is the first slice's `encoding`, and it is sRGB only when the colour profile is 1. :proven[every PC texture; the same formats as ForzaTools and Doliman's tables]

| Encoding | Format | DXGI (linear / sRGB) |
|---|---|---|
| 0 | BC1 | 71 / 72 |
| 1 | BC2 | 74 / 75 |
| 2 | BC3 | 77 / 78 |
| 3 / 4 | BC4 UNORM / SNORM | 80 / 81 |
| 5 / 6 | BC5 UNORM / SNORM | 83 / 84 |
| 7 / 8 | BC6H UF16 / SF16 | 95 / 96 |
| 9 | BC7 | 98 / 99 |
| 10 / 11 / 12 | R32G32B32A32 float / R16G16B16A16 UNORM / R16G16B16A16 float | 2 / 11 / 10 |
| 13 | R8G8B8A8 | 28 / 29 |
| 14 / 15 | B5G6R5 / B5G5R5A1 | 85 / 86 |
| 19 / 20 | R8 / A8 | 61 / 65 |

Counted by the first slice's encoding, the 318,118 PC textures are: BC7 212,892; BC1 30,374; BC4 UNORM 26,382 and SNORM 5,344;
BC5 UNORM 14,035 and SNORM 2,583; R8 8,955; R16G16B16A16 float 6,618 and UNORM 935; BC6H UF16 5,064; R8G8B8A8 4,860; A8 51;
BC3 19; BC2 4; R32G32B32A32 float 2. No slice of any texture has an encoding of 16 to 18, 21 or 22 (the reader refuses them), and no texture's first slice is
BC6H SF16, B5G6R5 or B5G5R5A1. :proven[all 318,118 PC textures]
Sources list 21 as R8G8 and 22 as a high-quality BC7 encode; neither occurs in this install. :sourced[ForzaTools]
Transcoding 1 ("BcBlockRle") exists in the enum but no PC texture uses it. :proven[all 318,118 PC textures]

The address mode (offset 52) over the 169,351 GeoChunk `.pb` textures is 0 (wrap) for 71,302 and 1 (clamp) for 98,049, and 0
on all 148,767 PC textures of the zips (`.pb` or `.swatchbin`); mode 2 never occurs. :proven[all 318,118 PC textures]
Clamp is on the per-cell terrain maps (`mainmap_*`, `submap_*`, `autouberglossmap_*`, whose half-texel border makes neighbouring
cells share edge texels) and on most `ub_*` far-LOD swatches; tiling surfaces, detail maps, normal maps and swatch-tint
palettes are wrap. :observed Whether the run-time sampler of every slot honours the texture's own mode is not established;
materials also carry sampler-state parameters. :unknown

## Durango header

A texture whose `TXCB` blob is version 2.0 has a 35-byte `TXCH` payload: the GUID (16 bytes), the base mip's width and height
(u16 each), the slice count (u16), the full texture's width and height (u16 each), a u16, the mip count, the full mip count and
the base mip (u8 each), and a u32 of bit fields. :proven[the 11 Durango textures of the install]
The bit fields are the console tile mode (bits 0 to 4; 13 on all 11), the encoding (5 to 10), the transcoding (11 to 16; 0) and
the colour profile (20 to 22). :proven[the 11 Durango textures of the install]
The payload is tiled for the console, and where each mip lies in it is not stored in the file. :observed

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
checks agree: a MikkTSpace tangent frame built from the mesh UVs on 1,997 real triangles puts green as stored a median 0.03° from the game's
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

The default of an unset normal-map slot is a SNORM map whose texels all hold the neutral normal. Over the Shibuya Scramble box,
four BC5 SNORM textures are bound to a normal-map slot of the `environment`, `environment_plot`, `environment_signage`, `glass`,
`environmentdeferreddecal`, `window_linecastroom` and `uber_roaddecal` families, and none holds a negative texel. :observed The
32 × 32 `TriPlanarNormalTexRef` default has one value in all 1,024 texels (the decoded bytes are 191 and 192, signed +0.498 and +0.506),
so `x = 2v − 1` is −0.004 and `y` is +0.012: a flat normal. :observed The 16 × 16 default of the `NormalHeightTexture` slot has bytes 184
to 198 (red) and 186 to 196 (green), so `2v − 1` lies within ±0.11 and its mean is 0.499: close to flat, but not one value.
:observed The 128 × 128 default of the `Blend2TextureSet` slots has bytes 151 to 231, so `2v − 1` reaches ±0.63: it is a detailed
normal map, not a flat default. :observed All four store only the positive half of the signed range, which fits the read
`2v − 1`: a negative `v` would give a component below −1. :inferred

215 texture paths referenced by car materials are in no archive of the install (referenced 396 times from materials of 142
cars: mostly badge and symbol labels, `car_standard` alpha, normal and roughness maps, interior LOD maps, the
`pg_hatchback_lip_ao` back normal of seven lamp lenses); what the engine binds for a missing texture is run-time only.
:observed In the world, 81 distinct texture hashes of the Tokyo core are in no archive (festival banners, flags,
projection-LOD textures). :observed

## Other texture containers

Livery decals (`media\Livery\Decals.zip`: 270 BC7 sRGB `decalNNN.swatchbin`, `DecalsHiRes.zip`: 188) and livery masks
(2,048 × 1,024 BC4 UNORM per region in each car archive) use the same container. :observed The pause-map tiles are 1,024 px
swatches ([The map](/engines/forzatech/world/coordinates-and-cells/)). :observed

:::open[What does the second colour profile field mean?]
Offset 44 equals the colour profile at offset 48 on every PC texture, so no texture says what it would be if it differed;
only the profile at 48 selects a format.
:::
