---
title: SpeedTree geometry and instances
description: Elden Ring's stored vegetation streams, runtime instance inputs, LOD blending and wind-off state.
games: [elden-ring]
implementations:
  - name: primase worlds/fromsoft (flver)
    url: https://github.com/Kalmarv/primase/blob/main/worlds/fromsoft/src/flver/mod.rs
---

Elden Ring's SpeedTree models are FLVER files with header word `0x8000` at `0x6A`. Their layouts declare both
stored vertex members and a per-instance stream supplied at draw time. All 119 SpeedTree models in the asset and map binders declare those two stream classes.
The independent reader refuses all 119; their stored streams are read separately and their non-billboard
geometry is checked against the vertex programs. :proven[all 119 SpeedTree models]

The game's own G-buffer vertex program is executed for every non-billboard mesh vertex in the asset and map
population, with identity instance transforms, finest LOD and wind disabled. Position and UV agree exactly;
normalized normals and tangents agree within `1e-6`. This establishes the windless decoding under those inputs,
not animated wind behaviour. :proven[executed vertex programs]

Elden Ring places them 70,014 times in 1,349 layouts. :observed

## Stored and runtime streams

The first member word splits into a low 16-bit stream number and a high 16-bit modifier. Modifier `0x8000` marks
an unstored member; offsets advance independently within each declared stream. :proven[all 119 SpeedTree models]

| Input | Content | Confidence |
|---|---|---|
| Stored Half4 `TEXCOORD2.xyz` | Rest position in model coordinates | :proven[executed vertex programs] |
| Stored Half4 `TEXCOORD3.xy` | Texture coordinates | :proven[executed vertex programs] |
| Last two texture inputs read by the program | Normal and tangent, usually the two UByte4Norm members | :proven[executed vertex programs] |
| Runtime `POSITION.xyz`, `.w` | Instance translation and scale | :observed |
| Runtime `TEXCOORD1.xyz` | Instance X basis | :observed |
| Runtime `TEXCOORD0.xyz` | Instance Y basis; third basis is their cross product | :observed |
| Runtime `TEXCOORD0.w` | LOD interpolation, 1 for finest position | :observed |

Three meshes of `AEG801_258` are exceptions to taking the two byte members as the frame: their programs read a
Half4 UV5 member as the normal input. The input selected by the program determines its role. :proven[executed vertex programs]

The stored frame unpacks as `x*2-1`. Its pixel program applies sampled normal X along the stored tangent `T` and
Y along `-w*(N×T)`; this differs from the ordinary layered-program convention. :observed

The stored rest positions are in the model file's frame and line up with the asset's collision. :observed
`AEG801_258`, with the three exceptional meshes, is placed 194 times. :observed A SpeedTree model's binder also
holds an ordinary FLVER, `<model>_1.flver`. :inferred

## Wind and billboard cards

The checked wind-off input sets row 3, Y of `VC_SpeedTreeWind` to 1. All-zero wind constants can produce NaN,
so a zero-filled constant buffer is not a neutral wind state. :proven[executed vertex programs]

Each mesh has one face set, at LOD level 0, 1 or 2; billboard cards are level 3 and draw with the
`SpeedTree_billboard` programs. :observed Billboard layouts instead store Float4 UV2 and Float2 UV3. Their program turns the card toward the camera and
selects an atlas image by view angle; their stored members do not directly give a fixed rest-space surface.
:observed

:::open[How does the full wind state evolve?]
The windless execution proves a neutral configuration only. The complete runtime meaning and update rules of
the wind rows, and camera-dependent billboard reconstruction, remain outside that proof. :unknown
:::
