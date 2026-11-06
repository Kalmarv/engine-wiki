---
title: Materials, shaders and bitmaps
description: "How a Stadium surface gets its look: CPlugMaterial and its template shader, the shader names the campaign uses, CPlugBitmap and its chunks, the classes whose chunks a bitmap or shader also reads, texture transforms, normal maps and the image files."
games: [tmnf]
sources:
  - title: GBX.NET
    url: https://github.com/BigBang1112/gbx-net
    note: version 2.5.0; the Plug and Func classes, their inheritance and chunk lists
---

A visual is drawn with a `CPlugMaterial`, which names a template shader file; the shader's name says what it samples (diffuse,
specular, normal, occlusion, projected layers) and the material's bitmaps supply the images, each with its own texture
transform. :observed[the 65 campaign maps]

## Materials

`CPlugMaterial` chunk `0x0907900E` holds an `i16` surface ID and an `i16`. :observed[three TMUnlimiter maps] Its chunk
`0x0907900D` can hold a device material stored in place. :observed[the install's packs]

## Shaders of the campaign

The template shaders the 65 campaign maps' materials name, by their file names: :observed[the materials of the 65 campaign maps]

| Shader | Confidence |
|---|---|
| `TDiff_Spec_Nrm TOcc CSpecSoft`, with `NoLightV` and `WhiteSpecPC2` variants | :observed |
| `TDiff_Occ TSpec_Nrm CSpecSoft` | :observed |
| `PDiff_Spec_Nrm CSpecSoft` | :observed |
| `PDiff PDiff PA [TOcc] PX2 Grass[2]` | :observed |
| `SoilGen21`, `SoilFixToGen21`, `SoilFix` | :observed |
| `VDep Fence` | :observed |
| `TSelfI TDiffA PX2`, `TSelfI Add` | :observed |
| `TAdd Night`, with a `ZBias` variant | :observed |
| `ShadowSkirt` | :observed |
| `Sea` | :observed |

`VDep Fence` draws the grass blades: half-metre upright strips in a lattice over every grass square. :observed[the campaign
maps' grass] Drawn as plain cut-outs they show as pale lines over the grass seen from above; the game fades them by the angle of
view. :inferred[from the shader's name and how the grass looks in the game]

### Projected layers

The projected shaders (`P…` and `SoilGen…`) carry transforms other than the identity on their projected slots: the grass's
`Blend1` a scale of 0.2, a repeat every 5 m; the dirt's `Blend1` 0.0678; `FabricFloor` 0.0625. :observed[the campaign maps]
These shaders sample texture-coordinate set 3. :observed[the campaign maps] The grass mesh's own texture coordinates are its
block-local position divided by 32, so the projection is from the position. :inferred

## Bitmaps

`CPlugBitmap` stores the chunks `0x09011019`, `01C`, `01E`, `020`, `022` and `024`. :observed[the install's packs] Its texture
coordinate rotation is in degrees: 180, −30 and −120 occur. :observed[the campaign maps]

| Order (chunk `0x09011022`) | Field | Type | Confidence |
|---|---|---|---|
| 1 | Image | node reference: an external DDS file, or an inline `CPlugFileGen` | :observed |
| 2 | Flags | `u64`: the usage in the low 8 bits, the pixel update in the next 8 | :observed |
| 3 | Mip, bump and LOD values | three `f32` | :observed |
| 4 | Border colour | packed | :observed |
| 5 | By mode | a render reference (mode 4), specular records (mode 7) or a clear colour (mode 8) | :observed |

:observed[the install's Game/Stadium packs, read to the end and compared with GBX.NET]

### Procedural images

`CPlugFileGen` (`0x0902F000`, version 2) is a procedural image read in place, with no chunks
([classes without chunks](/engines/gamebox/data-model/nodes/#classes-without-chunks)). All 38 in the Game/Stadium packs begin
with `0x80000002` and hold named arrays of integer, `vec4` colour and `f32` parameters. :observed[38 files]

## Inherited chunks

Several appearance classes read the chunks of their base classes before their own, as GBX.NET's class tables have it; the
install's packs read to the end that way. :observed[the install's packs, compared with GBX.NET]

| Class | Reads | Confidence |
|---|---|---|
| `CPlugBitmapApply` (`0x09012000`) | `CPlugBitmapSampler` `0x0907E008`, `CPlugBitmapAddress` `0x09047007` and `009`, then its own `0x09012004` | :observed |
| `CPlugShaderApply` (`0x09026000`) | the base shader's `0x0900200E` and `016`, the generic material's `0x09004003`, then its own `0x09026002`, `004` and `008` | :observed |
| `CPlugShaderPass` (`0x09067000`) | `006`, `007`, `00A` | :observed |
| `CFuncShaderLayerUV` (`0x05015000`) | `CFuncPlug` `0x0500B005` (timing, input ID and booleans), then its own | :observed |
| `CFuncShaders` (`0x05014000`) | `CFuncPlug` `0x0500B005`, then its own `0x05014000` | :observed |

Seven bitmap-render classes read the chunks `0x09086003`, `008`, `00A`, `00B`, `00C` and `00E` of their base and then their
own: Water (`005`, `006`), Overlay (`000`), LightOcc (`000`), Camera (`001`), Sub (`000`), Hemisphere (`001`) and LightFromMap
(`001`). :observed[the install's packs]

## Images

Most images are DDS files; reflections are cube maps (`DefaultCubeReflect*.dds`), and the arrow screens' `Advert` is a Bink
(`.bik`) video. :observed[the campaign maps' images] A few are TGA files beside the DDS, each with a TGA 2.0 footer:
:observed[the install]

| File | TGA | Confidence |
|---|---|---|
| `StadiumWarpAuvent2N.tga` | type 2, 15 × 16, 32 bits per pixel, descriptor 8 | :observed |
| `GrassFresnel.tga` | type 2, 128 × 1, 24 bits per pixel | :observed |
| Techno `SeaHeightPC2.tga`, `SeaHeightPC3.tga` | type 3 (grey), 512 × 512, 8 bits per pixel, yet descriptor 8 (eight alpha bits), a quirk of the writer | :observed |

The three packs hold 50 DDS files with 42 distinct contents, every one under the legacy (Direct3D 9) header. 33 are 2D
block-compressed textures by FourCC (16 `DXT1`, 1 `DXT3`, 16 `DXT5`) and 7 are cube maps with all six faces (2 `DXT1`,
5 `DXT5`). The other 2 are 24-bit RGB by channel masks, a format Direct3D 10 and later have no equivalent for, which
DirectXTex expands to 32-bit RGBA as it loads. Three of the FourCC files also carry nonzero bit counts or channel masks,
which the FourCC overrides. DirectXTex's library (may2026) reads every distinct file with these formats, shapes and
images. :proven[the 50 DDS files of the three packs]{games="tmnf"}

Normal maps are BC3 in the DXT5nm arrangement: red 0, blue about 255, X in alpha and Y in green. :observed[`StadiumRoadN`]

:::open[Which way does a normal map's green point?]
Whether green is +Y up or down the texture is not established.
:::
