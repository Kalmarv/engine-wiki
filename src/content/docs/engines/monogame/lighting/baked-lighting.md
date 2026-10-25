---
title: Baked lighting and the level shader
description: "How STUNTBOOST lights a level: lighting baked into atlases, the unlit baked branch of Render.fx, the direct-light mask that gates dynamic shadows, cascaded sun shadows, gamma and fog."
games: [stuntboost]
sources:
  - title: StuntboostTools documentation
    url: https://github.com/bytinggames/StuntboostTools
    note: bake groups, UV scale, fast and release bakes, the custom Blender build's colour spill
---

STUNTBOOST's levels are lit in Blender with Cycles and the result is stored in textures. The game draws a level mostly from its
baked colour and adds only dynamic shadows on top. The facts below are read from the game's code (`STUNTBOOST.dll`, the BytingLib
assemblies) and its compiled effects (`Render.fx`, build 25832744). :observed{games="stuntboost"}

## Bake groups and atlases

A **bake group** is a top-level collection of the Blender scene (*Level* and *Room*) exported with its own baked texture. Its
meshes are merged into `bake_N_object` meshes over one atlas: `Content/Models/Resources/<Level>.export/Bake<N>_Denoised.xnb`, a
[QOI](/engines/monogame/textures/xnb-textures/) image (mostly 4096 × 4096). :observed{games="stuntboost"} A second image per bake
group, `Bake<N>_DIRECT_Denoised`, is stored as the bake material's `KHR_materials_specular` colour texture. It is not a
specular colour: it is the bake's **direct-light mask**, the light that reached each texel straight from the sun without
bounces, and the game binds it as `DiffuseTex`. :observed{games="stuntboost"}

How densely an object is baked is the exporter's UV scale (per object, collection and vertex group, multiplying); the bake's
resolution, samples, denoise and margin are scene settings, with separate *Fast Bake* and *Release Bake* sets. The custom
Blender build adds a Cycles *Color Spill* light-path setting that boosts first-bounce indirect light for a more nostalgic look.
:sourced[StuntboostTools documentation]

## The baked branch of the level shader

A level that has a node with the `=SetBakedLighting()` call is drawn by `Scene3D.UseShading(baked: true)`: `DynamicObject` is
false, `DiffuseLightingEnabled` is false, and only dynamic shadows are added. That branch of `Render.fx` is unlit:

`color = atlas × (1 + k · ShadowColor) × lerp(AmbientLightInShadow, 1, 1 − k)`

with `k = clamp((DIRECT.r − 0.07) × 1.075, 0, 1) × dynamic shadow`. `DIRECT` is the direct-light mask; it only gates the dynamic
shadows (the board's) to texels that were lit directly. There is no N·L term, no specular, and the roughness and metallic factors
are not used. `LevelShadingDefault` sets `ShadowColor` to 0 and `AmbientLightInShadow` to 0.5. :observed{games="stuntboost"}

In the compiled pixel shader, `ps_uniforms_vec4[39]` is `DynamicObject`, `[50]` is `DiffuseLightingEnabled`, `[36]` and `[37]` are
the metallic and roughness factors, and `ps_s0` is `AlbedoTex`, `ps_s5` is `DiffuseTex`; the constant `1.075269` (= 1 / 0.93)
and `−0.07` sit among its defined constants. :proven{games="stuntboost"}

## Other lighting in the shader

`Render.fx` also has cascaded real-time sun shadows (`ShadowMapSplitCount`, `ViewProjectionLight[4]`, `ShadowDepthBiases[4]`,
sampled from `LightDepthTex`), ambient light, distance fog (`FogStart`, `FogLength`, `FogColor`), a volumetric-light technique
with blue noise, SSAO and depth of field in separate effects. :observed{games="stuntboost"}

The output is `color ^ (1 / Gamma)` with `Gamma` defaulting to 1.0. The shader applies **no colour grading** of its own. :observed{games="stuntboost"}

The sun's direction is defined in Blender by the world's sky texture (and also drives the skybox); a level can place regions with
another sun (`CustomSunRegion`). :sourced[StuntboostTools documentation]

:::open[Why the atlas looks darker than the game]
Shown alone, `Bake<N>_Denoised` looks much darker than the game draws the level, although the baked branch above can only
darken the atlas (with the default `ShadowColor` its factor is at most 1). Where the difference comes from (a post effect such as `Post.fx` or `Post2D.fx`, the
atlas encoding, or the display path) is not established.
:::
