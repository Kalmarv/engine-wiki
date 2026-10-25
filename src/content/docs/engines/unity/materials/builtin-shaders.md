---
title: Built-in and URP shaders
description: "What the shaders the Unity games use compute from a material's properties: URP Lit, Standard, Autodesk Interactive, the legacy surface shaders, unlit shaders, and SkateBIRD's Voronoi shader."
games: [skatebird, sledding, peak, big-walk]
sources:
  - title: Unity built-in shader source (2019.4.20f1)
    url: https://unity.com/releases/editor/archive
    note: builtin_shaders-2019.4.20f1 (Legacy/Autodesk/Unlit shaders, CGIncludes)
  - title: Universal Render Pipeline source (Unity-Technologies/Graphics)
    url: https://github.com/Unity-Technologies/Graphics
    note: LitForwardPass.hlsl, LitInput.hlsl and the shader library
implementations:
  - name: primase worlds/unity (passes/lower.rs)
    url: https://github.com/Kalmarv/primase/blob/main/worlds/unity/src/passes/lower.rs
  - name: primase worlds/skatebird (passes/voronoi.rs)
    url: https://github.com/Kalmarv/primase/blob/main/worlds/skatebird/src/passes/voronoi.rs
---

Which properties a [material](/engines/unity/materials/materials/) stores, and what they mean, is decided by its shader.
The shaders below are the ones the games use the most; each is described from its source (the built-in shader source
for 2019.4.20f1, the Universal Render Pipeline source for the 6000.3 games). :sourced[Unity built-in shader source]

## Which shaders the games use

SkateBIRD ships its built-in shaders as real Shader objects in `sharedassets0.assets`: Standard, Standard (Specular setup),
Autodesk Interactive, the Legacy Shaders `Bumped Diffuse`, `Bumped Specular`, `Transparent/Bumped Specular` and
`Transparent/Cutout/Bumped Specular`, `Houdini/SpecularVertexColor`, `Shiny/Unlit Two Tone`, `Minimap/Mission Marker`,
`Particles/Standard Unlit`, and its own `Bumped Specular Voronoi` and `Dirty Glass`, plus the post-processing stack's
`Hidden/PostProcessing/*`. :observed{games="skatebird"}

Sledding Game draws with the Universal Render Pipeline (`Universal Render Pipeline/Lit`, `Unlit`, `Nature/SpeedTree7`),
FlatKit's water shader, and shader-graph and package shaders (Shine Graph, BruteForce's SnowIceURP). :inferred{games="sledding"}

## Universal Render Pipeline/Lit

| Output | Computed from | Confidence |
|---|---|---|
| base colour | `_BaseMap` × `_BaseColor` | :sourced[Universal Render Pipeline source] |
| metallic, smoothness | `_Metallic` and `_Smoothness`; with `_METALLICSPECGLOSSMAP`, the map's R and its A × `_Smoothness` | :sourced[Universal Render Pipeline source] |
| occlusion | the map's G, lerped from white by `_OcclusionStrength` | :sourced[Universal Render Pipeline source] |
| normal | `_BumpMap` × `_BumpScale` with `_NORMALMAP` | :sourced[Universal Render Pipeline source] |
| emission | `_EmissionColor` × `_EmissionMap` with `_EMISSION` (an HDR colour can exceed 1) | :sourced[Universal Render Pipeline source] |

URP's vertex pass computes one coordinate, `TRANSFORM_TEX(texcoord, _BaseMap)`, and the surface input samples the base,
metallic, normal, occlusion and emission maps with it, so the other properties' own tiling is never read. Detail maps are the
one place a second transform applies. :sourced[Universal Render Pipeline source]

## Standard and Standard (Specular setup)

Base colour is `_MainTex` × `_Color`; metallic `_Metallic`, smoothness `_Glossiness`; with `_METALLICGLOSSMAP` the map's R
replaces `_Metallic` and its A × `_GlossMapScale` gives smoothness; smoothness can come from the base map's alpha
(`_SMOOTHNESS_TEXTURE_ALBEDO_CHANNEL_A`) with `_GlossMapScale`. Occlusion is the map's G whenever the shader has one
(Standard has no keyword for it), strength `_OcclusionStrength`. `_BumpMap` × `_BumpScale` with `_NORMALMAP`. Every map is
sampled through `_MainTex`'s tiling (`texcoord.xy = TRANSFORM_TEX(uv0, _MainTex)`), the detail maps through
`_DetailAlbedoMap`'s. :sourced[Unity built-in shader source] The specular setup reads a specular colour and
smoothness instead of metallic. :sourced[Unity built-in shader source]

## Autodesk Interactive

It is Standard's core with `RoughnessSetup` (`AutodeskInteractive.shader`): the property `_Glossiness` is **roughness**, so
smoothness is `1 − _Glossiness` (`MetallicRough`, `UnityStandardInput.cginc`); with `_METALLICGLOSSMAP` the map's R is
metallic, and with `_SPECGLOSSMAP` the map's R is the roughness. :sourced[Unity built-in shader source]

## The legacy surface shaders

A Legacy surface shader samples each map through its **own** tiling: a surface shader's `uv_<map>` input is
`TRANSFORM_TEX(uv0, <map>)`. Base colour is `_MainTex` × `_Color` (alpha `_MainTex`'s × `_Color`'s), metallic is 0, and the
normal map `_BumpMap` is unpacked unscaled (`UnpackNormal`). :sourced[Unity built-in shader source]

| Shader | Lighting | Notes | Confidence |
|---|---|---|---|
| Bumped Specular, Transparent/Bumped Specular, Transparent/Cutout/Bumped Specular, Houdini/SpecularVertexColor | `UnityBlinnPhongLight`: highlight `_SpecColor` × pow(n·h, 128 × `_Shininess`) × the gloss in `_MainTex`'s alpha | the cut-out variant is `alphatest:_Cutoff`, the transparent one `alpha:fade` (SrcAlpha OneMinusSrcAlpha); the Houdini shader multiplies the vertex colour into the albedo and reads `_LightColor0` at 32, `_SpecColor` at 48, `_Color` at 64, `_Shininess` at 80 of its constant buffer | :sourced[Unity built-in shader source] |
| Bumped Diffuse, Diffuse | `Lambert`: diffuse only | Diffuse has no normal map | :sourced[Unity built-in shader source] |
| Self-Illumin/Diffuse | `Lambert` plus emission | emission is `_MainTex` × `_Color` × `_Illum`'s alpha | :sourced[Unity built-in shader source] |

## Unlit shaders

`Unlit/Color` draws `_Color` as it is. `Universal Render Pipeline/Unlit` draws `_BaseMap` × `_BaseColor`.
:sourced[Unity built-in shader source] `Universal Render Pipeline/Nature/SpeedTree7` draws `_MainTex` × `_Color` with wind,
hue variation and alpha test; its geometry-type keywords (`GEOM_TYPE_BRANCH`, `GEOM_TYPE_BRANCH_DETAIL`) mark bark, and
leaf, frond and mesh geometry stay vegetation. :sourced[Universal Render Pipeline source]

## Vertex colour

Whether a shader multiplies the mesh's vertex colour into its surface is a property of the shader, not the mesh.
:observed

| Takes the vertex colour | Ignores it |
|---|---|
| Houdini/SpecularVertexColor; UI/Default; Sprites/Default; the Legacy and Mobile particle shaders; Particles/Standard Unlit and Surface; TextMesh Pro shaders (face colour × vertex colour) | Standard, Standard (Specular setup), Autodesk Interactive, the legacy surface shaders, Unlit/Color, Unlit/Texture, URP Lit and Unlit |

Both columns :sourced[Unity built-in shader source] (the shaders' input structs have or lack a `COLOR` input).

## SkateBIRD's Bumped Specular Voronoi

SkateBIRD's own shader, read from its forward-base fragment program (one directional light, D3D11 `ps_4_0`) and its
parameter record, is a **Lambert** surface (no specular term, whatever its name) whose `_MainTex` and `_BumpMap` are tiled
stochastically. :observed{games="skatebird"} Each map is sampled at the 3×3 cells around `floor(uv)` (`uv` the map's own
`TRANSFORM_TEX` coordinate); each cell *c* is offset by `h = frac(sin(dot(c, (12.9898, 78.233))) × 43758.5453)`, weighted
`2^(−7.2135 · |c − frac(uv) + h|²)` and normalised. The albedo is that blend × `_Color`; the normal is the same blend of the
unpacked normal map. The pattern never repeats. :observed{games="skatebird"}

## Shaders that build their own geometry

A shader whose vertex program builds the shape from component data (Shapes' line, disc, triangle and sphere shaders) draws
a placeholder mesh; the shape is in the GameObject's MonoBehaviours. SkateBIRD's `Minimap/Mission Marker` is an interface
shader on ordinary MeshRenderers (large spheres) that only the minimap camera draws, see
[layers and cameras](/engines/unity/world/layers-and-cameras/). :observed{games="skatebird"}
