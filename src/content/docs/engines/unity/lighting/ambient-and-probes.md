---
title: Ambient light, probes and fog
description: "A scene's RenderSettings: ambient modes (skybox, trilight, flat), the stored spherical-harmonics probe, fog, and the values every scene of SkateBIRD, Sledding Game and PEAK stores."
games: [skatebird, sledding, peak]
sources:
  - title: Unity scripting reference, RenderSettings and AmbientMode
    url: https://docs.unity3d.com/ScriptReference/Rendering.AmbientMode.html
    note: the ambient modes and the fog modes
  - title: Universal Render Pipeline source (Unity-Technologies/Graphics)
    url: https://github.com/Unity-Technologies/Graphics
    note: UniversalRenderPipeline.cs converts the ambient colours to the active colour space
implementations:
  - name: primase worlds/unity (passes/lower_ambient.rs)
    url: https://github.com/Kalmarv/primase/blob/main/worlds/unity/src/passes/lower_ambient.rs
---

Each scene stores one **RenderSettings** object (class 104) with its ambient lighting, fog, skybox material, reflection
settings and the sun. The ambient lighting a surface receives comes from one of three sources, chosen by
`m_AmbientMode`. :sourced[Unity scripting reference]

| `m_AmbientMode` | Name | Light comes from | Confidence |
|---|---|---|---|
| 0 | Skybox | the ambient probe `m_AmbientProbe`, generated in the editor from the skybox | :sourced[Unity scripting reference] |
| 1 | Trilight | a gradient of three colours: sky, equator, ground | :sourced[Unity scripting reference] |
| 3 | Flat | the sky colour alone | :sourced[Unity scripting reference] |
| 4 | Custom | the probe, generated from a custom cubemap | :sourced[Unity scripting reference] |

The three colours (`m_AmbientSkyColor`, `m_AmbientEquatorColor`, `m_AmbientGroundColor`) are stored in every mode. In skybox
mode they are whatever the scene last held for trilight, which is Unity's default when never set: sky (0.212, 0.227, 0.259),
equator (0.114, 0.125, 0.133), ground (0.047, 0.043, 0.035). They are not authored light. :proven[every skybox-mode scene of SkateBIRD and of Sledding Game build 25351629]{games="skatebird sledding"} :observed{games="peak"}

## The probe

`m_AmbientProbe` is a spherical-harmonics probe of nine coefficients per colour channel (27 floats: red 0 to 8, green 9 to 17,
blue 18 to 26). It is what the editor last generated, which is not necessarily what the colours stored beside it produce:
an all-zero probe means the editor never generated it. :observed

The band-0 coefficients (`sh[0]`, `sh[9]`, `sh[18]`) equal the average of the probe over all directions, in Unity's
packing of `SphericalHarmonicsL2` (the canonical constant basis function after the Lambert convolution, factor 1).
:sourced[Unity scripting reference] In every skybox-mode scene of SkateBIRD and Sledding Game, `m_IndirectSpecularColor` equals those three
coefficients exactly. :proven{games="skatebird sledding"} It does in PEAK's loose scenes too. :observed{games="peak"}

In trilight and flat modes the probe is not what Unity lights by, and a stored one can be stale: SkateBIRD's `level1`,
`level3`, `level5`, `level7` and `level12` store the identical probe although `level7`'s trilight colours differ from the
others'. :proven{games="skatebird"}

## Colour space and intensity

The colour space of the project decides how stored colours are read: the `PlayerSettings` of SkateBIRD, Sledding Game, PEAK and
Big Walk all state a linear colour space (`m_ActiveColorSpace` 1), read as that one field (the Unity 6 players' whole object is
longer than its published layout, see [type trees](/engines/unity/data-model/type-trees/#a-short-layout)) and the same from an
independent reader. :observed{games="skatebird sledding peak big-walk"} Under URP, the pipeline converts the ambient sky, equator and ground
colours with `CoreUtils.ConvertSRGBToActiveColorSpace`, so the stored colours are sRGB-encoded whatever the project's colour
space; decoding is per channel like `Color.linear`, unclamped above 1. :sourced[Universal Render Pipeline source]
`m_AmbientIntensity` applies only to the skybox ambient source; trilight and flat colours are HDR colours used as they are.
:sourced[Universal Render Pipeline source] That Unity's own trilight-to-spherical-harmonics blend is not in the published
source is why the trilight result for the built-in pipeline is not verified against the engine. :inferred

## Fog

`m_Fog` (on or off), `m_FogMode` (1 linear, 2 exponential, 3 exponential squared), `m_FogColor`, `m_FogDensity` for the exponential
modes and `m_LinearFogStart` and `m_LinearFogEnd` for linear. :sourced[Unity scripting reference]

## What the games store

Sledding Game and PEAK store:

| Scene | Mode | Intensity | Fog | Probe average (`sh[0]`, `sh[9]`, `sh[18]`) | Confidence |
|---|---|---|---|---|---|
| Sledding `level0` Boot | skybox | 1.0 | off | (0.1803, 0.2257, 0.3069) | :proven{games="sledding"} |
| Sledding `level1` mountain, build 25351629 | skybox | 1.0 | on, mode 3, density 0.002 | (0.1792, 0.2244, 0.3062) | :proven{games="sledding"} |
| Sledding `level1` mountain, build 26054124 | trilight | 1.0 | not recorded | not recorded; `m_IndirectSpecularColor` is 0 | :observed{games="sledding"} |
| PEAK `level0` | skybox | 1.0 | off | (0.1803, 0.2257, 0.3069); sky colour (0.9661, 0.7698, 0.4804) | :observed{games="peak"} |
| PEAK `level1`, `level3`, `level4` | flat | 0.5 | off, density 0.0035 | (0.0127, 0.1238, 0.5654); sky colour (0.9804, 0.9804, 0.9804) | :observed{games="peak"} |
| PEAK `level2` | skybox | 1.0 | off | (0.1803, 0.2257, 0.3069) | :observed{games="peak"} |

A flat-mode PEAK scene stores a probe whose average is a blue (0.0127, 0.1238, 0.5654) unrelated to its white flat colour, so
its probe is stale. :observed{games="peak"} The table covers PEAK's five loose scenes; the 208 level scenes in its
AssetBundles are not measured. :observed{games="peak"} Sledding Game's lodge is inside the mountain scene and shares its
RenderSettings; the scene stores one ambient. :proven{games="sledding"} In build 26054124 `level1` stores trilight mode with no skybox
material: sky (0.6392, 0.9581, 1.0189, alpha 1.5), equator (0.7065, 0.9223, 1.0189, alpha 1.5) and ground (0.3532, 0.4612, 0.5094,
alpha 1.5), HDR colours used as they are, with intensity 1. :observed{games="sledding"} Build 25351629 stored skybox mode with
Unity's default trilight colours. :observed{games="sledding"}

## SkateBIRD

SkateBIRD's scenes, by build index (the trilight colours are sky (0.5647, 0.5972, 0.6795), equator (0.7835, 0.7835, 0.7835) and
ground (0.5457, 0.5457, 0.5457) unless noted; intensity 1.0 everywhere, fog off, fog mode 3, density 0.01 unless noted):

| Scenes | Mode | Probe | Notes | Confidence |
|---|---|---|---|---|
| 0 title, 1 bedroom 1, 2 rooftop, 3 office, 4 server room, 5 bedroom 2, 12 playground | trilight | stored | the colours are as stated; the probe and skybox differ per scene | :proven{games="skatebird"} |
| 6 credits | trilight | all zero | | :proven{games="skatebird"} |
| 7 flashback | trilight | stored, identical to bedroom 1's | sky (0.5621, 0.5986, 0.6765), equator (0.7206, 0.5195, 0.4716), ground (0.5441, 0.5441, 0.5441); fog density 0.06 | :proven{games="skatebird"} |
| 13 skate heaven | trilight | all zero | | :proven{games="skatebird"} |
| 8 loading | skybox | stored | | :proven{games="skatebird"} |
| 9 MasterAudio, 10 Win10 Platform, 11 Steam Store Platform | skybox | all zero | | :proven{games="skatebird"} |

Fog is off in every SkateBIRD scene. :proven{games="skatebird"}

### Reflections

SkateBIRD's scenes store the reflection source `Skybox` with intensities 0.344 (bedrooms, rooftop, office, playground, skate
heaven), 0.548 (server room) and 0.0 (flashback), and a subtractive shadow colour (0.42, 0.478, 0.627); each scene has 1 to 23
reflection probes (the office has 23). :proven{games="skatebird"}

## PEAK

PEAK's levels light their surfaces from globals that its scripts set when a level starts, not from `RenderSettings` alone:
:observed[the managed scripts read, and level 4's volume rebuilt]{games="peak"}

- `FogShaderParams.Start` sets the global texture `FogTexture`.
- `LightVolume.Start`, when the light map's RGB and alpha slice arrays are both non-empty, rebuilds the light volume: each slice
  is a BC6H texture (RGB) and a BC4 texture whose red is the alpha, read with `GetPixels` and written with `SetPixels` into an
  `RGBAHalf` `Texture3D` with no mips (rows in Unity's order, not flipped), which it binds as `_LightMap`. It then sets
  `_Brightness`, `_AmbienceStrength`, `_AmbienceMin`, `_GridRes` (x, y, z, 0), `_RaySpacing` and `_GridOffset` (w 0), the grid
  size and offset copied from the light map. These slices are the unnamed one-level BC6H and BC4 textures of the level bundles
  ([textures](/engines/unity/textures/textures/)) :inferred[from the pairing and their equal counts]{games="peak"}. A reader assembling level 4's volume (`576878`) this way gives the editor's
  `RGBAHalf` bytes slice for slice.
- `FogConfig.Start` sets `_WeatherBlend` to 0. `_WindTexture` and the `Wind*` globals are set only by `FogConfig.SetFog`, which
  only `StormVisual.LateUpdate` calls, while the observed character is in a storm zone whose wind is on; at a level's start no
  script sets them.

A `LightVolume`'s script data is 188 bytes plus 12 per slice reference, and a `FogConfig`'s 84 bytes (its private `sinceSet` is
not stored). :observed{games="peak"}

In the Unity editor (6000.6.4f1, linear colour space), a global texture (2D, 3D or cube) that was never set, or was set to
null, samples as (0.2158203, 0.2158203, 0.2158203, 0.5019608): 128/255 decoded from sRGB in RGB and 128/255 in alpha. A global
float or vector never set reads 0. :observed[probe shaders in the editor]
