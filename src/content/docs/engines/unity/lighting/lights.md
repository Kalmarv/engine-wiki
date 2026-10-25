---
title: Lights
description: "The Light object, how URP and the built-in pipeline interpret colour, intensity, range and cones, which light is the sun, and the lights the games' scenes store."
games: [skatebird, sledding, peak]
sources:
  - title: Universal Render Pipeline source (Unity-Technologies/Graphics)
    url: https://github.com/Unity-Technologies/Graphics
    note: UniversalRenderPipelineCore.cs (light attenuation), UniversalRenderPipeline.cs (main light selection)
  - title: Unity scripting reference, Light
    url: https://docs.unity3d.com/ScriptReference/Light.html
    note: type, bake type and shadow enums
implementations:
  - name: primase worlds/unity (passes/lower_lights.rs)
    url: https://github.com/Kalmarv/primase/blob/main/worlds/unity/src/passes/lower_lights.rs
---

A **Light** (class 108) is a component on a GameObject. It stores its type (`m_Type`: 0 spot, 1 directional, 2 point,
3 rectangle area, 4 disc area), colour, intensity, range, spot angle and inner spot angle, shadow type, and how it is baked.
:sourced[Unity scripting reference] A light shines along its GameObject's local +Z. :sourced[Unity scripting reference]

## How the pipeline reads the numbers

| Property | Interpretation | Confidence |
|---|---|---|
| colour | gamma-encoded as stored; URP shades with the colour in linear space, so it is the sRGB decode of the stored value; a colour temperature, when the light uses one, scales it further | :sourced[Universal Render Pipeline source] |
| intensity | URP lights a surface with `colour × intensity / d²` for point and spot lights within their range and `colour × intensity` for a directional light; the number has no unit (URP's light unit field is not used by its shading) | :sourced[Universal Render Pipeline source] |
| range | where URP's attenuation reaches zero: URP squares the stored range and floors the square at 0.0001 (`1 / max(0.0001, range²)`), so a negative range reaches as far as its magnitude and one below 0.01 reaches 0.01; an infinite range has no falloff to zero; a range that is not a number makes the attenuation not a number | :sourced[Universal Render Pipeline source] |
| spot cone | the spot angles are full cone angles in degrees: the half angle is `spot_angle / 2`, the inner half angle `inner_spot_angle / 2` | :sourced[Universal Render Pipeline source] |
| shadows | `m_Shadows.m_Type` 0 none, 1 hard, 2 soft | :sourced[Unity scripting reference] |
| area lights | rectangle and disc lights are baked-only in URP | :sourced[Universal Render Pipeline source] |

The built-in pipeline attenuates point and spot lights by its own falloff, not the inverse square, and in a linear-colour
project without linear light intensity applies the intensity in gamma space. :sourced[Unity scripting reference]

## The sun

URP makes one light its main light: among the visible directional lights, the one `RenderSettings.m_Sun` names, else the one
with the greatest intensity above 0 (the first in its visible-light order on a tie). :sourced[Universal Render Pipeline source]
URP does this only when its asset's main light mode is per-pixel
([script fields](/engines/unity/data-model/script-fields/#the-universal-render-pipeline-asset)). :sourced[Universal Render Pipeline source]
The stored `m_Sun` of every scene of SkateBIRD and Sledding Game is null (file id 0, path id 0), so the sun is chosen by
intensity. :proven{games="skatebird sledding"} PEAK's five loose scenes also store none. :observed{games="peak"}

## Lights in the scenes

Counts by light type and the directional lights, over all `Light` objects of each scene file (state — inactive objects
and disabled lights — is not applied):

| Scene | Spot | Point | Directional | Directional lights (intensity, shadows) | Confidence |
|---|---|---|---|---|---|
| SkateBIRD `level1` | 0 | 10 | 5 | four at 0.5 or 0.3 without shadows, one at 1.0 with soft shadows | :observed{games="skatebird"} |
| SkateBIRD `level2` | 0 | 16 | 1 | 0.5, soft | :observed{games="skatebird"} |
| SkateBIRD `level3` | 2 | 0 | 1 | 1.0, soft | :observed{games="skatebird"} |
| SkateBIRD `level4` | 4 | 29 | 2 | 0.5 (colour 0.877, 0.839, 1.0) and 1.0, soft | :observed{games="skatebird"} |
| SkateBIRD `level5` | 1 | 1 | 5 | four without shadows, one at 1.0 soft | :observed{games="skatebird"} |
| SkateBIRD `level7` | 0 | 22 | 1 | 0.8, white, soft | :observed{games="skatebird"} |
| SkateBIRD `level12` | 0 | 3 | 2 | both 1.0, soft | :observed{games="skatebird"} |
| SkateBIRD `level13` | 0 | 38 | 1 | 1.0, soft | :observed{games="skatebird"} |
| Sledding Game `level1` | 26 | 30 | 1 | 2.0, white, soft | :observed{games="sledding"} |
| PEAK `level1` | 0 | 0 | 2 | 3.0 (colour 1.0, 0.955, 0.801) soft, and 0.01 disabled | :observed{games="peak"} |
| PEAK `level3` | 1 | 0 | 3 | 3.0 and 2.0 soft, and 0.01 disabled | :observed{games="peak"} |

SkateBIRD's sun is a soft-shadow directional light of colour (1.0, 0.9569, 0.8392) in most scenes, with Unity Euler angles
(50°, 113.29°, 0°) in the bedrooms and the playground, (50°, 150°, 0°) on the rooftop, (50°, 180°, 0°) in the office,
(50°, −30°, 0°) in the server room and flashback, and (30°, 39°, 0°) in skate heaven. :observed{games="skatebird"}
The extra `Boundary Fill Light` directional lights of the bedrooms (intensity 0.5 and 0.3) are the unshadowed ones.
:observed{games="skatebird"}

SkateBIRD's lights carry bake types (`m_Lightmapping`: 4 realtime, 2 baked, 1 mixed). `level1` has ten mixed point lights;
`level7` has twenty mixed and two baked point lights; every other light measured is realtime. 

## Lightmaps

A scene's baked lighting is described by its `LightmapSettings` object (class 157): the list of lightmaps (`m_Lightmaps`), the
lighting data asset (`m_LightingDataAsset`, in newer versions), the light probes (`m_LightProbes`, a `LightProbes` object) and the lightmap mode.
:sourced[Unity scripting reference] The `LightProbes` object (class 258) is in the shared assets: one in SkateBIRD's `sharedassets0`
and one in Sledding Game's `sharedassets1`. :observed In every scene read, `m_Lightmaps` is empty and there is no lighting data asset: the ten level
scenes of SkateBIRD (0 to 7, 12 and 13), both scenes of Sledding Game and PEAK's five loose scenes. :proven{games="skatebird sledding"}
:observed{games="peak"} The games draw with realtime lighting, reflection probes and ambient probes only, even where lights are
flagged mixed or baked. :observed

## Shadow settings by quality level

`QualitySettings` stores, per quality level, the shadow mode (0 disabled, 1 hard only, 2 all), the shadow distance, the cascade
count (the built-in pipeline's; a URP asset replaces it), and the pixel light count. :observed

| Game | Levels | Shadows | Distance | Cascades | Confidence |
|---|---|---|---|---|---|
| SkateBIRD | Fastest, Fast, Simple, Good, Beautiful, Fantastic | 0, 0, 1, 2, 2, 2 | 15, 20, 20, 40, 70, 150 m | 1, 1, 1, 2, 2, 4 | :proven{games="skatebird"} |
| Sledding Game | PC Low, PC Medium, PC High | 2, 2, 2 | 40 m each | 2 each | :proven{games="sledding"} |
| PEAK 3.0.0 | High Fidelity | 2 | 80 m | 1 | :proven{games="peak"} |

Sledding Game's three levels each point to their own URP asset; a level's URP asset replaces the built-in cascade count.
:proven{games="sledding"}
