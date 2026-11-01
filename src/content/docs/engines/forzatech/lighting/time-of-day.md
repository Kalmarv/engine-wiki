---
title: Time-of-day presets and light units
description: "Forza Horizon 6's sky presets (media/TimeOfDay/*.ppr): the property-bag format, the physical light units, the sun's illuminance and the emissive scales, and where the lighting passes consume them."
---

Each track has a time-of-day file in `media\TimeOfDay\` (the Tokyo track `Brio` has `TimeOfDay_Brio.ppr`; `TimeOfDay.ppr`
is the same kind of file for the older tracks) that lists its sky presets. A preset holds the sky and cloud files, the
sun's illuminance, the exposure settings and the scales that put authored brightness into the lighting units. The files
are plain (not encrypted) and read without keys. :observed

## The file

A `.ppr` file is a table of names followed by typed records. All values are little-endian. :observed

- Two `u32` come first: a version (3 in `TimeOfDay_Brio.ppr`, 2 in `TimeOfDay.ppr`) and the number of names (2,954 and
  1,962), then the name table: each name is a length byte and that many ASCII bytes. The records follow after two
  zero bytes. :observed[both files; the strings read up to the first non-text bytes number the count plus the two zero bytes]
- A record is `type u8, name u16, name+1 u16, payload`, where `name` indexes the table (the second `u16` is always the
  first plus one in every record read). :observed[the records of `TimeOfDay_Brio.ppr` were located by this pattern and the payload sizes below held for every one decoded]
- Payloads: types 0 and 1 an `i32`; type 2 an `f32`; type 3 a `u16` name index (a string value); type 4 two `f32`; type 7
  four `f32`; type 5 a scalar curve and type 6 a colour curve: `u32` (meaning unknown), `u8` flag, `u32` key count, then
  per key the time and one value (type 5) or three (type 6) as `f32`. :observed
- Curve times run from 0 to 1 (the first key of every curve read is 0 and the last 1). How the 0 to 1 parameter maps onto the
  clock is not established: the sun's illuminance of a dynamic preset is 0 until 0.075, peaks at 0.599 and is 0 again from
  0.926. :observed The grouping of records into presets is not recorded in the table; the records of a preset follow its
  `Files.NameOverride` record, and `TimeOfDay_Brio.ppr` has 203 of them. :observed

## Physical light units

Over the 203 presets of `TimeOfDay_Brio.ppr`: :observed

| Field | Values |
|---|---|
| `PhysicalLightUnits.Enabled` | 1 in 202, 0 in 1 (the one with 0 has both scales 1) |
| `PhysicalLightUnits.LuminanceToLightBufferInvScale` | 6600 in 202, 1 in the one with `Enabled` 0 |
| `PhysicalLightUnits.SkyToLuminanceScale` | 6600 in 157; 13,200 in 14; 52,800 in 12; 26,400 and 25,000 in 6 each; 40,000 in 2; 1, 3,200, 32,000, 42,000, 45,000 and 62,000 in 1 each |

The names read as: a sky texel is multiplied by `SkyToLuminanceScale` to give a luminance, and a luminance is divided by
`LuminanceToLightBufferInvScale` to give the value held in the light buffer. :inferred[the field names; no constant buffer
of the running game was read]

## Sun and exposure

- `Sun.LightingIlluminanceLux` is a curve in every preset. Its peak over the 203 presets is 0 in 48, from 0.05 to 1 in 33,
  from 1.5 to 300 in 26 (the night, studio and garage presets), and between 6,000 and 200,000 lux in the other 96: 72,000
  (rounded to the thousand) in 22, 70,000 in 13, 80,000 to 82,000 in 12, 120,000 in 4, 200,000 in 1. :observed
- `PostProcess.AdaptiveExposure.ExposureBias` and `.ExposureRange` are curves in stops; the dynamic summer preset
  `Forte_Summer_01` has a bias of 0 except a dip of −0.25 over 0.376 to 0.404 and a range that is −10 at 0, 2 at 0.077, 5 at
  0.119, 0 from 0.18 to 0.899, 1.39 at 0.93, 2.5 at 0.96 and −3 at 1. :observed
- `EmissiveIntensityVsExposure` (a curve, 1 at both of its two keys) and `EmissiveIntensityExposureRange` (−25 to 25) occur
  once in `TimeOfDay_Brio.ppr`, outside the presets: the emissive intensity does not vary with exposure there. :observed

## Emissive scales

Each preset has the scalars below as curves (constant ones have two keys). Counts are over the 203 presets of
`TimeOfDay_Brio.ppr`. :observed

| Field | Values |
|---|---|
| `EmissiveScales.TrackEmissiveEV` | constant 1 in 71; constant 6,600 in 50; a curve 1 to 50 in 30; constant 100 in 25; constant 50 in 8; 35, 1,200, 50,000 and 5 in 2 each; and 16 others once (3.5 to 30,000) |
| `EmissiveScales.CarEmissiveEV` | constant 3,200 in 131; constant 155 in 17; a curve 825 to 38,720 in 17; 22,000 in 7; others |
| `EmissiveScales.ForwardPlusEV` | constant 0 in 159; a curve from 0 up to 4.5 or 5 (night) in 23; others |
| `EmissiveScales.LightGlowEV` | constant 0 in 196 |
| `EmissiveScales.VFXEmissiveEV` | constant 1 in 172; a curve from 1 up to 50 to 100 in 14 |
| `EmissiveScales.Cubemap` | constant 1 in 199 |
| `GlobalIllumination.GIEmissiveScale` | 1 in 139, 2 in 52, a curve 1 to 6.944 in 9, 10 in 2, 0 in 1 |

By the sun's peak illuminance: of the 107 presets below 500 lux, `TrackEmissiveEV` is constant 1 in 55 and constant 6,600 in 43
(`GIEmissiveScale` 2 in 42 of them and `CarEmissiveEV` 3,200 in 42: 41 unnamed presets, `Debug_Grey` and `Forte_Autoshow_01`) and something else
in 9; of the 96 presets above 500 lux it is a curve 1 to 50 in 30 (`Forte_Summer_01` 11, `Forte_Spring_01` 5, `Forte_Overcast_01` 4,
`Forte_Summer_02` 3, `Forte_Autumn_01` 1 and 6 unnamed), constant 100 in 25 (`BeautifulArea_Midday` at 15,000
to 200,000 lux), constant 1 in 16, constant 50 in 8, constant 6,600 in 7 (sun 40,000 to 81,000 lux, `GIEmissiveScale` 2,
`SkyToLuminanceScale` 6,600) and others in 6. :observed
`Forte_Summer_01` (one of its 12 blocks, the dynamic one) has `TrackEmissiveEV` 1 at 0 and 0.059, 50 at 0.359 and 0.719, 1 at 0.959
and 1; `CarEmissiveEV` 825 at 0 and 0.06, 22,000 at 0.12, 38,720 at 0.54, 22,000 at 0.9, 825 at 0.96; `ForwardPlusEV` 0 until
0.926, 4 at 0.946, 5 at 0.97; `SkyToLuminanceScale` 13,200 and a sun peak of 70,000 lux at 0.599. :observed

## How the lighting passes consume the scales

- The world G-buffer pass writes the lit colour seed to `RT1.xyz`: forward local lights and the emissive term of
  [Other world families](/engines/forzatech/shaders/world-families/#emissive). The local-light term is `albedo / π` times a
  light record's intensity, the distance falloff and `N·L`, with no scene constant in the shader; the emissive term is the
  material's emission times `g(d)` and carries no preset scale either. :observed[the `projection_lod _E` permutations read]
- `FPlusPlus_CombineSeperateDiffuseSpec_Final_Tile0` loads the colour at the pixel from a read-write texture, adds the
  lit terms to it (in most material-flag branches the loaded colour is passed through unscaled), divides the sum by the
  scene constant `cb[59].x`, blends with a sky cube sample times `cb[59].z` by a fog factor, multiplies by `cb[59].x`
  and stores to the same texture. :observed[one compute shader of the 1,687 read]
  The loaded colour is thus in the units of the lit terms and of the sky term `cb[59].x · cb[59].z · cube`; if
  `cb[59].x · cb[59].z` is `SkyToLuminanceScale` and the seed is in the same unit, the seed is a luminance in cd/m². :inferred
- Neither that shader nor the deferred composite pixel shader `FPlusPlus_Composite_NoDepthWrite_DirectLight_DXR_PixelClassify0`
  (which reads `RT1.xyz` only under two material flags, as a retro-reflective colour) multiplies the colour by the distance
  squared, so nothing there undoes `g(d)`. :observed[two shaders]

## Open questions

:::open[Where is `TrackEmissiveEV` applied?]
No G-buffer shader reads multiplies an emissive term by a preset scale and the two lighting shaders read add it unscaled, so the
scale reaches the emissive pixel through values the CPU uploads (a material constant, or a scene constant of a pass that
was not read). Whether the lit unit is cd/m² or the light buffer's (cd/m² / 6600) is not established by the files.
:::

:::open[Is `g(d)` undone anywhere?]
An emissive pixel at distance `d` holds `e · g(d)`, `1/d²` beyond 1 m. No shader read multiplies it back. A frame capture of one
emissive pixel with known texel, distance and preset would fix `scale · g(d)` and the unit at once.
:::

:::open[What does the 0 to 1 curve parameter mean?]
The sun's illuminance of a dynamic preset peaks at 0.599, not 0.5.
:::
