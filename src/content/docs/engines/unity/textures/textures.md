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
  - name: primase worlds/unity (read/texture.rs)
    url: https://github.com/Kalmarv/primase/blob/main/worlds/unity/src/read/texture.rs
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

The `TextureFormat` ids met in the games, and whether they decode exactly:

| Id | Format | Bytes | Seen in | Confidence |
|---|---|---|---|---|
| 1 | Alpha8 | 1 per pixel | SkateBIRD (82 in `sharedassets0`) | :observed{games="skatebird"} |
| 2 | ARGB4444 | 2 per pixel | | :sourced[Unity scripting reference] |
| 3 | RGB24 | 3 per pixel | SkateBIRD (2 in `sharedassets0`) | :observed{games="skatebird"} |
| 4 | RGBA32 | 4 per pixel | SkateBIRD (10 in `sharedassets0`) | :observed{games="skatebird"} |
| 10 | DXT1 (BC1) | 8 per 4×4 block | SkateBIRD (207 in `sharedassets0`) | :observed{games="skatebird"} |
| 12 | DXT5 (BC3) | 16 per 4×4 block | SkateBIRD (146 in `sharedassets0`) | :observed{games="skatebird"} |
| 24 | BC6H | 16 per 4×4 block | | :sourced[Unity scripting reference] |
| 25 | BC7 | 16 per 4×4 block | Sledding Game | :observed{games="sledding"} |
| 26 | BC4 | 8 per 4×4 block | | :sourced[Unity scripting reference] |
| 27 | BC5 | 16 per 4×4 block | | :sourced[Unity scripting reference] |
| 63 | R8 | 1 per pixel | | :sourced[Unity scripting reference] |
| 28, 29, 64, 65 | crunched DXT1, DXT5, ETC, ETC2 | variable | none in SkateBIRD's `sharedassets0` | :observed{games="skatebird"} |

Crunched formats (Unity's own compression layer) need Unity's crunch decoder. SkateBIRD uses none. :observed{games="skatebird"}

Against an independent decoder over the textures of Sledding Game's mountain scene,
every texture's size, level count and colour space agree; level 0 decodes to the same RGBA8 for uncompressed formats and BC7
exactly, and for DXT1 and DXT5 within 1: the difference is the rounding of the interpolated palette entries, which the two
decoders do differently. :observed{games="sledding"}

:::open[Crunched textures in the other games]
Whether Sledding Game, PEAK or Big Walk store any crunched texture is not checked; the independent decoder comparison for
Sledding Game covers the formats listed above.
:::

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
