---
title: Time-of-day presets and light units
description: "Forza Horizon 6's sky presets (media/TimeOfDay/*.ppr): the file format (names, groups, leaves, curves), the physical light units, the sun's illuminance and the emissive scales, and where the lighting passes consume them."
implementations:
  - name: forzatech-formats (ppr.rs)
    url: https://github.com/Kalmarv/forzatech-formats/blob/main/src/ppr.rs
---

Each track has a time-of-day file in `media\TimeOfDay\` (the Tokyo track `Brio` has `TimeOfDay_Brio.ppr`; `TimeOfDay.ppr`
is the same kind of file for the older tracks) that lists its sky presets. A preset is a group of kind `Sky`, named by its
label; it holds the sky and cloud files, the sun's illuminance, the exposure settings and the scales that put authored
brightness into the lighting units. Other groups select a preset for a stretch of the day, bind weather, fog and zones to
presets, and hold the file's globals. The files are plain (not encrypted) and read without keys. :observed

## The file

A `.ppr` file is a table of names followed by a flat list of groups, each a list of typed leaves. All values are
little-endian. :proven[the six `.ppr` files of the install, `TimeOfDay_Brio.ppr`, `TimeOfDay.ppr` and `Homespace.ppr` in `media\TimeOfDay` and one each in `media\DeformableTerrain`, `media\Water` and `media\Weather`, each read to its last byte by a reader that refuses any value or length the layout below does not hold; none of the 9,076 zip archives of the install holds a `.ppr` entry]

| Part | Layout | Confidence |
|---|---|---|
| Header | `u32` version (3 in `TimeOfDay_Brio.ppr`, `DeformableTerrain.ppr` and `WeatherManager.ppr`; 2 in `TimeOfDay.ppr`, `Homespace.ppr` and `Water.ppr`), `u32` name count | :proven |
| Names | per name a `u8` length and that many printable ASCII bytes (2,954 names in `TimeOfDay_Brio.ppr`, 1,962 in `TimeOfDay.ppr`); three files have one empty name, which is the value of an empty string | :proven |
| Root | `u16` name index (0 in every file: the file's own name, `TimeOfDay_Brio`), `u32` group count (2,350 in `TimeOfDay_Brio.ppr`, 1,337 in `TimeOfDay.ppr`, none in `Homespace.ppr`) | :proven |
| Group | `u16` kind (a name), `f32`, `f32`, `u16` label (a name), `u32` leaf count, then that many leaves; groups do not nest | :proven |
| Leaf | `u8` type, `u16` name, `u16` id, then the payload of the type | :proven |

The first group of `TimeOfDay_Brio.ppr` and of `TimeOfDay.ppr` is the globals, kind `SkyGlobals` (48 and 32 leaves). :proven
A leaf's name and id are table entries: the id is a GUID string
(all 54,109 leaves of `TimeOfDay_Brio.ppr`), one for each pair of a group kind and a property name (452 pairs), so the
same property in two kinds of group can have two ids. A name's first use is followed in the table by its id (307 of 307 names;
50,966 of the 54,109 leaves have the id right after their name). :proven[`TimeOfDay_Brio.ppr`]

| Type | Payload | Confidence |
|---|---|---|
| 0 | `i32`, 0 or 1 (5,609 leaves of `TimeOfDay_Brio.ppr`) | :proven |
| 1 | `i32` | :proven |
| 2 | `f32` | :proven |
| 3 | `u16` name index, a string value | :proven |
| 4 | `f32` × 2 (21 leaves, each of a different property: ranges and the exposure boxes of the cameras) | :proven |
| 5 | a scalar curve | :proven |
| 6 | a colour curve | :proven |
| 7 | `f32` × 4 (one leaf, `GroundPlaneColour`) | :proven |

A curve (types 5 and 6) is a `u32` component count and per component a `u8` flag, a `u32` key count and the keys as `f32`.
A key starts with its time, then: for type 5 with flag 0 one value (8 bytes a key); for type 6 with flag 0 four values, red,
green, blue and a fourth that is 0 in every key (20 bytes); for type 5 with flag 1 four values in version 2 files and five in
version 3 files (20 and 24 bytes), whose order is not established. No other flag occurs. :proven[the six files; flag 1 occurs in 11 components of `TimeOfDay.ppr` and 8 of `TimeOfDay_Brio.ppr`, all on `ExposureRange` and `Grading.Scales`] Most curves have one component; of the type 5 leaves of `TimeOfDay_Brio.ppr`, 34,125 have one, 732 two (the three
`ExposureRange` properties), 277 four (`Clouds.SunShadowChannelSelection`) and 210 five (`PostProcess.Grading.Scales`); the 2,054
type 6 leaves have one. :proven[`TimeOfDay_Brio.ppr`]
Curve times are 0 at the first key of all 39,801 components of `TimeOfDay_Brio.ppr` and 1 at the last key of 39,645; the other
156 end between 0.9906 and 1, and one component has a key earlier than its predecessor. :proven[`TimeOfDay_Brio.ppr`]

`TimeOfDay_Brio.ppr` has 2,350 groups of 22 kinds: `SkyPreset` 1,113, `FogGlobalMaterial` 270, `Sky` 203,
`SkyZoneBinding` 162, `FogGlobalPreset` 127, `FogGlobalShaping` 101, `SkyWeatherBinding` 75, `SkyTransition` 69,
`SkyZoneFog` 61, `SkyWeatherPrecipitation1` to `3` 25 each, `SkyOverrideFog` 24, `SkySeasonBase` and `SkySeasonBinding` 20
each, `LocalFogWeatherBinding` 12, `AllowedScenarios` 5, `SkyZoneTunnel` 4, `SkyOverrideGrade` 4, `SkyZoneCity` 3,
`SkyGlobals` 1 and `TransitionPropertySet` 1. :proven[the file]

- The 203 `Sky` groups (the presets) each have 199 leaves, the same properties in the same order. A `Sky`'s label is its
  name (190 distinct: 13 labels are borne by two skies). The label `Forte_Summer_01` is borne by one. Its leaf `Files.NameOverride`
  names the sky files, empty for `Forte_Summer_01` itself, and `Forte_Summer_01` for 12 other presets (11 named
  `House_*_Forte_Summer_01`, and `InitialExperience_FreeRoam`), which reuse its sky files with other scales. :proven[`TimeOfDay_Brio.ppr`]
- A `SkyPreset` group (1,113) has five leaves: `SkyName`, `ForcedGrade`, `ForcedVolumetricFogPreset`,
  `ForcedVolumetricFogGlobalPreset` and `MoveToWholeFrame`. Its label is the preset's own name (`BP_Summer01_Dawn_01`) and its
  `SkyName` names a `Sky` label in 723 of the 1,113. Twenty-three name `Forte_Summer_01`, with group floats between 213.7
  and 1,160; the one labelled `Forte_Summer_01` has 720 and 780. :proven[`TimeOfDay_Brio.ppr`]
- A group's two floats are stored in every group and mean something this page does not establish. `SkyGlobals` has 0 and 1,440
  in `TimeOfDay_Brio.ppr`; the `Sky` labelled `Forte_Summer_01` has 181.86 and 1,181.46; the 11 `House_*` presets of
  `Forte_Summer_01`'s files have 181.2 and 1,180.8. :unknown[stored values; the 1,440 is the minutes of a day]

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

- `Sun.LightingIlluminanceLux` is a curve in every preset. Its peak over the 203 presets is 0 in 48, from 0.05 to 0.32 in 33,
  from 1 to 300 in 26 (the night, studio and garage presets), and between 6,000 and 200,000 lux in the other 96: 72,000
  (rounded to the thousand) in 22, 70,000 in 13, 80,000 to 82,000 in 12, 120,000 in 4, 200,000 in 1. :observed
- `PostProcess.AdaptiveExposure.ExposureBias` is a curve of one component and `.ExposureRange` one of two components in every
  preset. In `Forte_Summer_01` the bias is 0 at 0 and 0.063, −0.5 at 0.103, −0.35 at 0.18, 0 at 0.241, −0.25 from 0.284 to
  0.291, 0 at 0.299 and 0.361, −0.7 at 0.379, −1 at 0.399 and 0 from 0.414 on; the first component of the range is −10 at 0, 2
  at 0.077, 5 at 0.119, 0 from 0.18 to 0.899, 1.39 at 0.93, 2.5 at 0.96 and −3 at 1, the second 11 at 0, 14 at 0.08, 15.5 at
  0.113, 20 at 0.4, 19.87 at 0.798, 18 at 0.899, 16 at 0.94, 12 at 0.96 and 10 at 1. The 11 `House_*` presets that reuse its
  files have a bias that is 0 except −0.2 at 0.376, −0.25 at 0.399 and 0 at 0.404, and the same range. :observed
- `EmissiveIntensityVsExposure` (a curve, 1 at both of its two keys) and `EmissiveIntensityExposureRange` (−25 to 25) occur
  once in `TimeOfDay_Brio.ppr`, in the `SkyGlobals` group and in none of the presets: the emissive intensity does not vary with
  exposure there. :observed

## Emissive scales

Each preset has the scalars below as curves (constant ones have two keys). Counts are over the 203 presets of
`TimeOfDay_Brio.ppr`. :observed

| Field | Values |
|---|---|
| `EmissiveScales.TrackEmissiveEV` | constant 1 in 71; constant 6,600 in 50; a curve 1 to 50 in 30; constant 100 in 25; constant 50 in 8; 35, 1,200, 50,000 and 5 in 2 each; and 11 others once (3.5 to 30,000) |
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
`SkyToLuminanceScale` 6,600) and others in 10. The names are those of `Files.NameOverride`, the sky files a preset uses. :observed
The preset labelled `Forte_Summer_01` has `TrackEmissiveEV` 1 at 0, 3 at 0.029, 50 from 0.149 to 0.899, 3 at 0.989 and 1 at 1,
so its peak is 50; `CarEmissiveEV` 225 at 0, 300 at 0.028, 825 at 0.06, 1,000 at 0.073, 10,000 at 0.108, 22,000 at 0.12, 38,720
at 0.54, 16,000 at 0.9 and 825 at 0.96; `ForwardPlusEV` 0, 4.5 at 0.057, 0 from 0.126 to 0.926, 3 at 0.946, 1.85 at 0.97 and 0 at 1;
`SkyToLuminanceScale` 13,200; and a sun of 63,000 to 65,000 lux from 0.48 to 0.599, peaking at 65,000 at 0.54. The 11
`House_*_Forte_Summer_01` presets that reuse its files have `TrackEmissiveEV` 1 at 0 and 0.059, 50 at 0.359 and 0.719, 1 at
0.959 and 1, `CarEmissiveEV` 825 at 0 and 0.06, 22,000 at 0.12, 38,720 at 0.54, 22,000 at 0.9 and 825 at 0.96, `ForwardPlusEV` 0
until 0.926, 4 at 0.946, 5 at 0.97, and a sun peak of 70,000 lux at 0.599. `InitialExperience_FreeRoam`, the twelfth, has
`TrackEmissiveEV` 1 throughout. :observed

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
Each curve's time runs from 0 to 1 and the sun of `Forte_Summer_01` is 0 until 0.075, rises from 0.091 and is 0 again from 0.926,
peaking at 0.54. The preset's two group floats are 181.86 and 1,181.46, and the `SkyPreset` labelled `Forte_Summer_01` that selects
it has 720 and 780. If the time maps linearly onto the two floats as minutes of the day (`SkyGlobals` has 0 and 1,440), the sun
rises between minutes 257 and 273 (04:17 to 04:33), peaks at minute 722 (12:02), and is gone from minute 1,107 (18:27), and
the peak lies in the hour of that `SkyPreset`. :inferred[the arithmetic; no running game was read] Whether the mapping is
linear and the floats are minutes is not established.
:::
