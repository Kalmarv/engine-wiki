---
title: Engine shader inputs
description: Lane-level uses of global shader constants and their limits as evidence for CPU-side meaning.
games: [gta-v]
sources:
  - title: CodeWalker
    url: https://github.com/dexyfex/CodeWalker
    note: Constant and effect names used to identify compiled shader inputs.
implementations:
  - name: primase worlds/gta (resolve_shaders.rs)
    url: https://github.com/Kalmarv/primase/blob/main/worlds/gta/src/passes/resolve_shaders.rs
---

Enhanced programs read engine-owned buffers as well as material parameters. A constant's name is a lead; the lanes
actually read and the arithmetic using them constrain its role more precisely. :observed[compiled-program inspection]

| Constant | Inspected use | Confidence |
|---|---|---|
| `globalScreenSize.xy` | `VS_SSAO` multiplies UV by half of XY to produce pixel coordinates | :observed |
| `globalScreenSize.zw` | The same program offsets UV by twice Z or W for whole-texel steps | :observed |
| `gDirectionalAmbientColour.xyz` | Ambient colour multiplied by a directional normal term in `PS_lightTile_ambient` | :observed |
| `gDirectionalAmbientColour.w` | Vertex-colour scale through `(w-1)*fade + 1` in `VS_TransformD` | :observed |
| `gDynamicBakesAndWetness.z` | Scales an up-facing wetness term in parallax effects; also participates in vehicle dirt blending | :observed |
| `gDynamicBakesAndWetness.xy` | Ped coefficient pair in `y*(0.5 + 0.5*N.z) + x` | :observed |
| `gLightArtificialIntAmbient0.w` | Added to a vertex-colour term in G-buffer target 3 X | :observed |
| `globalScalars.x` | The factor an instance's visibility is faded by, 1 where fully shown; see below | :observed |
| `globalScalars2.z` | Enters both a `1-z` wetness term and a `floor(128*z)` state-byte expression | :observed |
| `globalScalars2.z` | In `VS_TransformD_749c0f99`, with `f = saturate(distance² * 0.000004)`, scales `COLOR0.x` by `1 + (gDirectionalAmbientColour.w - 1) * saturate(f - z)` and `COLOR0.y` by `1 + (w - 1) * saturate(1 - f - z)` | :observed |
| `globalScalars2.y` | `VS_Transform_SeeThrough_5c7539b4` draws its geometry only where `y > 0` and outputs `saturate(clip.w / y)` | :observed |
| `globalScalars2.x` | The phase of a sine vertex motion: `sin(position-derived phase + 2.5 * x)` in `VS_Transform_SeeThrough_5c7539b4`, and in `VS_PedTransformD_bddf08c5` | :observed |

`globalScalars2` is row 13 of the miscellaneous globals buffer (offset 208). Its lanes do different jobs in different programs, so
it is not one wetness scalar, and a program that loads all four lanes need not use all four (one sample loads `w` and never uses
it). :observed[compiled-program inspection] What writes it on the CPU, and its values, are not known. :unknown

The natural interpretation of `globalScreenSize.zw` is reciprocal width and height, but the sampled usage does not
itself show the CPU writing `1/x` and `1/y`. :inferred

In `PS_DeferredTextured_6b2704e5`, the state byte uses `((stipple << 6) & 192)` combined with 7 or 23 selected by
whether antighosting exceeds one half. These values come from lanes named `gStippleAlpha` and
`gTemporalAntiGhosting`, rather than from material albedo. :observed[compiled-program inspection]

## globalScalars.x

Lane x of `globalScalars` (row 12 of the frame-constant buffer a program binds; register 5 in most programs, 2 or 4 in a few) is read by 4,386 of the 12,286 distinct programs of the install's shader database: 4,372 pixel programs and 14 compute programs, and no vertex program. :observed[a value-graph walk from the word to every output lane, discard condition and write, over all programs counted by distinct bytecode; 7 programs could not be lifted into a value graph and are not counted]

Every use is multiplicative or monotone and leaves the value unchanged where the lane is 1, so the lane reads as the factor the engine fades an instance's visibility by (1 where it is fully shown, 0 where it is gone). The programs apply it in five ways, counted by the place the word reaches: :observed[same walk; the 59 programs of the last three rows and of the add-first group read by hand in their lifted text]

| Where the word goes | Pixel programs | Compute programs |
|---|---|---|
| An alpha lane of a colour target and/or an alpha-test discard, nearly always as a factor of the alpha (`alpha = texture.w * vertex.w * x`); 979 of them also quantise it into the 3-bit alpha of the G-buffer state byte, where 7 is opaque | 4,224 | 0 |
| Target 1 z of the reflection G-buffer programs (`PS_MirrorReflectionGBuffer`, `PS_ReflectionGBuffer`, each with and without `AlphaClip`; 28 each), which have no alpha lane: the product `colour.z^2 / 16 * k * x` in the emission slot | 112 | 0 |
| The depth of a depth-based alpha test (`PS_LinearDepth`: `x * alpha - ref` steers the depth output) | 27 | 0 |
| A manual blend with the scene behind, `lerp(scene, lit colour, x * k)` in the colour lanes with alpha 1 (`PS_Textured_*`, `*_DOF`) | 9 | 0 |
| The alpha of the reflection image the mirror compute programs store (`cs_mirror_reflection*`) | 0 | 14 |

No program uses the word in any other way. :observed[same walk]

The shader source CodeWalker ships keeps a commented legacy bytecode line `mul o0.w, r0.y, globalScalars.x` for the alpha of its basic pixel program, and its own port omits the factor. It gives the lane no name. :sourced[CodeWalker]

## Engine textures

Programs also sample textures the engine binds, named in each program's own [SGD2](/engines/rage/shaders/sgd2/) table (28-byte
texture records, the names checked against their stored joaat hashes). In the programs the Legion Square materials bind:

| Register (space 0) | Name | Programs | Confidence |
|---|---|---|---|
| `t1` | `gReflectionTex` | glass programs | :observed |
| `t2` | `gFogRayTex` | `PS_Textured_Zero_7903a05e_Wrapped` and others | :observed |
| `t3` | `g_BlueNoise` | `PS_DeferredTextured_AlphaClipC` | :observed |
| `t4`, `t5`, `t6` | `g_ReflectionAlphaDepthTex`, `g_ReflectionAlphaResult`, `gReflectionTexClipped` | glass programs | :observed |
| `t7` | `gCSMShadowTexture` | `PS_Textured_Zero_7903a05e_Wrapped` and others | :observed |
| `t14`, `t15`, `t17`, `t19`, `t22` | `g_BlendTexture`, `g_ReflectionTex2`, `g_WaterBumpTexture`, `g_RefractionTexture`, `g_LightingTexture` | `PS_WaterFountain_7903a05e_Wrapped` | :observed |

:observed[each bound program's table read and its name, hash and register checked against the material's binding]
These are the engine's names for the slots. No material stores a texture for them, so what the engine puts there at run time is
not in the data. :inferred

:::open[How does the CPU populate each global?]
Program reads establish a constant-to-output dependency. They do not establish every writer, update cadence,
default or physical unit of the constant. :unknown
:::
