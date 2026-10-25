---
title: Rock and animated-prop shaders
description: The uber_rock and uber_rock_array families of Forza Horizon 6 (retaining walls, boulders, rock faces) and the animated-prop families, as read from their compiled shaders.
---

`uber_rock_array` (197 compiled permutations, `bin.zip` `_0x00000022`) and `uber_rock` (`_0x00000023`) draw rural retaining
walls and stone tiles, coastal boulders and alpine rock faces. Their compiled pixel shaders (all 12 permutations met in the
rural, coastal and mountain test boxes) were interpreted on real merged constants and real textures and match the formulas
below to ≤ 3e-7 albedo, 3e-8 roughness and 1e-7 normal where no high-tiling uv is involved. :observed The larger residuals on
the micro and mid layers (up to 3.4e-4 albedo, 4.7e-3 normal at a camera about 1,900 m from the origin) are float32 uv rounding
at tilings 9 to 20; with those tilings set to 1 near the origin they fall to ≤ 2.6e-5 / 2.4e-6 / 2.5e-5. :observed

Counts come from a recorded census of the Tokyo track `Brio` and its rural and coastal test boxes; no longer re-checkable.
:observed

## Permutations met

| Family | Permutation | Materials in the test boxes |
|---|---|---|
| `uber_rock_array` | `_Array_Micro_Spline` | rural retaining walls |
| | `_Array_Micro_Up_Modulate_USU`, `_Array_Up_Modulate_USU` (+ `_Moss`) | 10 and 7 (+1 and +1) |
| `uber_rock` | `_diff1_simple_Modulate_Spline` | rural `_LOD4` and `_PLOD` |
| | `_diff1_simple_Modulate_Upshader`, `_diff1_simple_Upshader`, `_diff1_simple_Frost` | 15, 7, 9 |
| | `_Micro2_Modulate_UpShader`, `_Micro1_Modulate`, `_Micro1` | 3, 1, 1 |

All rows :observed. Each of the 64 rock materials matches exactly one permutation. Texture indices sit at material dword 88 +
the `TXMP` slot (`uber_rock_array`) and 76 + the slot (`uber_rock`). "TextureArray" is not a GPU texture array: the material
binds five ordinary textures `MidDiffuse_A..E` and `MidNormal_A..E` and picks two per pixel; the only `Texture2DArray` in these
shaders is the terrain clipmap. :observed `INSTANCE_VARIATION` x, y, z are the placement record bytes +0x34, +0x35, +0x36
divided by 255; `COLOR` is the vertex colour (`.g` up mask, `.b` and `.a` micro weights). The draw scale `S` is the largest
column length of the draw's 3 × 3 (`cb9[0..2]`; instanced: rows × scale); `uber_rock`'s micro uses the per-axis column lengths.
:observed `Frost` has no effect on the G-buffer outputs. :observed

## Shared pieces

```
UpMask:   a = n.y · COLOR.g,  b = sat(2·COLOR.g − 1) · N.y       (n = the layer normal so far, N = vertex normal; game Y up)
          sm = sat((b − UpMaskSmoothMinAngle/90) / ((UpMaskSmoothMaxAngle − UpMaskSmoothMinAngle)/90))
          up = UpMaskOnOffOnOff ? sat((a − UpMaskMinAngle/90 + sm·(b − a)) / ((UpMaskMaxAngle − UpMaskMinAngle)/90)) : 0
World layer normal (Up textures): n = normalize(X·x − B·y + N·z), X = (1,0,0), B = cross(N, X)
Modulate: uvM = (dot(P − c0, A)·sA + .5, dot(P − c0, B)·sB + .5) (ModulateConstants frame; P absolute)
          M = ModulateTexture(uvM); t = 0.5 + TM_Max·IV.x·(M − 0.5); o = overlay(c, t)
          c' = o + (c − o)·sat(0.01·|WORLDPOS| + ViewDist_offset)                 (fades out with camera distance)
Tide:     e = WORLDPOS.y + cb2[8].y + TideMarkAOEffect·AO', h = frac(IV.y)·1000 + 1.15
          satf = 1 + (1 − sat((e − h)/Blend))·SaturationAmount, dark = max(sat((e + DarkenOffset − h)/Blend), DarkenAmount)
          L = 0.33(r + g + b), k = L·(0.27, 0.6, 0.75);  c' = (satf·(c − k) + k)·dark
```

`B` is unnormalised in `uber_rock` and normalised in `uber_rock_array`. The tide-mark height comes from the placement record byte
+0x35 (`IV.y`). `AO'` in `uber_rock_array` is the traced layer AO; in `uber_rock` it is `1 + cb2[92].x·(sat(AO)^|cb2[92].w| − 1)`,
a run-time AO curve, and `TideMarkAOEffect` is non-zero on every census material (1, 1.5, 3.8, 4.36, 7), so `uber_rock`'s
water line depends on that run-time global. :observed Hand-placed (`.pvs`) rock instances have no tide byte. :observed

## uber_rock_array

```
Mac = MacroDiffuse(uv0), MN = MacroNormal(uv0), MAO = MacroAO(uv0).x
v = Mid_Variation_Mask(uv0).x;  i = clamp(floor(4v), 0, 3), j = i + 1        (layers A..E)
s = smoothstep(sat((4v − i − lo)/(hi − lo))),  lo/hi = 0.5 ∓ (1 − Array_Optimize)/2
uvm = MidUV_Tiling·uv1·(ScaleMidUVsOnOff ? S : 1);  D_i, D_j = MidDiffuse_[i|j](uvm), N_i, N_j = MidNormal_[i|j](uvm)
b = sat((s − lo2 + HeightScale·(N_j.a − N_i.a))/(hi2 − lo2)),  lo2/hi2 = 0.5 ∓ MidBlendSoftness/2
mid = D_i + (D_j − D_i)·b;  (x, y) = 2·lerp(N_i.rg, N_j.rg, b) − 1, z = sqrt(sat(1 − x² − y²)), nmid = normalize(T1·x − B1n·y + N·z)
(x', y') = xy of normalize(dot(nmid, T0), dot(nmid, B0n), dot(nmid, N));  (mx, my) = 2·MN.rg − 1
vv = normalize(x' + k·mx, y' − k·my, 1), k = NormalScale_MacroMidUpTextureSet_MacroMidUpBlendedTextureSet
nmd = normalize(T0·vv.x + B0n·vv.y + N·vv.z)
c1 = Mac + (sat(ov)^2.2 − Mac)·sat(normalStrength0),  g(x) = x^(1/2.2), ov = g(mid) > .5 ? 2·g(Mac)·g(mid) : 1 − 2(1 − g(Mac))(1 − g(mid))
r1 = clamp(mid.a + MacroRoughnessStrength·(2·rm − 1), 0, 1),  rm = Mac.a + (sat(1 − 2(1 − g(Mac.a))(1 − g(mid.a)))^2.2 − Mac.a)·sat(normalStrength0)
moss (_Moss): mm = (1 − s) [i = 0];  AO base = MAO + (N_i.b − MAO)·mm  (else MAO)
Up (UpBlend + UseSimpleUp): UD, EX, UN = UpSimpleDiffuse/Extras/Normal at the absolute world (X, Z) (1 m repeat)
     up0 = UpMask(n = nmd);  kh = UpMaskMegaHeightStrength·EX.b;  w = sat((up0 − (0.5 − kh))/(2kh))
     c = lerp(c1, UD, w), r = lerp(r1, EX.r, w), n = (1 − w)·nmd + w·nUp (world layer normal, UN), porosity lerp to EX.g
     AO' = lerp(1 + (1 − w)(AObase − 1), UN.b, w)
  (no Up: c = c1, r = r1, n = nmd, AO' = 1 + (AObase − 1)(1 − sat((UpMaskMegaHeightStrength − 0.5)/(2·UpMaskMegaHeightStrength))))
Micro:
  _Array_Micro_Spline: uvμ = MicroUVTiling·uv1·S; mA, mB = MicroNormalA/BTexture(uvμ), m = min(v, 1), I = MicroIntensity
       md = lerp(mA.a, mB.a, m), mr = lerp(mA.b, mB.b, m), micro (x, y, z) = lerp of the standard decodes
  Up permutations: mB = MicroNormalBTexture(uvμ) only, I = MicroIntensity·((1 − up0)(1 − COLOR.b) + COLOR.b)
  c += (overlay_c(md) − c)·I,  overlay_c(d) = c > .5 ? 1 − 2(1 − d)(1 − c) : 2dc;  r += I·MicroRoughnessStrength·(2·mr − 1)
  bb = normalize(dot(n, T1), dot(n, B1n), dot(n, N));  d = 1 + I(mz − 1), p = I·mx, q = −I·my
  cm = normalize((d + q)·bb.x + p·bb.z, (d + p)·bb.y + q·bb.z, d·bb.z − q·bb.y − p·bb.x)
  t = bb + (cm − bb)·sat(|N·V|)  (V toward the camera: view dependent);  n = normalize(T1·t.x + B1n·t.y + N·t.z)
Modulate (_Modulate): colour with M.rgb, roughness with M.a, both weighted 1 − max(up0, mm)
then tide(c, AO'), clamp(c, 0, 1), times the run-time AO factor K;  roughness written unclamped;  metal 0;  emissive 0
```

`UpMaskMegaHeightStrength` is 0 on 16 of 19 coastal and mountain array materials; there `w = sat((up0 − 0.5)/0)` is the GPU's hard
step (+inf → 1, −inf → 0, NaN → 0). :observed

## uber_rock

```
D = DiffuseA(uv0), AO = AOA(uv0).x, nb = normalize(T·x − B·y + N·z) of NormalA(uv0) (B = cross(N, T)·w, unnormalised)
Up (_Upshader): C = DiffuseC / NormalC / AOC at 0.2·world (X, Z); up = UpMask(n = nb)
     c = lerp(D.rgb, C.rgb, up), n = normalize(lerp(nb, nUp, up)), r = lerp(D.a, C.a, up), AO = lerp(AOA, AOC, up)
  (else up = the constant mask, c = D.rgb, n = nb, r = D.a)
Micro (_Micro1: M1 only, cw = 1; _Micro2: M1 + M2, cw = COLOR.a); cz = COLOR.b:
     M1 = MicroNormal(MicroUVTiling·uv1·cs), M2 = Micro2Normal(Micro2UVTiling·uv1·cs)   (cs = column scales)
     dd = M2.a + cw((M1.a − .5)cz + .5 − M2.a);  c += (dd − .5)(1 − up)·sat((0.875 + 0.125·cs.z)·lerp(MicroDiffuse02Strength, MicroDiffuse01Strength, cw))
     mr = M2.b + cw((M1.b − .5)cz + .5 − M2.b);  mr += (.5 − mr)·up;  r = overlay(r, mr) (condition on r)
     t = normalize(dot(n, T), dot(n, Bn), dot(n, N));  mx = lerp(M2.x, M1.x·cz, cw), my = −lerp(M2.y, M1.y·cz, cw)
     f = _Micro2 ? max((1 − up)·cz, 1 − cw) : max((1 − up)·cz, 0)
     n = T·t2.x + Bn·t2.y + N·t2.z,  t2 = normalize(t.x + f·mx·(1 − up), t.y + f·my·(1 − up), t.z)
Modulate (_Modulate): colour only
albedo = lerp(tide(clamp(c_mod, 0, 1)), c_premodulate, up) · K;  roughness r;  metal 0
```

The **MegaSkirt** blend into the terrain megatexture near the ground (run-time terrain height and clipmap, `cb7[29..51]`; every
`uber_rock_array` permutation above and `uber_rock` `_Spline` and `_Micro1*`) cannot be reproduced from files. The AO-into-albedo
factor K is run time. :unknown

## uber_asset_animated

Coastal boats `AMB_CST_BOAT_0x_A_Main` use `_Animate_AnimOscillate` and `*_Alpha` and `TEX_CST_DECAL_COMM_A` use
`_AlphaTest_AnimOscillate` (buckets 0x19 and 0x38, G-buffer pass). Texture slot 0 `AOTexture`, 1 `DiffuseATexture`, 2
`NormalATexture`, 3 `RoughnessMetalnessATexture`; register r7.x is `WetRoughnessScale`: :observed

```
wf = sat(N.y + 1);  D = DiffuseATexture(uv0);  RM = RoughnessMetalnessATexture(uv0)
k  = lerp(1 + wf(cb7[3].x − 1), 1 + wf(cb7[3].z − 1), sat(1 − RM.r));  L = dot(D.rgb, (0.3, 0.59, 0.11))
RT0.rgb = ((1 + (1 − k)·0.2)(D.rgb·k − L) + L) · (1 + K(max(max(cb2[43].x, ao), max(cb2[44].x, ao)) − 1)),  ao = AOTexture(uv1).r
RT0.w = RM.g;  RT1.w = RM.r + WetRoughnessScale(RM.r^(1 + wf(cb7[3].y − 1)) − RM.r);  RT2 = standard NormalATexture(uv0)
RT1.xyz seed 0;  _AlphaTest: discard D.a < cb2[128].x
```

`cb7[3]` is a run-time weather global; with `cb7[3] = (1, 1, 1)` every weather term is the identity. :observed The vertex shader
translates and rotates the mesh by triangle waves of game time `cb2[9].x` with per-draw speeds and amplitudes. :observed The
boats' pixel shader was interpreted on the real meshes and textures: albedo ≤ 6.4e-8, roughness ≤ 4.7e-8, normal ≤ 1e-7, identical
discard decisions. :observed

## anim_ledflipbookpanel

`_Standard` draws the festival LED screen `prp_fst_display_01_a` (bucket 0x19); texture indices sit in the material rows from
register 7 (r7.x `FlipbookTexture`, r7.y `MaskTexture`): :observed

```
M = MaskTexture(uv1 · MaskUVTiling).r      (BC4 SNORM: signed)
frame = fmod(FramesPerSecond·TimeDilationAmount·cb2[9].x + OffsetMultiplier·trunc(uv0.x), X·Y),  X, Y = int(XFrames), int(YFrames)
col = trunc(fmod(frame, X)), row = trunc(frame / X);  uvF = (frac(uv0.x)/(NumVariations·X) + col/X, frac(uv0.y)/Y + row/Y)
c = FlipbookTexture(uvF).rgb · Brightness · M;   RT0.rgb = c × the AO term (AO input 1);  RT1.xyz seed = c·g(d)
RT0.w = 0;  RT1.w = lerp(RoughnessBoard, RoughnessLED, M);  RT2 = vertex normal;  opaque
```

`c` is not clamped by the shader (Brightness 10; negative between the LED dots from the signed mask); the render target format
is not traced. The shader interpreted at game times 0, 0.07, 37.25 and 1,234.5 s matches the formulas (albedo ≤ 4.8e-7,
roughness ≤ 2.9e-8, emissive ≤ 5.8e-8). :observed
