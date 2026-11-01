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
| Tex1_TerrainBlend | 3 | 20 | :proven[every class-writing permutation and control-flow path] |
| Clutters_Grass | 4 | 8 | :proven[every class-writing permutation and control-flow path] |
| Tex1_Leaves | 5 | 32 | :proven[every class-writing permutation and control-flow path] |
| Bark | 5 | 8 | :proven[every class-writing permutation and control-flow path] |
| Tex1_Rocks | 5 | 8 | :proven[every class-writing permutation and control-flow path] |

These programs do not write class 1; the deferred non-metal branch uses F0 .04 rather than reading their o1.w as metalness. TerrainBlend's class-writing permutations never read its material property labelled Metalness. Other permutations with UAV atomics belong to the fragment-recording pass and do not establish an alternative shading class for an ordinary G-buffer draw. :observed[all listed class writers and consumer]

In those five templates the other o1-writing permutations (16, 8, 8, 2 and 2 of them) increment a structured u6 counter with `imm_atomic_iadd` and store a record to u7; their o0 is `cb1[85]` or a t70 record, o1.xyz a normal and o1.w zero, with no class byte. :observed[every o1-writing permutation of the five templates]

## The class literal

The class is a literal in the program, not a value it computes. The shader builds o1.z's byte by inserting the normal's sign
at bit 0 and adding its two high bits with weights 2 and 4. It then adds the literal 8 for class 1, 24 for class 3 or 32
for class 4, and writes the byte divided by 255. The class is therefore `byte >> 3`, and no normal can change it.
:observed[the packing code of the saved permutations below] The water atlases' bytes 48 and 80 (classes 6 and 10, on
[Water surfaces](/engines/anvil/water/surfaces/)) follow the same rule. :inferred

| Templates | Class | Checked permutation | Confidence |
|---|---:|---|---|
| Tex1_SkinningSupported, Tex1_TeamColoured, Tex2, Tex2_TintBFromShaderConstants, Tex2_Graffiti_Mode, Grounds, Road, Hero_Ice, IceBrick, Tex1_UniqueNormalGradient, Tex1_Screen, Screens, Screens_Simple, SHD_UNLIT_UndergroundBox, Tex1_FakeRiver | 1 | `ps_400000` of each | :observed[one permutation per template] |
| Decals1_Graffiti, Tex1_Graffiti_Mode_DecalFX | 1 | the cut-out permutations `ps_404004` and `ps_404000` | :observed[one permutation per template] |
| Outskirt | 3 | `ps_400000` | :observed[one permutation] |
| SHD_Nat_Veg_Grass_AO | 4 | `ps_400000` | :observed[one permutation] |

In these, class 1 has o1.w metalness, o2.z the albedo-scaled emission and o3.x the occlusion of all light. Outskirt writes
o1.w = 1 (its AO) and o2.zw = (1, 0), and Grass_AO o1.w = 1, o2.z = .2 and o2.w = 0; neither writes metalness or emission.
:observed[the same permutations] A valid class does not mean that every input of these programs is a material value: the
video and state branches of the screen templates, for example, read run-time state. :observed

:::open[What does the fragment-recording pass feed?]
Its target and UAV writes are established, but the full downstream use is not. :unknown
:::
