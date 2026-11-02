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

### The tint's inputs over the Shibuya box

Read from the models of every prototype of the Shibuya Scramble box (summer), 568 of its 1,534 prototypes draw an
`environment` material with `SwatchTint` on: 3,984 primitives, 729,706 triangles, 976,427 vertices. :observed

- `COLOR.r` is 0 on 666,214 vertices and 1 on 306,530; 3,683 (0.4%) lie between. The triangles whose corners disagree on
  red number 499. :observed
- `COLOR.g` is one value over the whole primitive in 3,196 of the 3,984, at most four in 772 more and five to 32 in 16;
  the vertices hold 47 distinct values over 0 to 255, 255 on 293,996 and 24 on 153,316 of them. Among the triangles
  whose red is 0, 813 have corners that disagree on green. :observed
- A base colour with an alpha channel is the rule: 662,422 of the 729,712 triangles of these materials (90.8%) are
  drawn with a BC7 sRGB `DiffAlphaTex_A`, whose texels have alpha under 250 on average 46% at its third mip level; the
  other 67,242 use an opaque BC1 sRGB texture, so the tint there covers the whole surface where red is 0. :observed
- The palette textures are RGBA8 or BC7 sRGB and range from 4 × 4 to 1024 × 1024 (32 × 512, 32 × 32, 64 × 64, 16 × 16
  and 256 × 256 among them), with one to seven stored mips. :observed
- Rule placements (`.pgeo` records) carry the byte at +0x34: 2,801 distinct (prototype, byte) pairs over 39,446
  instances, at most 111 bytes for one prototype. :observed Hand placements (`.pvs` instances) have no such record:
  26 instances of these prototypes. :observed Their transform's tint (four floats) is not a whole byte over 255 in 25 of
  the 26; the values are round authored fractions (0.51, 0.514, 0.13, 0.66, 0.09) with the other components equal to each
  other or one, the same kinds of population as the rule records' four bytes (all ones, all zeros, a varied first with the
  rest ones). :observed The first float is therefore the likely `INSTANCE_VARIATION.x` of a hand-placed instance, read as
  the palette row as it is. :inferred
- Over all 835 hand placements of the box, of every prototype, the tint is (1, 1, 1, 1) in 281, (0, 0, 0, 0) in 232,
  (1, 0, 0, 0) in 90 and something else in 232, mostly of the shapes (a, a, 0, 0) and (a, b, b, 0). The box's 61,292 rule
  records hold four bytes of 255 in 9,435, four zeros in 6,411 and mostly a varied first byte with the other three 255 in
  the rest. :observed The later tint components do not follow the rule record's pattern, so which of them, if any, a
  hand-placed instance's `INSTANCE_VARIATION.y` comes from is not established. :unknown

### The palette read

- The palette is the only texture the `_ST` pixel shaders sample through the static sampler register `s11`, and it is
  sampled with `SampleLevel` at level 0. :observed (the compiled pixel shaders of the `_Standard_ST` permutations)
- The root signature of those shaders declares no static samplers, so the filter and the address mode of `s11` are set
  at run time and are not in the shader. :observed The filter is not known. :unknown
- Over the Shibuya box the (palette, green, row) combinations read number 1,267 (rows from the rule placements' bytes
  over 255 and the hand placements' first tint float); a bilinear read of the same positions differs from a nearest-texel
  read by more than two 8-bit steps in 477 of them with clamp addressing and 592 with wrap. :observed Which filter the
  game uses is not established, so a nearest-texel read is a guess. :unknown

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
- The `EmissiveTexture` files bound by the `EmissiveAltUV` materials drawn in the Shibuya Scramble box (21 distinct
  textures, 256 x 256 or 512 x 512, linear) are all BC6H unsigned float, and they hold radiance rather than a 0 to 1 colour:
  the largest red, green or blue value of each is between 3.5 and 3,808, and between 4,700 and 141,400 texels of
  each map are above 1. :observed[every one of the 21 decoded to float32 and its extremes taken]

The `_Emissive` permutations (`_Emissive`, `_Emissive_EAUV`, `_Emissive_EF`) add this emission to `RT1.xyz`, in the
`g(d)` encoding of [Emissive](/engines/forzatech/shaders/world-families/#emissive): :observed[the expressions of those
three permutations' `RT1` channels]

```
E = DiffAlphaTex_A.rgb · EmissiveTexture.rgb · EmissiveTint.rgb · GIEmissiveScale · V · H · g(d)
V = 1 + LightEmisVariationOnOff · (sat((INSTANCE_VARIATION.y − EmissiveVariationMin)
                                       / (EmissiveVariationMax − EmissiveVariationMin)) − 1)
H = EmissiveTempVariationOnOff ? √3 · c / |c| : 1
c = lerp(lerp(1, WarmHue.rgb, sat(h)), ColdHue.rgb, sat(−h))     h = 2 · frc(hash) − 1
```

- `DiffAlphaTex_A` is read at `BaseColorAlpha_A_UVTiling · (Uv0Offset + TEXCOORD0)`, as in the other permutations, but
  `EmissiveTexture` at `Uv0Offset + TEXCOORD0`, without a tiling: the two maps line up only when the base colour map
  is not tiled. :observed
- The hue term `H` is a direction of length √3, so it leaves white unchanged and its magnitude never depends on `h`.
  `h` runs from −1 (fully `ColdHue`) to 1 (fully `WarmHue`). Its hash is the sum of three terms `ceil(row_k.x · q + row_k.w)`,
  one per row of a scene constant buffer, weighted 14.853, 10.474 and 11.125. :observed Those are the weights of the x, y
  and z of the instance position in the third component of the random offset of [Triplanar modulate](#triplanar-modulate),
  so the rows likely quantise the three axes of a position and the hue changes in steps from one place to the next. :inferred
- `_Emissive_EF` (`EmissiveFlash`) scales the emission by `1 + EmissiveFlashIntensity · (on − 1)`, where `on` is 1 while
  `frc(t · FlashTimeScale + FlashOffset) ≤ FlashOnDuration` and 0 otherwise, `t` being a scene constant. The emission
  therefore drops to `1 − EmissiveFlashIntensity` of its value for the rest of each period. :observed `t` is likely the
  clock. :inferred

## Mega-skirt (the `_MS` permutations)

Following `_Standard_MS`'s albedo channels back to their inputs gives the blend toward the ground near the bottom of a
mesh. :observed

```text
h  = worldpos.y + cb2[8].y − height(xz)          height: a texture at cb7[29] · (worldpos.xz + cb2[8].xz + cb7[29].xy)
H  = MegaSkirtUseVariationOnOff ? INSTANCE_VARIATION.z : MegaSkirtHeight
s  = sat((h − H) / −H) · cb7[28].x               1 at the ground, 0 at the height H
m  = lerp(clip.r, 0.5, f) · 2 − 1                clip: the terrain clipmap (class 0, space 4, t0, a 2D array)
k  = sat((sat(S · m − S + (2S + 1) · s) − MegaSkirtHeightMin) / (MegaSkirtHeightMax − MegaSkirtHeightMin))
albedo = lerp(DiffAlphaTex_A, clip · (1 − f), k)                         S = MegaSkirtHeightStrength
```

- `clip` is read in the clipmap ring that holds the pixel: a loop over the rings at `cb7[36]` onwards compares the
  position with each ring's origin and extent, the coordinate is `(pos − origin) · scale` from that ring's row, and the
  array slice and mip come through a `Texture3D<uint>` page table (space 12). `f` fades out the ring at its edge. :observed
- The ring rows, the height texture's mapping (`cb7[29]`) and `cb7[28].x` are scene constants written by the engine, and
  the clipmap is the near-field ground the engine writes at run time ([Near-field ground](/engines/forzatech/terrain/near-field-megatexture/)),
  so the blend's colour, its height source and its overall factor are not in any file. :observed The material holds
  only `MegaSkirtHeight`, `MegaSkirtHeightMin`, `MegaSkirtHeightMax`, `MegaSkirtHeightStrength`, the normal limits
  `MegaSkirtNormalMin` and `MegaSkirtNormalMax` (read by the normal channels) and `MegaSkirtUseVariationOnOff`. :observed

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

A cell of the room atlas (`BoxDiffRoughTex`, `BoxEmissiveTex`) is four columns wide: the first column holds two side walls (one above the other), the second a back wall in its lower half and black in its upper half (the front, which no view reaches), the third the floor and the fourth the ceiling, each one tile spanning both rows of its column. Viewed as decoded images, the `BoxDiffRoughTex` textures of the Shibuya Scramble box's windows that were looked at (2048 x 512 for a one-cell texture) show this layout; the back wall is the tile at `u` 0.25 to 0.5, `v` 0.5 to 1 of the cell, `v` down the image. Without `BoxUseAtlas` the whole texture is one cell; with it `RoomAtlasCount` gives the columns and rows of cells and `RoomAtlasIndex` a zero-based (column, row), wrapped by the count. :observed

### The room's glow

In `_Standard_E` the traced room's emission (`BoxEmissiveTex`) reaches `RT1.xyz` scaled as follows: :observed[the expressions of the permutation's three `RT1` colour channels]

```
E = room · g(d) · GIBakeEmissiveScale · F · WindowTintColour.rgb · H · ExposureValues · COLOR.x · S
S = sat((INSTANCE_VARIATION.y − EmissiveVariationMin) / (EmissiveVariationMax − EmissiveVariationMin))
```

`g(d)` is the distance encoding of [Emissive](/engines/forzatech/shaders/world-families/#emissive) and `H` the warm/cold
hue term of the [`_Emissive` permutations](#what-each-g-buffer-channel-depends-on) (`WarmHue`,
`ColdHue`, length √3), which the shader applies or leaves out by a switch, as there. :observed `F` has the form
`(1 − a)(1 − b⁵)`, the shape of one minus a Schlick Fresnel term, so less of the room shows at grazing angles. :inferred
So a pane's room is dark where its vertex colour's red is 0 or where its placement's `INSTANCE_VARIATION.y` is at or below
`EmissiveVariationMin`, and nothing in the term depends on the time of day: none of the 51 permutations reads
`LightSwitchOnTime` or `LightSwitchOffTime`. :observed

Over the Shibuya box (the 3,259 `window_linecastroom` materials loaded with its prototypes, their 1,361 window primitives
and 22,662 placements): :observed[a census of the box's prototypes and placements]

| Input | Values | Confidence |
|---|---|---|
| `ExposureValues` | 1.4 in 2,908 materials, 0.352 in 183, 11.2 in 156, 0.704 in 12: a material constant | :observed |
| `GIBakeEmissiveScale`, `EmissiveTempVariationOnOff` | 1 in every material | :observed |
| `Emissive` | 1 in 3,163, 0 in 96 | :observed |
| `LightSwitchOnTime`, `LightSwitchOffTime` | −1 in 2,643; 0.01 and 0.02 in 616 | :observed |
| `EmissiveVariationMin`–`Max` | 0–0.2, 0.1–0.3, 0.2–0.4, 0.6–0.75, 0.6–0.8, 0.7–0.9, 0.7–1, 0.75–0.9, 0.8–0.9 and 1–1 over the placed primitives; most often 0.7–0.9, 0.75–0.9, 0.7–1 and 0.6–0.8 | :observed |
| `COLOR.x` | Every window primitive has `COLOR_0`. Over the 25,281 triangles of the prototypes, 27.6% are 0, 21.9% are 1 and 50.4% between (multiples of 1/255, 120/255 the commonest); weighted by placements, 96.4% of 145,639 placed triangles are 1 and 1.3% are 0 | :observed |
| `INSTANCE_VARIATION.y` | The placement record's variation byte over 255, spread evenly over 0 to 1 on the 22,654 rule placements; the 8 hand placements have no variation byte | :observed |

With those ramps `S` is 0 on 73.4% of the 140,366 placed triangles of rule placements, 1 on 11.0% and between on
15.6%; `COLOR.x · S` is 0 on 73.5%. So about three windows in four show a dark room wherever the box is drawn. :observed
