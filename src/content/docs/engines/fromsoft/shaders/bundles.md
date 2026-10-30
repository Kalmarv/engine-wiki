---
title: Shader bundles and permutations
description: Shaderbdle containers, program stages, DXBC and DXIL, and material permutation selection.
implementations:
  - name: primase worlds/fromsoft (read/shaders.rs)
    url: https://github.com/Kalmarv/primase/blob/main/worlds/fromsoft/src/sekiro/read/shaders.rs
---

Shader bundles group compiled programs and binding metadata for one shader family. A material's shader path names
the family; its switches select programs within that family. :observed

The main `/shader/shaderbdle.shaderbdlebnd.dcx` holds `<family>.shaderbdle` members. Each is itself a binder of
programs and a `.metaparam`. :observed Elden Ring also has DLC bundle binders named
`shaderbdle_dlc01.shaderbdlebnd.dcx`, `shaderbdle_dlc02.shaderbdlebnd.dcx`, and a separate
`speedtree.shaderbdlebnd.dcx`, all under `/shader/`. :observed{games="elden-ring"}

| Property | Sekiro | Elden Ring | Confidence |
|---|---|---|---|
| Compiled programs | Shader Model 5 DXBC | Shader Model 6 DXIL in DirectX containers | :observed |
| Material parameters | Named reflected fields | Commonly `SAT_MtdParam`, with metaparam word offsets | :observed |
| Geometry inputs | Ordinary and skinned variants | Ordinary, skinned and SpeedTree variants | :observed |

The parts of these containers, their digest and (for Elden Ring) the `PSV0` record and the feature mask are described on
[Direct3D shader containers](/concepts/d3d-shader-containers/).

Stage file extensions agree with the shader kind in their program containers in Sekiro's bundle census and in
the Elden Ring Academy material-bundle comparison. The Sekiro census checks all 16,428 programs in its 248
bundles without a stage mismatch; Elden Ring's cited check is limited to one area.
:proven[all 248 bundles]{games="sekiro"} :observed{games="elden-ring"}

| Extension | Stage | Confidence |
|---|---|---|
| `.vpo` | Vertex | :proven[all 248 bundles]{games="sekiro"} :observed{games="elden-ring"} |
| `.ppo` | Pixel | :proven[all 248 bundles]{games="sekiro"} :observed{games="elden-ring"} |
| `.hpo` | Hull | :proven[all 248 bundles]{games="sekiro"} :observed{games="elden-ring"} |
| `.dpo` | Domain | :proven[all 248 bundles]{games="sekiro"} :observed{games="elden-ring"} |

## Samplers

Over 9,371 Sekiro DXBC programs and 13,423 Elden Ring DXIL programs, a texture register is sampled through exactly one
sampler register in all but 26 of the 192,998 program and texture-register pairs: 22 of those use both
`SS_ClampPoint` and `SS_ClampLinear`, 4 both `SS_ClampPoint` and `SS_Shadow`. Every comparison sample uses the
comparison sampler at `s12`, and every resource is in register space 0. The pairs read from the programs equal the
disassembly of Microsoft's compilers (`fxc`, `dxc`) on every program. :observed[the programs read]

| Registers | Samplers | Confidence |
|---|---|---|
| `s0`–`s4` | the material's samplers; ambient-occlusion, depth-of-field and bilateral-filter programs reuse these registers for their own | :observed |
| `s6` | `SS_WrapPoint` | :observed |
| `s7` | `SS_ClampPoint` | :observed |
| `s8` | `SS_WrapLinear` | :observed |
| `s9` | `SS_ClampLinear` | :observed |
| `s6`–`s12` | also an anisotropic sampler: `SS_WrapAniso` :only[sekiro], `SS_ClampAniso` :only[elden-ring] | :observed |
| `s12` | `SS_Shadow`, the comparison sampler | :observed |

The sampler states recorded in frame captures of both games match these names. `s12` has filter `0x94` (comparison,
linear minification and magnification, point mip), comparison `GREATER`, border colour 0 and LOD range 0 to 0.
:observed[frame captures]

## Forward or G-buffer

Every shader family of both games ships its `_Gbuf`, `_Fwd`, `_FwdSdw` and `_FwdSSdw` pixel programs and a `_Fwd.vpo`. :observed
Which of them a material is drawn with follows its definition: a material is drawn forward (a `_Fwd…` pixel program, target 0
its finished colour) when its MTD or MATBIN states `g_GX_ForwardRendering` true or `g_BlendMode` 2, and through the G-buffer
otherwise. Every family the recorded frames draw only forward has all its definitions forward by that rule, and no family they
draw only through the G-buffer has a definition stating `g_GX_ForwardRendering`. :observed[9 Sekiro frames of 4 sessions and 7
Elden Ring frames, programs matched by their bytes] Sekiro's sky dome and far mountains state `g_BlendMode` 0 with
`g_GX_ForwardRendering`, and Elden Ring's `M[Sky9]`, `M[Clouds9]`, `M[Clouds5]` and `M[DistantClouds]_001` state the flag.
:observed The one exception is Elden Ring's character-creator hair planes `P[ChrCustomize]` (blend mode 0), drawn forward in
several passes. :observed{games="elden-ring"} No recorded frame draws a material of blend mode 3, 4 or 5 without the flag.
:observed

Every forward colour draw of the recorded Elden Ring frames matches an `_FwdSdw` program by its bytes (86 of 86).
:observed{games="elden-ring"} A family's forward variants can be the same bytes, though (below), so a program matched by its
bytes does not always tell its pass.

### What forward programs read from the frame

A forward program finishes its colour itself, so it reads frame inputs that a G-buffer program leaves to later passes. In
disassembly (`cb8` is the scene buffer, `cb5` `cbLight`, `cb9` `cbPerFrame`):

| Input | Use | Confidence |
|---|---|---|
| Shadow map `g_ShadowTexture` (`t32`, 2-D) | Sekiro's shadowed forward programs compare against it with `sample_c_lz` through the comparison sampler `SS_Shadow` (`s12`): four reads in `MetallicValue_MeshDecal_FwdSdw`, and the seven `FwdSdw` materials of `m11_01` bind the same pair | :observed[one program read; seven bound]{games="sekiro"} |
| Volumetric fog `g_VolumeFog0` (`t47`, 3-D) | `colour * exp2(log2(fog.w) * k) + fog.xyz`, then times `SC_PreExposure` (`cb8[72].z`): `w` is the transmittance and `xyz` the in-scattered light, so no fog is (0, 0, 0, 1) and a fog of zeros turns the colour black; in Sekiro's `MetallicValue_MeshDecal_FwdSdw` and Elden Ring's `M[Sky9]`, `M[Clouds5]` and `M[DistantClouds]` `FwdSdw` programs | :observed[those programs] |
| `FC_VolumeFogParam[4]` (`cb8[67]` to `cb8[70]`) | read by the sky dome and far-mountain programs of `m11_01`, whose height-fog branch divides by `FC_VolumeFogParam[1].xyz`, so zeros there give NaN; the same programs read `FC_ScreenSize` at `cb8[1]` and `FC_DirLightVec_0` at `cb5[0]` | :observed[two programs]{games="sekiro"} |
| `FC_TimeOfDay` (`cb9`, register 27 `y`) | Elden Ring's sky programs (`M[DistantClouds]_001_FwdSdw`, `M[Atmosphere][Clouds]_001_FwdSdw` and others) read it in hours: `frem(t, 24)`, then saturated ramps blend the material's colour keys by the hour, so an hour of 0 gives the night keys | :observed{games="elden-ring"} |
| | Sekiro's programs declare it and never read it: the resource definitions mark it unused in `M[Sky]_SkyDome_Ver2_0_Fwd`, `CloudFog`, `FarMountain` and `AMSN` | :observed{games="sekiro"} |
| Scene registers `cb8[77]` to `cb8[88]` | read by Elden Ring's sky programs besides the above; by their neighbours, fog, atmosphere and sun values | :observed{games="elden-ring"} :inferred[their meaning]{games="elden-ring"} |

Sekiro's `M[LandScape]_FarMountain` dithers its fade: it keeps a fragment where `(noise - 0.5) * 0.999 + ditherFadeAlpha >= 0.5`,
so a fade of 0 discards every fragment and a fully shown mountain has a fade of 1. :observed[the program]{games="sekiro"}

Elden Ring's `M[DistantClouds]_001_Fwd.vpo` (the `Field_Skysphere_Clouds_410`, `_411`, `_420` and `_421` materials of `AEG096_410`
and `_420`) writes a cull distance (the length of the vertex's offset from a point, minus a constant) and two clip distances,
and its `POSITION1` output is the clip position again, which `M[DistantClouds]_001_FwdSdw.ppo` divides by its `w`. Run with the
material's own constants and textures, the pixel program gives (0, 4, 0, 0) for any `POSITION1` with `w` 0 (a NaN through its
HSV step) and a dark grey of about 0.05 for a real position. :observed[the programs lifted and run, tile `m60_42_36_00`]{games="elden-ring"}
Eight other sky vertex programs (`M[Clouds5]`, `M[Atmosphere][Clouds]` and others) declare `TEXCOORD0` as a `float4` holding UV
set 0 in `xy` and set 1 in `zw`; the sky models `AEG096_*` carry up to five UV sets stored as floats (`AEG096_010`'s first set
ranges from −15.9 to 15.3). :observed{games="elden-ring"}

The binding metadata is described in [METAPARAM](/engines/fromsoft/materials/metaparam/); material upload rules in
[constant binding](/engines/fromsoft/materials/constant-binding/).

## Sekiro

### Passes and switches

Sekiro layered materials select `<family>_<switch>_Gbuf.ppo` using `GXFT_SATStaticSwitch`. The unskinned vertex
program is `<family>_Gbuf.vpo`, and the skinned variant is `<family>_Gbuf_Skin.vpo`. :observed{games="sekiro"}

Alpha-tested pixel permutations carry `_[A]` and discard against `FC_AlphaRef`. The same family can contain
forward programs with `_Fwd`, and shadowed forward variants `_FwdSdw` and `_FwdSSdw`.
:observed{games="sekiro"}

The renderer numbers its passes, and a program's pass suffix is the name of its pass id: 0 `Fwd`, 1 `Velo`, 2 `Dpt`,
3 `DptA`, 4 `FwdSdw`, 5 `FwdSSdw`, 6 `FwdSsr`, 7 `FwdDpt`, 8 `Gbuf`, 9 `GBufDpt`, 10 `Pnt`, 11 `Pnt[M]`, 12 `PntCol`,
13 `PntWetH`, 14 `SO`, 15 `WatDpt`, 16 `Spec`, 17 `Aof`, 18 `Rsm`, 19 `Voxelization`, 20 `FwdDbg`, 21 `FwdSdwDbg`, 22 `GBufDbg`.
Beside that table the executable keeps the geometry suffixes `_Skin`, `_MorphSkin`, `_Morph`, `@[cl]`, `_FT`, `_FT_D`, `_PN` and
`_PN_D`, and the alpha-tested form `%s_[A]`. :inferred[read from the decrypted executable of Sekiro 1.06]{games="sekiro"}
The loaders of the material shader banks and of `GXFlver` load every pass's program, `<shader>_<pass>`, into a set per shader
indexed by pass, with each pass's `_[A]` program beside it. A draw then takes its program from the set by the pass id of the
pass drawing it (for a `GXFlver` material, entry `(pass + 1) * 3 + alpha`), so the material does not pick its forward variant.
Which passes draw a material is a mask test: a category word the material computes from its definition when it is set up
(`g_GX_ForwardRendering` gives category 2), with the model's flags, against each pass's own mask.
:inferred[read from the decrypted executable of Sekiro 1.06]{games="sekiro"}

At the Ashina Castle gate at night, the sky dome, the far mountains and the cloud and ground fog draw in pass 0 (`Fwd`), and the
characters and `GXFlver_ColDif` draws in pass 4 (`FwdSdw`). :observed[a read-only breakpoint on the draw's pass id in the
running game]{games="sekiro"} `M[Sky]_SkyDome_Ver2`, `M[Moon]` and `M[LandScape]_FarMountain` have byte-identical `_Fwd`,
`_FwdSdw` and `_FwdSSdw` pixel programs. :proven[every forward program of the main bundle compared by its bytes]{games="sekiro"}

The forward pass is chosen per draw job, when the job is set up. For a job of draw phase 0 or 15 the pass becomes 4 (`FwdSdw`),
or 5 (`FwdSSdw`) when the renderer's shadow setting is 3, if shadows are on and bit 0 of a flag byte of the job's descriptor
is clear; otherwise it stays 0 (`Fwd`). That bit is copied from a byte of the job's input, and the program is then entry
`(pass + 1) * 3 + alpha` of the set. :inferred[read from the decrypted executable of Sekiro 1.06]{games="sekiro"} In the
breakpoint record above, the pass-0 draws are the cloud fog and ground fog, whose layout parts have the shadow-receive flag
(byte `+0x11` of the part's entity data) clear, and the sky dome and far mountains, which no layout places; the pass-4 draws
are of parts with the flag set. Both passes run with the same draw-list filter and the same material mask.
:observed{games="sekiro"} Over the layouts of the nine maps, of the 527 forward models a layout places, 22 are placed with the
flag clear (21 fog and smoke models and one mesh decal) and 505 with it set, and no model is placed both ways.
:observed[the layouts of nine maps]{games="sekiro"} So a forward material draws with `FwdSdw` where its placements receive
shadows and with `Fwd` where they do not. :inferred{games="sekiro"}

The forward pass's target 0 is finished colour, unlike the deferred pass's
[G-buffer targets](/engines/fromsoft/shaders/gbuffer/). Forward programs can read scene depth, SSAO, irradiance
volumes, IBL cubemaps and fog in addition to material textures. :observed{games="sekiro"}

The Wolf's default outfit (`fc_m_0200`, `bd_m_9040`, `am_m_9000`, `lg_m_9000`) has four material variants that
output colour from a forward program and have no albedo output, and the Ashina costume two. They use three pixel
programs, `MeshDecal_Fwd`, `AMSN_Fwd` and `AMSN_Fwd_[A]`, and every RGB output of each depends on the lighting, IBL,
irradiance, SSAO, fog and camera or frame constants as well as the material, so a forward variant's colour is not
its albedo. :observed[a dependency trace of those programs' outputs]{games="sekiro"}

The `Character_AMSN_[AO_SSS]` pixel programs sample 17 textures in one stage. :observed{games="sekiro"}

Sekiro's `GXFlver_*` material programs instead live together in `/shader/gxflvershader.shaderbnd.dcx`.
Their instance-dependent effect variants include Bloody, Burn, Cm, Df, Cloth, Phantom, ZFeather and Decal;
a material definition alone does not identify which effect an instance uses. :observed{games="sekiro"}

The programs that draw [effects](/engines/fromsoft/effects/fxr/) (billboards, tracers, distortion, the particles on the GPU)
are in a bundle of their own, `/shader/gxffxshader.shaderbnd.dcx`, described on
[effect shader programs](/engines/fromsoft/shaders/effects/). :observed{games="sekiro"}

In a castle-interior capture, Sekiro uses reversed depth with `GreaterEqual`, and disables depth writes on matched
materials carrying `g_GX_bDisableDepthWrite`. Matched `g_BlendMode = 2` forward draws use additive
`SrcAlpha / InvSrcAlpha` colour blending and `One / Zero` alpha blending; G-buffer draws do not blend.
The captured cull state follows the face set rather than a single material-wide value. :observed{games="sekiro"}

## Elden Ring

An `_[A]` program does not always test a surface alpha. The G-buffer programs
`M[AMSN_V][Mb4][3Mask][Ov_N2][beach]_Gbuf_[A]` and `M[AMSN_V][Mb2]_Gbuf_[A]` discard, besides two fade tests, when
`1.0 + FC_AlphaRef.y * (g_DitherTexture.w - 0.5) < FC_AlphaRef.x`: the tested value is the constant 1.0 moved only by
the dither, with no texture alpha in it. At the neutral dither of 0.5 it is 1.0 over the whole surface, so with a
reference of 1.0 (`g_AlphaRef` 255) or below the program keeps every pixel, and such a material draws as opaque
whatever its albedo alpha holds. :observed[DXIL disassembly of the two programs, and running them at their materials'
references over the Limgrave tile `m60_42_36_00`]{games="elden-ring"} Other alpha-tested materials of the same tile
(`aet801_270_a`, `aet030_075_a` and four more) compare a sampled texture alpha with the reference, and their programs'
discards match `alpha < reference` at every texel. :observed[same tile]{games="elden-ring"}

:::open[What selects every runtime permutation and render state?]
The material switch does not explain every instance-dependent pass choice. The cited capture does not establish
blend modes 3–5 or a material field predicting every depth-bias change. :unknown{games="sekiro"}
:::
