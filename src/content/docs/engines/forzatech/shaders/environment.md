---
title: Environment shaders
description: What the Forza Horizon 6 environment family computes for city buildings and props, the swatch tint, signage, the triplanar modulate, deposits and ambient occlusion, as read from its compiled shaders.
---

`environment` is the family of city facades, building kits and most props; `environment_plot`, `environment_skinned` and the
`signage_*` families are close relatives. Its compiled G-buffer shaders were disassembled and the formulas below read from
them. :observed Pixel shaders of this family were also interpreted on real merged constants and real textures and matched the
formulas; where a formula is marked untraced it depends on a run-time constant. :observed

The numbers come from a recorded census of the Tokyo track `Brio`, no longer re-checkable. :observed

## Inputs

`TEXCOORD0` to `TEXCOORD2` are the dequantised UV sets (`v_d3d = 1 − v`), `COLOR` is the raw vertex colour,
`INSTANCE_VARIATION.x` is the placement record byte at +0x34 divided by 255 ([Placement files](/engines/forzatech/world/pgeo-placements/)),
and `AoWetBlendContextTex` is sampled on `TEXCOORD1` (its islands match the UV1 layout exactly). :observed

## Swatch tint (the `_ST` permutations: city facades)

```
w      = 1 − base.alpha · (1 − COLOR.r)            base colour alpha = tint mask, vertex red = tint off
tint   = SwatchTintTexture.SampleLevel(u = COLOR.g, v = INSTANCE_VARIATION.x)      a 32 × 512 palette
albedo = base.rgb · lerp(tint, 1, w)
```

Without the tint every facade is near white: the tiling textures are deliberately pale and get their colour from the
palette. :observed For the Shibuya facade `SHOP_W7_02_A_Tiling_14_VARIANT_6` the albedo before modulate and AO is sRGB
≈ (214, 214, 213). :observed Its visible character comes from the AO and grime mask, deposits, modulate, normal map and
lighting. :inferred

## G-buffer albedo (`_StandardRCSM_ShadowsTriPlanar_ST_TPNAO_D`)

```
uv    = TEXCOORD0 + Uv0Offset                         then RCSM cone-step parallax (view dependent)
base  = DiffAlphaTex_A(uv · BaseColorAlpha_A_UVTiling)            BC1 sRGB
tint  = SwatchTintTexture(u = COLOR.g, v = INSTANCE_VARIATION.x)  RGBA8 sRGB
a0    = base.rgb · lerp(tint, 1, 1 − base.a · (1 − COLOR.r))
aow   = AoWetBlendContextTex(TEXCOORD1 · MacroAOWetBlendMaskTiling)   x AO, y wetness mask, w deposit amount
rma   = RoughMetAoPorTex_A(uv · …)                                   x rough, y metal, z AO, w porosity
dep   = DepositsATexture(uv).x                                         BC4 SNORM
```

### Triplanar modulate

```
world = cb2[8].xyz + WORLDPOS: the absolute world position (game frame); n = normalize(WORLDNORMAL), no normal map
noise = simplex3D(world · TriPlanarNoiseVariationTiling) · 16
nf    = NoiseOnOff ? lerp(1, sat((0.5 − StepMin + noise) / (StepMax − StepMin)), Strength) : 1
frame = ModulateConstants {c0, c1, c2}: the .pvs frames table at the .pgeo record's u16 @ +0x3E
        (65535: a per-draw constant buffer instead, run time); c1.w · c2.w ≤ 0 (frame 0): uv = 0, k = 0
P = world · TriPlanarTextureTiling + R − c0.xyz;  A = c1.xyz, B = c2.xyz, C = cross(A, B)
    R = RandomOffsetOnOff ? frac((p.x·4.192 + p.z·2.624 + p.y·3.213, p.y·7.554 + p.x·4.523 + p.z·6.587,
                                  p.z·11.125 + p.y·10.474 + p.x·14.853)) · 123.456 : 0,  p = instance position
uA = dot(P,A)·c1.w + .5, uB = dot(P,B)·c2.w + .5, uC = dot(P,C)·c1.w + .5
|n·C| > |n·A| and > |n·B|:   uv = (uA·sign(n·C), uB),   w = sat(|n·C|−|n·A|) · sat(|n·C|−|n·B|)
else if |n·A| > |n·B|:       uv = (−sign(n·A)·uC, uB),  w = sat(|n·A|−|n·B|) · sat(|n·A|−|n·C|)
else:                        uv = (uA·sign(n·B), −uC),  w = sat(|n·B|−|n·A|) · sat(|n·B|−|n·C|)
k  = pow(w · SeamSize, SeamHardness) · nf · BrightSatRoughStrength
tm = TriPlanarModulateTexture(uv)  (global sampler s1)
```

### Modulate, deposits and AO

```
m2  = ModulateTexture(ModulateUVTiling · (WorldSpaceUV_Modulate ? world.xz · WorldSpaceUVTiling_Modulate : TEXCOORD2))
bri = sat((.5 + (tm.r − .5)·k) + (m2.r − .5)·_BrightnessStrength);  sat = the same with .g and _SaturationStrength
g = a0^(1/2.2); o = bri > .5 ? 1 − (1 − g)·2·(1 − bri) : g·2·bri; L = dot(o, (.299, .587, .114))
c1 = lerp(a0, sat(lerp(L, o, 2·sat))^2.2, 1 − rma.y)                  metal is never modulated
dn   = sat((simplex3D(world · DepositMacroNoiseTiling)·16 + .5 − MacroStepMin) / (MacroStepMax − MacroStepMin))
mask = sat(2·(1.5 + (dn − 1)·MacroStrength + (sat(aow.w) − .5)·MidStrength) − 2) · DepositsStrength
       · (1 + (sat(dep) − 1)·MicroStrength)
c2   = lerp(c1, DepositDiffuse, mask)                                 DepositDiffuse default (0.0529, 0.0482, 0.0395)
albedo = c2 · (1 + K · (max(..., AO(rma.z, aow.x), ...) − 1))          K = a per-frame constant (cb2[159]), run time
```

Wetness is zero when dry. :observed `DualUv` permutations sample base, normal and RMA twice (layer A on `TEXCOORD0`, layer B
on `TEXCOORD2` with `DualUV_BaseColorAlpha_A_UVTiling`) and blend `lerp(A, B, COLOR.b)`; tint, modulate and deposits follow
unchanged; `_Standard_ST` is base and tint only. :observed

Read from the shaders and checked on data: the permutation selection rule, the register and slot maps, every formula above,
UV1 for the AO and context mask, and the ModulateConstants frames. :observed Not traced: the AO-into-albedo constant K and the AO
strength globals (encrypted render settings), and the sampler filter modes (run-time descriptor tables; the palette's 2 × 2
texel cells make nearest and bilinear agree at `v = byte/255` except for bleeding at small rows). :unknown

The simplex noise is, op by op: skew `s = dot(p, 1/3)`, `i = floor(p + s)`, `x0 = p − (i − dot(i, 1/6))`; corner order from
`x0.x ≥ x0.y`, `x0.z ≥ x0.x`, `x0.y ≥ x0.z`; per corner `t = sat(0.6 − |x|²)⁴`,
`h = uint(frac(sin(dot((c.x + c.z, c.y + c.z)/256, (12.9898, 78.233))) · 43758.5453) · 255) & 15`, `sum += t · dot(g_grad3[h], x)`,
result `sum · 16`; `g_grad3` is the 12 edge gradients of a cube followed by the first four again. The hash runs `sin` on
arguments in the hundreds, where GPU `sin` implementations differ in the low bits; 93% of Shibuya's lattice corners change
gradient between float32 and float64 `sin`. The noise's lattice, frequency and amplitude are exact everywhere; the blotch
layout is not reproducible across GPUs. :observed

## What each G-buffer channel depends on

Reading every `GBufferLightScenario` pixel shader of `environment` in the Tokyo track's `bin.zip` (379 permutations, one per
variant) through the `CBMP` and `TXMP` maps, and following each render-target channel back to its texture reads and
parameter rows, gives these dependencies. :observed

- `RT0.w`, the metalness, is `RoughMetAoPorTex_A.g` in the 273 permutations that sample one texture set: alone in 199, and
  with the mega-skirt blend's textures in the 74 `_MS` ones. The 106 `_B` (two-set) permutations add
  `RoughMetAoPorTex_B.g`, `NormHeightTex_A.a` and `AoWetBlendContextTex.b` (54 alone, 52 with the mega-skirt blend).
- `RT1.w`, the roughness, is `sat(RoughMetAoPorTex_A.r)` plus the wet terms; with the rain constant at 0 it is exactly that.
- `RT2.xyz` reads `NormHeightTex_A.r` and `.g` only (378 of the 379; the one permutation without a normal output is the
  ray-tracing hit shader), as `x = 2r − 1, y = 2g − 1, z = sqrt(sat(1 − x² − y²))`, brought to the world as
  `x·T − y·B + z·N` with `B = (N × T)·w`. The vertex shader gives `w` as `sign(2·w_vertex − 1)` when the tangent is stored
  as unsigned bytes and the stored `w` otherwise (`_Standard`).
- `RT0.xyz` reads `DiffAlphaTex_A.rgb` in 378 of the 379 (the same one lacks it). The sample is taken through an sRGB view
  (linear), raised to `1/2.2` before the wet term and to `2.2` after it, so a dry surface returns the linear sample; the
  occlusion term of the albedo section multiplies it.
- The three maps are sampled at `Uv_k · (TEXCOORD0 + Uv0Offset)` with their own tiling parameters, `BaseColorAlpha_A_UVTiling`,
  `NormalHeight_A_UVTiling` and `RoughMetAoPoros_A_UVTiling`; a time-driven vertical scroll is added to V when a parameter
  row is non-zero (`AnimTranslate`). The `DualUV_*` tilings enter the permutations that blend two UV sets.
- `AlphaTest` permutations `discard` when `DiffAlphaTex_A.a − cb2[128].x < 0`: the reference is a constant of the draw's
  buffer, not a material parameter, and the materials' `ATST` bytes are `1, 0`.
- `EmissiveTexture` reaches only `RT1.xyz` (the lit colour), not the albedo.

## Signage

`signage_*` families (the `*_CM` permutations) colour a one-channel or RGBA mask atlas of `AtlasImages.zw` (columns, rows)
cells with constants:

```
cell  = min(cols·rows − 1, AtlasIndex − 1)                      AtlasIndex is 1-based
uv    = (cell_xy + TEXCOORD3) / (cols, rows)                    TEXCOORD3 = the sign face's 0..1 UV
m     = bicubic(mask, uv)
if UseSteppedMask:   m = saturate((m − 0.4) · 5)
c = lerp(BackgroundColor, ColorR, m.r)
if UseFiveColorMask: c = lerp(c, ColorG, m.g); c = lerp(c, ColorB, m.b); c = lerp(c, ColorA, m.a)
```

Constant registers (byte offset ÷ 16, from the constant map): background 1, R 2, G 3, B 4, A 5, AtlasImages 10.zw, AtlasIndex
11.xy, UseFiveColorMask 48.x, UseSteppedMask 57.z. `TEXCOORD3` exists only on a model's sign meshes, so attribute sets are
per mesh, not per model. :observed

Around that, over the 19 Tokyo `signage_*` G-buffer permutations (each render target channel followed back through the
constant and texture maps; the texture indices of the parameter buffer start at dword 236): :observed

- Without `_CM` the sampled cell is the colour itself; with `_CM` it is the mask above. The sample is taken through the
  format's own view, raised to 1/2.2, darkened by wetness and raised back to 2.2, so a dry surface returns the linear
  sample; the `BiCubic` permutations filter with Catmull-Rom, the others bilinearly. The result is saturated.
- The metalness is `RoughMetAoPorTex_A.g`, the roughness `saturate(RoughMetAoPorTex_A.r)` (wetness off) and the normal the
  standard decode of `NormHeightTex_A.rg`, all at `TEXCOORD0` with the environment family's tilings; the albedo is
  multiplied by a factor of `AoWetBlendContextTex.r` read at `TEXCOORD1`. A sign face is one coordinate set (`TEXCOORD3`)
  and the surface maps are others.
- The `Signage*Mural*` permutations lerp the wall colour (`DiffAlphaTex_A`, `TEXCOORD0`) to the sign colour by
  `MuralTexture.r` read in the same cell.
- The `_SignageEmissive*` permutations write `EmissiveTexture.rgb · EmissiveTint.rgb · (the sign colour above)`, times
  `GIEmissiveScale` and an instance-variation factor (`LightEmisVariationOnOff`), to `RT1.xyz` as `g(d)` of
  [Emissive](/engines/forzatech/shaders/world-families/#emissive); `EmissiveTexture` is read in the same cell of the same
  `TEXCOORD3` atlas, or at `TEXCOORD4` with `EmissiveAltUV`.
- The only `discard` compares a constant of the draw with one: the surface is opaque. The scroll, rotation and scale of the
  four mask channels, `RandomiseIndexOnOff` and `_AnimatedSign` are driven by the clock.

## Windows and other relatives

`window_linecastroom` (parallax interiors): the base colour comes from `FrameDiffuseandMask` (else `FittingsDiffAlphaTex`);
roughness is `max(FrameGlassRoughness(uv2 frame).r, lerp(1 − a, GlassRoughness(uv0 · tiling).r, a))` with `a = COLOR.a`;
`FrameGlassNormalTexture` is sampled on `uv2` (frame atlas) but built on `WORLDTANGENT0`, the only tangent the window shaders
take. The room's x centre and width come from `INSTANCE_VARIATION.z/.w` ([Placement files](/engines/forzatech/world/pgeo-placements/)). :observed

Over the 51 Tokyo G-buffer permutations (texture indices from dword 124): :observed

```
albedo   = lerp(t, F.rgb, F.a) · (1 − (1 − Fit.a)(1 − F.a))     F = FrameDiffuseandMask at uv2 in its atlas
t        = FittingsDiffAlphaTex.r at uv1 (in its atlas) · WindowTintColour
metal    = Metalness
```

so the albedo is 0 where neither the frame nor a fitting covers the pane. `FrameUseAtlasOnOff` picks the frame cell
`(FrameAtlasIndex + uv2) / FrameAtlasCount`. The room behind the pane (`BoxDiffRoughTex`, `BoxEmissiveTex`, up to three
furniture layers with parallax) is traced in the pixel shader from the world position, the camera and the material's
`RoomPos`, `RoomScale`, `RoomRotation`, `RoomAtlasIndex`, `RoomAtlasCount` and `RoomRandomisationOnOff` (the room is
a box intersected with the eye ray per wall; its atlas cell is `(RoomAtlasIndex + h) mod RoomAtlasCount`, `h` a hash of the
ceiled `RoomPos` under a per-draw matrix when `RoomRandomisationOnOff`, else 0), and reaches `RT1.xyz`, not the albedo. The only `discard` compares a constant of the draw with one. :observed
