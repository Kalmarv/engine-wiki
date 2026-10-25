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
| `globalScalars.x` | Multiplies alpha before the alpha test in the inspected program | :observed |
| `globalScalars2.z` | Enters both a `1-z` wetness term and a `floor(128*z)` state-byte expression | :observed |

The natural interpretation of `globalScreenSize.zw` is reciprocal width and height, but the sampled usage does not
itself show the CPU writing `1/x` and `1/y`. :inferred

In `PS_DeferredTextured_6b2704e5`, the state byte uses `((stipple << 6) & 192)` combined with 7 or 23 selected by
whether antighosting exceeds one half. These values come from lanes named `gStippleAlpha` and
`gTemporalAntiGhosting`, rather than from material albedo. :observed[compiled-program inspection]

:::open[How does the CPU populate each global?]
Program reads establish a constant-to-output dependency. They do not establish every writer, update cadence,
default or physical unit of the constant. :unknown
:::
