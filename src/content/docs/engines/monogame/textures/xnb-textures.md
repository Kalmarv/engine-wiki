---
title: Textures in XNB files
description: "The two texture encodings in STUNTBOOST's content: XNA's raw Texture2D and the QOI images of the BytingPipeline reader, and the sampler settings its levels use."
games: [stuntboost]
sources:
  - title: QOI specification
    url: https://qoiformat.org/qoi-specification.pdf
    note: the lossless image format of QoiReader files
  - title: MonoGame Texture2DReader
    url: https://github.com/MonoGame/MonoGame
    note: the layout of a Texture2D object in an XNB
implementations:
  - name: primase worlds/monogame (xnb.rs)
    url: https://github.com/Kalmarv/primase/blob/main/worlds/monogame/src/xnb.rs
---

STUNTBOOST stores its images two ways, both inside [XNB containers](/engines/monogame/archives/xnb-containers/). Neither is
block-compressed on disk. :observed{games="stuntboost"}

## Texture2D (XNA's reader)

The 401 `Texture2DReader` files (125 in `Textures/UI`, 103 in `Models/Resources`, 70 in `Achievements`, 53 in `Controls`, and the rest in `World`, `Playtesting`,
`HUD` and `Button`) hold a raw uncompressed surface. After the
reader's type id the object is: the surface format (`i32`), width, height and level count (each `i32`), then per level a byte
count (`i32`) and the pixels. :proven{games="stuntboost"}

```layout
title: Texture2DReader object
size: variable
games: [stuntboost]
note: "Little-endian. After the 7-bit type id of the primary object."
fields:
  - {at: 0, size: 4, type: i32, name: surface format, value: "0", level: proven, note: "SurfaceFormat.Color: 8-bit R, G, B, A; 0 in all 401 files"}
  - {at: 4, size: 4, type: i32, name: width, level: proven}
  - {at: 8, size: 4, type: i32, name: height, level: proven}
  - {at: 12, size: 4, type: i32, name: level count, level: proven, note: "1 in all 401 files"}
  - {at: 16, size: "per level", type: "level[]", name: levels, level: proven, note: "per level an i32 byte count (width × height × 4 of that level, with each side halved per level and at least 1) and that many bytes, rows top to bottom"}
```

Each file is read to its last byte, and every level's byte count is its pixels' size. :proven{games="stuntboost"} The sizes
vary: 640 × 144 (153 files), 64 × 64 (25), 279 × 337 (14), 160 × 90 (13) and many others. :proven{games="stuntboost"}

## QOI images (BytingPipeline.QoiReader)

The 576 `QoiReader` files hold the larger images: the baked lighting atlases of the levels, the background and achievement
art. The object is an `i32` byte count and a [QOI](https://qoiformat.org/) file of that length, which ends exactly at the end of
the XNB. :proven{games="stuntboost"}

A QOI file has a 14-byte header (`qoif`, width and height as big-endian `u32`, channels, colour space), a stream of chunks and
an 8-byte end marker. :sourced[QOI specification] All 576 have 4 channels and colour space 0 (sRGB with linear alpha).
:proven{games="stuntboost"}

| Size | Files | Where | Confidence |
|---|---|---|---|
| 4096 × 4096 | 198 | `Models/Resources`: the baked atlases of the levels | :proven{games="stuntboost"} |
| 1920 × 432 | 154 | `Textures/Backgrounds` and `Achievements` | :proven{games="stuntboost"} |
| 1920 × 1080 | 69 | backgrounds | :proven{games="stuntboost"} |
| 512 × 512 | 60 | | :proven{games="stuntboost"} |
| 5160 × 2161 and 5160 × 2160 | 55 and 7 | backgrounds | :proven{games="stuntboost"} |
| 2048 × 2048, 1024 × 1024, 256 × 256, 691 × 1080, 1404 × 688, 1920 × 416 | 8, 3, 2, 4, 2, 1 | | :proven{games="stuntboost"} |

374 of the QOI files are in `Models/Resources` (the level bakes and model textures), 128 in `Textures/Backgrounds`, 68 in
`Textures/Achievements` and 6 in `Textures/UI`. :proven{games="stuntboost"}

## Sampling

A level's glTF materials point at their textures through glTF samplers. The levels' samplers state nearest magnification (9728)
and nearest-mipmap-linear minification (9984), so texels are crisp. :observed{games="stuntboost"}

## Baked atlases

The lighting of a level is baked into atlases, one per bake group, `BakeN_Denoised`, and a second `BakeN_DIRECT_Denoised`
carried as the material's `KHR_materials_specular` colour texture ([baked lighting](/engines/monogame/lighting/baked-lighting/)).
The atlas alone looks much darker than the game draws it, because no colour grading is applied at run time and the grading is
part of the bake. :observed{games="stuntboost"}
