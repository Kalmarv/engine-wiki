---
title: Deferred shading and G-buffer encoding
description: Enhanced diffuse, normals, specular, occlusion and emission as the compiled programs store and read them.
games: [gta-v]
sources:
  - title: CodeWalker
    url: https://github.com/dexyfex/CodeWalker
    note: Effect and material-parameter names.
implementations:
  - name: primase worlds/gta (gbuffer.rs)
    url: https://github.com/Kalmarv/primase/blob/main/worlds/gta/src/passes/gbuffer.rs
---

Enhanced deferred pixel programs write several render targets that later lighting programs consume. The layout
below describes inspected `PS_DeferredTextured*` programs; individual effects can write constants, discard pixels or
use a different encoding. :observed[program evaluation and disassembly]

| Target | Channels | Role | Confidence |
|---|---|---|---|
| 0 | RGB | Diffuse colour, with material/texture and wetness influences | :observed |
| 0 | A | Draw-state byte from engine constants | :observed |
| 1 | RGB | World normal, usually `0.5*N + 0.5` | :observed |
| 1 | A | Additional normal precision; some effects pack 3/3/2 bits of normal components | :observed |
| 2 | R | Square root of specular intensity | :observed |
| 2 | G | Square root of specular falloff divided by 512 | :observed |
| 2 | B | Fresnel parameter | :observed |
| 3 | R/G | Natural/artificial ambient occlusion | :observed |
| 3 | B | Emission divided by 16 | :observed |
| 3 | A | Ambient-path flag; values above one half select an additional multiplier | :observed |
| 4 | R/G | Previous-frame screen displacement in pixels | :observed |

Target 0 holds the square root of the diffuse colour: the sampled point- and sun-light programs square it before
use. :observed[light-program execution]

Normal encoding varies: the twiddle effects quantize RGB as `floor(128*N + 128)/256` and carry residual bits in alpha.
Other inspected effects write `saturate(128*N.z - 127)` in alpha. A fourth normal component is not a material opacity
channel. :observed[program evaluation]

The inspected occlusion path stores `sqrt((a + k*vertexColour)/2)` through engine constants; the ambient pass applies
the square of twice the stored square. Treating the encoded occlusion as a direct linear multiplier changes the
response. :observed[program evaluation]

## Specular material path

For the inspected `normal_spec_decal` deferred program, with specular texture sample `s`, the output is as follows.
:observed[DXIL disassembly]

| Output | Expression | Confidence |
|---|---|---|
| `RT2.x` | `sqrt(SpecularColor * dot((s.r², s.g², s.b), specMapIntMask))` | :observed |
| `RT2.y` | `sqrt(Specular * s.a / 512)` | :observed |
| `RT2.z` | `Fresnel` | :observed |

The directional-light program reconstructs intensity `I = RT2.x²` and falloff `n = RT2.y² * 512`. Its exponent is
`3*n` below 500 and `1500 + 558*(n-500)` above that point. The specular term includes `(exponent+2)/8`, the Blinn-Phong
power of `N·H`, Schlick Fresnel with `F0 = 1-Fresnel` and `F90 = 1`, intensity, `N·L` and light colour.
:observed[DXIL disassembly]

The same inspected light path scales diffuse by `1 - I*F(N·V)`. Dry `default` has no material specular parameters and
writes zero intensity and falloff; a parameter-free material is not evidence for a nonzero default specular term.
:observed[DXIL disassembly]

## Sampling and scope

Inspected lighting passes sample the G-buffer using `TEXCOORD0.xy / TEXCOORD0.w`, a projected interpolant, rather
than an integer load at `SV_Position`. :observed[program inspection]

The formulas on this page describe sampled compiled permutations. Shared effect-family naming does not prove every
permutation has identical output stores; per-program output inspection is needed for that claim. :unknown
