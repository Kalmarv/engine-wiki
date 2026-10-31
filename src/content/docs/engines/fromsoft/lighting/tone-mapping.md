---
title: Exposure, tone curve and colour grading
description: "How the final picture is formed from the lit scene: the exposure scale and its meter, the Reinhard curve table, the colour matrix, vignette and the 16³ grading look-up, with their constants, files and defaults."
---

The last stage of the [rendered frame](/engines/fromsoft/lighting/frame/) turns the lit HDR scene into the 10-bit picture.
One program, `ToneMap_TabledToneMapLUTPS`, does it in both games: it scales the scene by an exposure, adds the bloom, maps
each channel through a Reinhard curve stored as a 1024 × 1 table, applies a colour matrix and a vignette, and looks the result
up in a 16 × 16 × 16 grading table. The curve table and the grading cube are written earlier in the same frame from the
draw parameters ([GPARAM](/engines/fromsoft/lighting/gparam/)) and a texture strip of the map. :observed

## The stages

The two games run the same stages in a different order: Elden Ring applies the colour matrix to the HDR colour before the
curve, Sekiro to the mapped colour after it. :observed[the final program's code in each game]

| Step | Sekiro | Elden Ring | Confidence |
|---|---|---|---|
| 1 | Scene × scene exposure, plus bloom | Scene × scene exposure (`g_ToneMapSceneLumScale`), plus glare | :observed |
| 2 | Curve: the table read at `x / (x + 0.2)` per channel | Colour matrix `g_mtxColorMultiplyer` (3 × 4) on the HDR colour | :observed |
| 3 | Colour matrix on the mapped colour | Curve: the table read at `x / (x + 0.2)` per channel | :observed |
| 4 | Vignette | Vignette | :observed |
| 5 | Input power `cbToneMap[2].z`, then the 16³ grading cube | the same | :observed |

The Elden Ring order is read from the DXIL of the installed `ToneMap_TabledToneMapLUTPS` (10,219 bytes), the same bytecode the
recorded Stormveil frame draws with. :observed{games="elden-ring"} A renderer that serves both games keeps the matrix's place as
data of the game rather than fixing one order. :inferred

In Sekiro's standard (SDR) branch: :observed[the program's disassembly and one recorded draw]{games="sekiro"}

- the colour matrix is three rows of four, each dotted with (mapped r, g, b, 1), and negative results are clamped to 0;
- the vignette takes `r = length((2 uv − 1) × xy)` and `t = 1 − saturate(r × z + w)` from its constant, and multiplies by
  `(t² (3 − 2t))⁴`;
- the grading cube is sampled at `pow(rgb, cbToneMap[2].z) × 15/16 + 1/32`, trilinearly between texel centres with the edges clamped.

The HDR-output branch is a different path, not described here.

## The tone constants

`cbToneMap` (`b1`, 416 bytes in Elden Ring) carries the curve's parameters `g_ReinhardParam` (`ReinhardContrast`,
`ReinhardWhiteBalance`) and, in its row 2, `g_ToneMapParam`: (`Contrast`, the table exponent, the input power).
:observed{games="elden-ring"} Sekiro's program uses the same row: the curve table's exponent is `g_ToneMapParam.y` and the
grading cube's input power `cbToneMap[2].z`. :observed{games="sekiro"}

The table exponent and the input power come from one gamma value. The tone parameters' constructor stores a gamma of 2.2 and a
pair of flags `0x0101`; when the second flag is set, the constant-buffer writer puts `1 / gamma` into the input power (byte 40,
`[2].z`) and 1 into the table exponent (byte 36, `[2].y`); when it is clear, the gamma goes into the table exponent and the input
power is 1. A per-frame snapshot copies the parameters between the two. :observed[read from the code of Sekiro 1.06 and Elden Ring
2.7.2.0]

| | Sekiro 1.06 | Elden Ring 2.7.2.0 |
|---|---|---|
| Constructor, gamma store | `0x14024DB30`, 2.2 at `+0x30` (`0x14024DB6A`) | RVA `0x1B90000`, 2.2 at `+0x30` (`0x1B9003A`) |
| Flags | word `+0xC8` = `0x0101`, the second at `+0xC9` | word `+0xE8` = `0x0101` (`0x1B9005D`), the second at `+0xE9` |
| Writer: `1 / gamma` | `0x140250BB7`, stored at `0x140250BD3` | `0x1B940A7`, stored at `0x1B940C3` and `0x1B940DB` |

So by default the curve table is written with exponent 1 and the colour is raised to `1 / 2.2` before the grading look-up.
:inferred[from the constructor defaults] The recorded frames agree: Sekiro's final draw holds `cbToneMap[2].z` = 0.4545454383,
and rebuilding its input to the look-up from the frame's HDR scene, bloom, curve, matrix and vignette, a power of `1 / 2.2`
matches 14,504 sampled pixels within one step of the 10-bit target (largest difference 0.00092), where the sRGB curve matches 3
and no power none. :observed[one frame]{games="sekiro"} Elden Ring's recorded `g_ToneMapParam` holds the table exponent 1 and
`1 / 2.2`. :observed{games="elden-ring"} Whether the brightness setting of the options menu, or any other writer, replaces these
values is not traced. :unknown

## The curve table

`ToneMap_WriteReinhardExToneMappingTablePS` writes the tone curve as a 1024 × 1 R16F table. At texel `i`, with
`u = (i + 0.5) / 1024`, it computes `z = (0.2 × u / (1 − u) × g_ReinhardParam.y) ^ g_ReinhardParam.x` and writes
`(z / (1 + z)) ^ (1 / g_ToneMapParam.y)`. :observed[the program's disassembly]{games="sekiro"} The same operations in the same
order, rounded to `f16` where the program narrows, give all 1,024 stored half-words of a recorded frame's table bit for bit,
with the frame's constants: contrast 1.45, white balance 1.7 and gamma 1. :observed[one frame at the Ashina Castle gate]{games="sekiro"}
The program narrows to `f16` toward zero. :observed[one frame]{games="sekiro"}

The contrast and white balance are the Tone Map group's `ReinhardContrast` and `ReinhardWhiteBalance`, merged across the loaded
draw-parameter files and blended by hour like any other field.

- :only[sekiro] Of the 253 draw-parameter files of the install, which hold 151 Reinhard fields, `mapbase.gparam.dcx` stores
  `ReinhardContrast` 1.45 and `ReinhardWhiteBalance` 1.7, the recorded frame's values; `default.gparam` stores 1.6 and 1.7, and
  `m11_01_0000` neither. :observed[every installed draw-parameter file]{games="sekiro"} Merging the three by the game's
  [bank rules](/engines/fromsoft/lighting/gparam/#banks-and-layers) gives the frame's 1.45: the map's file leaves the field to
  `MapBase`. :observed[the merge computed from the installed files]{games="sekiro"}
- :only[elden-ring] Stormveil's `m10_00_0000` stores `ReinhardContrast` 1.6 at the key 0 and 1.45 at the key 11.5, and
  `ReinhardWhiteBalance` 1; its keys are offsets on the file's 24-hour axis, not clock hours
  ([looking up an hour](/engines/fromsoft/lighting/gparam/#looking-up-an-hour)). :observed[the installed file]{games="elden-ring"}
  What the weather layers above it change is not established. :unknown{games="elden-ring"}

## The grading table

Each map keeps its grading tables as texture strips in one package, `/map/mXX/mXX_cgrading.tpf.dcx` (Sekiro) or
`/map/mXX/common/mXX_cgrading.tpf.dcx` (Elden Ring). A strip is 16 × 256 texels of 8-bit RGBA (TPF format 105): sixteen
16 × 16 slices one above the other. A compute pass copies the chosen strip into a 16 × 16 × 16 volume, `cube[x, y, z] =
strip[x, y + 16z]`: red runs along x, green down each slice and blue from slice to slice, with no flips. :observed

| | Sekiro | Elden Ring |
|---|---|---|
| Package of the recorded area | `/map/m11/m11_cgrading.tpf.dcx`: `m11_01_CGrading0000`, `0010`, `0020`, `0030` (textures 4 to 7) | `/map/m10/common/m10_cgrading.tpf.dcx`: `m10_00_CGrading0000`, `m10_00_CGrading1000`, `m10_01_CGrading0000` |
| Copy program | `ToneMap_Blend2Dto3DLUTCS` | `ToneMap_Copy2Dto3DLUTCS` |
| Volume format | RGBA32F | RGBA16F |
| Confidence | :observed{games="sekiro"} | :observed{games="elden-ring"} |

The package contents are from a census of every texture package of each install; the copy programs and volume formats from the
recorded frames. Elden Ring's copy runs in 16 × 16 groups over the 16 slices, by its DXIL. :observed{games="elden-ring"}

The draw parameters choose the strip. `ColorGrading[Yebis]` `LutSourceId` names a table, and its value 0 is the strip
`…CGrading0000` in both recorded areas:

- :only[sekiro] The recorded Ashina Castle frame's 16³ volume is the strip `m11_01_CGrading0000` exactly: each 8-bit channel
  divided by 255 and placed by the rule above reproduces all 4,096 RGB texels with no difference. Of the 48 ways to permute and
  flip the three axes, only that one matches, and the other three strips miss under every one of them (by at least 0.039).
  :observed[one frame against the installed strips]{games="sekiro"} `m11_01_0000` stores `LutSourceId` 0 at 18:00, the hour of
  that frame, and 20 at 02:00 ([its keys](/engines/fromsoft/lighting/gparam/#time-of-day)). :observed{games="sekiro"} That
  `LutSourceId` 10, 20 and 30 are the strips `0010`, `0020` and `0030` follows their names and is not checked. :inferred{games="sekiro"}
- :only[elden-ring] At the Stormveil gate the copy's source texture begins with the same 64 bytes as `m10_00_CGrading0000` and
  as neither of the package's other strips, and `m10_00_0000` stores `LutSourceId` 0 at every key; the copy writes the volume
  the final program binds at `t2`. :observed[one frame, the first row of the source]{games="elden-ring"} The whole recorded volume
  was not read back.

Elden Ring's copy narrows each 8-bit value into a half float. Direct3D's conversion rules round toward zero when a float format
is narrowed :sourced[Direct3D 11.3 functional specification, 3.2.2], so the stored texel is the value of `n / 255` rounded
toward zero to `f16`. :inferred{games="elden-ring"} That differs from round-to-nearest for 123 of the 256 byte values, and in
6,799 of the 12,288 RGB components of `m10_00_CGrading0000`. :proven[every byte value, computed exactly]{games="elden-ring"}

## Exposure

Both games run a luminance chain before the tone map (pass 16 of the
[pass list](/engines/fromsoft/lighting/frame/#the-passes)). How Sekiro's result reaches the scene exposure is not read.
:unknown{games="sekiro"}

:only[elden-ring] The picture's exposure is a scale the CPU writes: `ToneMap_TabledToneMapLUTPS` multiplies the scene by
`cbToneMap`'s `g_ToneMapSceneLumScale` at byte 48, which equals `SC_SceneExposure`, and samples no luminance texture.
:observed[the program's DXIL, three frames]{games="elden-ring"}

The GPU measures the frame first: :observed[the DXIL of the four programs, with constants from recorded frames]{games="elden-ring"}

1. `ToneMap_DownSample2x2PS` halves the R11G11B10F scene, one bilinear tap per half-size texel (2560 × 1440 to 1280 × 720).
2. `ToneMap_ColorToLuminancePS` writes a 64 × 64 RG32F target. Each texel takes 16 bilinear taps of the half-size frame at its
   centre plus `((k mod 4 − 1.5) / 256, (k / 4 − 1.5) / 256)`, the luma `dot(rgb, (0.299, 0.587, 0.114))` of each (NaN or
   infinity read as 0) times `g_vScenePreExposure.z`, and `L = log2(Y + 1e-5) + 20`; it writes `(mean(L) × w, w)` with the centre
   weight `w = 1 − (1 − 2^−r)³`, `r = length(2(uv − 0.5) × g_AdaptCenterWeight.xy)`. `g_AdaptCenterWeight` is the draw
   parameters' `Center Weight` and that times 720 / 1280: (7, 3.9375) at Stormveil at noon.
3. `ToneMap_ScaleLuminancePS` takes exact 4 × 4 means, 64 to 16 to 4 to 1.
4. `ToneMap_AdaptedLuminancePS` forms `target = s.x / s.y − g_AdaptParam.x` and `adapted = prev + (target − prev)(1 − 10^−rate)`,
   the rate `g_AdaptParam.y` when the target is above the previous value and `.z` otherwise, and writes
   `(adapted, 2^−(adapted − 20))`. A still frame converges to `adapted = target`.

Read back from one frame (all six draws of the chain, the Stormveil gate, one GPU): the down-sample matches a 2 × 2 mean to
within 0.97 of an R11G11B10F step, each scale level is the exact 4 × 4 mean (to 1e-7 relative) and the adapted value the rule
above to 5e-7, with a rate times `T` of 0.005183 that frame. :observed[one frame]{games="elden-ring"} The shipped
`ToneMap_ColorToLuminancePS`, run outside the game on Direct3D 12 on the same GPU and driver with the root signature of its own
`RTS0` part and the frame's constants, vertex buffer and source texture, reproduces all 4,096 cells of the 64 × 64 target, both
words, bit for bit. :proven[the shipped program run on one frame's inputs]{games="elden-ring"}

The formula computed exactly does not: its cells are all above the game's, by 2.2e-4 in `log2` per sample on average, at every
brightness, and the metered value differs by 2e-4 stops (−6.838357 in the game). The difference comes from the texture unit's
bilinear filter, which on that GPU differs from the exact blend of the stored texels by up to 2⁻¹¹ relative per channel; the same
operations with the hardware's sample reproduce the game's cells (`w` 4,096 of 4,096, `x` 3,949, the rest within 3 ulp). The
GPU's `log2` is not correctly rounded (1 ulp off on 122,104 of 196,608 arguments), and the driver may reorder the per-sample
dot product and the loop it compiles, which moves single cells by an ulp; the 4 × 4 means absorb these, so the 1 × 1 result is
the game's in both words. :observed[one frame, one GPU]{games="elden-ring"} So the meter's last digits depend on the GPU, not
only on the program. :inferred{games="elden-ring"}

`g_AdaptParam` is (`AutoExposure Middle Gray`, the light adaptation speed × `T`, the dark adaptation speed × `T`, 0), `T` a
per-frame value that is 0 while the game is paused and 1/30 by default; in recorded frames it ranges from 0.025 to 1.28 with
the recorder's stalls, so it reads as the frame time in seconds. `g_vScenePreExposure` is `(e, 2^e, 2^−e, 0)`; it is (0, 1, 1, 0)
in all 26 frames read, so pre-exposure is off. :observed[read from the decrypted code, and 26 frames of two runs]{games="elden-ring"}

The CPU then sets the scale `S`. With `x = adapted − 20`, `adapted` being the value the GPU wrote four frames earlier (the
results come back through a ring of four read-backs), `log2 S = Exposure − L(1 − e^(−x / L))`, `L` being the Tone Map's
`AutoExposure Adaption Max` when `x > 0` and `Adaption Min` when `x < 0`: a soft clamp, not a hard one. `Exposure`, `Max` and `Min`
are the draw parameters at the current hour, blended by the clamped rule of [GPARAM](/engines/fromsoft/lighting/gparam/#looking-up-an-hour)
(each is registered with interpolation); `FreezeAdaptionFade` forces `x = 0`. :observed[read from the decrypted code]{games="elden-ring"}
Over 21 frames of two runs at Stormveil (`x` from −0.44 to −0.33) the rule gives `log2 S` within 0.00011; a lag of 0, 2 or 6
frames, or base 2 for the exponential, misses by 0.002 to 0.09. Only the `Min` branch is checked on data. :observed[21 frames,
two runs]{games="elden-ring"}

:::open[Does the brightness setting replace the default gamma?]
The constructor's gamma of 2.2 and the recorded frames agree, but a writer from the options menu, or a copy of the whole
parameter block from elsewhere, is not traced in either game.
:::

:::open[Which strips do the other look-up IDs name?]
Only `LutSourceId` 0 is tied to a strip, in one area of each game. How an ID becomes a texture name, and what happens between
two keys that store different IDs, are not established.
:::
