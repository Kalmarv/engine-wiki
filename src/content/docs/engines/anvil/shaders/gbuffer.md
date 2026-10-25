---
title: G-buffer shading classes
description: Class-dependent output channels and the deferred lighting consumer.
games: [riders-republic]
---

The material shader packs both a normal and a shading class into the G-buffer. The lighting pass uses the class to interpret other channels, so the same output component does not always mean metalness or emission. :observed[material writers and deferred consumer]

Normals are octahedrally encoded. The two projected components are quantized to nine bits; their low eight bits occupy o1.x/y, while high bits and a normal sign share o1.z with the class. :observed[writer and consumer disassembly]

| Output | Class 1, ordinary surface | Classes 3–5, terrain/vegetation family | Confidence |
|---|---|---|---|
| o0.rgb | Base colour | Base colour | :observed |
| o0.w | Perceptual roughness | Perceptual roughness | :observed |
| o1.xyz | Packed world normal and class | Packed world normal and class | :observed |
| o1.w | Metalness | Ambient occlusion | :observed |
| o2.xy | Motion vector | Motion vector | :observed |
| o2.z | Emissive scalar, commonly exposure-divided | Specular occlusion | :observed |
| o2.w | Pass-dependent alpha | Translucency | :observed |
| o3.x | AO | Family-specific additional output | :observed |

Tex1's forward shader establishes the roughness convention: it clamps the stored roughness to at least .045 and squares it to obtain GGX alpha. Metalness drives `F0=lerp(.04,albedo,metalness)` and diffuse `albedo*(1-metalness)`. This discriminates roughness from the older SpecGloss label. :observed[forward program arithmetic]

| Template | Class | Checked class-writing permutations | Confidence |
|---|---:|---:|---|
| Tex1_TerrainBlend | 3 | 20 | :observed[every control-flow path] |
| Clutters_Grass | 4 | 8 | :observed[every control-flow path] |
| Tex1_Leaves | 5 | 32 | :observed[every control-flow path] |
| Bark | 5 | 8 | :observed[every control-flow path] |
| Tex1_Rocks | 5 | 8 | :observed[every control-flow path] |

These programs do not write class 1; the deferred non-metal branch uses F0 .04 rather than reading their o1.w as metalness. TerrainBlend's class-writing permutations never read its material property labelled Metalness. Other permutations with UAV atomics belong to the fragment-recording pass and do not establish an alternative shading class for an ordinary G-buffer draw. :observed[all listed class writers and consumer]

:::open[What does the fragment-recording pass feed?]
Its target and UAV writes are established, but the full downstream use is not. :unknown
:::
