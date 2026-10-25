---
title: Car materials and shaders
description: The Forza Horizon 6 car shader families (standard, paint, glass, coat, tyres and the rest), their parameters, what each writes, and the run-time layers that are the identity on a clean car.
---

Car materials use the same [material parameter format](/engines/forzatech/materials/materialbin/) as the world, with `MTPR` v2.0 (a `u8`
parameter count) followed by a 12-byte trailer `(u32, u32, u32 0)` on all 1,859 files of `Materials.zip`. Parent chains end at
`game:\Media\cars\_library\shaders\<family>\<family>.shaderbin`. :observed Each family's bundle (`Cars\_library\shaders\<family>.zip`) holds
`<family>.shaderbin` plus DXIL per variant (`_Standard\`, `_DXRSimpleHit_Base\`, or at the root when the family has one) and scenario
(`CarLightScenario` = the forward main view, `CarShadowDepthLightScenario`, `CarRTBufferLightScenario`, ...). Unlike the world families, car
shaders use classic bound registers ([Shader containers](/engines/forzatech/shaders/shaderbin/)). Input element ids follow the signature's
interpolation table (`car_standard`: 0 to 3 `TEXCOORD0..3`, 4 `WORLDPOS`, 5 `WORLDNORMAL`, 8 to 10 `WORLDTANGENT0..2`, 11 `COLOR`, 12
`DAMAGEIMPACT`, 13 `DAMAGESCRAPE`). :observed

Each family's `CarLightScenario` pixel shader was disassembled and its data flow printed back to material parameters, textures and
interpolants; the lighting inputs were found by their signature in the shared lighting code (`F0 = m(albedo − 0.04) + 0.04`, the roughness
floor `max(r, 0.01)`, the derivative-based normal variance on the final normal). Where shaders were run, a DXIL interpreter reproduced the
formulas: the tyre family over 234 runs on 14 tyre models agrees to 2.6e-6 in albedo, roughness, F0, normal, AO and DO. :observed The
counts come from a recorded census of the install's 682 cars; the install is no longer available. :observed

## Run-time layers that are the identity on a clean car

On a clean, dry, undamaged, stationary, exterior-view car with lamps off these layers do nothing: damage (scratches use the `DAMAGEIMPACT`
and `DAMAGESCRAPE` interpolants, zero when undamaged), SurfaceFX dirt, mud, snow and wetness (both blocks run only when a run-time amount in
`cb4` exceeds 0.05), rain streaks, and lamp emission (`Headlight_Color` × brightness × per-part light masks × run-time exposure). :observed
Every lamp emission term is multiplied by a run-time light-group value `cb4[Emissive_Trigger >> 2][Emissive_Trigger & 3]` (0 for triggers
above 79). :observed The quality switches `cb4[43].x`, `.y` and `.z` (coated orange-peel coat normal; carbon coat normal and fibre
anisotropy; the back normal of detailed glass; `cb4[43].w` gates a dirt term) are run-time values. :unknown

## car_standard

190 of the 240SX's 306 materials (`car_standardCarLightScenario.pcdxil.pso`):

```
uv     = UVChoice_OnCh1_OffCh2 ? TEXCOORD0 : TEXCOORD1           (the tangent frame follows: WORLDTANGENT0 / 1)
uv     = rotate(uv, UV_Orientation degrees): u' = cos a·u − sin a·v, v' = sin a·u + cos a·v   (D3D uv; the tangent frame is rotated about N by the same angle)
uvX    = uv · (Override<X>TilingOnOff ? <X>TilingOverride : (U_Tiling, V_Tiling))   per texture X
base   = BaseColorAlpha(uvB)                       (SampleBias −2)
rma    = RoughMetalAO(uvR)                          r = roughness, g = metalness, b = AO
tint   = BaseColor_Tint · BaseColor_TintMultiplier
t      = sat(tint · base)
w      = m + (1 − 2m)·BaseColor_TintMode.y          m = rma.g
col    = t + BaseColor_TintMode.x·(1 − w)·(base − t)
albedo = min(max(col, PBRValidation_Min), PBRValidation_Dielectric_Max + (1 − Dielectric_Max)·m)
rough  = s == 0 ? r : s > 0 ? 1 − sat(1 − s)(1 − r) : sat(1 + s)·r          s = Roughness_Shift
n      : x = 2N.r − 1, y = 2N.g − 1, z = sqrt(sat(1 − x² − y²)) (from the unscaled x, y),
         n = normalize(I·x·T − I·y·B + z·N), I = Normal_Intensity, B = cross(N, T)·T.w
AO     = (1 + sat(I)(rma.b − 1))·AoScale        (with the instance AO bake on TEXCOORD2: occlusion terms)
alpha  = Alpha.r(uvA)·base.a; the ShadowDepth pass discards alpha < 0.5 when AlphaTransparency
lighting: diffuse = albedo(1 − m); F0 = lerp(0.04, albedo, m); GGX with alpha = rough²
          (sun lobe: alpha = sat(1.8(1 − (1 − 0.5556·rough²)(1 − v))), v = the screen-space normal variance, 0 on smooth normals)
```

All :observed. The cut-out threshold 0.5 is read from the shadow pass; that the main view uses the same cut-out is not traced. :unknown

### Relatives

- **`car_standard_emissive`**: `car_standard` albedo, roughness and normal, with the dielectric maximum fixed at `0.871367` (`hi = 0.871367 +
  0.128633·m`); no alpha, no SurfaceFX; emission (`EmissiveCH1` desaturated by `EmissiveColor_Desat` × `EmissiveColor_Tint` ×
  `Emissive_Intensity`, anisotropic falloff) times the run-time light group. :observed
- **`car_standard_fabric`**: `tint' = TopStitchSwitch ? lerp(tint, StitchColor_Tint, sat(20·rma.g)) : tint`; `col = base·tint'`; `rim = lum(col)^0.2
  · RimColorAddAmount · sat(sat((N·V − 0.7)·−1.42857)^(4 − 3·FabricFuzziness))`, lum weights (0.2126, 0.7152, 0.0722); `albedo = clamp(col + rim,
  PBRValidation_Min, 0.871367 + 0.128633·rma.g)`; metal = `TopStitchSwitch ? 0 : rma.g`. :observed
- **`car_label`**: `albedo = clamp(BaseColorOverrideSwitch ? BaseColor_Override : base, PBRValidation_Min, 0.871367 + 0.128633·Metalness)`,
  metal `sat(Metalness)`, roughness `sat(Roughness)`; coverage `A = (UseAlphaBlend ? a : 1)(UseAlphaTest ? a : 1)` written as dual-source output
  `(lit·A, 1 − A)`. :observed
- **`car_livery`**: `albedo = clamp(BaseColorTextureSwitch ? BaseColorAlpha(uv0) : BaseColor, PBRValidation_Min, 0.871367 + 0.128633·m)`;
  normal `OrangePeelNormal_Texture(uv1·32)` with intensity `OrangePeelNormal_HeightScale` on the UV1 tangent frame. :observed
- **`car_brakerotor`**: `uv = (UV_Scaler(u − 0.5)(UV_Flip ? −1 : 1) + 0.5, UV_Scaler(v − 0.5) + 0.5)` on `TEXCOORD0`; normal on the same uv but with
  the `WORLDTANGENT1` frame; rotor glow (RotorGlowSwitch × run-time brake temperature) is run time. :observed

## car_automotive_paint

Stock path (`UserColorOverride` and `UniqueLiverySwitch` off), `_Standard`:

```
f      = smoothstep(sat(Ngeo·V))^GlancingFlopPower          (Ngeo = interpolated WORLDNORMAL)
paint  = ColorFlopSwitch ? lerp(GlancingFlopColor, PaintColor, f) : PaintColor    (flake: the same with FlakeColor)
cov    = FlakeCoverage; cc = ClearCoatCoverage; rc = ClearCoatRoughness
diffuse lobe  : Lambert, paint·(1 − cov)
flake lobe    : GGX, F0 = cov·flake, alpha = max(FlakeRoughness², rc²)
                normal n_f: X = −(I·Nx + k·Gx), Y = I·Ny + k·Gy, z = sqrt(sat(1 − Nx² − Ny²)); n = X·T + Y·B + z·N
                (Normal(uv0), I = Normal_Intensity, frame = WORLDTANGENT1 with B = cross(N, T)·T.w)
                glitter G = lerp(N00.xy, N0.xy, N00.w)(2v − 1), N00 = NormalMap00Texture(uvg·UVTiling@0x9A7DB1FA),
                N0 = NormalMap0Texture(uvg·UVTiling@0xFD6BB566), uvg = uv1 rotated about (1, 0.97):
                u' = (u − 1)·0.594079 + 1 − (v − 0.97)·0.804407, v' = (u − 1)·0.804407 + 0.97 + (v − 0.97)·0.594079
                k = sat((FlakeRoughness − 0.75)·−4)·(0.0125·smoothstep(sat(Ngeo·V)) + 0.0125)·GlitterIntensity
base lobes × (1 − F(Nc·V)·cc) × ((1 − cc) + cc·ClearCoatTint·T), T ~ (1 − F(V·H)) (energy term)
coat lobe     : GGX, F = 0.04 + 0.96(1 − V·H)^5, alpha = rc², weight cc, normal n_c:
                X = −(I·Nx + s·Ox), Y = I·Ny + s·Oy (O = OrangePeelNormal(uv1·32), 2v − 1),
                s = lerp(GlancingAngleStrength, OrangePeelStrength, sat((sat(Ngeo·V) − 0.4)·2.85714))
                (the coat normal is lerp(n_c, Ngeo, wetness), wetness 0 when dry)
the base lobes see L and V bent towards the normal by (1 − 0.37·cc) (coat refraction)
```

The glitter and orange-peel perturbations are added only when the run-time quality switch `cb4[43].y` is non-zero (DXIL: both are zeroed
otherwise). :observed With `UserColorOverride` the paint and flake colours are both `UserColor0`; with `UniqueLiverySwitch` the livery texture
`BaseColorAlpha` replaces them (MaskedLivery: masked by `sat((Alpha.r·base.a − 0.5)·100)`); with `UserLiverySwitch` the run-time livery render
target (premultiplied) is blended over by its alpha ([Liveries](/engines/forzatech/gameplay/liveries/)). :observed

## Glass group

`car_glass`, `car_glass_detailed`, `car_window`, `car_window_limotint`, `car_lens`, `car_livery_transmissive`, `car_tinthack`. All write two
targets: `SV_Target0` the lit colour and `SV_Target1` a transmittance (rgb) the background is multiplied by, i.e. dual-source blending
`dst = src0 + dst·src1` (the blend state itself is run time). Common terms: :observed

```
NoV   = sat(dot(N, V))
a'    = 1 − max(1e-4, sat(1.8(1 − (1 − 0.555556·r²)·v)))       v = screen-space normal variance; v = 1 → 1 − max(1e-4, sat(r²))
F_k   = (0.05 − k·a' + 0.95·a'^6)(1 − NoV)^5
Tif_k = 1 − k·a' − F_k                                          one interface's transmission weight
```

- **`car_glass`** (lamp bulbs): `tint = GlassColor`, or with `IridescenceSwitch` `lerp(GC, (1 + (1 − sat(d/1500))(|cos(d·k)| − 1))·GC,
  GlassIridescenceStrength)`, `d = GlassThickness/dot(N, V)`, `k = (0.00448799, 0.00615999, 0.00713998)`; Lambert albedo `tint` weighted by
  `Opacity`; specular roughness `Roughness`; normal geometric; `T = Tif_0.06² (1 − Opacity)·sat(tint)`. :observed
- **`car_window`, `car_window_limotint`** (identical except limotint lacks the interior tint step): `colour = GlassColor` (× `max(UserColorMultiply,
  0.1022417)` with `PlayerColorSwitch`; the interior camera `cb11[3].w ≠ 0` applies `lerp(colour, 1, InteriorTintReduction)`); opacity
  `o = 0.005` (exterior, dry: the shader's constant); roughness `0.2·sat((d − 0.02)·1.020408)`, `d = max(0.03·x, 0.005)`, `x = WipersEnabled_Part2 ?
  ShatterMap.w·0.5 : sat(ShatterMap.w·0.5 + ShatterMap.y)` (`ShatterMap` at `TEXCOORD1·0.6`); normal geometric; `T = Tif_0.06²(1 − o)·sat(colour)`. :observed
- **`car_glass_detailed`** (lamp lenses with a modelled back face): front interface on the geometric normal with roughness `rF = RoughnessMask ?
  RoughMetalAO.r(TEXCOORD0) : Roughness`; back interface on the `BackNormal` map (uv `UVChoice_OnCh1_OffCh2 ? TEXCOORD0 : rotate(TEXCOORD1,
  UV_Orientation)` × `(U_Tiling, V_Tiling)`, intensity `BackNormal_Intensity`, used when the run-time switch `cb4[43].z ≠ 0`) with `rB`; `Tf =
  Tif_0.04(rF, N)·Tif_0.04(rB, Nback)`; `o = Opacity`, or with `DualOpacityOnOff` `lerp(Opacity, OpacityB, sat((sat(max(|bn.x·S|, |bn.y·S|)·I) −
  Min)/(Max − Min)))` with `S = BentAngle.x + .y + .z`; coverage `A = AlphaTransparency ? Alpha.r(TEXCOORD0) : 1`; `T = 1 + (Tf(1 − o)·sat(tint)
  − 1)·A`. :observed
- **`car_lens`**: `SV_Target1 = 1` (`1 − cb4[28].w` when fading): the lens only adds light. Specular roughness 0 (`alpha = sat(1.8(1 − v))`), `F0 =
  0.00608 + 0.281536·r`, diffuse albedo `0.0160632·r`, `r = BaseColor_A_Texture.r` at the parallax-offset uv; emission `EmissiveCH1 × EmissiveMaskCH1
  × EmissiveColor_Tint × Emissive_Intensity ×` the run-time light group. **WarpingFX parallax** (one step): `V = normalize(−WORLDPOS)`, `N =
  normalize(WORLDNORMAL)`, `T = normalize(WORLDTANGENT0.xyz)`, `B = cross(N, T)·WORLDTANGENT0.w`, `s = sat(WarpingFX_intensity·dot(V, N))·3.074`
  (`0x4008978D40000000`), `uv' = TEXCOORD0 + s·(dot(V, T), dot(V, B))`. An evaluator of the DXIL instructions (float32) on the inputs at 33
  samples (3 points × 3 view directions on each of the Supra's two parallax lens materials, both headlights, offsets up to 0.43 in u) gives a
  maximum difference of 2.2e-7. :observed
- **`car_livery_transmissive`**: premultiplied alpha `a = Opacity·sat((Alpha.r·BaseColorAlpha.a − 0.5)·100)`, `SV_Target0 = lit × a`,
  `SV_Target1 = 1 − a`; albedo `min(max(BaseColorTextureSwitch ? BaseColorAlpha : BaseColor, PBRValidation_Min), 0.871367)`, roughness
  `sat(Roughness)`, no metal. :observed
- **`car_tinthack`**: a tint film: `c = ColorListSwitch ? ColorList : Color`, coverage = alpha test, diffuse albedo `0.3·c`, roughness 1, `T = 1 − a
  + a·0.7(1 − 0.05(1 − NoV)^5)²·sat(c)`. :observed

Clean-state values of the glass group (all run-time): unbroken (`b = sat((sat((cb4[42].y·cb8[0].x − 0.5)·1000)(BreakOut ? BreakMap.r − 1 : −1) +
0.639)·2.94985) = 1`, so the broken-glass roughness 0.063, opacity 0.211 and bent normal drop out), no fog (the `cb3[53..54]` and `cb2[111..112]`
height-fog factor 0), no livery layer, exterior view, fully faded in (`cb4[28].w = 1`), lamps off. :unknown

## Coat and special group

`car_standard_coated`, `car_reflector`, `car_carbonfiber`, `retro_licenseplate_base`, `retro_licenseplate_atlas`, `car_metal_colorshift`,
`car_mirror`, `car_blackhole`, `car_wheelblur`, `car_digitalscreen`, `car_nodraw`, `diffonly`, `car_interiorlod1`, `car_rotatingfan`. Shared terms:
:observed

```
GGX alpha    a(r) = sat(1.8(1 − (1 − 0.555556·r²)·v))      v = screen-space normal variance; v = 1 → a = r²
normal       x = 2t.r − 1, y = 2t.g − 1, z = sqrt(sat(1 − x² − y²)) (unscaled x, y); n = normalize(I·x·T − I·y·B + z·N), B = cross(N, T)·w
shift(r, s)  s > 0: 1 − sat(1 − s)(1 − r);  s < 0: sat(1 + s)·r;  s = 0: r                (Roughness_Shift)
tint(b, m)   t = sat(tint·b); w = m + (1 − 2m)·TintMode.y; col = t + TintMode.x·(1 − w)(b − t);  tint = BaseColor_Tint·BaseColor_TintMultiplier
pbr(c, m)    min(max(c, PBRValidation_Min), dm + (1 − dm)·m), dm = 0.871367 where the family has no PBRValidation_Dielectric_Max parameter
F0           m(albedo − 0.04) + 0.04, diffuse albedo (1 − m)/π
std UV       uv = rot(UVChoice_OnCh1_OffCh2 ? TEXCOORD0 : TEXCOORD1, UV_Orientation)·(U_Tiling, V_Tiling), each texture's tiling replaced by its *TilingOverride
```

**Coat lighting** (one function, identical in `car_standard_coated`, `car_reflector` and both retro plates; `car_carbonfiber` has its own with the
same coat terms): coat Fresnel `0.02 + 0.98(1 − VoH)^5` (F0 0.02, i.e. index 1.3294313), scaled by the mask, on the coat normal with GGX alpha `ac =
max(0.001, a(cr)·mask)`; the base specular lobe uses alpha `max(ac, a(r))`: the base is never smoother than the coat, and never below alpha 0.001 even
with mask 0. The coat normal is geometric unless the quality switch supplies one. :observed

| Family | What it writes | Confidence |
|---|---|---|
| `car_standard_coated` | `car_standard` inputs on the std UV; coat mask `ClearCoatMask`, coat roughness `ClearCoatRoughness`; with the quality switch the coat normal is the orange-peel map `OrangePeel_Texture(TEXCOORD1·64)`, `(r − 0.5, 0.5 − g, z)` at strength 0.5 on `WORLDTANGENT1`; cut-out in ShadowDepth `AlphaTransparency ? Alpha.r(uv_Alpha)·BaseColorAlpha.a : 1 < 0.5` | :observed |
| `car_reflector` | lamp reflector bowls: albedo `BaseColor`, metal 1, roughness `Roughness` (+ `CracksOnOff` × run-time break mask), coat mask 0; normal `Normal(rot(TEXCOORD1, UV_Orientation)·(U_Tiling, V_Tiling))` | :observed |
| `car_carbonfiber` | `uvW = rot(TEXCOORD1, UV_Orientation)·(U_Tiling, V_Tiling)`; `weave = lerp(WeaveColorTintA, WeaveColorTintB, WeaveMask.x(uvW))`; `mask = sat((Alpha.r·BaseColorAlpha.a − 0.5)·100)`; `L = UniqueLiverySwitch ? (MaskedLivery ? mask : 1) : 0`; albedo `lerp(weave, clamp(BaseColorAlpha.rgb, PBRValidation_Min0, PBRValidation_Dielectric_Max0), L)`; base normal blends the plain normal with `WeaveNormal(uvW)` by whiteout; coat weight `ClearCoatCoverage·(1 − M·L)`, coat F0 0.02; with the quality switch the coat has a normal from `ClearCoatNormal_Texture` and the base lobe is anisotropic: `alpha_T = max((1 + k)·a, 0.001)` along `t`, `alpha_B = max((1 − k)·a, 0.001)`, `k = 1 − sqrt(1 − A²)`, `A = (1 − wet)(1 − L)·AnisoStrength·sat((|WORLDPOS| − DEFAULT_StartDistance0)/(DEFAULT_EndDistance − DEFAULT_StartDistance0))` (stock Start 9, End 7 m), `D = max(0.8·D_iso(a), D_aniso)` | :observed |
| `retro_licenseplate_base` | `RetroTextureSwitch` off: albedo `RetroDiffuse`, `F0c = RetroF0`; on: `t = CH1DiffuseTexture(TEXCOORD0)`, `F0c = lerp(0.333·t.rgb, RetroF0, t.a)`; metal = luminance of `F0c`, roughness 0.15, coat 0; cut-out `CH1OpacitySwitch ? sat((CH1NormalMap.a − 0.3)·2.5) : 1 < 0.5` | :observed |
| `retro_licenseplate_atlas` | plate characters: `uvA = TEXCOORD0 + (frac(i/8), trunc(i/8)/8)`, `i = cb4[55 + ((c >> 2) & 1)][c & 3]`, `c = int(TEXCOORD3.x·8)`: the characters are run-time constants | :observed; characters :unknown |
| `car_metal_colorshift` | `car_standard` with the tint multiplied per channel by `Reflected_RTint(Reflected_RTint_UVTiling·(R.B0, R.N0)/|(R.T0, R.B0, R.N0)|)`, `R = reflect(view ray, shaded normal)`; no stock car uses this family | :observed |
| `car_mirror` | the planar reflection target is used only when `cb4[29].x ≠ 0 && cb2[48].y == 0` (run time); fallback albedo 0.871367, metal 1, roughness 0 | :observed |
| `car_blackhole` | no parameters; folded constant: diffuse 0.000483078 → albedo 0.0015176, metal 0, roughness 1 | :observed |
| `diffonly` | albedo `path(TEXCOORD0).rgb`, metal 0, roughness 1 | :observed |
| `car_digitalscreen` | folded albedo 0.0030353, roughness 0.22, metal 0; emission (`StaticEmissive` × `cb2[99].z`, screen and backup-camera render targets × `cb2[60].y`, `PowerSwitch`) is run time | :observed |
| `car_interiorlod1` | `t = DiffuseMetalnessMap(TEXCOORD0)`; albedo `0.6·lerp(t.rgb, (0.549585, 0.556114, 0.554256), t.a)`, metal `sat(t.a)`, roughness `sat(0.7 − 0.3·t.a)` | :observed |
| `car_rotatingfan` | uv rotated about `UVCenterOfRotation` by `time·deg·(sat(2·cb?)·AdditionalSpinWithTireVelocity + TimeScale)·(light parameter > 79 ? light group : 0)` (run time), then `car_standard` inputs without tiling | :observed |
| `car_wheelblur` | coverage `sat(0.4(1 − min(cb4[42].z, cb8[0].z)) + blurRT.a …)` from a run-time wheel-blur render | :observed |
| `car_nodraw` | colour 0 and transmittance 1: invisible | :observed |

## car_tires_pg

Two variants selected by the material's int `Legacy`: `_Standard_L` (LegacyHeightAO, LegacyNormal, LegacyGlobalBase, LegacyGlobalWear) and
`_Standard` (UniqueNorm, UnqiueMasks, GlobalBase and three tyre-line colours). All 197 tyre models use them (157 + 70 legacy sidewall
materials, 116 + 36 standard sidewall, 122 legacy tread, 94 standard tread; `SidewallOnOff` on every sidewall, `TextSwitch` on 106 sidewalls); the
only tyre material placed by a car file is `CHE_BelAir_57`'s spare (`tireSidewall_vintage`). D3D uv: :observed

```
uvt   = TEXCOORD0·UniqueMapTiling
gate  = sat(10(1 − |n_obj.x|))         n_obj = normalize(cb9[4..7] rows · N): the normal in the per-object frame, x = axle
k     = gate·ParallaxStrength·(h0 − c)       legacy: h0 = LegacyHeightAO.x(uvt), c = 0.8, ParallaxStrength@0x8780443B
                                             standard: h0 = UniqueNorm.w(uvt), c = 0.5, ParallaxStrength@0x5C6763CB
uvp   = uvt + k·(V·T, V·B)              V = normalize(−WORLDPOS), T = normalize(WORLDTANGENT0), B = cross(N, T)·w (unnormalised)
proj  = SidewallOnOff ? (dot(cb9[6].xyz, Pw) + cb9[6].w + 0.5, dot(cb9[5].xyz, Pw) + cb9[5].w + 0.5) : uvt        Pw = cb2[8] + WORLDPOS
sws   = SidewallOnOff ? SideWallScalars : (1, 1, 1, 1)
base  = TextSwitch ? path@0x33A205F2(TextUVTiling.x·u0, TextUVTiling.y·sat((TextSlideAmount + v0)·16/min(16, cb4[61][i]))) : BaseTyreColour   (sampler s12: U wrap, V clamp)
legacy   albedo = lerp(base, LegacyGlobalBase(proj).rgb, LegacyHeightAO(uvp).x·sws.x·LegacyGlobalWear(proj).x)
         rough  = sat(LegacyGlobalBase(proj).w·sws.y·UnwornRoughnessMultiplier)
         normal map LegacyNormal(uvp);  ao_in = LegacyHeightAO(uvp).y·sws.w
standard albedo = lerp(base, GlobalBase(proj).rgb, UnqiueMasks(uvp).x·sws.x), then towards TireLine1/2/3Color by
                  g·(1 − sat(|m − c|·14.285714)) for c = 0.25 / 0.5 / 0.75, m = UnqiueMasks(uvp).z·sws.z,
                  g = sat(10 − 20|v0 − 0.5|)·sat((wear − 0.06 + (SurfaceFX(uv2.x, 4·uv2.y).y − 0.5)·0.05)·(−50))
         rough  = sat(UnqiueMasks(uvp).y·sws.y·UnwornRoughnessMultiplier)
         normal map UniqueNorm(uvp);  ao_in = UnqiueMasks(uvp).w·sws.w
n     = normalize(x·T − y·normalize(B) + z·N), x, y = 2t.rg − 1, z = sqrt(sat(1 − x² − y²))
lighting: Lambert albedo/π, dielectric GGX F0 = 0.04, alpha = rough²
AO    = sat(CH3AOTexture(uv2.x, uv2.y − cb4[47][i]).x·ao_in), DO = sat((that + DOFromAOOffset)^DOFromAOPow)
```

`i` is the wheel index `cb11[0].x` (0 to 3). Clean state: new tyre (per-wheel wear `cb4[67][i] = 0`), stationary (per-wheel blur `cb4[31+i].w =
0`), dry and clean (`cb4[21,28,42,46]`, `cb2[70].w` = 0), exterior view, fully faded in. :observed The per-object matrix `cb9[4..7]` (rows 4 to 7 of the
per-draw pose buffer, whose rows 0 to 2 are the world matrix the vertex shader uses and rows 12 to 14 the previous frame's) is read by no shader other
than the tyre pixel shader and no readable file names it; its use fits the inverse of the object's world matrix, i.e. the mesh's own object space,
which is inferred. :inferred The run-time surface map (bindless space 43 index 9, sampled at `TEXCOORD1`, its normal blended in by `sat((N.y + 0.3)·5.6958)`) has a
neutral value (0.5, 0.5, −, 0). :unknown

## Paint, slots and missing textures

Paint colour comes from the [factory paint list](/engines/forzatech/gameplay/car-paint/) or a [livery](/engines/forzatech/gameplay/liveries/); the paint
type values 3 and −1 of a livery slot (`Materials.zip painttypes\*.materialbin` use another shader, `carpaint_user`) have no readable index → file
table. :unknown 289 references of 261 materials on 129 cars are textures the install does not ship and are read outside any quality switch;
396 references to 215 missing paths were counted in all (see [Swatch textures](/engines/forzatech/textures/pb-swatch/)). In `car_label` the
missing `Normal` sits behind `cb4[43].y` and in `car_glass_detailed` the missing `BackNormal` behind `cb4[43].z` (traced with a forward slice of the DXIL:
the texture sample feeds only a quality-switch phi). :observed

:::open[What do the run-time quality switches and light groups hold?]
`cb4[43].x/.y/.z`, the light-group table indexed by `Emissive_Trigger` and the per-wheel tyre rows are filled by CPU code each frame; their values
are in no file.
:::
