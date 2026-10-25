---
title: Draw keywords
description: "Which shader keywords a draw has under the built-in pipeline and under URP, as a function of the scene's lights, shadows, fog and the pipeline asset, measured with an editor probe."
games: [skatebird, sledding]
sources:
  - title: Universal Render Pipeline source (Unity-Technologies/Graphics)
    url: https://github.com/Unity-Technologies/Graphics
    note: the keyword groups the pipeline sets per frame
implementations:
  - name: primase worlds/unity (passes/draw_keywords.rs)
    url: https://github.com/Kalmarv/primase/blob/main/worlds/unity/src/passes/draw_keywords.rs
---

A player stores one compiled program per keyword set ([shader objects](/engines/unity/shaders/shader-objects/)). Which set a
draw uses is the renderer's choice each frame, from the frame's lights, shadows, fog and probes; nothing public states it
exactly. The rules below were measured by rendering a probe shader that was compiled with the same `multi_compile` lines as
the engine's own shaders and that writes one bit per keyword it was compiled with into the pixel it draws; the pixel is read
back from a render texture. The editor was Unity 6000.6.4f1 with the Universal Render Pipeline package 17.6.0 (Direct3D 12,
with graphics enabled: the shaders have to run). :observed

The games were built with other versions (2019.4.20f1 for SkateBIRD, 6000.3.12f1 for Sledding Game), so the rules are the
newer editor's. Two cross-checks that they hold for the players: every stored variant of a pass carries the keywords the
rules predict, and the settings read from each quality level's URP asset ([script fields](/engines/unity/data-model/script-fields/))
agree with which keywords the build stripped. :observed{games="sledding"}

## Built-in pipeline, forward base pass

The pass compiles with `multi_compile_fwdbase`, `multi_compile_fog` and `multi_compile_instancing`. :observed

| Keyword | Set when | Confidence |
|---|---|---|
| `DIRECTIONAL` | on every draw, whatever the lights (no light, intensity 0) | :observed |
| `LIGHTPROBE_SH` | on every draw that is not lightmapped; light probe usage Off and the ambient mode do not change it | :observed |
| `SHADOWS_SCREEN` | exactly when the sun casts shadows (hard or soft), the quality level draws shadows, and the renderer receives them | :observed |
| `FOG_LINEAR`, `FOG_EXP`, `FOG_EXP2` | fog is on, by its mode | :observed |
| `INSTANCING_ON` | the material enables instancing and two draws share it | :observed |
| `VERTEXLIGHT_ON` | not set by one or two point lights (the quality level's pixel light count of 4 makes them pixel lights); needs a light forced per vertex or more lights than the pixel light count; not observed set | :observed |

Lightmap keywords were not tested. :observed

SkateBIRD's stored variants all carry `DIRECTIONAL` (so a pass resolves it as implied). `SHADOWS_SCREEN` is on 192 of the
198 draws of its first level; the other 6 are renderers that do not receive shadows. :observed{games="skatebird"}

## Universal Render Pipeline, forward path

| Keyword | Set when | Confidence |
|---|---|---|
| `_MAIN_LIGHT_SHADOWS` | the asset supports shadows and lights the main light per pixel, with 1 cascade; and also for a sun without shadows or a shadow distance of 0 (the pipeline binds an empty shadow map and sets it) | :observed |
| `_MAIN_LIGHT_SHADOWS_CASCADE` | the main light casts shadows within the shadow distance and the asset has 2 or 4 cascades | :observed |
| neither | shadows unsupported in the asset, or the main light per vertex | :observed |
| `_SHADOWS_SOFT` | the asset supports soft shadows and the sun's shadows are soft | :observed |
| `_ADDITIONAL_LIGHTS` / `_ADDITIONAL_LIGHTS_VERTEX` | by the asset's additional lights mode (per pixel, per vertex), whether or not an additional light exists; none when disabled | :observed |
| `_CLUSTER_LIGHT_LOOP` | the Forward+ rendering path | :observed |
| `_ADDITIONAL_LIGHT_SHADOWS` | the asset supports them and a shadow-casting additional light exists | :observed |
| `_LIGHT_LAYERS` | the asset supports light layers | :observed |
| `_LIGHT_COOKIES` | never set by the asset's setting alone in the cases tried; no case had a light with a cookie | :observed |
| `_REFLECTION_PROBE_BLENDING`, `_REFLECTION_PROBE_BOX_PROJECTION` | the asset's two settings | :observed |
| `_REFLECTION_PROBE_ATLAS` | Forward+ with blending | :observed |
| fog keywords | as the built-in pipeline's | :observed |

`_MIXED_LIGHTING_SUBTRACTIVE` was never set in the cases tried; the deferred path draws no forward pass. :observed

Keywords the frame's lights or an object's position decide (`VERTEXLIGHT_ON`, the lightmap and shadowmask keywords) and keywords
that depend on the renderer's features (`_SCREEN_SPACE_OCCLUSION`, `_DBUFFER_MRT3`, `_ADDITIONAL_LIGHT_SHADOWS`) are not derived
from the scene alone: where every stored variant of a stage has a keyword, the keyword is taken as implied. :inferred

## Effect of getting the keyword set wrong

Sledding Game's mountain scene: of 164 materials on URP shaders (last quality level), 20 find a stored variant with no keywords
or the commonest set, and all 164 find one with the scene's keywords. The 144 that find none without them all lack a keyword of one group,
`_MAIN_LIGHT_SHADOWS` or `_MAIN_LIGHT_SHADOWS_CASCADE`, which the URP asset's cascade count decides. :inferred{games="sledding"}
SkateBIRD's first level: 2 of 198 materials find a variant with none, all 198 with the build-implied `DIRECTIONAL`, and 198
with the scene's keywords. :inferred{games="skatebird"}
