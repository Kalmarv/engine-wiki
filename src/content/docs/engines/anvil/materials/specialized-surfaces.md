---
title: Specialized surface families
description: Ice, roads, layered ground, screens, vegetation and world-space material behaviour.
games: [riders-republic]
---

Specialized templates combine texture samples with world position, vertex data, camera direction, lighting or time. Uniform-texture execution establishes channel arithmetic; spatially varying textures are needed to distinguish UV routing and parallax. Nine major specialized families have both kinds of execution checks, including independent Direct3D 11 WARP runs on 128×128 textures sampled over 16×16 output grids. :proven[covered nine families]

## Ice and layered rock

`MAD_Hero_Ice` mixes two surface colours through t80.R and two deep colours through t75.R. Frost t81.G warps both UV axes by `(1-sat(t78.B))*FrostPower`. The final colour interpolates between screen blend `1-(1-surface)*(1-deep)` and multiply `surface*deep`; its weight depends on shaded normal, light and view. Roughness is t77.R, metalness 0, AO 1. Tangent-space normal XY adds t79 and object normal t76, with reconstructed Z components multiplied. :proven[executed Hero_Ice]

Its parallax march takes up to 24 groups of four explicit-LOD samples of t78.R. The UV offsets are exactly 1/1024, 1/512, 3/1024 and 1/256, rather than their rounded disassembly text. Height starts at .99; the per-tap step is `(1/1024)*(10+100*lod)/ParallaxScale*(-view.z)`. The selected UV precedes the first height hit. Spatial checks distinguish this march from a surface without parallax. :proven[5 spatial cases]

`MAD_IceBrick` shares the ice colour mix but omits the object normal and parallax march. :proven[executed permutation]

`MAD_Tex1_UniqueNormalGradient` adds dirt-controlled A/B/C colour zones to medium and micro detail maps. The triplanar variant samples world-space planes and blends them by the geometric normal; the world-space projection and zone correspondence are traced but the triplanar variant is not executed. :proven[UniqueNormalGradient] :observed[triplanar disassembly]

`MAD_Tex1_UniqueNormal_DiffuseBlend` adds an object normal and a separately tiled detail normal by adding XY and multiplying reconstructed Z. Albedo is t75 RGB, roughness is the detail normal t77 A, metalness is object normal t76 B, and `AO=1+UseAO*(t78.B*t79.B-1)`. The masks affect AO rather than establishing a diffuse colour blend from the template's name. `MAD_Tex1_Graffiti_Monster` adds a second detail normal, team/custom colour and view-dependent emission; on its placed materials, the relevant colour alpha and EmissivePower are zero, leaving diffuse colour and zero emission. :proven[executed permutations and placed constants]

## Roads, ground and distant surfaces

| Family | Behaviour | Confidence |
|---|---|---|
| `MAD_Road` | Procedural painted-road surface driven by material constants and shader pattern arithmetic | :proven[executed spatial cases] |
| `MAD_Grounds` | Two-layer floor surface with material transforms and per-vertex terms; its world-UV switch remains disassembly-only | :proven[executed mesh-UV path] :observed[world-UV branch] |
| `MAD_Tex1_TeamColoured` | Tex1-like response with Neutral team tint constants; its hue wraps negative results, unlike Tex1 | :proven[executed permutation] |
| `MAD_Tex1_Graffiti_Mode_DecalFX` | Team/custom colour and screen-space stripe response; alpha-test and dither discards are traced separately from the executed surviving-pixel formulas | :proven[colour/surface execution] :observed[discard trace] |
| `MAD_Outskirt` | `uv=(worldXY-16384)/32768`; albedo t75 at uv, snow normal t76 at `uv*16`, roughness 1, shading class 3 | :proven[executed world-position cases] |
| `MAD_Tex1_FakeRiver` | Foam alpha multiplies `1.5-s`, where s is a vertex scalar; a shared constant supplies both roughness and metalness, both zero on the placed material | :proven[executed permutation] |
| `MAD_Raw_TerrainBlend`, `MAD_OutBorder` | Read terrain tile tables and blend their outputs with terrain-dependent details | :observed[disassembly] |
| `MAD_Cliffs_TriPlanar` | World-space projections control cliff detail sampling | :proven[executed template] |
| `MAD_Tex1_Rocks`, `MAD_Bark`, `MAD_Tex1_Leaves` | Use the non-metal G-buffer layout, with AO and specular occlusion in different channels from ordinary Tex1 | :observed[all class-writing permutations] |

Road's paint is analytic: after its material UV transform, `lane = frac((v+LaneOffset)*LaneWidth) >= 1-sat(LineWidth)`, `dash = frac((u+LineOffset)*LineFrequency) >= LineGap`, and `paint=max(lane*dash,sat(Luminosity))`. Colour is `(hueColour*paint)^2.2`, with a saturated hue-ramp colour mixed toward white by saturation. Roughness is Normal.A, metalness Normal.B times Metalness, and emission is mask red times scale divided by t23. :proven[executed spatial Road cases]

The placed Road material has Saturate −1, Luminosity .3, LineWidth .05, LineFrequency .5 and LineGap .5. Its hue colour therefore becomes white, giving linear road colour `.3^2.2 ≈ .0707` and white paint. Its Alpha constant is not read by the executed `0x400000` key. :proven[placed constants and executed program]

## Screens and overlays

The Screens families compute `frame = trunc(time*FPS+Delay) mod (columns*rows)` when FPS ≥ 1, otherwise zero. The sheet row is reversed so frame zero uses the top row. Screens combines video, logos and a pixel-grid map; Screens_Simple uses video plus a grid. The grid can come from a template default even when no Material property names it. :proven[WARP execution] :observed[stored defaults]

Screens emits `max(grid.rgb)*max(colour.rgb)*EmissiveValue/t23`. Screens_Simple uses a roughness constant; Screens uses roughness 1. `MAD_Tex1_Screen` instead outputs `0.6*sat(t75.rgb)^2.2`, roughness .1, metalness 0 and emissive scalar `.666667/t23`. :proven[executed programs]

`MAD_Decals1_Graffiti` follows Decals1's roughness remap and metalness, adding a team-colour interpolation and a Fresnel emission term; this emission path does not divide by t23. `MAD_SHD_UNLIT_UndergroundBox` uses a view-direction vertical gradient between ColorB and ColorA. :proven[executed permutations]

`SHD_Nat_Veg_Grass_AO` multiplies diffuse RGB by `1+AOMult*(COLOR0.a-1)`, uses roughness 1, AO 1 and specular occlusion .2 in class 4. Its normal binding links a custom texture operator. The stored selector points to the set's normal slot; this corrects an interpretation based only on an unbound execution texture. :proven[shader formula] :observed[operator and selector]

| Remaining family | Established scope | Confidence |
|---|---|---|
| `MAD_UI_UNLIT_InterractionZone` | Forward-only additive marker, colour/alpha textures with depth and distance fades | :observed[forward shader] |
| `STP_CHAR_WorldAsset` | Layer-zero diffuse/normal/mask and atlas-selected detail maps | :observed[labels and constants] |
| `STP_DBG_VertexColorDisplay` | Raw COLOR0 RGB and alpha test on COLOR0 A | :observed[shader listing] |
| `DirectDisplayMaterialTemplate` | Direct-display rather than an ordinary textured material graph | :observed[template structure] |
| `MAD_FakeForest` | Distant forest proxy family, separate from runtime grass | :observed[template and world usage] |

:::open[What supplies the missing per-vertex and runtime values?]
FakeRiver's scalar, Grounds' vertex inputs, full team-state updates, terrain-reading templates and exact screen time require their runtime producers. Flat shader inputs establish a formula but do not establish those producers. :unknown
:::
