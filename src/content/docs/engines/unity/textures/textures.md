---
title: Texture2D
description: "How Unity stores a texture: format ids, the mip chain, row order, colour space, normal map usage modes, wrap and filter, streaming, and the engine's default textures."
games: [skatebird, sledding, peak, big-walk]
sources:
  - title: Universal Render Pipeline source
    url: https://github.com/Unity-Technologies/Graphics
    note: how URP unpacks normal maps
  - title: Unity scripting reference, TextureFormat
    url: https://docs.unity3d.com/ScriptReference/TextureFormat.html
    note: format ids
  - title: UnityPy (Texture2DConverter)
    url: https://github.com/K0lb3/UnityPy
    note: reader used as the independent decoder
implementations:
  - name: unity-formats (texture.rs)
    url: https://github.com/Kalmarv/unity-formats/blob/main/src/texture.rs
---

A **Texture2D** (class 28) stores a width, height, a pixel format, a chain of mip levels and the sampler settings the
engine uses. The pixels are either inside the object (`image data`) or streamed from a `.resS`
([StreamingInfo](/engines/unity/archives/player-data-folder/)). :observed

## Fields

| Field | Meaning | Confidence |
|---|---|---|
| `m_Width`, `m_Height` | size of level 0 | :observed |
| `m_TextureFormat` | Unity's `TextureFormat` id (table below) | :observed |
| `m_MipCount` | number of levels | :observed |
| `m_ColorSpace` | 1 sRGB, 0 linear | :observed |
| `m_LightmapFormat` | the texture usage mode; 3 = a normal map stored as DXT5nm, 4 = a normal map stored as plain RGB | :observed |
| `m_TextureSettings.m_FilterMode` | 0 point, 1 bilinear, 2 trilinear | :observed |
| `m_TextureSettings.m_WrapU`, `m_WrapV` | 0 repeat, 1 clamp, 2 mirror, 3 mirror once | :observed |
| `m_TextureSettings.m_MipBias` | added to the level of detail the texture is sampled at | :observed |
| `m_TextureSettings.m_Aniso` | anisotropic filtering level; above 1 means anisotropic | :observed |
| `m_StreamData` | `offset`, `size`, `path` of the pixels in a stream file; empty (or size 0) means the pixels are in `image data` | :observed |

## Mip chain

The levels follow each other, largest first, with no padding: level *i* is `max(1, width >> i)` by `max(1, height >> i)`
pixels, and the levels' sizes add up to the whole of the pixel data. :observed{games="sledding"} A reader can therefore
reject a texture whose stated sizes do not match its data. :observed

**Rows are stored bottom first.** Unity's texture origin is the bottom left, so row 0 is v = 0. An image-space (top-left
origin) consumer flips the rows; for uncompressed and BC1 to BC5 whole-block levels that is an exact in-place swap of rows
and block rows, for others a decode. :observed

## Formats

The `TextureFormat` ids met in the games, and whether they decode exactly. A census read the `m_TextureFormat` of every
Texture2D object of every serialized file and bundle of the four installs (SkateBIRD's 31 loose files, Sledding Game's 7
loose files and 50 Addressables bundles, PEAK's 13 loose files and 7 level bundles, Big Walk's `data.unity3d`): 259,045
objects, none refused. Which ids occur is :proven for those builds; the counts below are objects, not distinct images.

| Id | Format | Bytes | SkateBIRD | Sledding Game | PEAK | Big Walk | Confidence |
|---|---|---|---|---|---|---|---|
| 1 | Alpha8 | 1 per pixel | 82 | 67 | 467 | 93 | :proven |
| 2 | ARGB4444 | 2 per pixel | 0 | 0 | 0 | 0 | :proven that none occurs |
| 3 | RGB24 | 3 per pixel | 9 | 11 | 280 | 14 | :proven |
| 4 | RGBA32 | 4 per pixel | 31 | 81 | 864 | 93 | :proven |
| 5 | ARGB32 | 4 per pixel | 0 | 0 | 8 | 17 | :proven |
| 9 | R16 | 2 per pixel | 0 | 0 | 0 | 1 | :proven |
| 10 | DXT1 (BC1) | 8 per 4×4 block | 501 | 548 | 1,881 | 86 | :proven |
| 12 | DXT5 (BC3) | 16 per 4×4 block | 486 | 881 | 3,957 | 841 | :proven |
| 13 | RGBA4444 | 2 per pixel | 0 | 0 | 0 | 0 | :proven that none occurs |
| 15 | RHalf | 2 per pixel | 0 | 0 | 0 | 2 | :proven |
| 17 | RGBAHalf | 8 per pixel | 0 | 0 | 0 | 1 | :proven |
| 19 | RGFloat | 8 per pixel | 0 | 0 | 0 | 2 | :proven |
| 20 | RGBAFloat | 16 per pixel | 0 | 0 | 0 | 4 | :proven |
| 24 | BC6H | 16 per 4×4 block | 0 | 0 | 123,848 | 2 | :proven |
| 25 | BC7 | 16 per 4×4 block | 0 | 4 | 27 | 4 | :proven |
| 26 | BC4 | 8 per 4×4 block | 0 | 0 | 123,848 | 1 | :proven |
| 27 | BC5 | 16 per 4×4 block | 0 | 0 | 0 | 0 | :proven that none occurs |
| 63 | R8 | 1 per pixel | 0 | 1 | 0 | 0 | :proven |
| 28 | crunched DXT1 | variable | 0 | 1 | 0 | 1 | :proven |
| 29, 64, 65 | crunched DXT5, ETC, ETC2 | variable | 0 | 0 | 0 | 0 | :proven that none occurs |

No other id occurs in the four installs, and every texture is a plain 2D one (`m_TextureDimension` 2).
:proven{games="skatebird sledding peak big-walk"} For every texture of a format in the table other than the crunched ones,
`m_CompleteImageSize` equals the sum of the levels' sizes at the format's bytes per pixel or block (258,915 textures); the
only 128 that differ are empty 0×0 font atlases of size 0. :proven{games="skatebird sledding peak big-walk"} The ids and names
are those of Unity's `TextureFormat` enum. :sourced[Unity scripting reference]

Crunched formats (Unity's own compression layer) need Unity's crunch decoder: Sledding Game's `Fish` (2048², 12 levels) and
Big Walk's `Metal032_2K_Roughness` are the only two crunched textures in the four installs; SkateBIRD and PEAK have none.
:proven{games="skatebird sledding peak big-walk"}

Against an independent decoder over the textures of Sledding Game's mountain scene,
every texture's size, level count and colour space agree; level 0 decodes to the same RGBA8 for uncompressed formats and BC7
exactly, and for DXT1 and DXT5 within 1: the difference is the rounding of the interpolated palette entries, which the two
decoders do differently. :observed{games="sledding"}

### BC6H holds unsigned half floats

A BC6H block does not say whether its endpoints are signed; the texture's format decides. Unity's BC6H (id 24) is the
**unsigned** variant (Direct3D's `BC6H_UF16`): decoding 5,030 of the 123,850 BC6H textures of the installs both ways, the
unsigned decode gives finite, non-negative, smooth values (largest value in any texture 8.43, mean of each texture
0.15 to 0.82) and the signed decode of the same blocks gives a largest value of at least 22,416 (up to 65,504, the half-float
maximum) and a mean of at least 2,720 in every one of the 5,030, and negative values in 734 of them. :observed{games="peak big-walk"} The sample is the 1,016
BC6H textures of PEAK's loose `level1`, `level3` and `level4`, one level scene of each of PEAK's seven bundles (4,012
textures) and Big Walk's two 2048² BC6H textures (`Mask - 2k Noise`, `Mask - 2k Square`, linear colour space, 12 levels):
the unsigned decode of those is a noise field and a rounded square, the signed decode is saturated. :observed{games="peak big-walk"}
A second implementation of both variants agrees with the first on the unsigned decode to within one 8-bit step on 24 sampled
textures, and on the signed decode on all but 0.04% of the samples. :observed{games="peak"}

PEAK stores 123,848 BC6H textures and as many BC4 textures, all unnamed and with one level, in 25 sizes (132×276 is the most
common, 53,272 of them). :proven{games="peak"} SkateBIRD and Sledding Game have none. :proven{games="skatebird sledding"}

:::open[Nibble order of ARGB4444 and RGBA4444]
No texture of the four installs uses id 2 or 13, so the order of the four-bit channels inside the 16-bit value is not
established by data. Community decoders disagree about it.
:::

### ARGB32 byte order

Byte 0 of an `ARGB32` (id 5) pixel is alpha. :observed{games="big-walk"} Four of Big Walk's `GlobalTint` terrain textures
(128², no alpha in the tint) have byte 0 equal to 255 in every pixel while the other three bytes vary; so the stored order is
A, R, G, B. :observed{games="big-walk"}

## Colour space and normal maps

`m_ColorSpace` 1 marks a texture Unity samples as sRGB; 0 means the raw values are used as linear data. **A linear texture
used as a base colour** is sampled as linear, but glTF base colour slots are always decoded as sRGB, so such a texture used
as it is renders darker than in the game (SnowIceURP base maps up to 52/255 off).
:observed{games="sledding"}

A normal map has usage mode 3 (DXT5nm: x in alpha, y in green) or 4 (plain: x in red). Unity's normal maps are green up with
z rebuilt from the unit length; URP unpacks x from red times alpha, which is alpha for DXT5nm and red for plain maps.
:sourced[Universal Render Pipeline source]

## Engine default textures

A shader property can declare a default texture by name (`white`, `black`, `gray`, `grey`, `bump`, `red`, `linearGray`,
`linearGrey`). A property left unassigned samples that default. The players hold no texture with these names (none in
SkateBIRD's or Sledding Game's files), so they are built into the engine. :observed{games="skatebird sledding"} An editor
(Unity 6000.6.4f1, Gamma colour space, Direct3D 12) that samples each default into a render texture gives:

| Default | RGBA sampled |
|---|---|
| `white` | 1, 1, 1, 1 |
| `black` | 0, 0, 0, 0 (alpha 0) |
| `red` | 1, 0, 0, 0 (alpha 0) |
| `gray`, `grey`, `linearGray`, `linearGrey` | 127/255 in all four channels |
| `bump` | 127/255, 127/255, 1, 1 |
| no default, or a name that is no default | 128/255 in all four channels |

:observed Those values come from a newer editor than the players' builds and one colour space; `white`, `black` and `red`
have channels of 0 or 1 and are the same in either colour space, the greys and `bump` are measured for Gamma only.
:observed

## Shared and global textures

The engine also supplies textures that no material has a property for: the shadow map (`_ShadowMapTexture` in the built-in
pipeline, `_MainLightShadowmapTexture` in URP), reflection probe cubes (`unity_SpecCube0`, `unity_SpecCube1`,
`_GlossyEnvironmentCubeMap`), light-probe volumes, the camera depth and grab textures. SkateBIRD's programs name them in
their texture tables; Sledding Game's URP shader objects keep a variant's textures in a per-variant parameter blob
([shader objects](/engines/unity/shaders/shader-objects/)), where they are named the same way. :observed{games="skatebird sledding"}
